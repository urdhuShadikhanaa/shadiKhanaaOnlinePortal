import { LightningElement, api } from 'lwc';
import { isDate } from 'c/utils';
import LABEL_CLICK_TO_EDIT from '@salesforce/label/c.Click_To_Edit';

import defaultTemplate from './defaultTemplate.html';
import amountType from './amountType.html';

import getLookupListForIds from '@salesforce/apex/InputLookupController.getLookupListForIds';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { reduceErrors } from 'c/ldsUtils';

const templates = {
    relatedMapping: defaultTemplate,
    basicMapping: defaultTemplate,
    amountType: amountType,
    default: defaultTemplate
};

export default class WsCellPanelMappedData extends LightningElement {
    @api cellObjectId;

    @api columnName = '';

    @api rowName = '';

    @api allowEdit = false;

    clickTimeout = null;

    objectLabel = '';

    labels = {
        clickToEdit: LABEL_CLICK_TO_EDIT
    };

    configuration = {};

    rowOptions = [];

    columnOptions = [];

    get canCreate() {
        return (
            this.configuration?.canCreateObjects && this.configuration?.mapping?.isObjectCreateable && this.allowEdit
        );
    }

    _field = {};

    @api get field() {
        return this._field;
    }

    _rowObjectIds = [];

    @api get rowObjectIds() {
        return this._rowObjectIds;
    }

    set rowObjectIds(value) {
        let localValue = [...value];

        this._rowObjectIds = localValue;
        this.rowOptions = [];
        if (localValue.length > 1 && this.rowRelation) {
            getLookupListForIds({ idList: localValue })
                .then((result) => {
                    this.rowOptions = result;
                })
                .catch((error) => {
                    this._notifyError('error', reduceErrors(error)[0]);
                });
        }
    }

    _columnObjectIds = [];

    @api get columnObjectIds() {
        return this._columnObjectIds;
    }

    set columnObjectIds(value) {
        let localValue = [...value];

        this._columnObjectIds = localValue;
        this.columnOptions = [];
        if (localValue.length > 1 && this.columnRelation) {
            getLookupListForIds({ idList: localValue })
                .then((result) => {
                    this.columnOptions = result;
                })
                .catch((error) => {
                    this._notifyError('error', reduceErrors(error)[0]);
                });
        }
    }

    set field(field) {
        this._field = field;
        this.configuration = field.configuration;
        this.objectLabel = this.configuration?.mapping?.objectLabel ? this.configuration?.mapping?.objectLabel : '';
        this.setupConditionData();
    }

    get displayType() {
        return this.configuration?.mapping?.valueFieldInfo?.displayType;
    }

    get rowRelation() {
        return this.configuration?.rowRelation;
    }

    get columnRelation() {
        return this.configuration?.columnRelation;
    }

    get cellRelation() {
        return this.configuration?.cellRelation;
    }

    get objectApiName() {
        return this.configuration?.mapping.objectName;
    }

    get conditions() {
        return this.configuration?.mapping.conditions;
    }

    get hasMultipleRelations() {
        return this.rowOptions?.length > 1 || this.columnOptions?.length > 1;
    }

    render() {
        return templates[this.field.fieldType] || templates.default;
    }

    connectedCallback() {
        this.setupConditionPhrase();
    }

    conditionData = {};

    phrase = '';

    setupConditionData() {
        const relatedObjects = {};
        const extraHandlingConditions = new Map();

        if (this.conditions && this.conditions.singleCondition) {
            this.conditions.singleConditions.forEach((item) => {
                if (item.isFieldCreateable) {
                    const condition = item.singleCondition;

                    if (!this.byPassCheck(condition)) {
                        if (condition.pqcrush__Operator__c === 'EQUALS') {
                            relatedObjects[condition.pqcrush__Field__c] = condition.pqcrush__Value__c;
                        } else if (
                            condition.pqcrush__Operator__c === 'GREATER_THAN' ||
                            condition.pqcrush__Operator__c === 'GREATER_THAN_OR_EQUAL_TO'
                        ) {
                            const newCondition = this.processGreaterThanCondition(condition, extraHandlingConditions);

                            extraHandlingConditions.set('greaterthan' + condition.pqcrush__Field__c, newCondition);
                        } else if (
                            condition.pqcrush__Operator__c === 'LESS_THAN' ||
                            condition.pqcrush__Operator__c === 'LESS_THAN_OR_EQUAL_TO'
                        ) {
                            const newCondition = this.processLessThanCondition(condition, extraHandlingConditions);

                            extraHandlingConditions.set('lessthan' + condition.pqcrush__Field__c, newCondition);
                        }
                    }
                }
            });

            extraHandlingConditions.forEach((item) => {
                if (isDate(item.pqcrush__Value__c)) {
                    relatedObjects[item.pqcrush__Field__c] = item.pqcrush__Value__c.toISOString();
                } else {
                    relatedObjects[item.pqcrush__Field__c] = item.pqcrush__Value__c;
                }
            });
        }
        this.conditionData = relatedObjects;
    }

