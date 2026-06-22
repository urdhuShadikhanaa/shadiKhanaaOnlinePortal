import { LightningElement, api } from 'lwc';
import { formattedSummaryDisplayData } from 'c/wsDataUtils';
import { isSummationType } from 'c/dataFormatUtils';
import { isLightColor } from 'c/utils';

import customDisplayField from './customDisplayField.html';
import wsTableCellSummaryDisplayField from './wsTableCellSummaryDisplayField.html';
import relatedObjectDisplayField from './relatedObjectDisplayField.html';

const templates = {
    relatedMapping: relatedObjectDisplayField,
    basicMapping: customDisplayField,
    amountType: wsTableCellSummaryDisplayField,
    default: wsTableCellSummaryDisplayField
};

export default class WsTableCellSummaryDisplayField extends LightningElement {
    name;

    displayValue;

    shouldRender = false;

    shouldRenderCount = false;

    type;

    style = '';

    countStyle = '';

    bubbleStyle = '';

    textColor = '';

    displayStyle = '';

    valueContainerClass = 'ws-sum-value-container';

    configuration = {};

    @api fieldIndex;

    @api displayFields;

    privateDisplayField;

    @api
    get displayField() {
        return this.privateDisplayField;
    }

    set displayField(displayField) {
        this.privateDisplayField = displayField;
        this.type = displayField.type ? displayField.type : 'text';
        this.name = displayField.displayName;
        this.configuration = displayField.configuration;

        switch (this.type.toLowerCase()) {
            case 'currency':
            case 'number':
                this.valueContainerClass = 'ws-sum-value-container';
                break;
            default:
                this.valueContainerClass = 'ws-text-value-container';
                break;
        }

        this.style = `background-color: ${displayField.color};`;
        this.displayValue = formattedSummaryDisplayData(this.type, this.displayField.data);

        if (isSummationType(this.type)) {
            if (this.displayValue > 99999999) {
                this.displayStyle = 'font-size: xx-small;';
            } else if (this.displayValue > 99999) {
                this.displayStyle = 'font-size: x-small;';
            }
        }

        this.textColor = isLightColor(displayField.color) ? 'black' : 'white';
        this.displayStyle = this.displayStyle + `color: ${this.textColor};`;
        this.shouldRender = displayField.data.length > 0;
        this.shouldRenderCount = displayField.data.length > 1;
    }

    render() {
        return templates[this.displayField.fieldType] || templates.default;
    }

    get count() {
        return this.displayField.data.length;
    }

    get countValue() {
        return this.count > 9 ? '9+' : this.count.toString();
    }
}