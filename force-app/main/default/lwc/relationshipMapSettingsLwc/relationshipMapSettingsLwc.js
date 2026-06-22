import { LightningElement, api, track } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import lodash from '@salesforce/resourceUrl/lodash';

import getObjectFields from '@salesforce/apex/OrgChartSettingsController.getRMObjectFields';

import getOrgChartFields from '@salesforce/apex/OrgChartSettingsController.getOrgChartFields';
import updateOrgChartFields from '@salesforce/apex/OrgChartSettingsController.saveSettings';

import getAutoGenerateMapFlag from '@salesforce/apex/RelationshipMapSettingsController.getAutoCreateMapFlag';
import setAutoGenerateMapFlag from '@salesforce/apex/RelationshipMapSettingsController.setAutoCreateMapFlag';

import getOrgSettings from '@salesforce/apex/StrategySettingsController.getOrgSettings';

import Select_Fields_And_Labels from '@salesforce/label/c.Select_Fields_And_Labels';
import Save from '@salesforce/label/c.Save';
import Cancel from '@salesforce/label/c.Cancel';
import error_rm_settings_object_field_load from '@salesforce/label/c.error_rm_settings_object_field_load';
import error_rm_settings_display_field_load from '@salesforce/label/c.error_rm_settings_display_field_load';
import error_rm_settings_display_field_save from '@salesforce/label/c.error_rm_settings_display_field_save';
import error_rm_settings_auto_generate_flag_load from '@salesforce/label/c.error_rm_settings_auto_generate_flag_load';
import error_rm_settings_auto_generate_flag_save from '@salesforce/label/c.error_rm_settings_auto_generate_flag_save';
import error_rm_settings_support_colors_load from '@salesforce/label/c.error_rm_settings_support_colors_load';
import error_rm_settings_support_colors_save from '@salesforce/label/c.error_rm_settings_support_colors_save';

export default class RelationshipMapSettingsLwc extends LightningElement {
    objectsLoading = true;

    objects = [];

    featureFlagsLoading;

    autoGenerateMapFlag = true;

    originalAutoGenerateMapFlag = true;

    supportColorsLoading;

    @track supportColors = [];

    originalSupportColorsMap = {};

    supportColorsMap = {};

    orgChartFieldsLoading;

    @track orgChartFields = [];

    originalOrgChartFields = [];

    orgChartFieldsToDelete = [];

    orgSettings;

    orgSettingsLoading;

    errorMessage = null;

    label = {
        Select_Fields_And_Labels,
        Save,
        Cancel,
        error_rm_settings_object_field_load,
        error_rm_settings_display_field_load,
        error_rm_settings_display_field_save,
        error_rm_settings_auto_generate_flag_load,
        error_rm_settings_auto_generate_flag_save,
        error_rm_settings_support_colors_load,
        error_rm_settings_support_colors_save
    };

    constructor() {
        super();
        this.loadObjectFields();
        this.loadOrgChartFields();
        this.loadAutoGenerateFlagValue();
        this.loadOrgSettings();
    }

    async renderedCallback() {
        await loadScript(this, lodash);
    }

    updateErrorMessage(title, message) {
        if (this.errorMessage == null) {
            this.errorMessage = '';
        }
        this.errorMessage += '<b>' + title + ': </b>' + message + '<br/>';
    }

    loadObjectFields() {
        this.objectsLoading = true;
        getObjectFields()
            .then((result) => {
                this.objects = result;
                this.objectsLoading = false;
            })
            .catch((error) => {
                this.objectsLoading = false;
                this.updateErrorMessage(this.label.error_rm_settings_object_field_load, error.body.message);
            });
    }

    loadOrgChartFields() {
        this.orgChartFieldsLoading = true;
        getOrgChartFields({ mapType: 'Relationship Map' })
            .then((result) => {
                this.originalOrgChartFields = result;
                this.orgChartFields = JSON.parse(JSON.stringify(result));
                this.orgChartFieldsLoading = false;
            })
            .catch((error) => {
                this.originalOrgChartFields = [];
                this.orgChartFields = [];
                this.orgChartFieldsLoading = false;
                this.updateErrorMessage(this.label.error_rm_settings_display_field_load, error.body.message);
            });
    }

