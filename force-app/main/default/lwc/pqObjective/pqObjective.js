import { LightningElement, api, wire, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';

import { publish, MessageContext } from 'lightning/messageService';
import OBJECTIVE_DATA_CHANNEL from '@salesforce/messageChannel/objectiveData__c';

import { getPageReference } from 'c/utils';
import { formatLabel } from 'c/stringUtils';

import getUserRecordAccess from '@salesforce/apex/UserRecordAccessServiceController.getUserRecordAccess';
import getObjectivesForAccountPlan from '@salesforce/apex/ObjectiveController.getObjectivesForAccountPlan';
import createNewTaskForObjective from '@salesforce/apex/ObjectiveController.createNewTaskForObjective';
import removeTaskFromObjective from '@salesforce/apex/ObjectiveController.removeTaskFromObjective';
import deleteObjective from '@salesforce/apex/ObjectiveController.deleteObjective';
import getSettings from '@salesforce/apex/ObjectiveController.getSettings';
import getObjectiveTaskSortFieldValues from '@salesforce/apex/ObjectiveController.getObjectiveTaskSortFieldValues';
import updateObjectiveTaskSortAscending from '@salesforce/apex/ObjectiveController.updateObjectiveTaskSortAscending';
import updateObjectiveTaskSortField from '@salesforce/apex/ObjectiveController.updateObjectiveTaskSortField';
import getObjectiveTaskUserSortValues from '@salesforce/apex/ObjectiveController.getObjectiveTaskUserSortValues';
import updateObjectiveRecords from '@salesforce/apex/ObjectiveController.updateObjectiveRecords';

import Click_Anywhere_To_Refresh from '@salesforce/label/c.Click_Anywhere_To_Refresh';
import Delete from '@salesforce/label/c.Delete';
import Edit from '@salesforce/label/c.Edit';
import New_Objective from '@salesforce/label/c.New_Objective';
import New_Task from '@salesforce/label/c.New_Task';
import New_Task_Subject_Placeholder from '@salesforce/label/c.New_Task_Subject_Placeholder';
import No_Objectives from '@salesforce/label/c.No_Objectives';
import Objectives from '@salesforce/label/c.Objectives';
import Delete_Objective from '@salesforce/label/c.Delete_Objective';
import Delete_Objective_Confirmation from '@salesforce/label/c.Delete_Objective_Confirmation';
import Delete_Objective_Name from '@salesforce/label/c.Delete_Objective_Name';
import Delete_Objective_Options from '@salesforce/label/c.Delete_Objective_Options';
import Remove_Task from '@salesforce/label/c.Remove_Task';
import Remove_Task_Confirmation from '@salesforce/label/c.Remove_Task_Confirmation';
import Remove_Task_Name from '@salesforce/label/c.Remove_Task_Name';
import Remove_Task_Options from '@salesforce/label/c.Remove_Task_Options';
import fieldErrorDescription from '@salesforce/label/c.FieldErrorDescription';

export default class PqObjective extends NavigationMixin(LightningElement) {
    @api recordId;
    @api objectApiName;
    @api hasContainer = false;
    @track sortIconName;
    showAccountPlanName = false;
    objectives;
    hasObjectives = true;
    newTaskId = null;
    settings = null;
    canCreateObjectives = false;
    canCreateTasks = false;
    canEditGraph = false;
    loadingTasks = false;
    allowAddTask = false;
    allowTasksBasedObjStage = false;
    addTaskModal = false;
    disableSortButton = false;
    taskSortFieldButtonLabel;
    taskSortFieldValues = [];
    tempTaskSortFieldValues = [];
    taskSortOrder;

    labels = {
        Click_Anywhere_To_Refresh,
        Delete,
        Delete_Objective,
        Delete_Objective_Confirmation,
        Delete_Objective_Name,
        Delete_Objective_Options,
        Edit,
        New_Objective,
        New_Task,
        New_Task_Subject_Placeholder,
        No_Objectives,
        Objectives,
        Remove_Task,
        Remove_Task_Confirmation,
        Remove_Task_Name,
        Remove_Task_Options,
        fieldErrorDescription
    };

    get showCreateObjectivesButton() {
        return this.canCreateObjectives && this.canEditGraph;
    }

    get showCreateTasksButton() {
        return this.canCreateTasks && this.canEditGraph && this.allowAddTask;
    }

    get hideSortButtons() {
        return this.disableSortButton;
    }

    @wire(MessageContext) messageContext;

    @wire(getUserRecordAccess, { recordId: '$recordId' })
    wiredAccountPlanAccess({ data }) {
        if (data) {
            this.canEditGraph = data.HasAllAccess || data.HasEditAccess;
        }
    }

    renderedCallback() {
        if (this.newTaskId) {
            const newTaskDiv = this.template.querySelector("[data-id='" + this.newTaskId + "']");
            newTaskDiv?.classList?.add('highlight');

            // eslint-disable-next-line @lwc/lwc/no-async-operation
            window.setTimeout(() => {
                newTaskDiv?.classList?.remove('highlight');
                this.newTaskId = null;
            }, 1000);
        }
    }

    async connectedCallback() {
        if (this.objectApiName !== 'pqcrush__Account_Plan__c') {
            this.showAccountPlanName = true;
        } else {
            this.showAccountPlanName = false;
        }
        this.loadData();
    }

    async loadData() {
        await getSettings().then((result) => {
            this.settings = result;
            this.allowAddTask = result.allowAddTask;
            this.allowTasksBasedObjStage = result.allowTasksBasedObjStage;
            this.addTaskModal = result.useSFTaskModal;
            this.disableSortButton = result.disableSortButton;
        });
        await getObjectiveTaskSortFieldValues().then((result) => {
            let temp = [];
            let temp2 = [];
            result.forEach((element) => {
                const fieldValueArray = element.split(',');
                temp.push({ label: fieldValueArray[0], value: fieldValueArray[1] });
                temp2.push(fieldValueArray[0]);
            });

            this.taskSortFieldValues = temp;
            this.tempTaskSortFieldValues = result;
        });

        await getObjectiveTaskUserSortValues({ listOfValues: this.tempTaskSortFieldValues }).then((result) => {
            const myArray = result.split(',');
            this.taskSortFieldButtonLabel = 'Order Tasks by ' + myArray[0];
            this.taskSortOrder = myArray[1];
            if (this.taskSortOrder === 'true') {
                this.sortIconName = 'utility:arrowdown';
            } else {
                this.sortIconName = 'utility:arrowup';
            }
        });

        await getObjectivesForAccountPlan({ accountPlanId: this.recordId })
            .then((result) => {
                let objectiveWrapperList = JSON.parse(JSON.stringify(result));
                this.objectives = objectiveWrapperList.objectives.sort((a, b) => {
                    if (a.accountPlanName > b.accountPlanName) {
                        return 1;
                    } else if (a.accountPlanName < b.accountPlanName) {
                        return -1;
                    }

                    if (a.objective.Name >= b.objective.Name) {
                        return 1;
                    }

                    return -1;
                });
                this.canCreateObjectives = objectiveWrapperList.creatable;
                this.canCreateTasks = objectiveWrapperList.taskCreatable;
                this.objectives = this.checkAndUpdateObjectiveStage(this.objectives);
                this.disableSortButton = objectiveWrapperList.this.processObjectives(this.objectives);
                if (this.objectives && this.objectives?.length > 0) {
                    this.hasObjectives = true;
                } else {
                    this.hasObjectives = false;
                }
                this.publishMessage();
            })
            .catch((error) => {
                this.showNotification('Error', error.message, 'error');
            });
    }

    processObjectives(objectives) {
        if (!objectives || objectives.length <= 0) {
            return;
        }

        objectives.forEach((objective) => {
            if (objective.tasks && objective.tasks.length > 0) {
                let completed = 0;
                objective.tasks.forEach((task) => {
                    if (task.isClosed) {
                        completed++;
                    }
                });
                objective.completePercentage = (completed / objective.tasks.length) * 100;
                if (objective.completePercentage < this.settings.task.lowMidBoundary * 100) {
                    objective.style = 'background-color: ' + this.settings.task.lowColor;
                } else if (objective.completePercentage >= this.settings.task.midHighBoundary * 100) {
                    objective.style = 'background-color: ' + this.settings.task.highColor;
                } else {
                    objective.style = 'background-color: ' + this.settings.task.midColor;
                }

                objective.completePercentage = objective.completePercentage.toFixed(0) + '%';
            } else {
                objective.completePercentage = '';
                objective.style = 'background-color: gray;';
            }
        });
    }

    checkAndUpdateObjectiveStage(objectives) {
        let objectivesForUpdate = [];

        objectives.forEach((objective) => {
            if (objective.objective.pqcrush__Stage_Override__c) {
                let notStartedCount = 0;
                // let inProgressCount = 0;
                let completeCount = 0;

                objective.tasks.forEach((task) => {
                    if (task.status === 'Not Started' || task.status === null) {
                        notStartedCount++;
                        // } else if (task.status === 'In Progress') {
                        //    inProgressCount++;
                    } else if (task.status === 'Completed') {
                        completeCount++;
                    }
                });

                let newStage;
                if (objective.tasks.length === 0) {
                    newStage = 'Not Started';
                } else if (completeCount > 0 && objective.tasks.length === completeCount) {
                    newStage = 'Complete';
                } else if (notStartedCount > 0 && objective.tasks.length === notStartedCount) {
                    newStage = 'Not Started';
                } else {
                    newStage = 'In Progress';
                }

                if (newStage !== objective.objective.pqcrush__Stage__c) {
                    objective.objective.pqcrush__Stage__c = newStage;
                    objectivesForUpdate.push({ ...objective.objective, pqcrush__Stage__c: newStage });
                }
            }
        });

        if (objectivesForUpdate.length) {
            updateObjectiveRecords({ objectives: objectivesForUpdate }).catch((error) => {
                this.showNotification('Error', error.message, 'error');
            });
        }

        return objectives;
    }

    async handleObjectiveClicked(event) {
        const recordId = event.currentTarget.dataset.id;
        if (!this.hasContainer) {
            const eventNavigation = this.template.querySelector('c-event-navigation');
            eventNavigation.invokeNewRecordEvent('pqcrush__Objective__c', [], 'RELATED_LIST', 'edit', recordId);
        } else {
            const canEdit = await this.getAccessForRecord(recordId);
            const evt = new CustomEvent('objectedit', {
                detail: { canEdit, recordId }
            });
            this.dispatchEvent(evt);
        }

        let transparentLayer = this.template.querySelector("[data-name='transparent-layer']");
        transparentLayer.setAttribute('class', 'transparent-layer');
    }

    handleObjectiveNameClick(event) {
        const recordId = event.currentTarget.dataset.id;
        this[NavigationMixin.Navigate](getPageReference('pqcrush__Objective__c', recordId));
    }

    async getAccessForRecord(recordId) {
        let canEdit = false;
        await getUserRecordAccess({ recordId: recordId }).then((access) => {
            canEdit = access.HasAllAccess || access.HasEditAccess;
        });
        return canEdit;
    }

    async handleTaskClicked(event) {
        const recordId = event.currentTarget.dataset.id;
        if (!this.hasContainer) {
            const eventNavigation = this.template.querySelector('c-event-navigation');
            eventNavigation.invokeNewRecordEvent('Task', [], 'RELATED_LIST', 'edit', recordId);
        } else {
            const canEdit = await this.getAccessForRecord(recordId);
            const evt = new CustomEvent('objectedit', {
                detail: { canEdit, recordId }
            });
            this.dispatchEvent(evt);
        }

        let transparentLayer = this.template.querySelector("[data-name='transparent-layer']");
        transparentLayer.setAttribute('class', 'transparent-layer');
    }

    async handleChangeTaskSortField(event) {
        var order = event.detail.value;
        await updateObjectiveTaskSortField({ sortField: order }).then((result) => {
            if (!result) {
                let fieldMsg = order + ' field error.' + this.labels.fieldErrorDescription;
                this.showNotification('Error', fieldMsg, 'error');
            } else {
                this.loadData();
            }
        });
    }

    async handleChangeTaskSortDirection() {
        await updateObjectiveTaskSortAscending({ taskSortOrder: this.taskSortOrder }).then((result) => {
            this.taskSortOrder = result;
            this.loadData();
        });
    }

    handleNewObjectiveClick() {
        const modal = this.template.querySelector('c-create-record-modal');
        const key = 'objective';
        modal.open(
            'pqcrush__Objective__c',
            { pqcrush__Account_Plan__c: this.recordId, pqcrush__Stage_Override__c: this.allowTasksBasedObjStage },
            { key }
        );

        let transparentLayer = this.template.querySelector("[data-name='transparent-layer']");
        transparentLayer.setAttribute('class', 'transparent-layer');
    }

    handleObjectCreated() {
        this.loadData();
    }

    handleNewTaskClick(event) {
        const objectiveId = event.currentTarget.dataset.id;
        if (this.addTaskModal) {
            const createTaskNav = this.template.querySelector('c-create-task-navigation');
            if (createTaskNav) {
                createTaskNav.handleCreateTask({
                    WhatId: objectiveId,
                    Subject: this.labels.New_Task_Subject_Placeholder
                });
                let transparentLayer = this.template.querySelector("[data-name='transparent-layer']");
                transparentLayer.setAttribute('class', 'transparent-layer');
            }
        } else {
            this.loadingTasks = true;
            createNewTaskForObjective({
                objectiveId: objectiveId,
                taskSubject: this.labels.New_Task_Subject_Placeholder
            })
                .then((result) => {
                    this.newTaskId = result;
                    this.loadData();
                    this.loadingTasks = false;
                })
                .catch((error) => {
                    this.loadingTasks = false;
                    this.showNotification('Error', error.message, 'error');
                });
        }
    }

    transparencylLayerClicked(event) {
        event.currentTarget.setAttribute('class', 'slds-hide');
        this.loadData();
    }

    handleRemoveTask(event) {
        const objectiveId = event.currentTarget.dataset.objective;
        const taskId = event.currentTarget.dataset.task;
        const taskSubject = event.currentTarget.dataset.subject;
        const type = 'task';
        const modal = this.template.querySelector('c-modal-for-confirmation');
        const message = this.labels.Remove_Task_Confirmation;
        modal.open(
            formatLabel(this.labels.Remove_Task_Name, [taskSubject]),
            message,
            { type, objectiveId, taskId },
            this.labels.Remove_Task,
            null,
            [{ label: this.labels.Remove_Task_Options, value: 'option1' }],
            ['option1']
        );
    }

    handleRemoveObjective(event) {
        const objectiveId = event.currentTarget.dataset.id;
        const objectiveName = event.currentTarget.dataset.name;
        const taskIds = this.objectives.find((x) => x.objective.Id === objectiveId)?.tasks?.map((x) => x.id);
        const type = 'objective';
        const modal = this.template.querySelector('c-modal-for-confirmation');
        const message = this.labels.Delete_Objective_Confirmation;
        if (taskIds.length > 0) {
            modal.open(
                formatLabel(this.labels.Delete_Objective_Name, [objectiveName]),
                message,
                { type, objectiveId, taskIds },
                this.labels.Delete_Objective,
                null,
                [{ label: this.labels.Delete_Objective_Options, value: 'option1' }],
                ['option1']
            );
        } else {
            const alsoDelete = true;
            deleteObjective({ objectiveId, taskIds, alsoDelete })
                .then(() => {
                    this.loadData();
                })
                .catch((error) => {
                    this.showNotification('Error', error.message, 'error');
                });
        }
    }

    handleDeleteClicked(event) {
        switch (event.detail.callerData.type) {
            case 'task':
                this.handleDeleteTaskClicked(event);
                break;
            case 'objective':
                this.handleDeleteObjectiveClicked(event);
                break;
            default:
                break;
        }
    }

    handleDeleteTaskClicked(event) {
        const objectiveId = event.detail.callerData.objectiveId;
        const taskId = event.detail.callerData.taskId;
        const alsoDelete = event.detail.messageSelectedValue === 'option1';
        this.processDeleteOrRemoveTask(objectiveId, taskId, alsoDelete);
    }

    handleAlternativeTaskClicked(event) {
        const objectiveId = event.detail.callerData.objectiveId;
        const taskId = event.detail.callerData.taskId;
        const alsoDelete = event.detail.messageSelectedValue === 'option1';
        this.processDeleteOrRemoveTask(objectiveId, taskId, alsoDelete);
    }

    processDeleteOrRemoveTask(objectiveId, taskId, alsoDelete) {
        removeTaskFromObjective({ objectiveId, taskId, alsoDelete })
            .then(() => {
                this.loadData();
            })
            .catch((error) => {
                let msg = error.message ? error.message : error.body?.message;
                this.showNotification('Error', msg, 'error');
            });
    }

    handleDeleteObjectiveClicked(event) {
        const objectiveId = event.detail.callerData.objectiveId;
        const taskIds = event.detail.callerData.taskIds;
        const alsoDelete = event.detail.messageSelectedValue === 'option1';
        deleteObjective({ objectiveId, taskIds, alsoDelete })
            .then(() => {
                this.loadData();
            })
            .catch((error) => {
                this.showNotification('Error', error.message, 'error');
            });
    }

    showNotification(title, message, variant) {
        const evt = new ShowToastEvent({ title, message, variant });
        this.dispatchEvent(evt);
    }

    publishMessage() {
        const message = {
            recordId: this.recordId,
            action: 'refresh'
        };

        publish(this.messageContext, OBJECTIVE_DATA_CHANNEL, message);
    }
}