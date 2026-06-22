import { LightningElement, api } from 'lwc';

export default class CreateRecordModal extends LightningElement {
    @api objectApiName;

    // Key value pairs of FieldApiName and Value
    // @api fieldValues = { LastName: 'Test', Email: 'duy.nguyen@prolifiq.com' };
    @api fieldValues = {};

    recordTypeId;

    title;

    callerInfo;

    @api open(objectApiName, fieldValues = {}, callerInfo) {
        // eslint-disable-next-line @lwc/lwc/no-api-reassignments
        this.objectApiName = objectApiName;
        // eslint-disable-next-line @lwc/lwc/no-api-reassignments
        this.fieldValues = fieldValues;
        this.callerInfo = callerInfo;
        this.template?.querySelector('c-modal-with-record-type-selection')?.open(objectApiName);
    }

    @api show() {
        this.template?.querySelector('c-modal-with-record-type-selection')?.show();
    }

    @api hide() {
        this.template?.querySelector('c-modal-with-record-type-selection')?.hide();
    }

    handleSave() {
        this.template?.querySelector('c-pq-dynamic-record-form')?.submit();
    }

    handleSuccess(event) {
        this.hide();
        if (event.detail.callerInfo !== undefined) {
            event.detail.callerInfo = this.callerInfo;
        }
        this.dispatchEvent(
            new CustomEvent('success', {
                detail: event.detail
            })
        );
    }

    handleLoad(event) {
        const { objectInfos } = event.detail;
        const objectInfo = objectInfos[this.objectApiName];

        if (objectInfo) {
            this.title = `New ${objectInfo.label}`;
        }
    }

    handleRecordTypeSelected(event) {
        this.recordTypeId = event.detail.recordTypeId;
    }
}