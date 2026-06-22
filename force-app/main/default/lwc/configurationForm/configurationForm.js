import { LightningElement, api } from 'lwc';
import LABEL_ADD_CONDITION from '@salesforce/label/c.Add_Condition';
import LABEL_ALL_CONDITIONS_ARE_TRUE from '@salesforce/label/c.All_Conditions_Are_True';
import LABEL_ANY_CONDITIONS_ARE_TRUE from '@salesforce/label/c.Any_Conditions_Are_True';
import LABEL_CUSTOM_CONDITION_LOGIC_IS_MET from '@salesforce/label/c.Custom_Condition_Logic_Is_Met';
import LABEL_CONDITIONS from '@salesforce/label/c.Conditions';
import LABEL_CONDITION_LOGIC from '@salesforce/label/c.condition_Logic';
import LABEL_CONDITION_LOGIC_HELP from '@salesforce/label/c.condition_Logic_Help';
import LABEL_GROUP_RECORDS_TOGETHER from '@salesforce/label/c.Group_Records_Together';
import LABEL_NONE from '@salesforce/label/c.None';
import LABEL_PARENT_RELATIONSHIP_FIELD from '@salesforce/label/c.Parent_Relationship_Field';
import LABEL_SELECT_A_LABEL_FIELD from '@salesforce/label/c.Select_A_Label_Field';
import LABEL_SELECT_A_PARENT_FIELD from '@salesforce/label/c.Select_A_Parent_Field';
import LABEL_SELECT_A_VALUE_FIELD from '@salesforce/label/c.Select_A_Value_Field';
import LABEL_SELECT_AN_OBJECT from '@salesforce/label/c.Select_An_Object';
import LABEL_TARGET_LABEL_FIELD from '@salesforce/label/c.Target_Label_Field';
import LABEL_TARGET_VALUE_FIELD from '@salesforce/label/c.Target_Value_Field';
import LABEL_TARGET_OBJECT_TYPE from '@salesforce/label/c.Target_Object_Type';
import LABEL_WARNING from '@salesforce/label/c.Warning';
import LABEL_WARNING_NUMERICAL_FIELD from '@salesforce/label/c.WS_Numerical_Fields_Required_Warning';
import LABEL_MISSING_CONDITION_ALPHABETS from '@salesforce/label/c.ws_error_MissingConditionAlphabets';
import LABEL_INVALID_START_END_CONDITIONS from '@salesforce/label/c.ws_error_InvalidStartEndConditions';
import LABEL_MISMATCHED_PARENTHESES from '@salesforce/label/c.ws_error_MismatchedParentheses';
import LABEL_INVALID_CHARACTER from '@salesforce/label/c.ws_error_InvalidCharacter';
import LABEL_ADJACENT_LETTERS from '@salesforce/label/c.ws_error_AdjacentLetters';
import LABEL_ADJACENT_AND_OR from '@salesforce/label/c.ws_error_AdjacentANDOR';
import LABEL_INVALID_OPEN_PARENTHESIS from '@salesforce/label/c.ws_error_InvalidOpenParenthesis';
import LABEL_INVALID_CLOSE_PARENTHESIS from '@salesforce/label/c.ws_error_InvalidCloseParenthesis';

import {
    transformConditionLogic,
    resetConditionSymbols,
    containsAllConditionAlphabets,
    checkStartEndConditions,
    isValidParentheses,
    checkAdjacentLetters,
    checkAdjacentPlusMinus,
    checkInvalidOpenParenthesis,
    checkInvalidCloseParenthesis,
    isValidCharacter
} from './customConditionUtils';

const defaultConditionOperator = 'AND';

import WsTemplateBuilderService from 'c/wsTemplateBuilderService';

export default class ConfigurationForm extends LightningElement {
    @api customKey;

    _targetObject;

    @api
    get targetObject() {
        return this._targetObject;
    }

    set targetObject(targetObject) {
        this._targetObject = targetObject;
        this.setFields();
    }

    fields = [];

    fieldsMap = {};

    async setFields() {
        const fields = await WsTemplateBuilderService.getFieldsForObjectAsList(this.targetObject);

        this.fields = fields;
        const fieldMap = await WsTemplateBuilderService.getFieldsForObjectAsMap(this.targetObject);

        this.fieldsMap = fieldMap;
        if (this.hasProductRelationship && this.targetObject === 'Opportunity') {
            const additionalFields = await WsTemplateBuilderService.getFieldsForObjectAsList('OpportunityLineItem');

            this.fields = [...fields, ...additionalFields];
        }
        this.generateOptions();
    }

