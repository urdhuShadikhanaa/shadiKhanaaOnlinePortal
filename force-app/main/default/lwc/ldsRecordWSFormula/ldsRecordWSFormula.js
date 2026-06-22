import { LightningElement, api } from 'lwc';

// LABELS
import CREATE_NEW_FORMULA from '@salesforce/label/c.Create_New_Formula';
import NEW_SUMMARY_FORMULA from '@salesforce/label/c.New_Summary_Formula';

export default class LdsRecordWSFormula extends LightningElement {
    @api whiteSpaceId;

    _isModalOpen = false;

    labels = {
        createNewFormula: CREATE_NEW_FORMULA,
        newFormula: NEW_SUMMARY_FORMULA
    };

    error = null;

    @api
    set isModalOpen(value) {
        this._isModalOpen = value;
        this.error = null;
        const modal = this.template.querySelector('c-modal');

        if (modal) {
            if (this._isModalOpen) {
                modal.show();
            } else {
                modal.hide();
            }
        }
    }

    get isModalOpen() {
        return this._isModalOpen;
    }

    handleSuccess(event) {
        // eslint-disable-next-line @lwc/lwc/no-api-reassignments
        this.isModalOpen = false;
        const successEvent = new CustomEvent('success', {
            detail: {
                objectId: event.detail.id
            }
        });

        this.dispatchEvent(successEvent);
    }

    handleCancel() {
        // eslint-disable-next-line @lwc/lwc/no-api-reassignments
        this.isModalOpen = false;
        const cancelEvent = new CustomEvent('cancel', {});

        this.dispatchEvent(cancelEvent);
    }

    handleError(event) {
        this.error = event.detail.message;
    }
}