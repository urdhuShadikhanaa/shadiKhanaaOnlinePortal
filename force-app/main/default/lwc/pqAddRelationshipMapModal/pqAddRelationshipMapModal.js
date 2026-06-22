import { LightningElement, api } from 'lwc';
import ACCOUNT_PLAN_OBJECT from '@salesforce/schema/Account_Plan__c';
export default class PqAddRelationshipMapModal extends LightningElement {
    @api recordId;
    @api objectApiName;

    @api async openModel() {
        await this.handleNewObjectiveClick();
    }

    async handleNewObjectiveClick() {
        const modal = this.template.querySelector('c-create-record-modal');
        const key = 'Relationship Map';
        modal.open(
            'pqcrush__Relationship_Map__c',
            {
                pqcrush__pq_AccountPlanId__c: this.recordId,
                pqcrush__Type_Setting__c: ACCOUNT_PLAN_OBJECT.objectApiName
            },
            { key }
        );
    }

    handleObjectCreated() {
        const valueChangeEvent = new CustomEvent('valuechange');
        this.dispatchEvent(valueChangeEvent);
    }
}