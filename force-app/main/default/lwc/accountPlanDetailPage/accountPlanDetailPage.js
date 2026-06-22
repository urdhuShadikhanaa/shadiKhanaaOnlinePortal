import { LightningElement, api } from 'lwc';
import getRecordTypeId from '@salesforce/apex/FetchRecordTypeId.getRecordTypeId';
export default class AccountPlanDetailPage extends LightningElement {
    @api recordId;
    recordTypeId;
    error;
    connectedCallback() {
        getRecordTypeId({ recordId: this.recordId })
            .then((result) => {
                this.recordTypeId = result;
            })
            .catch((err) => {
                this.error = err;
            });
    }
}