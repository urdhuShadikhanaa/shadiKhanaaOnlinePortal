import { LightningElement, api } from 'lwc';

import {
    getFieldsForLayout,
    densityValues,
    getCompoundFields,
    compoundFieldIsUpdateable,
    compoundFieldIsCreateable,
    isCompoundField,
    isPersonAccount,
    UNSUPPORTED_REFERENCE_FIELDS,
    Fields
} from 'c/fieldUtils';

import { ShowToastEvent } from 'lightning/platformShowToastEvent';

function isUnsupportedReferenceField(name) {
    return UNSUPPORTED_REFERENCE_FIELDS.indexOf(name) !== -1;
}

function normalizeBool(bool) {
    if (!bool) {
        return false;
    }
    switch (bool.toString().toLowerCase()) {
        case '0':
        case 'false':
        case 'no':
        case 'off':
        case 'disabled':
            return false;
        default:
            return true;
    }
}

export default class PqDynamicRecordForm extends LightningElement {
    _objectApiName;

    cols = 1;

    _layout;

    _fields = [];

    _firstLoad = true;

    _loading = true;

    _loadedPending = false;

    _fieldsHandled = false;

    _record;

    _objectInfo;

    _isPersonAccount = false;

    errors = null;

    @api fieldValues = {};

    @api density = densityValues.AUTO;

    @api recordTypeId;

    @api get objectApiName() {
        return this._objectApiName;
    }

    set objectApiName(val) {
        this._objectApiName = val;
    }

    @api get columns() {
        return this.cols;
    }

    set columns(val) {
        this.cols = parseInt(val, 10);
        if (isNaN(this.cols) || this.cols < 1) {
            this.cols = 1;
        }
    }

    @api get layoutType() {
        return this._layout;
    }

    set layoutType(val) {
        if (val.match(/Full|Compact/)) {
            this._layout = val;
        } else {
            throw new Error(`Invalid layout "${val}". Layout must be "Full" or "Compact"`);
        }
    }

    set fields(val) {
        this._fields = [];
        if (Array.isArray(val)) {
            for (let i = 0; i < val.length; i++) {
                this.addField(val[i]);
            }
        } else {
            this.addField(val);
        }
    }

    @api get fields() {
        return this._fields;
    }

    addField(field) {
        const hasValue = field in this.fieldValues;
        let value = null;

        if (hasValue && this._objectInfo.fields[field].dataType === Fields.BOOLEAN) {
            value = normalizeBool(this.fieldValues[field]);
        } else if (hasValue) {
            value = this.fieldValues[field];
        }
        const fieldObj = {
            name: field,
            hasValue,
            value: value
        };

        this._fields.push(fieldObj);
    }

    @api
    submit(fields) {
        this.errors = null;
        let fieldsRequiredMap = {};

        this.fields?.forEach((field) => {
            fieldsRequiredMap[field.name] = { required: field.required, label: field.label };
        });

        let errorMessage = '';
        let numberOfRequiredFields = 0;
        let isValid = true;

        this.template.querySelectorAll('lightning-input-field')?.forEach((inp) => {
            let supportsTrim = typeof inp?.value?.trim === 'function';
            let trimmedValue = supportsTrim ? inp?.value?.trim() : inp?.value;
            let isRequired = fieldsRequiredMap[inp.fieldName].required;

            if (isRequired && (trimmedValue === undefined || trimmedValue === null || trimmedValue === '')) {
                if (numberOfRequiredFields > 0) {
                    errorMessage = errorMessage + ', ';
                }
                errorMessage = errorMessage + fieldsRequiredMap[inp.fieldName].label;
                numberOfRequiredFields++;
                isValid = false;
            }
        });

        if (isValid) {
            this._loading = true;
            this.template.querySelector('lightning-record-edit-form').submit(fields);
        } else {
            this._loading = false;
            this.errors = numberOfRequiredFields > 1 ? errorMessage + ' are required' : errorMessage + ' is required';
            this.dispatchError(this.errors);
        }
    }

    @api
    clearForm() {
        const inputFields = this.template.querySelectorAll('lightning-input-field');

        if (inputFields) {
            inputFields.forEach((field) => {
                field.reset();
            });
        }
    }

    get computedInputClass() {
        if (this.cols === 1) {
            return 'slds-form-element_1-col';
        }

        return '';
    }

