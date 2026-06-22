import { LightningElement, api } from 'lwc';

import { formatDataValue } from 'c/dataFormatUtils';

import pqGenericInputFieldBoolean from './pqGenericInputFieldBoolean.html';
import pqGenericInputFieldCurrency from './pqGenericInputFieldCurrency.html';
import pqGenericInputFieldDate from './pqGenericInputFieldDate.html';
import pqGenericInputFieldDouble from './pqGenericInputFieldDouble.html';
import pqGenericInputFieldInteger from './pqGenericInputFieldInteger.html';
import pqGenericInputFieldPercent from './pqGenericInputFieldPercent.html';
import pqGenericInputFieldText from './pqGenericInputFieldText.html';
import pqGenericInputFieldUnknown from './pqGenericInputFieldUnknown.html';

import Amount_Exceeded_One_Trillion from '@salesforce/label/c.Amount_Exceeded_One_Trillion';

export default class PqGenericInputField extends LightningElement {
    value;

    @api displayName;

    @api booleanValue;

    @api
    set fieldValue(value) {
        this._fieldValue = value;
        this.setupFormattedValues(value);
    }

    get fieldValue() {
        return this._fieldValue;
    }

    _fieldValue = null;

    @api
    set type(type) {
        this._type = type;
        this.setupFormattedValues(this.fieldValue);
    }

    get type() {
        return this._type;
    }

    _type = null;

    labels = {
        AmountExceededOneTrillion: Amount_Exceeded_One_Trillion
    };

    renderHtml = {
        textarea: pqGenericInputFieldText,
        text: pqGenericInputFieldText,
        currency: pqGenericInputFieldCurrency,
        double: pqGenericInputFieldDouble,
        percent: pqGenericInputFieldPercent,
        integer: pqGenericInputFieldInteger,
        boolean: pqGenericInputFieldBoolean,
        date: pqGenericInputFieldDate
    };

    get title() {
        return this.displayName + ': ' + this.value;
    }

    @api resetValue() {
        this.setupFormattedValues(this.fieldValue);
    }

    setupFormattedValues(newValue) {
        if (!this.type) {
            return;
        }
        const formattedValue = formatDataValue(newValue, this.type);

        this.value = formattedValue;
        if (this.type === 'boolean') {
            // eslint-disable-next-line @lwc/lwc/no-api-reassignments
            this.booleanValue = formattedValue;
        }
        this.autosize();
    }

    render() {
        if (this.renderHtml[this.type]) {
            return this.renderHtml[this.type];
        }

        return pqGenericInputFieldUnknown;
    }

    onTextInput(event) {
        var updatedValue = event.target.value;

        this.setupFormattedValues(updatedValue);
        this.autosize();
    }

    onAmountFocus(event) {
        // Set value to empty if value is 0 for aesthetics

        // Also stupid fix for stupid firefox because
        // Lightning:input won't gain focus if there's a value
        // So need to clear it out then re-apply value
        if (!event || !event.target) {
            return;
        }
        let element = event.target;
        let val = element.value;

        element.value = null;

        if (parseInt(val, 10) !== 0) {
            // eslint-disable-next-line @lwc/lwc/no-async-operation
            window.setTimeout(() => {
                element.value = val;
            }, 25);
        }
    }

    cleanupAmount(event) {
        if (!event || !event.target) {
            return;
        }

        // Set value to 0 if user clears out the amount
        if (!event.target.value) {
            event.target.value = 0;
        }
    }

    onValueChange(event) {
        if (!event || !event.target) {
            return;
        }
        const updatedValue = event.target.value;

        this.setupFormattedValues(updatedValue);
        const valueChangedEvent = new CustomEvent('valuechanged', {
            detail: { value: updatedValue }
        });

        this.dispatchEvent(valueChangedEvent);
    }

    // Prevents the value from changing when the user scrolls over a lightning:input number field
    preventValueChange(event) {
        event.preventDefault();
    }

    autosize() {
        const textArea = this.template.querySelector("[data-id='inputTextArea']");

        if (!textArea) {
            return;
        }
        let el = textArea.getElement();

        if (el) {
            el.style.height = 'auto';
            el.style.height = el.scrollHeight + 'px';
        }
    }
}