    @api targetObjectOptions = [];

    @api targetValueField = '';

    @api targetParentField = '';

    @api conditionOperator = '';

    @api recordsAreGrouped = false;

    @api enableGrouping = false;

    @api includeValueField = false;

    @api includeParentField = false;

    @api hasProductRelationship = false;

    @api messageForDependencyWarning = '';

    privateConditions = [];

    privateTargetLabelField = '';

    targetLabelFieldOptions = [];

    targetValueFieldOptions = [];

    targetParentFieldOptions = [];

    showNewCondition = false;

    labels = {
        addCondition: LABEL_ADD_CONDITION,
        conditions: LABEL_CONDITIONS,
        conditionLogic: LABEL_CONDITION_LOGIC,
        conditionLogicHelp: LABEL_CONDITION_LOGIC_HELP,
        groupRecordsTogether: LABEL_GROUP_RECORDS_TOGETHER,
        parentRelationshipField: LABEL_PARENT_RELATIONSHIP_FIELD,
        selectALabelField: LABEL_SELECT_A_LABEL_FIELD,
        selectAParentField: LABEL_SELECT_A_PARENT_FIELD,
        selectAValueField: LABEL_SELECT_A_VALUE_FIELD,
        selectAnObject: LABEL_SELECT_AN_OBJECT,
        targetLabelField: LABEL_TARGET_LABEL_FIELD,
        targetObjectType: LABEL_TARGET_OBJECT_TYPE,
        targetValueField: LABEL_TARGET_VALUE_FIELD,
        warning: LABEL_WARNING
    };

    get _targetObjectOptions() {
        return [...this.targetObjectOptions] || [];
    }

    @api
    get conditions() {
        return this.privateConditions;
    }

    set conditions(value) {
        this.privateConditions = this.normalizeConditions(value);
    }

    @api
    get targetLabelField() {
        return this.privateTargetLabelField;
    }

    set targetLabelField(value) {
        this.privateTargetLabelField = value;
    }

    @api
    reportValidity() {
        const inputFields = [...this.template.querySelectorAll('lightning-combobox')];

        inputFields.forEach((field) => {
            field.reportValidity();
        });
    }

    @api
    getConfiguration() {
        const {
            customKey,
            targetObject,
            targetLabelField,
            targetValueField,
            targetParentField,
            conditionOperator,
            conditions
        } = this;
        const configuration = {
            customKey,
            targetObject,
            targetLabelField,
            targetValueField,
            targetParentField,
            conditionOperator,
            conditions: conditions.map(({ field, operator, value }) => {
                return {
                    field,
                    operator,
                    value
                };
            })
        };

        return configuration;
    }

    _readOnly = false;

    @api
    get readOnly() {
        return this._readOnly;
    }

    set readOnly(value) {
        this._readOnly = value;
        if (this._readOnly) {
            this.showNewCondition = false;
        }
    }

    customLogicText = '';
    get showCustomLogicInput() {
        let response = false;
        const isValidCustomLogicOperator = ['AND', 'OR', ''].includes(this.conditionOperator);

        if (!isValidCustomLogicOperator) {
            if (this.conditions.length > 2) {
                response = true;
            }
            if (this.customLogicText === '' && this.conditionOperator !== 'CUSTOM') {
                this.customLogicText = this.conditionOperator;
                // eslint-disable-next-line @lwc/lwc/no-api-reassignments
                this.conditionOperator = 'CUSTOM';
            }
        }

        return response;
    }

    get conditionOperatorRadioValue() {
        const isBasicLogicOperator = ['AND', 'OR'].includes(this.conditionOperator);
        if (isBasicLogicOperator) {
            return this.conditionOperator;
        }

        return 'CUSTOM';
    }

    get addConditionDisabled() {
        return !this.targetObject || !this.fields || this.showNewCondition || this.conditions.length > 25;
    }

    get isTargetObjectOptionsEmpty() {
        return this.targetObjectOptions.length === 0;
    }

    get targetLabelFieldDisabled() {
        return !this.targetObject || !this.targetLabelFieldOptions || !this.targetLabelFieldOptions.length;
    }

    get targetValueFieldDisabled() {
        return !this.targetObject || !this.targetValueFieldOptions.length;
    }

    get targetParentFieldDisabled() {
        return !this.targetObject || !this.targetParentFieldOptions.length;
    }

