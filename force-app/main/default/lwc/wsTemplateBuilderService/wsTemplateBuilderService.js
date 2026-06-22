import getObjects from '@salesforce/apex/WhiteSpaceTemplateController.getObjects';
import getSuggestedContactObject from '@salesforce/apex/WhiteSpaceTemplateController.getSuggestedContactObject';
import getFields from '@salesforce/apex/WhiteSpaceTemplateController.getFields';
import getWhiteSpaceAmountTypes from '@salesforce/apex/WhiteSpaceTemplateController.getWhiteSpaceAmountTypes';

import { templateAreas } from 'c/whiteSpaceTemplateBuilderUtils';
import { isNotEmpty } from 'c/utils';

function validate(obj, props) {
    return props.every((prop) => {
        // eslint-disable-next-line no-prototype-builtins
        return obj.hasOwnProperty(prop) && obj[prop] && obj[prop] !== '' && obj[prop] !== null;
    });
}

const intersectionBy = (a, b, fn) => {
    const s = new Set(b.map(fn));

    return [...new Set(a)].filter((x) => s.has(fn(x)));
};

const uniqueElementsBy = (arr, fn) =>
    arr.reduce((acc, v) => {
        if (!acc.some((x) => fn(v, x))) {
            acc.push(v);
        }

        return acc;
    }, []);

const checkForCustomOpportunityMapping = (objectName, relationships) => {
    if (objectName === 'Product2') {
        const customOpportunityRelationship = {
            childObjectApiName: 'Opportunity'
        };

        relationships = [...relationships, customOpportunityRelationship];
    }

    return relationships;
};

const headerObjRequiredFieldsForRecordType = ['targetObject', 'targetLabelField'];
const headerObjRequiredFieldsForPicklistType = ['targetObject', 'targetValueField'];
const cellAmountTypeRequiredFields = ['targetObject', 'targetLabelField', 'targetValueField'];
const cellBasicRequiredFields = ['targetObject', 'targetLabelField'];
const conditionObjRequiredFields = ['field', 'operator', 'value'];

class WsTemplateBuilderService {
    amountTypes;

    objectTypeMap;

    objectTypeOptions = [];

    async init() {
        const objects = await getObjects();

        this.objectTypeMap = Object.assign({}, ...objects.map((item) => ({ [item.apiName]: item })));
        this.objectTypeOptions = objects.map((obj) => {
            return {
                label: obj.label,
                value: obj.apiName
            };
        });
        this.amountTypes = await getWhiteSpaceAmountTypes();
    }
    async getSuggestedContactObject() {
        const objects = await getSuggestedContactObject();
        if (!this.objectTypeMap) {
            this.objectTypeMap = Object.assign({}, ...objects.map((item) => ({ [item.apiName]: item })));
        }
        else {
            this.objectTypeMap = Object.assign({},...this.objectTypeMap, ...objects.map((item) => ({ [item.apiName]: item })));
        }
        this.objectTypeOptions = objects.map((obj) => {
            return {
                label: obj.label,
                value: obj.apiName
            };
        });
        if (!this.amountTypes) {
            this.amountTypes = await getWhiteSpaceAmountTypes();
        }
    }
    async getFieldsForObjectAsList(sObjectApiName) {
        if (!this.objectTypeMap[sObjectApiName]) {
            return [];
        }
        if (!this.objectTypeMap[sObjectApiName].fieldsList) {
            const fieldsResult = await getFields({ sObjectApiName: sObjectApiName });

            this.objectTypeMap = {
                ...this.objectTypeMap,
                [sObjectApiName]: {
                    ...this.objectTypeMap[sObjectApiName],
                    fieldsList: fieldsResult
                }
            };
        }

        return this.objectTypeMap[sObjectApiName].fieldsList;
    }

    async getFieldsForObjectAsMap(sObjectApiName) {
        if (!this.objectTypeMap[sObjectApiName]) {
            return {};
        }
        if (!this.objectTypeMap[sObjectApiName].fieldsMap) {
            const fieldsResult = await this.getFieldsForObjectAsList(sObjectApiName);
            const fields = Object.assign({}, ...fieldsResult.map((item) => ({ [item.apiName]: item })));

            this.objectTypeMap = {
                ...this.objectTypeMap,
                [sObjectApiName]: {
                    ...this.objectTypeMap[sObjectApiName],
                    fieldsMap: fields,
                    fieldsList: fieldsResult
                }
            };
        }

        return this.objectTypeMap[sObjectApiName].fieldsMap;
    }

    getCommonChildRelationships(sObjectApiName1, sObjectApiName2) {
        let commonRelationships = [];

        if (sObjectApiName1 && sObjectApiName2) {
            const childRelationships1 = this.getUniqueChildRelationshipObjectNames(sObjectApiName1);
            const childRelationships2 = this.getUniqueChildRelationshipObjectNames(sObjectApiName2);

            commonRelationships = intersectionBy(childRelationships1, childRelationships2, (x) => x.childObjectApiName)
                .filter((obj) => {
                    return this.objectTypeMap[obj.childObjectApiName];
                })
                .map((obj) => {
                    return {
                        label: this.objectTypeMap[obj.childObjectApiName].label,
                        value: this.objectTypeMap[obj.childObjectApiName].apiName
                    };
                })
                .sort((a, b) => a.label.localeCompare(b.label));
        }

        return commonRelationships;
    }

