import { LightningElement, api } from 'lwc';

// LABELS
import CREATE_NEW_DATA_TYPE from '@salesforce/label/c.Create_New_Data_Type';
import NEW_DATA_TYPE from '@salesforce/label/c.New_Data_Type';

export default class DataTypeModal extends LightningElement {
    @api whiteSpaceId;

    labels = {
        createNewDataType: CREATE_NEW_DATA_TYPE,
        newDataType: NEW_DATA_TYPE
    };

    error = null;

    @api show() {
        this.error = null;
        const modal = this.template.querySelector('c-modal');

        if (modal) {
            modal.show();
        }
    }

    @api hide() {
        const modal = this.template.querySelector('c-modal');

        if (modal) {
            modal.hide();
        }
    }

    handleSuccess(event) {
        // eslint-disable-next-line @lwc/lwc/no-api-reassignments
        this.hide();
        const successEvent = new CustomEvent('success', {
            detail: {
                objectId: event.detail.id
            }
        });

        this.dispatchEvent(successEvent);
    }

    handleCancel() {
        // eslint-disable-next-line @lwc/lwc/no-api-reassignments
        this.hide();
        const cancelEvent = new CustomEvent('cancel', {});

        this.dispatchEvent(cancelEvent);
    }

    handleError(event) {
        this.error = event.detail.message;
    }

    handleSubmit(event) {
        event.preventDefault(); // Stop the form from submitting
        let fields = event.detail.fields;

        fields.pqcrush__White_Space__c = this.whiteSpaceId;
        this.template.querySelector('lightning-record-edit-form').submit(fields);
    }
}