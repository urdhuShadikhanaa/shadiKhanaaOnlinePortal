import { LightningElement, track, api } from 'lwc';
import createWhiteSpaceTemplate from '@salesforce/apex/WhiteSpaceTemplateController.createWhiteSpaceTemplate';
import updateWhiteSpaceTemplate from '@salesforce/apex/WhiteSpaceTemplateController.updateWhiteSpaceTemplate';
import getTemplateWrapper from '@salesforce/apex/WhiteSpaceTemplatePickerController.getTemplateWrapper';
import getRelatedWhiteSpaces from '@salesforce/apex/WhiteSpaceTemplateController.getRelatedWhiteSpaces';
import getUserRecordAccess from '@salesforce/apex/UserRecordAccessServiceController.getUserRecordAccess';
import { loadScript } from 'lightning/platformResourceLoader';
import lodash from '@salesforce/resourceUrl/lodash';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { reduceErrors } from 'c/ldsUtils';
import WHITESPACETEMPLATE_OBJECT from '@salesforce/schema/White_Space_Template__c';
import CONDITION_FIELD_FIELD from '@salesforce/schema/Mapping_Condition__c.Field__c';
import CONDITION_OPERATOR_FIELD from '@salesforce/schema/Mapping_Condition__c.Operator__c';
import CONDITION_VALUE_FIELD from '@salesforce/schema/Mapping_Condition__c.Value__c';
import { NavigationMixin } from 'lightning/navigation';
import { templateAreas, headerBuildTypes } from 'c/whiteSpaceTemplateBuilderUtils';
import LABEL_EDIT from '@salesforce/label/c.Edit';
import LABEL_CANCEL from '@salesforce/label/c.Cancel';
import LABEL_CELL_CONFIGURATION from '@salesforce/label/c.Cell_Configuration';
import LABEL_CELLS from '@salesforce/label/c.Cells';
import LABEL_COLUMN_CONFIGURATION from '@salesforce/label/c.Column_Configuration';
import LABEL_COLUMNS from '@salesforce/label/c.Columns';
import LABEL_DONE from '@salesforce/label/c.Done';
import LABEL_ERROR_CREATING_TEMPLATE from '@salesforce/label/c.error_creating_template';
import LABEL_LOADING from '@salesforce/label/c.Loading';
import LABEL_ROW_CONFIGURATION from '@salesforce/label/c.Row_Configuration';
import LABEL_ROWS from '@salesforce/label/c.Rows';
import LABEL_SAVE from '@salesforce/label/c.Save';
import LABEL_TEMPLATE_NAME from '@salesforce/label/c.Template_Name';
import LABEL_WARNING_EDIT_TEMPLATE_BEING_USED from '@salesforce/label/c.warning_edit_template_being_used';

import WsTemplateBuilderService from 'c/wsTemplateBuilderService';
import { generateUUID } from 'c/utils';

const selectedAreaClassName = 'is-selected';

const resetHeaderMappingFields = (config) => {
    return {
        ...config,
        targetObject: '',
        targetLabelField: '',
        targetValueField: '',
        targetParentField: '',
        conditionOperator: '',
        conditions: [],
        usePicklistDependency: false
    };
};

const fromConditionWrapper = ({ singleConditions = [] } = {}) => {
    const conditions = singleConditions.map((item) => {
        const newItem = {
            field: item.singleCondition[CONDITION_FIELD_FIELD.fieldApiName],
            operator: item.singleCondition[CONDITION_OPERATOR_FIELD.fieldApiName],
            value: item.singleCondition[CONDITION_VALUE_FIELD.fieldApiName]
        };

        return newItem;
    });

    return conditions;
};

const fromMappingWrapper = ({
    id,
    objectName = '',
    labelFieldName = '',
    valueFieldName = '',
    groupResults = false,
    parentIdFieldName = '',
    conditions = {}
} = {}) => {
    const mappingWrapper = {
        id: id,
        targetObject: objectName,
        targetLabelField: labelFieldName,
        recordsAreGrouped: groupResults,
        targetValueField: valueFieldName,
        targetParentField: parentIdFieldName,
        conditionOperator: conditions.operator,
        conditions: fromConditionWrapper(conditions)
    };

    return mappingWrapper;
};

