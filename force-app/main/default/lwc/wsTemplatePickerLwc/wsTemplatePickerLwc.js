import { LightningElement, api, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';

import getTemplateList from '@salesforce/apex/WhiteSpaceTemplatePickerController.getTemplateList';
import getTemplateWrapper from '@salesforce/apex/WhiteSpaceTemplatePickerController.getTemplateWrapper';

import getTotalCountWithLookup from '@salesforce/apex/WhiteSpaceUtils.getTotalCountWithLookup';

import ACCOUNT_OBJECT from '@salesforce/schema/Account';
import AP_ACCOUNTID_FIELD from '@salesforce/schema/Account_Plan__c.Account__c';
import WS_TEMPLATE from '@salesforce/schema/White_Space__c.White_Space_Template__c';
import WS_ACCOUNT_PLAN from '@salesforce/schema/White_Space__c.Account_Plan__c';
import WS_ARECOLUMNSFILTERED from '@salesforce/schema/White_Space__c.AreColumnsFiltered__c';
import WS_AREROWSFILTERED from '@salesforce/schema/White_Space__c.AreRowsFiltered__c';
import WS_ARECELLSFILTERED from '@salesforce/schema/White_Space__c.AreCellsFiltered__c';
import WS_AREUNRELATEDCELLSFILTERED from '@salesforce/schema/White_Space__c.AreUnrelatedCellsFiltered__c';
import LABEL_NO_TEMPLATES from '@salesforce/label/c.No_Templates';

import { WsTemplateModel } from 'c/wsTemplatePickerUtils';

import { isUndefinedOrNull } from 'c/utils';

export default class WsTemplatePickerLwc extends LightningElement {
    @api accountPlanId = '';

    accountId = '';

    templates = [];

    selectedTemplateId;

    templateViewMap = {};

    isLoading = false;

    showContainerSpinner = false;

    showTileSpinner = false;

    labels = {
        noTemplates: LABEL_NO_TEMPLATES
    };

    @api getWsRecordForCreate() {
        const newWs = {
            [WS_TEMPLATE.fieldApiName]: this.selectedTemplateId,
            [WS_ACCOUNT_PLAN.fieldApiName]: this.accountPlanId,
            [WS_ARECOLUMNSFILTERED.fieldApiName]: this.selectedTemplate.column.isFiltered,
            [WS_AREROWSFILTERED.fieldApiName]: this.selectedTemplate.row.isFiltered,
            [WS_ARECELLSFILTERED.fieldApiName]: this.selectedTemplate.areCellsFiltered,
            [WS_AREUNRELATEDCELLSFILTERED.fieldApiName]: this.selectedTemplate.areUnrelatedCellsFiltered
        };

        return newWs;
    }

    @api isSelectionValid() {
        if (this.selectedTemplateId) {
            return (
                !this.templateViewMap[this.selectedTemplateId].column.exceedsLimit &&
                !this.templateViewMap[this.selectedTemplateId].row.exceedsLimit
            );
        }

        return false;
    }

    get selectedTemplate() {
        return this.templateViewMap[this.selectedTemplateId];
    }

    @wire(getRecord, { recordId: '$accountPlanId', fields: [AP_ACCOUNTID_FIELD] })
    wiredRecord({ error, data }) {
        if (error) {
            this.error = 'error';
        } else if (data) {
            this.accountId = getFieldValue(data, AP_ACCOUNTID_FIELD);
        }
    }

    @wire(getObjectInfo, { objectApiName: ACCOUNT_OBJECT })
    objectInfo;

    async connectedCallback() {
        this.getTemplates();
    }

    async getTemplates() {
        try {
            this.showContainerSpinner = true;
            this.templates = await getTemplateList();
        } catch (error) {
            this.error = error;
        } finally {
            this.showContainerSpinner = false;
        }
    }

    async handleSelect(event) {
        const templateId = event.detail;

        if (!this.templateViewMap[templateId]) {
            this.showTileSpinner = true;
            const templateWrapper = await getTemplateWrapper({ templateId: templateId });
            let templateModel = new WsTemplateModel(templateWrapper, this.objectInfo.data.childRelationships);

            await templateModel.getHeaderTotals();
            this.showTileSpinner = false;
            this.templateViewMap = { ...this.templateViewMap, [templateId]: templateModel };
        }
        this.selectedTemplateId = templateId;
        this.dispatchSelectEvent(templateId);
    }

    async handleHeaderFilter(event) {
        const { name, checked } = event.detail;
        const selectedTemplate = this.templateViewMap[this.selectedTemplateId];
        const { mapping, filteredCount } = selectedTemplate[name];

        if (isUndefinedOrNull(filteredCount)) {
            this.setLoadingState(true, name);
            this.showTileSpinner = true;
            selectedTemplate[name].filteredCount = await getTotalCountWithLookup({
                mapping: mapping,
                lookupRecordId: this.accountId
            });
            this.setLoadingState(false, name);
            this.showTileSpinner = false;
        }
        selectedTemplate[name].isFiltered = checked;
        this.templateViewMap = { ...this.templateViewMap, [this.selectedTemplateId]: selectedTemplate };
        this.dispatchSelectEvent(this.selectedTemplateId);
    }

    handleCellFilter(event) {
        const selectedTemplate = this.templateViewMap[this.selectedTemplateId];

        selectedTemplate.areCellsFiltered = event.detail.checked;
        this.templateViewMap = { ...this.templateViewMap, [this.selectedTemplateId]: selectedTemplate };
        this.dispatchSelectEvent(this.selectedTemplateId);
    }

    handleUnrelatedCellFilterChanged(event) {
        const selectedTemplate = this.templateViewMap[this.selectedTemplateId];

        selectedTemplate.areUnrelatedCellsFiltered = event.detail.checked;
        this.templateViewMap = { ...this.templateViewMap, [this.selectedTemplateId]: selectedTemplate };
        this.dispatchSelectEvent(this.selectedTemplateId);
    }

    dispatchSelectEvent(templateId) {
        const selectionEvent = new CustomEvent('optionselected', {
            detail: { value: templateId }
        });

        this.dispatchEvent(selectionEvent);
    }

    setLoadingState(isLoading, sectionName) {
        this.isLoading = isLoading;
        const loadingStateEvent = new CustomEvent('loadstatechange', {
            detail: { value: isLoading }
        });

        this.dispatchEvent(loadingStateEvent);
        this.template.querySelector('c-ws-template-tile').setLoading(sectionName, isLoading);
    }
}