    saveOrgChartFields() {
        if (JSON.stringify(this.orgChartFields) !== JSON.stringify(this.originalOrgChartFields)) {
            this.orgChartFieldsLoading = true;
            let deleteIds = this.orgChartFieldsToDelete.map(function (item) {
                return item.id;
            });

            updateOrgChartFields({
                updateListJson: JSON.stringify(this.orgChartFields),
                deleteIds: deleteIds
            })
                .then(() => {
                    this.loadOrgChartFields();
                })
                .catch((error) => {
                    this.loadOrgChartFields();
                    this.updateErrorMessage(this.label.error_rm_settings_display_field_save, error.body.message);
                });
        }
    }

    loadAutoGenerateFlagValue() {
        this.featureFlagsLoading = true;
        getAutoGenerateMapFlag({ mapType: 'Relationship Map' })
            .then((result) => {
                this.autoGenerateMapFlag = JSON.parse(JSON.stringify(result));
                this.originalAutoGenerateMapFlag = result;
                this.featureFlagsLoading = false;
            })
            .catch((error) => {
                this.autoGenerateMapFlag = JSON.parse(JSON.stringify(this.originalAutoGenerateMapFlag));
                this.featureFlagsLoading = false;
                this.updateErrorMessage(this.label.error_rm_settings_auto_generate_flag_load, error.body.message);
            });
    }

    saveAutoGenerateFlagValue() {
        if (this.originalAutoGenerateMapFlag !== this.autoGenerateMapFlag) {
            this.featureFlagsLoading = true;
            setAutoGenerateMapFlag({ value: this.autoGenerateMapFlag, mapType: 'Relationship Map' })
                .then(() => {
                    this.featureFlagsLoading = false;
                    this.originalAutoGenerateMapFlag = this.autoGenerateMapFlag;
                })
                .catch((error) => {
                    this.featureFlagsLoading = false;
                    this.updateErrorMessage(this.label.error_rm_settings_auto_generate_flag_save, error.body.message);
                });
        }
    }

    loadOrgSettings() {
        this.orgSettingsLoading = true;
        getOrgSettings()
            .then((result) => {
                this.orgSettings = result;
                this.orgSettingsLoading = false;
            })
            .catch(() => {
                this.orgSettingsLoading = false;
            });
    }

    @api
    saveData() {
        this.errorMessage = null;
        this.saveAutoGenerateFlagValue();
        this.saveOrgChartFields();
    }

    @api
    resetData() {
        this.errorMessage = null;
        this.loadObjectFields();
        this.loadOrgChartFields();
        this.loadAutoGenerateFlagValue();
    }

    handleVisibilityChange(event) {
        var params = event.detail;
        var objectName = params.objectName;
        var fieldName = params.fieldName;
        var isChecked = params.checked;
        var isMainChecked = params.mainChecked;
        var field = _.find(this.orgChartFields, function (x) {
            return x.objectName === objectName && x.fieldName === fieldName;
        });

        if (isChecked !== null) {
            field.isVisible = isChecked;
        }
        if (isMainChecked !== null) {
            field.isMain = isMainChecked;
        }

        this.saveData();
    }

    handleColorChange(event) {
        let params = event.detail;
        let name = params.name;
        let val = params.value;

        this.supportColorsMap[name] = val;
        this.saveData();
    }

    handleAutoGenerateMapChange(event) {
        let params = event.detail;
        let val = params.value;

        this.autoGenerateMapFlag = val;
        this.saveData();
    }

    handleFieldToggled(event) {
        var params = event.detail;
        var objectName = params.objectName;
        var fieldName = params.fieldName;
        var checked = params.checked;
        var fieldLabel = params.fieldLabel;
        var relatedFieldName = params.relatedFieldName;

        if (checked) {
            // Add the object field to the list of org chart fields
            let obj = {
                fieldLabel: fieldLabel,
                fieldName: fieldName,
                objectName: objectName,
                relatedFieldName: relatedFieldName,
                isVisible: true,
                isMain: false,
                isEditable: true,
                mapType: 'Relationship Map'
            };

            this.orgChartFields.push(obj);
        } else {
            // Remove the object field from the list of org chart fields
            let i = _.findIndex(this.orgChartFields, function (x) {
                return x.objectName === objectName && x.fieldName === fieldName;
            });

            let removedItem = _.pullAt(this.orgChartFields, i)[0];

            // If the object field is part of the initial list from the server then add it to the list of items to delete
            if (_.includes(JSON.stringify(this.originalOrgChartFields), JSON.stringify(removedItem))) {
                this.orgChartFieldsToDelete.push(removedItem);
            }
        }
        this.saveData();
    }

    passthroughEvent(event) {
        const passedEvent = new CustomEvent(event.type, {
            detail: event.detail
        });

        // Dispatches the event.
        this.dispatchEvent(passedEvent);
    }
}