const toConditionWrappers = (conditions = []) => {
    return conditions.map((item) => {
        return {
            isFieldCreateable: true,
            singleCondition: {
                [CONDITION_FIELD_FIELD.fieldApiName]: item.field,
                [CONDITION_OPERATOR_FIELD.fieldApiName]: item.operator,
                [CONDITION_VALUE_FIELD.fieldApiName]: item.value
            }
        };
    });
};

const toMappingWrapper = (
    {
        id = null,
        targetLabelField = '',
        targetObject = '',
        targetValueField = '',
        targetParentField = '',
        recordsAreGrouped = false,
        conditionOperator = '',
        conditions = []
    } = {},
    name
) => {
    return {
        id: id,
        name: name || targetObject,
        objectName: targetObject,
        labelFieldName: targetLabelField,
        valueFieldName: targetValueField,
        parentIdFieldName: targetParentField,
        groupResults: recordsAreGrouped,
        conditions: {
            operator: conditionOperator,
            singleConditions: toConditionWrappers(conditions)
        }
    };
};

const toTitleCase = (text) => {
    return text
        .toLowerCase()
        .split(' ')
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(' ');
};

export default class BuilderPage extends NavigationMixin(LightningElement) {
    templateAreas = templateAreas;

    templateWrapper;

    canEdit = false;

    isEditing = false;

    _recordId;

    _createMode = false;

    amountTypes;

    get _viewMode() {
        return !this.isEditing;
    }

    get showEditButton() {
        return this.canEdit && !this.isEditing;
    }

    get templateType() {
        const type =
            this.configurations.column.type === headerBuildTypes.PICKLIST_VALUES ||
            this.configurations.row.type === headerBuildTypes.PICKLIST_VALUES
                ? headerBuildTypes.PICKLIST_VALUES
                : headerBuildTypes.RECORDS;

        return type;
    }

    @track configurations = {
        [templateAreas.column]: {
            targetObject: '',
            targetLabelField: '',
            targetValueField: '',
            conditionOperator: '',
            conditions: [],
            type: '',
            usePicklistDependency: false
        },
        [templateAreas.row]: {
            targetObject: '',
            targetLabelField: '',
            targetValueField: '',
            conditionOperator: '',
            conditions: [],
            type: '',
            usePicklistDependency: false
        },
        [templateAreas.cell]: {
            amountTypeFields: [],
            basicFields: []
        }
    };

    selectedArea;

    loading = false;

    /** String to store the template name */
    templateName = '';

    /** Array of object types to choose from for the cell*/
    cellObjectTypeOptions = [];

    error;

    relatedWhiteSpaces = [];

    labels = {
        edit: LABEL_EDIT,
        cancel: LABEL_CANCEL,
        cells: LABEL_CELLS,
        columns: LABEL_COLUMNS,
        done: LABEL_DONE,
        loading: LABEL_LOADING,
        rows: LABEL_ROWS,
        save: LABEL_SAVE,
        templateName: LABEL_TEMPLATE_NAME,
        templateWarning: LABEL_WARNING_EDIT_TEMPLATE_BEING_USED
    };

    set recordId(id) {
        if (!id) {
            this._createMode = true;
            this._recordId = null;

            return;
        }
        this._recordId = id;
        this._createMode = false;
    }

    @api get recordId() {
        return this._recordId;
    }

    connectedCallback() {
        this.init();
    }

    renderedCallback() {
        if (this.lodashInitialized) {
            return;
        }
        this.lodashInitialized = true;
        loadScript(this, lodash);
    }