    async getParentRelationships(sObjectApiName) {
        let parentRelationships = [];

        if (isNotEmpty(sObjectApiName)) {
            const uniqueRelationshipObjectNames = await this.getUniqueParentRelationshipObjectNames(sObjectApiName);

            parentRelationships = uniqueRelationshipObjectNames
                .map((objName) => {
                    return {
                        label: this.objectTypeMap[objName].label,
                        value: objName
                    };
                })
                .sort((a, b) => a.label.localeCompare(b.label));
        }

        return parentRelationships;
    }

    getUniqueChildRelationshipObjectNames(sObjectApiName) {
        let childRelationshipObjectNames = [];
        const objectInfo = this.objectTypeMap[sObjectApiName];

        if (objectInfo) {
            childRelationshipObjectNames = uniqueElementsBy(
                checkForCustomOpportunityMapping(sObjectApiName, objectInfo.childRelationships),
                (a, b) => a.childObjectApiName === b.childObjectApiName
            );
        }

        return childRelationshipObjectNames;
    }

    async getUniqueParentRelationshipObjectNames(sObjectApiName) {
        let parentRelationshipObjectNames = [];
        const fields = await this.getFieldsForObjectAsMap(sObjectApiName);

        if (fields) {
            parentRelationshipObjectNames = Object.values(fields)
                .filter((field) => {
                    return (
                        field.displayType.toLowerCase() === 'reference' &&
                        this.objectTypeMap[field.referenceObjectApiName]
                    );
                })
                .map((field) => {
                    return field.referenceObjectApiName;
                });
            if (sObjectApiName === 'Opportunity') {
                parentRelationshipObjectNames = [...parentRelationshipObjectNames, 'Product2'];
            }
            parentRelationshipObjectNames = [...new Set(parentRelationshipObjectNames)];
        }

        return parentRelationshipObjectNames;
    }

    isConfigurationEmpty(type, configuration) {
        if (type === templateAreas.column || type === templateAreas.row) {
            if (configuration.type === 'picklistvalues') {
                return !configuration || (!configuration.targetObject && !!configuration.targetValueField);
            }

            if (configuration.type === 'records') {
                return (
                    !configuration ||
                    !configuration.targetObject ||
                    (!configuration.targetLabelField && !configuration.targetValueField)
                );
            }
        }
        if (type === templateAreas.cell) {
            return !configuration.amountTypeFields?.length && !configuration.basicFields?.length;
        }

        return true;
    }

    isHeaderConfigurationValid(configuration) {
        if (configuration.type === 'picklistvalues') {
            return validate(configuration, headerObjRequiredFieldsForPicklistType);
        }
        if (configuration.type === 'records') {
            return validate(configuration, headerObjRequiredFieldsForRecordType);
        }

        return false;
    }

    isCellConfigurationValid(configuration = {}, isCellDataRequired = false) {
        if (isCellDataRequired && this.isConfigurationEmpty(templateAreas.cell, configuration)) {
            return false;
        }

        const amountTypeFieldsValid = configuration.amountTypeFields?.length
            ? this.validateCellConfigsArray(configuration.amountTypeFields, cellAmountTypeRequiredFields)
            : true;
        const basicFieldsValid = configuration.basicFields?.length
            ? this.validateCellConfigsArray(configuration.basicFields, cellBasicRequiredFields)
            : true;

        return amountTypeFieldsValid && basicFieldsValid;
    }

    isConfigurationValid(type = '', configuration = {}, isCellDataRequired = false) {
        if (type === templateAreas.column || type === templateAreas.row) {
            return this.isHeaderConfigurationValid(configuration);
        }
        if (type === templateAreas.cell) {
            return this.isCellConfigurationValid(configuration, isCellDataRequired);
        }

        return false;
    }

    validateCellConfigsArray(configs, requiredFields) {
        return configs.every((config) => {
            return validate(config.mapping, requiredFields) && this.validateConditions(config.mapping.conditions);
        });
    }

    validateConditions(conditions = []) {
        return conditions.every((item) => {
            return validate(item, conditionObjRequiredFields);
        });
    }

    getObjectLabel(sObjectApiName) {
        const objectInfo = this.objectTypeMap[sObjectApiName];

        return objectInfo ? objectInfo.label : '';
    }

    getObjectLabelPlural(sObjectApiName) {
        return this.objectTypeMap[sObjectApiName]?.labelPlural ?? '';
    }

    isFieldGroupable(field) {
        return field?.isAccessible;
    }
}

const wsTemplateBuilderService = new WsTemplateBuilderService();

export default wsTemplateBuilderService;