    get multipleConditions() {
        return this.conditions.length > 1;
    }

    get canGroup() {
        const field = this.findFieldData(this.targetLabelField);

        return WsTemplateBuilderService.isFieldGroupable(field) && this.enableGrouping && !this.targetParentField;
    }

    get canShowParentSelection() {
        return this.includeParentField && !this.recordsAreGrouped;
    }

    get conditionOperatorOptions() {
        let Options = [
            { label: LABEL_ALL_CONDITIONS_ARE_TRUE, value: 'AND' },
            { label: LABEL_ANY_CONDITIONS_ARE_TRUE, value: 'OR' }
        ];
        if (this.conditions.length > 2) {
            Options.push({ label: LABEL_CUSTOM_CONDITION_LOGIC_IS_MET, value: 'CUSTOM' });
        }
        return Options;
    }

    get targetObjectTypeLabel() {
        const fieldInfo = this.targetObjectOptions.find((option) => option.value === this.targetObject);

        return fieldInfo ? fieldInfo.label : '';
    }

    get targetLabelFieldLabel() {
        const fieldInfo = this.targetLabelFieldOptions.find((option) => option.value === this.targetLabelField);

        return fieldInfo ? fieldInfo.label : '';
    }

    get targetValueFieldLabel() {
        const fieldInfo = this.targetValueFieldOptions.find((option) => option.value === this.targetValueField);

        return fieldInfo ? fieldInfo.label : '';
    }

    get targetParentFieldLabel() {
        const fieldInfo = this.targetParentFieldOptions.find((option) => option.value === this.targetParentField);

        return fieldInfo ? fieldInfo.label : '';
    }

    generateOptions() {
        this.setTargetLabelFieldOptions();
        if (this.includeValueField) {
            this.setTargetValueFieldOptions();
        }
        if (this.includeParentField) {
            this.setTargetParentFieldOptions();
        }
    }

    setTargetLabelFieldOptions() {
        let nameField = '';

        this.targetLabelFieldOptions = this.fields
            .filter(
                (field) =>
                    field.isNameField ||
                    (field.isAccessible &&
                        (field.displayType.toLowerCase() === 'string' ||
                            WsTemplateBuilderService.isFieldGroupable(field)))
            )
            .map((field) => {
                if (field.sobjectApiName === this.targetObject) {
                    if (field.isNameField) {
                        nameField = field.apiName;
                    }

                    return {
                        label: field.label,
                        value: field.apiName
                    };
                }

                return {
                    label: field.label + ' (' + field.sobjectApiName + ')',
                    value: field.sobjectApiName + '.' + field.apiName
                };
            });
        if (!this.targetLabelField && this.targetLabelFieldOptions.length) {
            this.handleTargetLabelFieldChange({ target: { value: nameField, name: 'targetLabelField' } });
        }
    }

    findFieldData(apiName) {
        const fieldInfo = this.fields.find((field) => field.apiName === apiName);

        return fieldInfo ? fieldInfo : {};
    }

    setTargetValueFieldOptions() {
        this.targetValueFieldOptions = this.fields
            .filter(
                (field) =>
                    field.isAccessible &&
                    (field.displayType.toLowerCase() === 'currency' ||
                        field.displayType.toLowerCase() === 'number' ||
                        field.displayType.toLowerCase() === 'percent' ||
                        field.displayType.toLowerCase() === 'double' ||
                        field.displayType.toLowerCase() === 'integer')
            )
            .map((field) => {
                if (field.sobjectApiName === this.targetObject) {
                    return {
                        label: field.label,
                        value: field.apiName
                    };
                }

                return {
                    label: field.label + ' (' + field.sobjectApiName + ')',
                    value: field.sobjectApiName + '.' + field.apiName
                };
            });
        // eslint-disable-next-line @lwc/lwc/no-api-reassignments
        this.messageForDependencyWarning =
            this.targetObject && !this.targetValueFieldOptions.length ? LABEL_WARNING_NUMERICAL_FIELD : '';
        if (!this.targetValueField && this.targetValueFieldOptions.length) {
            // eslint-disable-next-line @lwc/lwc/no-api-reassignments
            this.targetValueField = this.targetValueFieldOptions[0].value;
            this.dispatchFieldChange('targetvaluefieldchange', 'targetValueField', this.targetValueField);
        }
    }