    /** *****************************************************************************
     * @description Group up various get data calls to apex
     */
    init = async () => {
        try {
            this.loading = true;
            await WsTemplateBuilderService.init();
            this.amountTypes = WsTemplateBuilderService.amountTypes;

            if (this._recordId) {
                const template = await getTemplateWrapper({ templateId: this._recordId });

                await this.processTemplate(template);
                const relatedWhiteSpaces = await getRelatedWhiteSpaces({ templateId: this._recordId });

                this.relatedWhiteSpaces = [...relatedWhiteSpaces];
                const recordAccess = await getUserRecordAccess({ recordId: this._recordId });

                this.canEdit = recordAccess.HasEditAccess;
                this._createMode = false;
            } else {
                this._createMode = true;
                this.isEditing = true;
            }
        } catch (error) {
            this.error = error;
            const evt = new ShowToastEvent({
                message: reduceErrors(error).join(', '),
                variant: 'error',
                mode: 'pester'
            });

            this.dispatchEvent(evt);
        } finally {
            this.loading = false;
        }
    };

    initializeHeaderValues({ mapping = {}, type = '', usePicklistDependency = false } = {}) {
        const headerObject = {
            ...fromMappingWrapper(mapping),
            usePicklistDependency,
            type
        };

        return headerObject;
    }

    initializeCellValues(cellTemplate, hasProductRelationship) {
        const { id, type, displayFieldId, mapping } = cellTemplate;
        const cellObject = {
            id,
            displayFieldId,
            type,
            hasProductRelationship: hasProductRelationship,
            mapping: fromMappingWrapper(mapping),
            name: this.amountTypes.find((amountType) => amountType.Id === displayFieldId)?.Name
        };

        return cellObject;
    }

    async processTemplate(template) {
        try {
            this.templateWrapper = template;
            this.templateName = template.name;

            const columnConfig = {
                [templateAreas.column]: {
                    ...this.configurations[templateAreas.column],
                    ...this.initializeHeaderValues(template.columnConfiguration)
                }
            };
            const rowConfig = {
                [templateAreas.row]: {
                    ...this.configurations[templateAreas.row],
                    ...this.initializeHeaderValues(template.rowConfiguration)
                }
            };

            // Only use amount types that are active and not deleted
            const filterAmountTypes = Object.values(template.amountTypeFields).filter((item) => {
                return this.amountTypes.find((amountType) => amountType.Id === item.displayFieldId);
            });

            const cellMappings = filterAmountTypes.map((item) => {
                return this.initializeCellValues(
                    item,
                    rowConfig.row.targetObject === 'Product2' || columnConfig.column.targetObject === 'Product2'
                );
            });

            const basicFields =
                template.basicFields?.map((item) => {
                    const obj = {
                        id: item.id,
                        mapping: fromMappingWrapper(item.mapping)
                    };

                    return obj;
                }) ?? [];

            const cellConfig = {
                [templateAreas.cell]: {
                    amountTypeFields: [...cellMappings],
                    basicFields: basicFields
                }
            };

            this.updateConfigurationInState({ ...columnConfig, ...rowConfig, ...cellConfig });
            this.setObjectsForCellMapping();
        } catch (error) {
            this.error = error;
            const evt = new ShowToastEvent({
                message: reduceErrors(error).join(', '),
                variant: 'error',
                mode: 'pester'
            });

            this.dispatchEvent(evt);
        }
    }

    // Internal Functions
    handleAreaClick(event) {
        const selectedArea = event.currentTarget.dataset.areaName;

        if (selectedArea === this.selectedArea) {
            return;
        }
        this.clearSelection();
        event.currentTarget.classList.add(selectedAreaClassName);
        this.selectedArea = selectedArea;
    }

    handleAddAmountTypeField(event) {
        const amountTypeId = event.detail.amountTypeId;
        const existingConfiguration = this.configurations.cell.amountTypeFields.find(
            (config) => config.displayFieldId === amountTypeId
        );

        if (!existingConfiguration) {
            const config = {
                displayFieldId: amountTypeId,
                name: this.amountTypes.find((amountType) => amountType.Id === amountTypeId).Name,
                hasProductRelationship:
                    this.configurations.column.targetObject === 'Product2' ||
                    this.configurations.row.targetObject === 'Product2',
                mapping: {
                    type: 'amountType',
                    targetObject: '',
                    targetLabelField: '',
                    targetValueField: '',
                    conditionOperator: '',
                    conditions: []
                }
            };

            this.configurations.cell = {
                ...this.configurations.cell,
                amountTypeFields: [...this.configurations.cell.amountTypeFields, config]
            };
        }
    }

