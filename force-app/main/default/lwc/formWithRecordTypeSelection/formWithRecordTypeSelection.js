import { LightningElement, api } from 'lwc';

// Importing to get the object info
import getRecordTypeInfos from '@salesforce/apex/SObjectController.getRecordTypeInfos';

// LABELS
import LABEL_CONTINUE from '@salesforce/label/c.Continue';
import LABEL_SELECT_RECORD_TYPE from '@salesforce/label/c.Select_Record_Type';

export default class FormWithRecordTypeSelection extends LightningElement {
    labels = {
        continue: LABEL_CONTINUE,
        selectRecordType: LABEL_SELECT_RECORD_TYPE
    };

    recordTypeOptions = [];

    defaultRecordType = null;

    error = null;

    isButtonDisabled = true;

    recordTypeSelection = null;

    showRecordTypeSelector = false;

    showRecordModal = false;

    @api modalTitle;

    @api
    set modalError(value) {
        this.error = value;
    }

    get modalError() {
        return this.error;
    }

    @api show() {
        this.setShowRecordTypeSelector();

        // This.template.querySelector('c-modal').show();
    }

    @api hide() {
        // This.template.querySelector('c-modal').hide();
    }

    @api open(objectApiName) {
        this.error = null;
        this.getRecordTypes(objectApiName);
        this.show();
    }

    async getRecordTypes(sobjectApiName) {
        await getRecordTypeInfos({ sobjectApiName })
            .then((rtValues) => {
                let optionsValues = [];

                for (let i = 0; i < rtValues.length; i++) {
                    if (!rtValues[i].isMaster && rtValues[i].isActive && rtValues[i].isAvailable) {
                        optionsValues.push({
                            label: rtValues[i].name,
                            value: rtValues[i].recordTypeId
                        });

                        if (rtValues[i].isDefaultRecordTypeMapping) {
                            this.defaultRecordType = rtValues[i].recordTypeId;
                            this.recordTypeSelection = this.defaultRecordType;
                            this.isButtonDisabled = false;
                        }
                    }
                }

                this.recordTypeOptions = optionsValues;
                this.setShowRecordTypeSelector();
            })
            .catch((error) => {
                this.error = error.message;
            });
    }

    setShowRecordTypeSelector() {
        if (!this.recordTypeOptions) {
            this.showRecordModal = true;
            this.showRecordTypeSelector = false;

            return;
        }

        if (this.recordTypeOptions.length === 1) {
            this.showRecordModal = true;
            this.showRecordTypeSelector = false;
            let evt = new CustomEvent('recordtypeselected', {
                detail: { recordTypeId: this.recordTypeSelection }
            });

            this.dispatchEvent(evt);
        } else if (this.recordTypeOptions.length > 1) {
            this.showRecordTypeSelector = true;
            this.showRecordModal = false;
        } else {
            this.showRecordModal = true;
            this.showRecordTypeSelector = false;
        }
    }

    handleCancel() {
        let cancelEvent = new CustomEvent('cancel', {});

        this.dispatchEvent(cancelEvent);
    }

    handleError(event) {
        this.error = event.detail.message;
    }

    handleChange() {
        this.isButtonDisabled = false;
    }

    handleClick() {
        let combobox = this.template.querySelector('.combobox-container');

        this.recordTypeSelection = combobox.value;
        this.showRecordTypeSelector = false;
        this.showRecordModal = true;
        let evt = new CustomEvent('recordtypeselected', {
            detail: { recordTypeId: this.recordTypeSelection }
        });

        this.dispatchEvent(evt);
    }
}