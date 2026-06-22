import { LightningElement, api } from 'lwc';

import WsTemplateBuilderService from 'c/wsTemplateBuilderService';
import { templateAreas, headerBuildTypes } from 'c/whiteSpaceTemplateBuilderUtils';
import { isNotEmpty } from 'c/utils';

export default class HeaderBuilder extends LightningElement {
    _area;

    @api
    get area() {
        return this._area;
    }

    set area(area) {
        this._area = area;
        this.setTargetObjectOptions();
    }

    @api readOnly = false;

    _builderState;

    @api
    get builderState() {
        return this._builderState;
    }

    set builderState(builderState) {
        this._builderState = builderState;
        this.setTargetObjectOptions();
    }

    get buildType() {
        return this.getValueFromState('type');
    }

    get excludedFields() {
        if (
            this.buildType === headerBuildTypes.RECORDS ||
            this.otherHeaderConfiguration.type === headerBuildTypes.RECORDS
        ) {
            return [];
        }

        return [this.otherHeaderConfiguration.targetValueField];
    }

    targetObjectOptions = [];

    async setTargetObjectOptions() {
        if (this.builderState) {
            if (this.buildType === headerBuildTypes.PICKLIST_VALUES) {
                if (
                    this.otherHeaderConfiguration.type === headerBuildTypes.PICKLIST_VALUES &&
                    isNotEmpty(this.otherHeaderConfiguration.targetObject)
                ) {
                    this.targetObjectOptions = [
                        WsTemplateBuilderService.objectTypeOptions.find((option) => option.value === this.targetObject)
                    ];

                    return;
                }
            }

            if (this.buildType === headerBuildTypes.RECORDS) {
                if (
                    this.otherHeaderConfiguration.type === headerBuildTypes.PICKLIST_VALUES &&
                    isNotEmpty(this.otherHeaderConfiguration.targetObject)
                ) {
                    this.targetObjectOptions = await WsTemplateBuilderService.getParentRelationships(
                        this.otherHeaderConfiguration.targetObject
                    );

                    return;
                }
            }

            this.targetObjectOptions = WsTemplateBuilderService.objectTypeOptions;
        }
    }

    get otherHeaderConfiguration() {
        const otherArea = this.area
            ? this.area === templateAreas.column
                ? templateAreas.row
                : templateAreas.column
            : null;

        return this.builderState[otherArea];
    }

    get targetObject() {
        return this.getValueFromState('targetObject');
    }

    get targetLabelField() {
        return this.getValueFromState('targetLabelField');
    }

    get targetParentField() {
        return this.getValueFromState('targetParentField');
    }

    get recordsAreGrouped() {
        return this.getValueFromState('recordsAreGrouped');
    }

    get targetValueField() {
        return this.getValueFromState('targetValueField');
    }

    get conditionOperator() {
        return this.getValueFromState('conditionOperator');
    }

    get conditions() {
        return this.getValueFromState('conditions');
    }

    get usePicklistDependency() {
        return this.getValueFromState('usePicklistDependency');
    }

    getValueFromState(fieldName) {
        const value = this.builderState[this.area] ? this.builderState[this.area][fieldName] : null;

        return value;
    }

    get options() {
        return [
            { label: 'Records', value: headerBuildTypes.RECORDS },
            { label: 'Picklist Values', value: headerBuildTypes.PICKLIST_VALUES }
        ];
    }

    get showRecordsConfig() {
        return this.buildType === headerBuildTypes.RECORDS;
    }

    get showPicklistConfig() {
        return this.buildType === headerBuildTypes.PICKLIST_VALUES;
    }

    handleHeaderFormChange(event) {
        this.dispatchFormChange(event.detail);
    }

    handleTypeChange(event) {
        const payload = {
            field: 'type',
            value: event.detail.value
        };

        this.dispatchFormChange(payload);
    }

    dispatchFormChange(payload) {
        this.dispatchEvent(
            new CustomEvent('formchange', {
                detail: {
                    area: this.area,
                    ...payload
                }
            })
        );
    }
}