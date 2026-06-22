/** ***************************
 THIS CLASS IS NO LONGER USED
******************************/

import { LightningElement, track, wire, api } from 'lwc';

// Apex calls
import getMatrixByAccountPlan from '@salesforce/apex/KeyStakeholderController.getMatrixByAccountPlan';

import getkeyStakeholders from '@salesforce/apex/KeyStakeholderController.getKeyStakeholdersByAccountPlanId';
import getIndividualkeyStakeholder from '@salesforce/apex/KeyStakeholderController.getKeyStakeholderByIdORContactId';
import upsertKeyStakeholder from '@salesforce/apex/KeyStakeholderController.upsertKeyStakeholder';

// Labels
import Delete_Key_Stakeholder from '@salesforce/label/c.Delete_Key_Stakeholder';
import Delete_Key_Stakeholder_Confirmation from '@salesforce/label/c.Delete_Key_Stakeholder_Confirmation';

// Object Info
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import KeyStakeholderObj from '@salesforce/schema/Key_Stakeholder__c';
import getAccountPlanRecordAccess from '@salesforce/apex/AccountPlanController.getUserRecordAccess';

export default class RelationshipInfluenceForKeyStakeholders extends LightningElement {
    /** ***************************
     THIS CLASS IS NO LONGER USED
    ******************************/

    @api accountPlanId;

    @track canDrag = false;

    @track influence = [];

    @track isLoading = false;

    @track stakeholderLabel = '';

    @track stakeholders = [];

    @track support = [];

    canUpdateInfluenceSupport = false;

    permissionDeleteStakeholders = false;

    canEditAccountPlan = false;

    canDeleteStakeholders = false;

    label = {
        Delete_Key_Stakeholder,
        Delete_Key_Stakeholder_Confirmation
    };

    /** *****************
     Flag/label loading
    *******************/

    @wire(getObjectInfo, { objectApiName: KeyStakeholderObj })
    wiredGetLabel({ data }) {
        if (data) {
            this.stakeholderLabel = data.label;
            this.canUpdateInfluenceSupport =
                data.fields.pqcrush__SupportId__c.updateable && data.fields.pqcrush__InfluenceId__c.updateable;
            this.permissionDeleteStakeholders = data.deletable;
            this.checkCanDrag();
            this.canDeleteStakeholders = this.permissionDeleteStakeholders && this.canEditAccountPlan;
        }
    }

    @wire(getAccountPlanRecordAccess, { accountPlanId: '$accountPlanId' })
    wiredAccountPlanAccess({ data }) {
        if (data) {
            this.canEditAccountPlan = data.HasAllAccess || data.HasEditAccess;
            this.canDeleteStakeholders = this.permissionDeleteStakeholders && this.canEditAccountPlan;
        }
        this.checkCanDrag();
    }

    checkCanDrag() {
        this.canDrag = this.canUpdateInfluenceSupport && this.canEditAccountPlan;
    }

    /** ***********
     Data loading
    *************/

    connectedCallback() {
        this.loadData();
    }

    loadData() {
        this.isLoading = true;
        this.getInitialData()
            .then(() => {
                return this.getKeyStakeholderData();
            })
            .then(() => {
                this.isLoading = false;
            })
            .catch((error) => {
                this.fireErrorEvent('An error occurred while loading data', error.body.message);
                this.isLoading = false;
            });
    }

    async getInitialData() {
        let matrix = await getMatrixByAccountPlan({ accountPlanId: this.accountPlanId });

        this.influence = matrix?.influenceList;
        this.support = matrix?.supportList;
    }

    async getKeyStakeholderData() {
        let rawSteaks = await getkeyStakeholders({ accountPlanId: this.accountPlanId });

        this.stakeholders = rawSteaks;
    }

    /** ****************
     Data manipulation
    ******************/

