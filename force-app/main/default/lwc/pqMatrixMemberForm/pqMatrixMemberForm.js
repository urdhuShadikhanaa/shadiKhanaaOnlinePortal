import { LightningElement, api } from 'lwc';

export default class PqMatrixMemberForm extends LightningElement {
    @api objectApiName;

    // Key value pairs of FieldApiName and Value
    // @api fieldValues = { LastName: 'Test', Email: 'duy.nguyen@prolifiq.com' };
    @api fieldValues = {};

    objectId;

    recordTypeId;

    title;

    supportData;

    influenceData;

    @api open(objectApiName, objectId, influenceData, supportData, fieldValues = {}) {
        // eslint-disable-next-line @lwc/lwc/no-api-reassignments
        this.objectApiName = objectApiName;
        // eslint-disable-next-line @lwc/lwc/no-api-reassignments
        this.fieldValues = fieldValues;
        this.objectId = objectId;
        this.influenceData = influenceData;
        this.supportData = supportData;
        this.template?.querySelector('c-form-with-record-type-selection')?.open(objectApiName, objectId);
    }

    @api show() {
        this.template?.querySelector('c-form-with-record-type-selection')?.show();
    }

    @api hide() {
        this.template?.querySelector('c-form-with-record-type-selection')?.hide();
    }

    handleSave() {
        this.template?.querySelector('c-pq-dynamic-matrix-member-form')?.submit();
    }

    handleSuccess(event) {
        this.hide();
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