    setTargetParentFieldOptions() {
        var noneLabel = '--';

        noneLabel += LABEL_NONE;
        noneLabel += '--';
        let self = this;

        this.targetParentFieldOptions = this.fields.reduce(
            function (options, field) {
                if (
                    field.isAccessible &&
                    field.displayType.toLowerCase() === 'reference' &&
                    field.referenceObjectApiName === self.targetObject &&
                    field.apiName !== 'MasterRecordId'
                ) {
                    return [
                        ...options,
                        {
                            label: field.label,
                            value: field.apiName
                        }
                    ];
                }

                return options;
            },
            [
                {
                    label: noneLabel,
                    value: ''
                }
            ]
        );
        if (!this.targetParentField && this.targetParentFieldOptions.length > 1) {
            // eslint-disable-next-line @lwc/lwc/no-api-reassignments
            this.targetParentField = this.targetParentFieldOptions[0].value;
            this.dispatchFieldChange('targetparentfieldchange', 'targetParentField', this.targetParentField);
        }
    }

    normalizeConditions(conditions) {
        if (Array.isArray(conditions) && conditions.length !== 0) {
            return conditions.map((condition, index) => {
                return {
                    ...condition,
                    key: `condition-${index}`
                };
            });
        }

        return [];
    }

    handleConditionSubmitted(event) {
        const { customKey, ...rest } = event.detail;

        // eslint-disable-next-line @lwc/lwc/no-api-reassignments
        this.conditions = this.conditions.map((item, index) => {
            if (index !== customKey) {
                return item;
            }

            return { ...item, ...rest, isActive: false };
        });
        this.dispatchFormChange('conditions', this.conditions);
    }

    handleNewCondition(event) {
        const { field, operator, value } = event.detail;
        const newCondition = { field, operator, value };

        // eslint-disable-next-line @lwc/lwc/no-api-reassignments
        this.conditions = [...this.conditions, newCondition];
        if (this.conditions.length === 2) {
            // eslint-disable-next-line @lwc/lwc/no-api-reassignments
            this.conditionOperator = defaultConditionOperator;
        }
        this.hideNewConditionForm();
        this.dispatchFormChange('conditions', this.conditions);
        this.dispatchFieldChange('conditionoperatorchange', 'conditionOperator', this.conditionOperator);
    }

    handleEditCondition(event) {
        const { customKey } = event.detail;

        this.setActiveCondition(customKey);
    }

    handleEditConditionCanceled() {
        this.setActiveCondition();
    }

    setActiveCondition(customKey) {
        // eslint-disable-next-line @lwc/lwc/no-api-reassignments
        this.conditions = this.conditions.map((item, index) => {
            if (index !== customKey) {
                return { ...item, isActive: false };
            }

            return { ...item, isActive: true };
        });
        if (this.showNewCondition) {
            this.hideNewConditionForm();
        }
    }

    hideNewConditionForm() {
        this.showNewCondition = false;
    }

    showNewConditionForm() {
        this.showNewCondition = true;
    }

    handleRemoveCondition(event) {
        const customKey = event.detail.customKey;

        // eslint-disable-next-line @lwc/lwc/no-api-reassignments
        this.conditions = this.conditions.filter((item, index) => index !== customKey);
        if (this.showNewCondition) {
            this.hideNewConditionForm();
        }
        if (this.conditions.length === 1) {
            // eslint-disable-next-line @lwc/lwc/no-api-reassignments
            this.conditionOperator = '';
        }
        if (this.conditions.length < 3 && this.conditionOperator !== 'AND' && this.conditionOperator !== 'OR') {
            // eslint-disable-next-line @lwc/lwc/no-api-reassignments
            this.conditionOperator = defaultConditionOperator;
        }
        this.dispatchFormChange('conditions', this.conditions);
        this.dispatchFieldChange('conditionoperatorchange', 'conditionOperator', this.conditionOperator);
    }

    /** Handles form input. */
    handleTargetObjectChange(event) {
        const { name, value } = event.target;

        // eslint-disable-next-line @lwc/lwc/no-api-reassignments
        // This.targetObject = value;
        this._targetObject = value;
        this.dispatchFieldChange('targetobjectchange', name, value);
    }

    handleTargetLabelFieldChange(event) {
        const { name, value } = event.target;

        // eslint-disable-next-line @lwc/lwc/no-api-reassignments
        this.targetLabelField = value;
        this.dispatchFieldChange('targetlabelfieldchange', name, value);
        this.handleGroupRecordsChanged({ target: { checked: false, name: 'recordsAreGrouped' } });
    }

