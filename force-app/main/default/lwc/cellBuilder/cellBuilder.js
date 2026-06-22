import { LightningElement, api } from 'lwc';
import LABEL_ADD_AMOUNT_TYPE from '@salesforce/label/c.Add_Amount_Type';
import LABEL_VALUE from '@salesforce/label/c.Value';
import LABEL_WARNING from '@salesforce/label/c.Warning';
import LABEL_WHITE_SPACE_CELL_WARNING from '@salesforce/label/c.White_Space_Cell_Warning';

export default class CellBuilder extends LightningElement {
    @api readOnly;

    @api targetObjectOptions = [];

    @api amountTypes = [];

    @api builderState;

    labels = {
        addAmountType: LABEL_ADD_AMOUNT_TYPE,
        cellWarning: LABEL_WHITE_SPACE_CELL_WARNING,
        value: LABEL_VALUE,
        warning: LABEL_WARNING
    };

    get amountTypeFields() {
        return this.builderState?.cell?.amountTypeFields ?? [];
    }

    get basicFields() {
        return this.builderState?.cell?.basicFields ?? [];
    }

    get addAmountTypesDisabled() {
        return this.targetObjectOptions.length === 0 || this.amountTypes.length === 0;
    }

    get addBasicFieldsDisabled() {
        return this.targetObjectOptions.length === 0;
    }

    @api
    getConfiguration() {
        let configurations = [];
        const forms = [...this.template.querySelectorAll('c-configuration-form')];

        forms.forEach((form) => configurations.push(form.getConfiguration()));

        return configurations;
    }

    renderedCallback() {
        if (this.hasRendered) {
            return;
        }
        this.hasRendered = true;
        const forms = [...this.template.querySelectorAll('c-configuration-form')];

        forms.forEach((form) => {
            form.reportValidity();
        });
    }

    handleAddBasicField() {
        const evt = new CustomEvent('addbasicfield', {
            detail: {}
        });

        this.dispatchEvent(evt);
    }

    handleRemoveBasicField(event) {
        const evt = new CustomEvent('removebasicfield', {
            detail: {
                id: event.target.value
            }
        });

        this.dispatchEvent(evt);
    }

    handleAddAmountTypeField(event) {
        const amountTypeId = event.detail.value;
        const evt = new CustomEvent('addamounttypefield', {
            detail: {
                amountTypeId
            }
        });

        this.dispatchEvent(evt);
    }

    handleRemoveAmountTypeField(event) {
        const amountTypeId = event.target.value;
        const evt = new CustomEvent('removeamounttypefield', {
            detail: {
                amountTypeId
            }
        });

        this.dispatchEvent(evt);
    }

    handleAmountTypeFieldChange(event) {
        this.dispatchFormChange('amountType', event);
    }

    handleBasicFieldChange(event) {
        this.dispatchFormChange('basicMapping', event);
    }

    dispatchFormChange(type, event) {
        const { customKey, field, value } = event.detail;
        const evt = new CustomEvent('formchange', {
            detail: {
                type,
                customKey,
                field,
                value
            }
        });

        this.dispatchEvent(evt);
    }
}