/* eslint-disable @lwc/lwc/no-api-reassignments */
import { LightningElement, api } from 'lwc';
import { createFlattenedSetFromDelimitedString, isNotEmpty } from 'c/utils';
import EMPTY_DATA from '@salesforce/resourceUrl/empty_whitespace_illustration';

import LABEL_LOADING from '@salesforce/label/c.Loading';
import LABEL_NO_RESULTS_FOUND from '@salesforce/label/c.No_Results_Found';
import LABEL_REFRESH_DATA from '@salesforce/label/c.Refresh_Data';

const sumValue = (data, property) => {
    const sum = data.reduce((previousValue, currentValue) => {
        const valueToAdd = +currentValue[property] || 0;

        previousValue += valueToAdd;

        return previousValue;
    }, 0);

    return sum;
};

export default class PqDatatable extends LightningElement {
    labels = {
        loading: LABEL_LOADING,
        noResultsFound: LABEL_NO_RESULTS_FOUND,
        refreshData: LABEL_REFRESH_DATA
    };

    emptyDataUrl = EMPTY_DATA;

    @api recordId;

    _keyField;

    @api
    get keyField() {
        return this._keyField || 'Id';
    }

    set keyField(value = 'Id') {
        this._keyField = value;
    }

    // Sorting
    @api
    get sortedBy() {
        return this._sortedBy;
    }

    set sortedBy(value) {
        if (value) {
            this._sortedBy = value.replace('.', '_');
        }
    }

    @api sortedDirection = 'asc';

    @api
    get sortableFields() {
        return this._sortableFields;
    }

    set sortableFields(value = '') {
        this._sortableFields = createFlattenedSetFromDelimitedString(value, ',');
    }

    _filter = {};

    @api
    get filter() {
        return this._filter;
    }

    set filter(value = {}) {
        this._filter = { ...value };
        this._setTableData(this.tableData);
    }

    @api iconName;

    @api title;

    @api showRecordCount = false;

    @api showRowNumberColumn = false;

    @api showColumnTotals = false;

    // Misc
    @api columnWidthsMode = 'fixed'; // Override salesforce default

    @api showRefreshButton = false;

    @api showSpinner = false;

    @api customHeight;

    @api customRelativeMaxHeight;

    @api useRelativeMaxHeight = false;

    @api loaded = false;

    isHideCheckbox = true;

    showComposedActions = true;

    tableData = [];

    tableColumns = [];

    displayedTableData = [];

    get showEmptyGraphics() {
        return this.loaded && this.displayedTableData?.length === 0;
    }

    get recordCountDisplay() {
        return this.displayedTableData && this.displayedTableData.length ? `(${this.displayedTableData.length})` : '';
    }

    get composedActionSlot() {
        return this.template.querySelector('slot[name=composedActions]');
    }

    @api
    initializeTable(columns, data) {
        this._setTableColumns(columns);
        this._setTableData(data);
    }

    @api
    refreshTable() {
        this.dispatchEvent(new CustomEvent('refresh'));
    }

    handleRefresh() {
        this.refreshTable();
    }

    handleComposedActionSlotChange(event) {
        this.showComposedActions =
            (this.composedActionSlot && this.composedActionSlot.assignedElements().length !== 0) ||
            event.target.assignedElements().length !== 0;
    }

    handleColumnSorting(event) {
        this._updateColumnSorting(event.detail.fieldName, event.detail.sortDirection);
    }

    // Private functions

    _setTableColumns(tableColumns) {
        if (!tableColumns || !tableColumns.length) {
            return;
        }
        const finalColumns = [];

        for (let col of tableColumns) {
            // Sorting
            if (this.sortableFields && this.sortableFields.size) {
                // If parent fields require sorting, use _ in place of . for the fieldName.
                if (this.sortableFields.has(col.fieldName)) {
                    col.sortable = true;
                }
            }

            if (this.showColumnTotals) {
                col.baseLabel = col.label;
            }
            finalColumns.push(col);
        }
        this.tableColumns = finalColumns;
    }

    _setTableData(tableData) {
        if (!tableData || !tableData.length) {
            this.tableData = [];
            this.displayedTableData = [];

            return;
        }

        this.tableData = tableData;

        let displayedTableData = [...this.tableData];

        // Has filters
        if (Object.keys(this.filter).length > 0) {
            displayedTableData = this._filterData(displayedTableData, this.filter);
        }

        // Has sort
        if (this.sortedBy) {
            displayedTableData = this._sortData(this.sortedBy, this.sortedDirection, displayedTableData);
        }
        this.displayedTableData = displayedTableData;
        this._updateColumnTotals();
    }

    _updateColumnTotals() {
        if (this.showColumnTotals) {
            this.tableColumns = this.tableColumns.map((column) => {
                if (column.type === 'currency' || column.type === 'number') {
                    const total = sumValue(this.displayedTableData, column.fieldName) || 0;
                    const totalString = total.toLocaleString();

                    return {
                        ...column,
                        label: `${column.baseLabel} (${totalString})`
                    };
                }

                return column;
            });
        }
    }

    _updateColumnSorting(fieldName, sortDirection) {
        this.sortedBy = fieldName;
        this.sortedDirection = sortDirection;
        this.displayedTableData = this._sortData(fieldName, sortDirection, this.displayedTableData);
    }

    _filterData(data, query) {
        const filteredData = data.filter((item) => {
            // eslint-disable-next-line guard-for-in
            for (let key in query) {
                const value = item[key];

                if (value === undefined) {
                    return false;
                }

                const filter = query[key];

                if (filter.type === 'picklist' && !filter.selectedValues.includes(value)) {
                    return false;
                }

                if (filter.type === 'date' || filter.type === 'datetime') {
                    const startDate = isNotEmpty(filter.startDate) ? new Date(filter.startDate) : null;
                    const endDate = isNotEmpty(filter.endDate) ? new Date(filter.endDate) : null;
                    const valueDate = new Date(value);
                    const matchesStartDate = startDate !== null ? valueDate >= startDate : true;
                    const matchesEndDate = endDate !== null ? valueDate <= endDate : true;
                    const dateMatches = matchesStartDate && matchesEndDate;

                    return dateMatches;
                }
            }

            return true;
        });

        return filteredData;
    }

    _sortData(fieldName, sortDirection, unsortedData) {
        const dataToSort = JSON.parse(JSON.stringify(unsortedData));
        const reverse = sortDirection !== 'asc';

        return dataToSort.sort(this._sortBy(fieldName, reverse));
    }

    _sortBy(field, reverse, primer) {
        const key = primer
            ? function (x) {
                  return primer(x[field]);
              }
            : function (x) {
                  return x[field];
              };

        // Checks if the two rows should switch places
        reverse = !reverse ? 1 : -1;

        return function (a, b) {
            // eslint-disable-next-line no-sequences, no-return-assign
            return (a = key(a) ? key(a) : ''), (b = key(b) ? key(b) : ''), reverse * ((a > b) - (b > a));
        };
    }

    // Class expressions

    get customHeightStyle() {
        if (this.customHeight) {
            return `height: ${this.customHeight}px;`;
        }
        if (this.useRelativeMaxHeight) {
            // 62vh tries to take into account both global header and utility bar
            const viewHeight = this.customRelativeMaxHeight ? this.customRelativeMaxHeight : '62';

            return `height: ${viewHeight}vh;`;
        }

        return '';
    }

    handleRowAction(event) {
        const evt = new CustomEvent('rowaction', {
            detail: event.detail
        });

        this.dispatchEvent(evt);
    }
}