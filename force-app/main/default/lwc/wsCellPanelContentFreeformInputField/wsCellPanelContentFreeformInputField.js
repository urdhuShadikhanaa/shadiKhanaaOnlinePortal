import { LightningElement, api } from 'lwc';

import { formatDataValue } from 'c/dataFormatUtils';

import LABEL_SAVE from '@salesforce/label/c.Save';
import LABEL_CANCEL from '@salesforce/label/c.Cancel';

export default class WsCellPanelContentFreeformInputField extends LightningElement {
    @api
    set displayField(value) {
        this._displayField = value;
        this.setupDefaultCurrentValue();
    }

    get displayField() {
        return this._displayField;
    }

    _displayField = {};

    @api
    set valueObject(value) {
        this._valueObj = value;
        this.setupDefaultCurrentValue();
    }

    get valueObject() {
        return this._valueObj;
    }

    _valueObj = {};

    hasChanges = false;

    originalValue;

    currentValue;

    labels = {
        save: LABEL_SAVE,
        cancel: LABEL_CANCEL
    };

    setupDefaultCurrentValue() {
        if (!this.displayField.type) {
            return;
        }
        let formattedValue = formatDataValue(this._valueObj.value, this.displayField.type);

        this.currentValue = formattedValue;
        this.originalValue = formattedValue;
    }

    handleValueChanged(event) {
        const { value } = event.detail;

        this.currentValue = formatDataValue(value, this.displayField.type);
        this.hasChanges = this.currentValue !== this.originalValue;
    }

    handleSaveValue() {
        const detail = {
            dataObjId: this.valueObject.objectId,
            updatedValue: this.currentValue
        };

        const saveValueEvent = new CustomEvent('valuesaved', {
            detail: detail
        });

        this.dispatchEvent(saveValueEvent);
        this.originalValue = this.currentValue;
        this.hasChanges = false;
    }

    handleResetValue() {
        this.template.querySelector('c-pq-generic-input-field').resetValue();
        this.currentValue = this.originalValue;
        this.hasChanges = false;
    }
}