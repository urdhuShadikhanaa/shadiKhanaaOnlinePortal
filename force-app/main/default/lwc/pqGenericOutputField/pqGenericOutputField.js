import { LightningElement, api } from 'lwc';
import { formatDataValue } from 'c/dataFormatUtils';
import CURRENCY from '@salesforce/i18n/currency';

export default class PqGenericOutputField extends LightningElement {
    currencyCode = CURRENCY;

    @api fieldValue;

    @api displayStyle;

    initialRender = true;

    isNumber = false;

    isText = false;

    isDate = false;

    numberFormatStyle = 'currency';

    displayDigits = 0;

    _displayType;

    @api
    set displayType(type) {
        this._displayType = type;
        this.setupTypeFlags(type);
    }

    get displayType() {
        return this._displayType;
    }

    get displayValue() {
        return formatDataValue(this.fieldValue, this.displayType);
    }

    setupTypeFlags(type) {
        if (!type || typeof type !== 'string') {
            return;
        }
        switch (type.toLowerCase()) {
            case 'date':
            case 'datetime':
                this.isDate = true;
                break;
            case 'currency':
                this.isNumber = true;
                this.numberFormatStyle = 'currency';
                this.displayDigits = 2;
                break;
            case 'double':
                this.isNumber = true;
                this.numberFormatStyle = 'decimal';
                this.displayDigits = 6;
                break;
            case 'integer':
                this.isNumber = true;
                this.numberFormatStyle = 'decimal';
                this.displayDigits = 0;
                break;
            case 'percent':
                this.isNumber = true;
                this.numberFormatStyle = 'percent-fixed';
                this.displayDigits = 2;
                break;
            default:
                this.isText = true;
                break;
        }
    }
}