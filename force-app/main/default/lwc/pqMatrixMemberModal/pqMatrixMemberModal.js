import { LightningElement, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import Record_Updated from '@salesforce/label/c.Record_Updated';
import Cancel from '@salesforce/label/c.Cancel';
import Save from '@salesforce/label/c.Save';
import Close from '@salesforce/label/c.Close';

export default class PqMatrixMemberModal extends LightningElement {
    @api objectApiName;

    // Key value pairs of FieldApiName and Value
    // @api fieldValues = { LastName: 'Test', Email: 'duy.nguyen@prolifiq.com' };
    @api fieldValues = {};

    objectId;

    recordTypeId;

    title;

    supportData;

    influenceData;

    canEdit = false;

    labels = {
        Cancel,
        Close,
        Save
    };

    @api open(objectApiName, objectId, influenceData, supportData, fieldValues = {}, canEdit) {
        // eslint-disable-next-line @lwc/lwc/no-api-reassignments
        this.objectApiName = objectApiName;
        // eslint-disable-next-line @lwc/lwc/no-api-reassignments
        this.fieldValues = fieldValues;
        this.objectId = objectId;
        this.influenceData = influenceData;
        this.supportData = supportData;
        this.canEdit = canEdit;
        this.template?.querySelector('c-modal-with-record-type-selection')?.open(objectApiName, objectId);
    }

    @api show() {
        this.template?.querySelector('c-modal-with-record-type-selection')?.show();
    }

    @api hide() {
        this.template?.querySelector('c-modal-with-record-type-selection')?.hide();
    }

    handleSave() {
        this.template?.querySelector('c-pq-dynamic-matrix-member-form')?.submit();
    }

    handleSuccess(event) {
        this.hide();
        this.dispatchEvent(
            new ShowToastEvent({
                title: Record_Updated,
                variant: 'success'
            })
        );
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
            this.title = `${objectInfo.label}`;
        }
    }

    handleRecordTypeSelected(event) {
        this.recordTypeId = event.detail.recordTypeId;
    }
}