    get _rows() {
        const out = [];

        if (!this._objectInfo) {
            return out;
        }
        const rowLength = this.cols;
        const fields = this.fields.slice();
        let rowkey = 0;
        let thisRow = { fields: [], key: rowkey };

        while (fields.length > 0) {
            if (thisRow.fields.length < rowLength) {
                const field = fields.shift();
                const { name, hasValue, value, required } = field;

                if (this._objectInfo.fields && this._objectInfo.fields[name]) {
                    const compound = isCompoundField(name, this._objectInfo, this._isPersonAccount);

                    let compoundFields = [];

                    if (compound) {
                        compoundFields = getCompoundFields(name, this._record, this._objectInfo);
                    }

                    const hasFields = this._objectInfo && this._objectInfo.fields;

                    const fieldUpdateable = compound
                        ? compoundFieldIsUpdateable(
                              compoundFields, // eslint-disable-line indent
                              this._record, // eslint-disable-line indent
                              this._objectInfo // eslint-disable-line indent
                          ) // eslint-disable-line indent
                        : hasFields && this._objectInfo.fields[name].updateable;
                    const fieldCreateable = compound
                        ? compoundFieldIsCreateable(
                              compoundFields, // eslint-disable-line indent
                              this._record, // eslint-disable-line indent
                              this._objectInfo // eslint-disable-line indent
                          ) // eslint-disable-line indent
                        : hasFields && this._objectInfo.fields[name].createable;
                    const shouldShowAsInputInEditMode = fieldUpdateable || (!this._recordId && fieldCreateable);
                    const updateable =
                        !isUnsupportedReferenceField(name) && this._objectInfo ? shouldShowAsInputInEditMode : false;
                    const editable =
                        !isUnsupportedReferenceField(name) &&
                        (hasFields && this._objectInfo.fields[name] ? fieldUpdateable : false);

                    thisRow.fields.push({
                        name,
                        value,
                        editable,
                        required,
                        updateable,
                        compound,
                        canPrepopulate: hasValue && !compound
                    });
                }
            } else {
                out.push(thisRow);
                thisRow = { fields: [], key: ++rowkey };
            }
        }
        if (thisRow.fields.length) {
            out.push(thisRow);
        }

        return out;
    }

    handleLoad(event) {
        event.stopPropagation();
        const { objectInfos, record } = event.detail;
        const apiName = this.objectApiName.objectApiName ? this.objectApiName.objectApiName : this.objectApiName;

        this._record = record;
        this._objectInfo = objectInfos[apiName];

        if (!this._fieldsHandled && objectInfos) {
            const layoutFields = getFieldsForLayout(event.detail, apiName, this._layout);

            // eslint-disable-next-line @lwc/lwc/no-api-reassignments
            this.fields = Object.keys(layoutFields);
            this.populateAdditionalInfo(this.fields, event.detail);
            this._fieldsHandled = true;
        }

        this._isPersonAccount = record ? isPersonAccount(record) : false;

        if (this._firstLoad) {
            this._loading = false;
            this._firstLoad = false;
        }

        if (this._loadedPending) {
            // eslint-disable-next-line @lwc/lwc/no-async-operation
            setTimeout(() => {
                this._loading = false;
                this._loadedPending = false;
            }, 0);
        }

        this.dispatchEvent(
            new CustomEvent('load', {
                detail: event.detail
            })
        );
    }

    populateAdditionalInfo(fields, data) {
        let mapApiName = {};

        data?.layout?.sections?.forEach((section) => {
            section.layoutRows?.forEach((row) => {
                row.layoutItems?.forEach((item) => {
                    let apiName = '';

                    item.layoutComponents?.forEach((comp) => {
                        apiName = comp.apiName;
                    });
                    mapApiName[apiName] = { required: item.required, label: item.label };
                });
            });
        });

        fields?.forEach((field) => {
            if (mapApiName[field.name]) {
                field.required = mapApiName[field.name].required;
                field.label = mapApiName[field.name].label;
            } else {
                field.required = false;
            }
        });
    }

    handleError(event) {
        event.stopPropagation();
        this._loading = false;
        this.dispatchError(event.detail);
    }

    dispatchError(error) {
        this.dispatchEvent(
            new CustomEvent('error', {
                detail: error
            })
        );
    }

    handleSuccess(event) {
        event.stopPropagation();
        this._loading = false;
        this.dispatchEvent(
            new ShowToastEvent({
                title: `${this._objectInfo.label} created!`,
                variant: 'success'
            })
        );
        this.dispatchEvent(
            new CustomEvent('success', {
                detail: event.detail
            })
        );
        this.clearForm();
    }
}