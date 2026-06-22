import { LightningElement, api } from 'lwc';

import LABEL_ADD_CONDITION from '@salesforce/label/c.Add_Condition';
import LABEL_ALL_CONDITIONS_ARE_TRUE from '@salesforce/label/c.All_Conditions_Are_True';
import LABEL_ANY_CONDITIONS_ARE_TRUE from '@salesforce/label/c.Any_Conditions_Are_True';
import LABEL_CONDITIONS from '@salesforce/label/c.Conditions';
import LABEL_ENABLE_SUGGESTED_CONTACT from '@salesforce/label/c.Enable_Suggested_Contacts_For_RM';
import LABEL_SUGGESTED_CONTACT from '@salesforce/label/c.SuggestedContactDropdownLabel';
import getRMOrgSettingForType from '@salesforce/apex/RelationshipMapSettingsController.getRMOrgSettingForType';
import updateEnableSuggestedContactsForRM from '@salesforce/apex/RelationshipMapSettingsController.updateEnableSuggestedContactsForRM';
import updateRMorgSettingCondition from '@salesforce/apex/RelationshipMapSettingsController.updateRMOrgSettingOperator';
import getContactsConditions from '@salesforce/apex/RelationshipMapSettingsController.getContactsConditions';
import insertContactsCondition from '@salesforce/apex/RelationshipMapSettingsController.insertContactsCondition';
import updateContactsCondition from '@salesforce/apex/RelationshipMapSettingsController.updateContactsCondition';
import deleteContactsCondition from '@salesforce/apex/RelationshipMapSettingsController.deleteContactsCondition';
import updateContactLimit from '@salesforce/apex/RelationshipMapSettingsController.updateContactLimit';
import getPicklistValues from '@salesforce/apex/WhiteSpaceTemplateController.getPicklistValues';
const defaultConditionOperator = 'OR';
import WsTemplateBuilderService from 'c/wsTemplateBuilderService';
export default class MapSettingsDefaultValues extends LightningElement {
    labels = {
        Enable_Suggested_Contacts_For_RM: LABEL_ENABLE_SUGGESTED_CONTACT,
        addCondition: LABEL_ADD_CONDITION,
        conditions: LABEL_CONDITIONS,
        SuggestedContactdropdownLabel: LABEL_SUGGESTED_CONTACT
    };
    _settingType = 'keystakeholder';
    _readOnly = false;
    errorMessage = '';
    settingId;
    loading = true;
    targetObject = 'Contact';
    showNewCondition = false;
    privateConditions = [];
    _showSuggestedContacts = false;
    contactLimit = '';
    fields = [];
    fieldsMap = {};
    conditionOperator = 'OR';
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
    @api
    get settingType() {
        return this._settingType;
    }
    set settingType(value) {
        this._settingType = value;
    }
    get showSuggestedContacts() {
        return this._showSuggestedContacts;
    }
    set showSuggestedContacts(value) {
        this._showSuggestedContacts = value;
    }
    get conditions() {
        return this.privateConditions;
    }
    set conditions(value) {
        this.privateConditions = this.normalizeConditions(value);
    }
    get addConditionDisabled() {
        return !this.targetObject || !this.fields || this.showNewCondition;
    }
    get multipleConditions() {
        return this.conditions.length > 1;
    }
    get conditionOperatorOptions() {
        return [
            { label: LABEL_ALL_CONDITIONS_ARE_TRUE, value: 'AND' },
            { label: LABEL_ANY_CONDITIONS_ARE_TRUE, value: 'OR' }
        ];
    }
    async connectedCallback() {
        await Promise.all([this.loadSettings(), this.setFields()]);
        await this.loadContactConditions();
        await this.getPicklistValues();
        this.loading = false;
    }
    async loadSettings() {
        this.errorMessage = null;
        await getRMOrgSettingForType({ type: this._settingType })
            .then((result) => {
                this.settingId = result?.Id;
                if (result?.pqcrush__Operator__c !== null && result?.pqcrush__Operator__c !== undefined) {
                    this.conditionOperator = result?.pqcrush__Operator__c;
                }
                this._showSuggestedContacts = result?.pqcrush__Enable_Suggested_Contacts_For_RM__c;
                this.contactLimit = result?.pqcrush__contact_limit__c;
            })
            .catch((error) => {
                this.errorMessage = error?.body?.message;
            });
    }
    async setFields() {
    await WsTemplateBuilderService.getSuggestedContactObject(); 
        const fields = await WsTemplateBuilderService.getFieldsForObjectAsList(this.targetObject);
        this.fields = fields.filter((item) => item.apiName !== 'AccountId');
        const fieldMap = await WsTemplateBuilderService.getFieldsForObjectAsMap(this.targetObject);
        this.fieldsMap = Object.keys(fieldMap)
            .filter((field) => field !== 'AccountId')
            .reduce((obj, field) => {
                obj[field] = fieldMap[field];
                return obj;
            }, {});
    }
    async loadContactConditions() {
        await getContactsConditions({ settingId: this.settingId }).then((result) => {
            if (result && Array.isArray(result) && result.length) {
                this.conditions = result
                    .filter(
                        (condition) =>
                            condition.Id &&
                            condition.pqcrush__Field__c &&
                            condition.pqcrush__Operator__c &&
                            condition.pqcrush__Value__c
                    )
                    .map(({ Id, pqcrush__Field__c, pqcrush__Operator__c, pqcrush__Value__c }) => ({
                        Id,
                        field: pqcrush__Field__c,
                        operator: pqcrush__Operator__c,
                        value: pqcrush__Value__c
                    }));
            }
        });
    }
    handleShowSuggestedContactsToggled(event) {
        let checked = event?.srcElement?.checked;
        this.loading = true;
        updateEnableSuggestedContactsForRM({ settingId: this.settingId, showSuggestedContacts: checked })
            .then(() => {
                this._showSuggestedContacts = checked;
                this.loading = false;
            })
            .catch((error) => {
                let errormsg = error.message ? error.message : error.body?.message;

                this.showNotification('Error', errormsg, 'error');
            });
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
    showNewConditionForm() {
        this.showNewCondition = true;
    }
    hideNewConditionForm() {
        this.showNewCondition = false;
    }
    async handleNewCondition(event) {
        const { field, operator, value } = event.detail;
        let newCondition = { field, operator, value };
        this.hideNewConditionForm();
        await insertContactsCondition({ conditions: [this.buildConditionRecord(newCondition)] }).then((result) => {
            newCondition.Id = result[0].Id;
            this.conditions = [...this.conditions, newCondition];

            if (this.conditions.length === 2) {
                this.conditionOperator = defaultConditionOperator;
            }
        });
        await this.handleUpdateRMorgSettingCondition();
    }
    async handleRemoveCondition(event) {
        const customKey = event.detail.customKey;
        const deleteCondition = this.conditions.find((item, index) => index === customKey);
        if (deleteCondition) {
            const id = deleteCondition.Id;
            this.conditions = this.conditions.filter((item, index) => index !== customKey);
            if (this.showNewCondition) {
                this.hideNewConditionForm();
            }
            if (this.conditions.length === 1) {
                this.conditionOperator = '';
            }
            this.handleUpdateRMorgSettingCondition();
            deleteContactsCondition({ conditions: [{ Id: id }] });
        }
    }
    handleConditionSubmitted(event) {
        const { customKey, ...rest } = event.detail;
        this.conditions = this.conditions.map((item, index) => {
            if (index !== customKey) {
                return item;
            }
            return { ...item, ...rest, isActive: false };
        });
        const updateCondition = this.conditions.find((item, index) => index === customKey);
        updateContactsCondition({ conditions: [this.buildConditionRecord(updateCondition)] });
    }
    
    //suggest contact restricted for permission set
    async handleUpdateRMorgSettingCondition() {
        await updateRMorgSettingCondition({
            rmOrgSettingId: this.settingId,
            rmOrgSettingOperator: this.conditionOperator
        }).catch((error) => {
                this.errorMessage = error?.body?.message;
            });
    }
    handleEditConditionCanceled() {
        this.setActiveCondition();
    }
    setActiveCondition(customKey) {
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
    handleEditCondition(event) {
        const { customKey } = event.detail;
        this.setActiveCondition(customKey);
    }
    handleConditionOperatorChange(event) {
        const { value } = event.target;
        this.conditionOperator = value;
        this.handleUpdateRMorgSettingCondition();
    }
    buildConditionRecord(condition) {
        return {
            Id: condition.Id ?? null,
            pqcrush__Parent_Object_Id__c: this.settingId,
            pqcrush__Parent_Object_Name__c: 'RM_Org_Setting__c',
            pqcrush__Field__c: condition.field,
            pqcrush__Operator__c: condition.operator,
            pqcrush__Value__c: condition.value
        };
    }
    async getPicklistValues() {
        let options = [];
        options = await getPicklistValues({
            objectName: 'pqcrush__RM_Org_Setting__c',
            fieldName: 'pqcrush__contact_limit__c'
        });
        this.picklistOptions = options;
    }
    handleSuggestedContactChange(event) {
        updateContactLimit({ settingId: this.settingId, contactLimitValue: event.target.value })
            .then(() => {
                this.loading = false;
            })
            .catch((error) => {
                let errormsg = error.message ? error.message : error.body?.message;
                this.showNotification('Error', errormsg, 'error');
            });
    }
}