    handleRemoveAmountTypeField(event) {
        const amountTypeId = event.detail.amountTypeId;

        this.configurations.cell = {
            ...this.configurations.cell,
            amountTypeFields: this.configurations.cell.amountTypeFields.filter(
                (config) => config.displayFieldId !== amountTypeId
            )
        };
    }

    handleAddBasicField() {
        const newData = {
            id: generateUUID(),
            isNew: true,
            name: '',
            mapping: {
                type: 'basicMapping',
                targetObject: '',
                targetLabelField: '',
                targetValueField: '',
                conditionOperator: '',
                conditions: []
            }
        };

        this.configurations.cell = {
            ...this.configurations.cell,
            basicFields: [...this.configurations.cell.basicFields, newData]
        };
    }

    handleRemoveBasicField(event) {
        const id = event.detail.id;

        this.configurations.cell = {
            ...this.configurations.cell,
            basicFields: this.configurations.cell.basicFields.filter((config) => config.id !== id)
        };
    }

    handleCellFormChange(event) {
        const { customKey, field, value, type } = event.detail;

        let updatedConfig;

        if (field === 'targetObject' && value) {
            updatedConfig = {
                targetObject: value,
                targetLabelField: '',
                targetValueField: '',
                conditionOperator: '',
                conditions: []
            };
        } else {
            updatedConfig = {
                [field]: value
            };
        }

        if (type === 'amountType') {
            this.configurations.cell = {
                ...this.configurations.cell,
                amountTypeFields: this.configurations.cell.amountTypeFields.map((item) => {
                    if (item.displayFieldId !== customKey) {
                        return item;
                    }

                    return {
                        ...item,
                        hasProductRelationship:
                            this.configurations.column.targetObject === 'Product2' ||
                            this.configurations.row.targetObject === 'Product2',
                        mapping: {
                            ...item.mapping,
                            ...updatedConfig
                        }
                    };
                })
            };
        }

        if (type === 'basicMapping') {
            this.configurations.cell = {
                ...this.configurations.cell,
                basicFields: this.configurations.cell.basicFields.map((item) => {
                    if (item.id !== customKey) {
                        return item;
                    }

                    return {
                        ...item,
                        mapping: {
                            ...item.mapping,
                            ...updatedConfig
                        }
                    };
                })
            };
        }
    }

    async handleHeaderFormChange(event) {
        const { area, field, value } = event.detail;

        // eslint-disable-next-line default-case
        switch (field) {
            case 'targetObject': {
                await this.handleHeaderTargetObjectChange(area, value);
                this.setObjectsForCellMapping();
                break;
            }
            case 'type': {
                const updatedConfig = {
                    [area]: {
                        ...this.configurations[area],
                        ...resetHeaderMappingFields(this.configurations[area]),
                        type: value
                    }
                };

                if (value === headerBuildTypes.PICKLIST_VALUES) {
                    const otherArea = area === templateAreas.column ? templateAreas.row : templateAreas.column;
                    const otherConfig = this.configurations[otherArea];

                    if (otherConfig.type === headerBuildTypes.PICKLIST_VALUES) {
                        updatedConfig[area].targetObject = otherConfig.targetObject;
                    }
                }
                this.updateConfigurationInState(updatedConfig);
                this.setObjectsForCellMapping();
                break;
            }
            case 'targetValueField': {
                const updatedConfig = {
                    [field]: value,
                    usePicklistDependency: false
                };
                const newConfig = { [area]: { ...this.configurations[area], ...updatedConfig } };

                this.updateConfigurationInState(newConfig);
                break;
            }
            default: {
                const updatedConfig = {
                    [field]: value
                };
                const newConfig = { [area]: { ...this.configurations[area], ...updatedConfig } };

                this.updateConfigurationInState(newConfig);
            }
        }
    }

