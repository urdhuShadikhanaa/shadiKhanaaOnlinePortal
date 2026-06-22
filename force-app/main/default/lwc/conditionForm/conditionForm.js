import { LightningElement, api } from 'lwc';
import { getSupportedFieldTypes, fieldTypeOperatorsMap, fieldTypeInputTypeMap } from 'c/conditionUtils';
import getPicklistValues from '@salesforce/apex/WhiteSpaceTemplateController.getPicklistValues';
import getRelatedValues from '@salesforce/apex/WhiteSpaceTemplateController.getRelatedObjectValues';
import LABEL_CANCEL from '@salesforce/label/c.Cancel';
import LABEL_DONE from '@salesforce/label/c.Done';
import LABEL_FIELD from '@salesforce/label/c.Field';
import LABEL_OPERATOR from '@salesforce/label/c.Operator';
import LABEL_SELECT_A_FIELD from '@salesforce/label/c.Select_A_Field';
import LABEL_SELECT_AN_OPERATOR from '@salesforce/label/c.Select_An_Operator';
import LABEL_VALUE from '@salesforce/label/c.Value';

export default class ConditionForm extends LightningElement {
    fieldOptions = [];

    @api objectType = '';

    @api field = '';

    @api operator = '';

    @api value = '';

    @api customKey;

    picklistOptions = [];

    privateFields;

    labels = {
        cancel: LABEL_CANCEL,
        done: LABEL_DONE,
        field: LABEL_FIELD,
        operator: LABEL_OPERATOR,
        selectAField: LABEL_SELECT_A_FIELD,
        selectAnOperator: LABEL_SELECT_AN_OPERATOR,
        value: LABEL_VALUE
    };

    @api
    get fields() {
        return this.privateFields;
    }

    set fields(value) {
        this.privateFields = { ...value };
        this.fieldOptions = Object.values(value)
            .filter((field) => getSupportedFieldTypes().includes(field.displayType.toLowerCase()))
            .map((field) => {
                return {
                    label: field.label,
                    value: field.apiName
                };
            });
    }

    get fieldType() {
        return this.field ? this.fields[this.field].displayType.toLowerCase() : '';
    }

    get operators() {
        return this.field ? fieldTypeOperatorsMap[this.fieldType] : [];
    }

    get inputType() {
        const inputType = this.fieldType ? fieldTypeInputTypeMap[this.fieldType] : 'text';

        return inputType;
    }

    get isPicklistInput() {
        return this.inputType === 'combobox';
    }

    connectedCallback() {
        this.getPicklistOptions();
    }

    async getPicklistOptions() {
        let options = [];

        if (this.fieldType === 'boolean') {
            options = [
                {
                    value: 'true',
                    label: 'True'
                },
                {
                    value: 'false',
                    label: 'False'
                }
            ];
        } else if (this.fieldType === 'picklist') {
            options = await getPicklistValues({ objectName: this.objectType, fieldName: this.field });
        } else if (this.fieldType === 'reference') {
            options = await getRelatedValues({ objectName: this.objectType, fieldName: this.field });
        }
        this.picklistOptions = options;
    }

    handleChange(event) {
        const { name, value } = event.target;

        this[name] = value;
        if (name === 'field') {
            // eslint-disable-next-line @lwc/lwc/no-api-reassignments
            this.operator = !this.operators.length
                ? ''
                : this.operators.find((item) => item.value === this.operator)
                ? this.operator
                : this.operators[0].value;
            this.getPicklistOptions();
        }
    }

    handleDone() {
        const allValid = [...this.template.querySelectorAll('lightning-combobox, lightning-input')].reduce(
            (validSoFar, inputCmp) => {
                inputCmp.reportValidity();

                return validSoFar && inputCmp.checkValidity();
            },
            true
        );

        if (allValid) {
            const { customKey, field, operator, value } = this;
            const evt = new CustomEvent('conditionsubmitted', {
                detail: {
                    customKey,
                    field,
                    operator,
                    value
                }
            });

            this.dispatchEvent(evt);
        }
    }

    handleCancel() {
        const evt = new CustomEvent('conditioncanceled', {});

        this.dispatchEvent(evt);
    }
}