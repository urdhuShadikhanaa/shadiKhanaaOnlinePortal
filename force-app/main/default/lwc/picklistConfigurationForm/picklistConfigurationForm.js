import { LightningElement, api } from 'lwc';

import LABEL_TARGET_OBJECT_TYPE from '@salesforce/label/c.Target_Object_Type';
import LABEL_TARGET_VALUE_FIELD from '@salesforce/label/c.Target_Value_Field';

import WsTemplateBuilderService from 'c/wsTemplateBuilderService';

export default class PicklistConfigurationForm extends LightningElement {
    labels = {
        targetObjectType: LABEL_TARGET_OBJECT_TYPE,
        targetValueField: LABEL_TARGET_VALUE_FIELD
    };

    @api excludedFields = [];

    @api targetValueField;

    @api usePicklistDependency = false;

    @api readOnly;

    fields = {};

    _targetObject;

    @api
    get targetObject() {
        return this._targetObject;
    }

    set targetObject(targetObject) {
        this._targetObject = targetObject;
        this.setFields();
    }

    _targetObjectOptions = [];

    @api
    get targetObjectOptions() {
        return this._targetObjectOptions;
    }

    set targetObjectOptions(targetObjectOptions) {
        this._targetObjectOptions = [...targetObjectOptions];
    }

    get targetObjectTypeLabel() {
        return WsTemplateBuilderService.getObjectLabel(this.targetObject);
    }

    get picklistFields() {
        const picklistFields = Object.values(this.fields)
            .filter((field) => {
                const displayType = field.displayType.toLowerCase();

                return (
                    (displayType === 'picklist' || displayType === 'multipicklist') &&
                    field.isUpdateable &&
                    !this.excludedFields.includes(field.apiName)
                );
            })
            .map((field) => {
                return {
                    label: field.label,
                    value: field.apiName
                };
            });

        return picklistFields;
    }

    get controllingField() {
        let controllingField;

        const controllingFieldName = this.fields[this.targetValueField]?.controllingFieldName;

        if (controllingFieldName) {
            controllingField = this.fields[controllingFieldName];
        }

        return controllingField;
    }

    get targetValueFieldLabel() {
        return this.fields[this.targetValueField]?.label;
    }

    async setFields() {
        const fields = await WsTemplateBuilderService.getFieldsForObjectAsMap(this.targetObject);

        this.fields = fields;
    }

    handleTargetObjectChange(event) {
        const { name, value } = event.target;

        // eslint-disable-next-line @lwc/lwc/no-api-reassignments
        this._targetObject = value;
        this.dispatchFormChange(name, value);
    }

    async handleTargetValueFieldChange(event) {
        const { name, value } = event.target;

        // eslint-disable-next-line @lwc/lwc/no-api-reassignments
        this.targetValueField = value;
        this.dispatchFormChange(name, value);
    }

    handleControllingFieldOptionChange(event) {
        const { name, checked } = event.target;

        // eslint-disable-next-line @lwc/lwc/no-api-reassignments
        this.usePicklistDependency = checked;
        this.dispatchFormChange(name, checked);
    }

    dispatchFormChange(field, value) {
        const event = new CustomEvent('formchange', {
            detail: {
                field: field,
                value: value
            }
        });

        this.dispatchEvent(event);
    }
}