    async handleHeaderTargetObjectChange(area, value) {
        const updatedConfig = { ...resetHeaderMappingFields(this.configurations[area]), targetObject: value };

        this.updateConfigurationInState({ [area]: { ...this.configurations[area], ...updatedConfig } });

        const otherArea = area === templateAreas.column ? templateAreas.row : templateAreas.column;
        const otherConfiguration = this.configurations[otherArea];

        if (
            this.configurations[area].type === headerBuildTypes.PICKLIST_VALUES &&
            otherConfiguration.type === headerBuildTypes.RECORDS
        ) {
            const parentRelationshipObjectNames = await WsTemplateBuilderService.getUniqueParentRelationshipObjectNames(
                value
            );
            const validTargetObject = parentRelationshipObjectNames.includes(otherConfiguration.targetObject);

            if (!validTargetObject) {
                this.updateConfigurationInState({
                    [otherArea]: {
                        ...otherConfiguration,
                        ...resetHeaderMappingFields(otherConfiguration)
                    }
                });
            }
        }
    }

    updateConfigurationInState(configuration) {
        this.configurations = {
            ...this.configurations,
            ...configuration
        };
    }

    setObjectsForCellMapping() {
        if (this.templateType === headerBuildTypes.PICKLIST_VALUES) {
            const targetObject =
                this.configurations.column.type === headerBuildTypes.PICKLIST_VALUES
                    ? this.configurations.column.targetObject
                    : this.configurations.row.targetObject;
            const targetObjectOption = WsTemplateBuilderService.objectTypeOptions.find(
                (option) => option.value === targetObject
            );
            const options = targetObjectOption ? [targetObjectOption] : [];

            this.cellObjectTypeOptions = options;
        } else {
            const commonRelationships = WsTemplateBuilderService.getCommonChildRelationships(
                this.configurations.column.targetObject,
                this.configurations.row.targetObject
            );

            this.cellObjectTypeOptions = commonRelationships;
        }
        this.checkCellConfigurationTargetObjects(this.cellObjectTypeOptions);
    }

    checkCellConfigurationTargetObjects(relationships) {
        this.configurations.cell = {
            ...this.configurations.cell,
            amountTypeFields: this.updateCellConfigs(this.configurations.cell.amountTypeFields, relationships),
            basicFields: this.updateCellConfigs(this.configurations.cell.basicFields, relationships)
        };
    }

    updateCellConfigs(configs, relationships) {
        return (
            configs?.map((item) => {
                if (
                    relationships.find((obj) => {
                        return obj.value === item.mapping.targetObject;
                    })
                ) {
                    return item;
                }
                const updatedItem = {
                    targetObject: '',
                    targetLabelField: '',
                    targetValueField: '',
                    conditions: []
                };

                return {
                    ...item,
                    hasProductRelationship:
                        this.configurations.column.targetObject === 'Product2' ||
                        this.configurations.row.targetObject === 'Product2',
                    mapping: { ...item.mapping, ...updatedItem }
                };
            }) ?? []
        );
    }

    clearSelection() {
        const selectedElement = this.template.querySelector(`.${selectedAreaClassName}`);

        if (selectedElement) {
            selectedElement.classList.remove(selectedAreaClassName);
        }
    }

    handleEditClick() {
        this.isEditing = true;
    }

    async handleEditCancel() {
        await this.processTemplate(this.templateWrapper);
        this.isEditing = false;
    }

    handlePageCancel() {
        this.navigateToListView();
    }

