import { LightningElement, api } from 'lwc';
import { operators } from 'c/conditionUtils';
import LABEL_EDIT_CONDITION from '@salesforce/label/c.Edit_Condition';
import LABEL_REMOVE from '@salesforce/label/c.Remove';

export default class ConditionTile extends LightningElement {
    @api customKey;

    @api field;

    @api operator;

    @api value;

    @api fields;

    @api readOnly;

    labels = {
        editCondition: LABEL_EDIT_CONDITION,
        remove: LABEL_REMOVE
    };

    get fieldLabel() {
        if (this.field && this.fields) {
            return this.fields[this.field] ? this.fields[this.field].label : this.field;
        }

        return '';
    }

    get operatorLabel() {
        return this.operator ? operators[this.operator].label : '';
    }

    handleRemove(event) {
        event.stopPropagation();
        if (this.readOnly) {
            return;
        }
        const removeEvt = new CustomEvent('removecondition', {
            detail: {
                customKey: this.customKey
            }
        });

        this.dispatchEvent(removeEvt);
    }

    handleEdit() {
        if (this.readOnly) {
            return;
        }
        const event = new CustomEvent('editcondition', {
            detail: {
                customKey: this.customKey
            }
        });

        this.dispatchEvent(event);
    }
}