    handleTargetValueFieldChange(event) {
        const { name, value } = event.target;

        // eslint-disable-next-line @lwc/lwc/no-api-reassignments
        this.targetValueField = value;
        this.dispatchFieldChange('targetvaluefieldchange', name, value);
    }

    handleTargetParentFieldChange(event) {
        const { name, value } = event.target;

        // eslint-disable-next-line @lwc/lwc/no-api-reassignments
        this.targetParentField = value;
        this.dispatchFieldChange('targetparentfieldchange', name, value);
    }

    handleGroupRecordsChanged(event) {
        const { name, checked } = event.target;

        // eslint-disable-next-line @lwc/lwc/no-api-reassignments
        this.recordsAreGrouped = checked;
        this.dispatchFieldChange('grouprecordschanged', name, checked);
    }

    handleConditionOperatorChange(event) {
        const { value } = event.target;

        // eslint-disable-next-line @lwc/lwc/no-api-reassignments
        this.conditionOperator = value;
        if (event.detail.value === 'AND' || event.detail.value === 'OR') {
            this.dispatchFieldChange('conditionoperatorchange', 'conditionOperator', value);
        } else if (event.detail.value === 'CUSTOM') {
            this.checkAndDispatchCustomCondition(this.customLogicText);
        }
    }

    handleCustomConditionChange(event) {
        this.customLogicText = event.target.value;
        this.checkAndDispatchCustomCondition(this.customLogicText);
    }

    checkAndDispatchCustomCondition(customLogic) {
        if (customLogic.replace(/ /g, '').length) {
            let isValidResult = this.isValidCustomCondition(customLogic);
            isValidResult = resetConditionSymbols(isValidResult);
            let customLogicInput = this.template.querySelector('.customLogicInput');
            if (customLogicInput) {
                customLogicInput.setCustomValidity(isValidResult);
                customLogicInput.reportValidity();
            }

            if (isValidResult === '') {
                this.dispatchFieldChange('conditionoperatorchange', 'conditionOperator', customLogic);
                // eslint-disable-next-line @lwc/lwc/no-api-reassignments
                this.conditionOperator = 'CUSTOM';
            }
        }
    }

    isValidCustomCondition(conditionLogic) {
        let conditionsLength = this.conditions.length;
        conditionLogic = transformConditionLogic(conditionLogic);

        if (!containsAllConditionAlphabets(conditionLogic, conditionsLength)) {
            return `${LABEL_MISSING_CONDITION_ALPHABETS}`;
        }

        if (!checkStartEndConditions(conditionLogic)) {
            return `${LABEL_INVALID_START_END_CONDITIONS}`;
        }

        if (!isValidParentheses(conditionLogic)) {
            return `${LABEL_MISMATCHED_PARENTHESES}`;
        }

        for (let i = 0; i < conditionLogic.length; i++) {
            let char = conditionLogic[i];
            if (!isValidCharacter(char, conditionsLength)) {
                return `${LABEL_INVALID_CHARACTER} ${char}`;
            }

            if (i + 1 < conditionLogic.length) {
                let nextChar = conditionLogic[i + 1];

                if (!checkAdjacentLetters(char, nextChar)) {
                    return `${LABEL_ADJACENT_LETTERS} ${char} ${nextChar}`;
                }
                if (!checkAdjacentPlusMinus(char, nextChar)) {
                    return `${LABEL_ADJACENT_AND_OR} ${char} ${nextChar}`;
                }
                if (!checkInvalidOpenParenthesis(char, nextChar)) {
                    return `${LABEL_INVALID_OPEN_PARENTHESIS} ${char} ${nextChar}`;
                }
                if (!checkInvalidCloseParenthesis(char, nextChar)) {
                    return `${LABEL_INVALID_CLOSE_PARENTHESIS} ${char} ${nextChar}`;
                }
            }
        }

        return '';
    }

    dispatchFieldChange(eventName, field, value) {
        const event = new CustomEvent(eventName, {
            detail: {
                customKey: this.customKey,
                field: field,
                value: value
            },
            bubbles: true
        });

        this.dispatchEvent(event);
        this.dispatchFormChange(field, value);
    }

    dispatchFormChange(field, value) {
        const event = new CustomEvent('formchange', {
            detail: {
                customKey: this.customKey,
                field: field,
                value: value
            }
        });

        this.dispatchEvent(event);
    }
}