    handlePageSave() {
        const templateNameInputCmp = this.template.querySelector("[data-name='templateName']");

        if (!templateNameInputCmp.checkValidity()) {
            templateNameInputCmp.reportValidity();

            return;
        }

        let amountTypeFields = {};

        this.configurations.cell.amountTypeFields.forEach((item) => {
            const template = {
                id: item.id,
                displayFieldId: item.displayFieldId,
                mapping: toMappingWrapper(item.mapping)
            };

            amountTypeFields[item.displayFieldId] = template;
        });

        const basicFields = this.configurations.cell.basicFields.map((item) => {
            return {
                id: item.isNew ? null : item.id,
                mapping: toMappingWrapper(item.mapping)
            };
        });

        const rowMapping = toMappingWrapper(this.configurations.row);
        const columnMapping = toMappingWrapper(this.configurations.column);

        const wrapper = {
            name: this.templateName,
            id: this.recordId,
            amountTypeFields,
            basicFields,
            columnConfiguration: {
                usePicklistDependency: this.configurations.column.usePicklistDependency,
                mapping: columnMapping
            },
            rowConfiguration: {
                usePicklistDependency: this.configurations.row.usePicklistDependency,
                mapping: rowMapping
            }
        };

        this.loading = true;

        if (this._createMode) {
            createWhiteSpaceTemplate({ templateWrapper: wrapper })
                .then((results) => {
                    const evt = new ShowToastEvent({
                        title: `${results.name} created!`,
                        variant: 'success'
                    });

                    this.dispatchEvent(evt);
                    this.loading = false;
                    this.navigateToListView();
                })
                .catch((error) => {
                    this.error = error;
                    const evt = new ShowToastEvent({
                        title: LABEL_ERROR_CREATING_TEMPLATE,
                        message: reduceErrors(error).join(', '),
                        variant: 'error',
                        mode: 'pester'
                    });

                    this.dispatchEvent(evt);
                    this.loading = false;
                });
        } else if (!this._createMode) {
            updateWhiteSpaceTemplate({ templateWrapper: wrapper })
                .then((results) => {
                    const evt = new ShowToastEvent({
                        title: `${results.name} updated!`,
                        variant: 'success'
                    });

                    this.dispatchEvent(evt);
                    this.processTemplate(results);
                    this.loading = false;
                    this.isEditing = false;
                })
                .catch((error) => {
                    this.error = error;
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: LABEL_ERROR_CREATING_TEMPLATE,
                            message: reduceErrors(error).join(', '),
                            variant: 'error',
                            mode: 'pester'
                        })
                    );
                    this.loading = false;
                });
        }
    }

    navigateToListView() {
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: WHITESPACETEMPLATE_OBJECT.objectApiName,
                actionName: 'list'
            }
        });

        const closeEvent = new CustomEvent('closebuilder', { bubbles: true, composed: true, detail: {} });

        this.dispatchEvent(closeEvent);
    }

    handleTemplateNameChange(event) {
        this.templateName = event.target.value;
    }

    // Template Expresions
    get isHeaderAreaActive() {
        return this.selectedArea === templateAreas.column || this.selectedArea === templateAreas.row;
    }

    get isCellAreaActive() {
        return this.selectedArea === templateAreas.cell;
    }

    get panelHeader() {
        var headerString = '';

        switch (this.selectedArea) {
            case 'row':
                headerString = LABEL_ROW_CONFIGURATION;
                break;
            case 'column':
                headerString = LABEL_COLUMN_CONFIGURATION;
                break;
            case 'cell':
                headerString = LABEL_CELL_CONFIGURATION;
                break;
            default:
                headerString = '';
        }

        return toTitleCase(headerString);
    }

    get hasRelatedWhiteSpaces() {
        return this.relatedWhiteSpaces && this.relatedWhiteSpaces.length;
    }

    get columnValidity() {
        return WsTemplateBuilderService.isConfigurationValid(templateAreas.column, this.configurations.column);
    }

    get rowValidity() {
        return WsTemplateBuilderService.isConfigurationValid(templateAreas.row, this.configurations.row);
    }

    get cellValidity() {
        return WsTemplateBuilderService.isConfigurationValid(
            templateAreas.cell,
            this.configurations.cell,
            this.isCellDataRequired
        );
    }

    get isSaveTemplateDisabled() {
        return !this.rowValidity || !this.columnValidity || !this.cellValidity || this.loading;
    }

    get isCellDataRequired() {
        return (
            this.configurations[templateAreas.column]?.usePicklistDependency ||
            this.configurations[templateAreas.row]?.usePicklistDependency
        );
    }
}