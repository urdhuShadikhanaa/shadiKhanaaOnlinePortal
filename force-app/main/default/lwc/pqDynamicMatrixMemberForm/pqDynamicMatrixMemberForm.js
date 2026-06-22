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

import getMatrixMemberById from '@salesforce/apex/GraphDataController.getMatrixMemberById';
import getMatrixByMemberId from '@salesforce/apex/GraphDataController.getMatrixByMemberId';
import updateMatrixMember from '@salesforce/apex/GraphDataController.updateMatrixMember';

import Influence from '@salesforce/label/c.Influence';
import Support from '@salesforce/label/c.Support';

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

export default class PqDynamicMatrixMemberForm extends LightningElement {
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

    labels = {
        Influence,
        Support
    };

    @api fieldValues = {};

    @api density = densityValues.AUTO;

    @api recordTypeId;

    _objectId;

    @api influenceData;

    @api supportData;

    @api containerId;

    currentInfluence;

    currentSupport;

    personId;

    matrixInfo;

    @api canEdit;

    @api get objectId() {
        return this._objectId;
    }

    set objectId(val) {
        this._objectId = val;
        this.getMemberData(val);
    }

    async getMemberData(memberId) {
        this.matrixInfo = await getMatrixByMemberId({ memberId });
        getMatrixMemberById({ memberId })
            .then((result) => {
                this.currentInfluence = null;
                this.currentSupport = null;
                if (result) {
                    this.personId = result.personId;
                    this.influenceData.forEach((item) => {
                        if (item.name === result.influence) {
                            this.currentInfluence = {
                                name: item.name,
                                value: item.value
                            };
                        }
                    });
                    this.supportData.forEach((item) => {
                        if (item.name === result.support) {
                            this.currentSupport = {
                                name: item.name,
                                value: item.value,
                                color: item.color
                            };
                        }
                    });

                    // This.currentInfluence = result.influence;
                    // This.currentSupport = result.support;
                }
            })
            .catch((error) => {
                this.handleError(error);
            });
    }

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
                // REMOVE INFLUENCE & SUPPORT FIELDS
                if (
                    val[i] === 'pqcrush__InfluenceId__c' ||
                    val[i] === 'pqcrush__Influence__c' ||
                    val[i] === 'pqcrush__SupportId__c' ||
                    val[i] === 'pqcrush__Support__c'
                ) {
                    continue;
                }

                this.addField(val[i]);
            }
        } else {
            this.addField(val);
        }

        // Add custom field
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
        this._loading = true;
        this.template.querySelector('lightning-record-edit-form').submit(fields);
    }

    @api
    clearForm() {
        const inputFields = this.template.querySelectorAll('lightning-input-field');

        if (inputFields) {
            inputFields.forEach((field) => {
                if (
                    field.dataset?.name !== 'pqcrush__Relationship_Map__c' &&
                    field.dataset?.name !== 'pqcrush__Account_Plan__c'
                ) {
                    field.reset();
                }
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
                const { name, hasValue, value } = field;

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

        let influenceRow = { fields: [], key: ++rowkey };
        let influenceOptions = [];

        this.influenceData?.forEach((item) => {
            if (item.name) {
                influenceOptions.push({
                    label: item.value,
                    value: item.name
                });
            }
        });

        let customInfluence = {
            name: this.matrixInfo?.influenceLabel ? this.matrixInfo.influenceLabel : this.labels.Influence,
            isCustom: true,
            value: this.currentInfluence?.name,
            options: influenceOptions,
            readOnly: !this.canEdit,
            dataKey: 'influence'
        };

        influenceRow.fields.push(customInfluence);
        out.push(influenceRow);

        let supportRow = { fields: [], key: ++rowkey };
        let supportOptions = [];

        this.supportData?.forEach((item) => {
            if (item.name) {
                supportOptions.push({
                    label: item.value,
                    value: item.name
                });
            }
        });

        let custom = {
            name: this.matrixInfo?.influenceLabel ? this.matrixInfo.supportLabel : this.labels.Support,
            isCustom: true,
            value: this.currentSupport?.name,
            options: supportOptions,
            readOnly: !this.canEdit,
            dataKey: 'support'
        };

        supportRow.fields.push(custom);

        out.push(supportRow);

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

    handleError(event) {
        event.stopPropagation();
        this._loading = false;
        this.dispatchEvent(
            new CustomEvent('error', {
                detail: event.detail
            })
        );
    }

    handleSuccess(event) {
        event.stopPropagation();
        this._loading = false;

        let memberId = event.detail.id;

        updateMatrixMember({
            memberId: memberId,
            influence: this.currentInfluence?.name,
            support: this.currentSupport?.name
        })
            .then(() => {
                this.dispatchEvent(
                    new CustomEvent('success', {
                        detail: {
                            memberId: this.personId,
                            influence: this.currentInfluence,
                            support: this.currentSupport
                        }
                    })
                );
            })
            .catch((error) => {
                this.handleError(error);
            });

        this.clearForm();
    }

    handleChange(event) {
        if (event.currentTarget.dataset.key === 'support') {
            this.currentSupport = this.getInfluenceSupportForName(this.supportData, event.currentTarget.value);
        }

        if (event.currentTarget.dataset.key === 'influence') {
            this.currentInfluence = this.getInfluenceSupportForName(this.influenceData, event.currentTarget.value);
        }
    }

    getInfluenceSupportForName(data, name) {
        if (data) {
            const found = data.find((element) => element.name === name);

            return {
                name: found.name,
                value: found.value,
                color: found.color
            };
        }

        return {};
    }
}