    handleRefreshStakeholders(updateOthers) {
        this.isLoading = true;
        this.getKeyStakeholderData()
            .then(() => {
                if (updateOthers) {
                    this.fireApplicationEvent('MATRIX_UPDATED', null, true);
                }
                this.isLoading = false;
            })
            .catch((error) => {
                this.fireErrorEvent('An error occurred while loading data', error.body.message);
                this.isLoading = false;
            });
    }

    handleStakeholderMoved(event) {
        let memberId = event.detail.memberId;
        let newInfluence = event.detail.targetInfluence;
        let newSupport = event.detail.targetSupport;

        const index = this.findStakeholderIndexForId(memberId);
        let stakeholder = this.stakeholders[index];

        stakeholder.influence = newInfluence;
        stakeholder.support = newSupport;
        this.replaceStakeholderAtIndex(stakeholder, index);

        let params = {
            stakeholderId: memberId,
            influence: newInfluence,
            support: newSupport
        };

        upsertKeyStakeholder(params)
            .then(() => {
                this.fireApplicationEvent('MATRIX_UPDATED', memberId, true);
            })
            .catch((error) => {
                this.handleRefreshStakeholders(false);
                this.fireErrorEvent('An error occurred while updating stakeholder', error.body.message);
            });
    }

    handleStakeholderUpdated(event) {
        let recordId = event.detail.recordId;

        getIndividualkeyStakeholder({
            objectId: recordId,
            planId: this.accountPlanId
        }).then((result) => {
            this.findAndUpdateStakeholder(result);
        });
    }

    findAndUpdateStakeholder(updatedStakeholder) {
        if (updatedStakeholder) {
            const index = this.findStakeholderIndexForId(updatedStakeholder.id);

            this.replaceStakeholderAtIndex(updatedStakeholder, index);
        }
    }

    findStakeholderIndexForId(id) {
        const index = this.stakeholders.findIndex((item) => {
            return item.id === id;
        });

        return index;
    }

    replaceStakeholderAtIndex(updatedStakeholder, index) {
        let stakeholders = this.stakeholders;

        stakeholders[index] = updatedStakeholder;
        this.stakeholders = [...stakeholders];
    }

    handleStakeholderRemoved(event) {
        let stakeholderId = event.detail.recordId;
        let updatedArray = this.stakeholders.filter((item) => {
            return item.id !== stakeholderId;
        });

        this.stakeholders = updatedArray;
    }

    handleEditKeyStakeholderClicked(event) {
        const objectId = event.detail.objectId;
        const canEdit = event.detail.canEdit;
        const modal = this.template.querySelector('c-pq-matrix-member-modal');

        modal.open('pqcrush__Key_Stakeholder__c', objectId, this.influence, this.support, {}, canEdit);
    }

    handleMatrixMemberSuccess() {
        this.handleRefreshStakeholders(true);
    }

    handleRefreshMembers() {
        this.handleRefreshStakeholders(false);
    }

    /** *************
     Event handling
    ***************/

    bubbleEvent(event) {
        const passedEvent = new CustomEvent(event.type, {
            detail: event.detail
        });

        this.dispatchEvent(passedEvent);
    }

    fireApplicationEvent(eventName, eventValue, shouldUpdateSystemViews) {
        const evt = new CustomEvent('pqapplicationevent', {
            detail: { name: eventName, value: eventValue, refreshViews: shouldUpdateSystemViews }
        });

        this.dispatchEvent(evt);
    }

    fireErrorEvent(title, message) {
        const evt = new CustomEvent('showerror', {
            detail: { title: title, message: message }
        });

        this.dispatchEvent(evt);
    }

    @api
    handleApplicationEvent(eventName, eventValue) {
        switch (eventName) {
            case 'RM_EDIT_SETTINGS_SAVE_SUCCESS':
                this.loadData();
                break;
            default:
                break;
        }
        let influenceChart = this.template.querySelector('c-relationship-influence-chart');

        if (influenceChart) {
            influenceChart.handleApplicationEvent(eventName, eventValue);
        }
    }
}