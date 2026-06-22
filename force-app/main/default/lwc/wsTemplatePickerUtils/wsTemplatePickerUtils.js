import getHeaderTotals from '@salesforce/apex/WhiteSpaceTemplatePickerController.getHeaderTotals';

import { isEmptyObject } from 'c/utils';

export const MaxRecordSize = 100;

export const MinRecordSize = 1;

class TemplateSection {
    _configuration;

    filterInfo;

    isFiltered;

    totalCount;

    filteredCount;

    constructor(configuration, filterInfo) {
        this._configuration = configuration;
        this.filterInfo = filterInfo;
        this.isFiltered = false;
        this.totalCount = null;
        this.filteredCount = null;
    }

    get label() {
        if (this.isPicklistType) {
            return `${this._configuration.mapping.objectLabel}: ${this._configuration.mapping.valueFieldInfo.label}`;
        }
        if (this.isGroupedType) {
            return `${this._configuration.mapping.objectLabel}: ${this._configuration.mapping.labelFieldInfo.label}`;
        }

        return this._configuration.mapping.objectLabelPlural;
    }

    get isFilterable() {
        return !this.isPicklistType && this.filterInfo !== null && this.filterInfo !== undefined;
    }

    get count() {
        return this.isFiltered ? this.filteredCount : this.totalCount;
    }

    get mapping() {
        return this._configuration.mapping;
    }

    get exceedsLimit() {
        return this.count > MaxRecordSize;
    }

    get lessThanMinimum() {
        return this.count < MinRecordSize;
    }

    get isPicklistType() {
        return this._configuration.type === 'picklistvalues';
    }

    get isGroupedType() {
        return this._configuration.mapping.groupResults;
    }
}

export class WsTemplateModel {
    _template;

    _parentContextChildRelationships;

    column;

    row;

    cellObjects;

    areCellsFiltered = false;

    areUnrelatedCellsFiltered = false;

    constructor(template, parentContextChildRelationships) {
        this._template = template;
        this._parentContextChildRelationships = parentContextChildRelationships.map((item) => item.childObjectApiName);
        this.column = new TemplateSection(
            template.columnConfiguration,
            this.findLookupRelationshipInfo(template.columnConfiguration.mapping.objectName)
        );
        this.row = new TemplateSection(
            template.rowConfiguration,
            this.findLookupRelationshipInfo(template.rowConfiguration.mapping.objectName)
        );
        this.cellObjects = Object.values(template.amountTypeFields ?? {}).map((item) => item?.mapping?.objectName);
    }

    get id() {
        return this._template.id;
    }

    get name() {
        return this._template.name;
    }

    get picklistSourceObjectLabel() {
        let label = '';

        if (this.hasPicklistHeader) {
            if (this.column.isPicklistType) {
                label = this.column.mapping.objectLabelPlural;
            } else if (this.row.isPicklistType) {
                label = this.row.mapping.objectLabelPlural;
            }
        }

        return label;
    }

    get amountTypeObjects() {
        let objectNames = [];

        if (this.hasPicklistHeader) {
            if (this.column.isPicklistType) {
                objectNames.push(this.column.mapping.objectName);
            } else if (this.row.isPicklistType) {
                objectNames.push(this.row.mapping.objectName);
            }
        }
        objectNames = objectNames.concat(this.cellObjects);

        return objectNames;
    }

    get hasPicklistHeader() {
        return this.column.isPicklistType || this.row.isPicklistType;
    }

    get hasAmountTypeFields() {
        return this._template.amountTypeFields && !isEmptyObject(this._template.amountTypeFields);
    }

    get hasBasicFields() {
        return Array.isArray(this._template.basicFields) && this._template.basicFields.length;
    }

    get areCellsFilterable() {
        return this.filterableAmountTypesExist();
    }

    get hasUnrelatedCellTypes() {
        return this.unfilterableAmountTypesExist();
    }

    async getHeaderTotals() {
        const results = await getHeaderTotals({
            columnMapping: this.column.mapping,
            rowMapping: this.row.mapping
        });

        this.column.totalCount = results.columnTotal;
        this.row.totalCount = results.rowTotal;

        return this;
    }

    findLookupRelationshipInfo(objectName) {
        return this._parentContextChildRelationships.find((item) => item === objectName);
    }

    filterableAmountTypesExist() {
        let objs = [...this.amountTypeObjects];

        return this._parentContextChildRelationships.some((item) => objs.includes(item));
    }

    unfilterableAmountTypesExist() {
        let objs = [...this.amountTypeObjects];

        return objs.some((item) => !this._parentContextChildRelationships.includes(item));
    }
}