    setupConditionPhrase() {
        if (!this.condition) {
            return;
        }
        const { mapping } = this.configuration;

        let conditionsTranslation = '';
        let operator;
        let finalPhrase = `Create a new ${mapping.objectLabel}`;

        if (mapping.isObjectCreateable) {
            if (mapping.conditions) {
                operator = mapping.conditions.operator || ', or';

                mapping.conditions.singleConditions.forEach((item) => {
                    const condition = item.singleCondition;
                    const phrase = `${condition.pqcrush__Field__c} ${condition.pqcrush__Operator__c} ${condition.pqcrush__Value__c}`;

                    conditionsTranslation = `${conditionsTranslation} ${operator} ${phrase}`;
                });

                const lengthOfOp = operator.length + 2;

                if (conditionsTranslation.length > lengthOfOp) {
                    conditionsTranslation = conditionsTranslation.slice(lengthOfOp - 1);
                    finalPhrase = `Create a new ${mapping.objectLabel} for ${this.columnName} and ${this.rowName} where ${conditionsTranslation}`;
                }
            }
        }
        this.phrase = finalPhrase;
    }

    createRecord(event) {
        const detail = {
            objectApiName: this.objectApiName,
            accountRelationships: this.configuration?.accountRelationships ?? [],
            relatedObjects: {
                ...this.conditionData
            }
        };

        let navigationLocation = 'RELATED_LIST';

        let { rowId, columnId } = event.detail;

        if (this.rowRelation) {
            detail.relatedObjects[this.rowRelation] = rowId
                ? rowId
                : this.rowObjectIds?.length
                ? this.rowObjectIds[0]
                : null;
        } else {
            navigationLocation = '';
        }

        if (this.columnRelation) {
            detail.relatedObjects[this.columnRelation] = columnId
                ? columnId
                : this.columnObjectIds?.length
                ? this.columnObjectIds[0]
                : null;
        } else {
            navigationLocation = '';
        }

        if (this.cellRelation) {
            detail.relatedObjects[this.cellRelation] = this.cellObjectId;
            navigationLocation = 'RELATED_LIST';
        }

        detail.navigationLocation = navigationLocation;

        const createRecordEvent = new CustomEvent('createrecord', {
            detail
        });

        this.dispatchEvent(createRecordEvent);
    }

    // --------------------------------------------------

    byPassCheck(condition) {
        if (condition.pqcrush__Field__c === 'CreatedDate') {
            return true;
        }

        return false;
    }

    processGreaterThanCondition(condition, greaterthanConditions) {
        var newDate;
        const num = Number(condition.pqcrush__Value__c);
        const date = new Date(condition.pqcrush__Value__c);

        if (num) {
            const newValue = num + 1;

            return this.getNewGreaterThanCondition(greaterthanConditions, condition, 0, newValue);
        }
        if (date) {
            newDate = new Date(date);
            newDate.setDate(newDate.getDate() + 1);

            return this.getNewGreaterThanCondition(greaterthanConditions, condition, new Date('1900-01-01'), newDate);
        }

        return Object.assign({}, condition);
    }

    getNewGreaterThanCondition(greaterthanConditions, condition, oldValue, newValue) {
        var newCondition;

        if (greaterthanConditions.has('greaterthan' + condition.pqcrush__Field__c)) {
            oldValue = greaterthanConditions.get('greaterthan' + condition.pqcrush__Field__c).pqcrush__Value__c;
        }
        newCondition = Object.assign({}, condition);
        newCondition.pqcrush__Value__c = newValue > oldValue ? newValue : oldValue;

        return newCondition;
    }

    processLessThanCondition(condition, lessthanConditions) {
        var newDate;
        const date = new Date(condition.pqcrush__Value__c);
        const num = Number(condition.pqcrush__Value__c);

        if (num) {
            const newValue = num > 0 ? 0 : num - 1;

            return this.getNewLessThanCondition(lessthanConditions, condition, 0, newValue);
        }
        if (date) {
            newDate = new Date(date);
            newDate.setDate(newDate.getDate() - 30);

            return this.getNewLessThanCondition(lessthanConditions, condition, new Date('3000-01-01'), newDate);
        }

        return Object.assign({}, condition);
    }

    getNewLessThanCondition(lessthanConditions, condition, oldValue, newValue) {
        var newCondition;

        if (lessthanConditions.has('lessthan' + condition.pqcrush__Field__c)) {
            oldValue = lessthanConditions.get('lessthan' + condition.pqcrush__Field__c).pqcrush__Value__c;
        }
        newCondition = Object.assign({}, condition);
        newCondition.pqcrush__Value__c = newValue < oldValue ? newValue : oldValue;

        return newCondition;
    }

    // --------------------------------------------------

    handleEditRecordClick(event) {
        if (this.clickTimeout) {
            return;
        }

        // eslint-disable-next-line @lwc/lwc/no-async-operation
        this.clickTimeout = window.setTimeout(() => {
            window.clearTimeout(this.clickTimeout);
            this.clickTimeout = null;
        }, 200);

        this.editRecord(event);
    }

    editRecord(event) {
        event.stopPropagation();
        const { objectid, displayname } = event.currentTarget.dataset;

        const detail = {
            recordId: objectid,
            recordName: displayname
        };

        const editRecordEvent = new CustomEvent('editrecord', {
            detail: detail
        });

        this.dispatchEvent(editRecordEvent);
    }

    // --------------------------------------------------

    _notifyError(title, error = '') {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message: error,
                variant: 'error',
                mode: 'sticky'
            })
        );
    }
}