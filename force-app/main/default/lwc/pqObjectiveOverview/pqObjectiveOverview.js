import { LightningElement, api, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import getObjectivesForAccountPlan from '@salesforce/apex/ObjectiveController.getObjectivesForAccountPlan';
import getUserSettings from '@salesforce/apex/AccountPlanUserSettingController.getSettings';
import getSettings from '@salesforce/apex/ObjectiveController.getSettings';
import updateSettings from '@salesforce/apex/AccountPlanUserSettingController.updateSettings';

import { subscribe, MessageContext } from 'lightning/messageService';
import OBJECTIVE_DATA_CHANNEL from '@salesforce/messageChannel/objectiveData__c';

// LABELS
import Total_Completed_Objectives from '@salesforce/label/c.Total_Completed_Objectives';
import Total_Unfinished_Objectives from '@salesforce/label/c.Total_Unfinished_Objectives';
import Total_Completed_Tasks from '@salesforce/label/c.Total_Completed_Tasks';
import Total_Unfinished_Tasks from '@salesforce/label/c.Total_Unfinished_Tasks';

export default class PqObjectiveOverview extends LightningElement {
    @api recordId;

    objectives;

    hasObjectives;

    objectiveConfiguration;

    taskConfiguration;

    barConfiguration;

    userSettings;

    settings;

    loaded = false;

    labels = {
        Total_Completed_Objectives,
        Total_Unfinished_Objectives,
        Total_Completed_Tasks,
        Total_Unfinished_Tasks
    };

    usePieChart = false;

    iconName = 'utility:chart';

    subscription = null;

    updateChart = false;

    @wire(MessageContext) messageContext;

    connectedCallback() {
        this.loadSettings();
        this.loadData();
        this.subscribeToChannel();
    }

    async loadSettings() {
        await getUserSettings({ accountPlanId: this.recordId })
            .then((result) => {
                this.usePieChart = result.pqcrush__Objective_Overview_Chart_Type__c === 'Pie';
                this.userSettings = result;
                this.setIcon();
            })
            .catch((error) => {
                this.showNotification('Error', error.message, 'error');
            });
    }

    async updateSettings(chartType) {
        let settingId = this.userSettings.Id;

        await updateSettings({ settingId, chartType }).catch((error) => {
            this.showNotification('Error', error.message, 'error');
        });
    }

    setIcon() {
        if (this.usePieChart) {
            this.iconName = 'utility:assignment';
        } else {
            this.iconName = 'utility:chart';
        }
    }

    subscribeToChannel() {
        if (this.subscription) {
            return;
        }

        // Subscribing to the message channel
        this.subscription = subscribe(this.messageContext, OBJECTIVE_DATA_CHANNEL, (message) => {
            this.handleMessage(message);
        });
    }

    handleMessage(message) {
        if (message.action === 'refresh' && message.recordId === this.recordId) {
            this.updateChart = true;
            this.loadData();
        }
    }

    async loadData() {
        await getSettings().then((result) => {
            this.settings = result;
        });

        await getObjectivesForAccountPlan({ accountPlanId: this.recordId })
            .then((result) => {
                let objectiveWrapperList = JSON.parse(JSON.stringify(result));

                this.objectives = objectiveWrapperList.objectives;
                this.processObjectives(this.objectives);
                if (this.objectives && this.objectives?.length > 0) {
                    this.hasObjectives = true;
                } else {
                    this.hasObjectives = false;
                }
            })
            .catch((error) => {
                this.showNotification('Error', error.message, 'error');
            });
    }

    processObjectives(objectives) {
        if (!objectives || objectives.length <= 0) {
            return;
        }

        let completedTasks = 0;
        let unfinishedTasks = 0;
        let totalTasks = 0;
        let totalObjectives = objectives.length;
        let completedObjectives = 0;
        let unfinishedObjectives = 0;

        objectives.forEach((objective) => {
            if (objective.tasks && objective.tasks.length > 0) {
                let completedObjective = true;

                objective.tasks.forEach((task) => {
                    totalTasks++;
                    if (task.isClosed) {
                        completedTasks++;
                    } else {
                        completedObjective = false;
                    }
                });
                completedObjectives = completedObjective ? ++completedObjectives : completedObjectives;
            }
        });

        unfinishedObjectives = totalObjectives - completedObjectives;
        unfinishedTasks = totalTasks - completedTasks;

        let taskColor = 'lightgray';
        let objectiveColor = 'lightgray';

        const completeTaskPercentage = (completedTasks / totalTasks) * 100;

        if (completeTaskPercentage < this.settings.task.lowMidBoundary * 100) {
            taskColor = this.settings.task.lowColor;
        } else if (completeTaskPercentage >= this.settings.task.midHighBoundary * 100) {
            taskColor = this.settings.task.highColor;
        } else {
            taskColor = this.settings.task.midColor;
        }

        const completeObjectivePercentage = (completedObjectives / totalObjectives) * 100;

        if (completeObjectivePercentage < this.settings.objective.lowMidBoundary * 100) {
            objectiveColor = this.settings.objective.lowColor;
        } else if (completeObjectivePercentage >= this.settings.objective.midHighBoundary * 100) {
            objectiveColor = this.settings.objective.highColor;
        } else {
            objectiveColor = this.settings.objective.midColor;
        }

        this.loadCharts(
            completedObjectives,
            unfinishedObjectives,
            completedTasks,
            unfinishedTasks,
            objectiveColor,
            taskColor
        );
    }

    loadCharts(completedObjectives, unfinishedObjectives, completedTasks, unfinishedTasks, objectiveColor, taskColor) {
        let completedObjectiveMessage = this.labels.Total_Completed_Objectives + ': ' + completedObjectives;
        let unfinishedObjectiveMessagse = this.labels.Total_Unfinished_Objectives + ': ' + unfinishedObjectives;
        const objectiveData = {
            labels: [completedObjectiveMessage, unfinishedObjectiveMessagse],
            datasets: [
                {
                    label: '',
                    backgroundColor: [objectiveColor, 'rgb(200, 200, 200)'],
                    data: [completedObjectives, unfinishedObjectives]
                }
            ]
        };

        let completedTaskMessage = this.labels.Total_Completed_Tasks + ': ' + completedTasks;
        let unfinishedTaskMessagse = this.labels.Total_Unfinished_Tasks + ': ' + unfinishedTasks;
        const taskData = {
            labels: [completedTaskMessage, unfinishedTaskMessagse],
            datasets: [
                {
                    label: '',
                    backgroundColor: [taskColor, 'rgb(200, 200, 200)'],
                    data: [completedTasks, unfinishedTasks]
                }
            ]
        };

        this.objectiveConfiguration = {
            type: 'pie',
            data: objectiveData,
            options: {
                animation: {
                    animateRotate: true
                },
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            font: {
                                size: 14
                            }
                        }
                    }
                }
            }
        };

        this.taskConfiguration = {
            type: 'pie',
            data: taskData,
            options: {
                animation: {
                    animateRotate: true
                },
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            font: {
                                size: 14
                            }
                        }
                    }
                }
            }
        };

        const barData = {
            labels: ['Objectives', 'Tasks'],
            datasets: [
                {
                    label: 'Completed Objectives',
                    data: [completedObjectives, 0],
                    backgroundColor: objectiveColor
                },
                {
                    label: 'Completed Tasks',
                    data: [0, completedTasks],
                    backgroundColor: taskColor
                },
                {
                    label: 'Unfinished',
                    data: [unfinishedObjectives, unfinishedTasks],
                    backgroundColor: 'rgb(200, 200, 200)'
                }
            ]
        };

        this.barConfiguration = {
            type: 'bar',
            data: barData,
            options: {
                indexAxis: 'y',
                plugins: {
                    title: {
                        display: true,
                        text: 'Objective Summary'
                    }
                },
                responsive: true,
                scales: {
                    x: {
                        stacked: true
                    },
                    y: {
                        stacked: true
                    }
                }
            }
        };

        if (this.updateChart) {
            const objChart = this.template.querySelector('.objChart');

            objChart?.update(this.objectiveConfiguration.data);

            const taskChart = this.template.querySelector('.taskChart');

            taskChart?.update(this.taskConfiguration.data);

            const barChart = this.template.querySelector('.barChart');

            barChart?.update(this.barConfiguration.data);
        }
        this.loaded = true;
    }

    handleChartChange() {
        this.usePieChart = !this.usePieChart;
        this.updateSettings(this.usePieChart ? 'Pie' : 'Bar');
        this.setIcon();
    }

    showNotification(title, message, variant) {
        const evt = new ShowToastEvent({ title, message, variant });

        this.dispatchEvent(evt);
    }
}