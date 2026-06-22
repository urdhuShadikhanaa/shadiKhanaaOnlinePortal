import { LightningElement, api, track, wire } from 'lwc';
import { hasKey, union, difference } from 'c/utils';
import { formatDataValue } from 'c/dataFormatUtils';
import { reduceErrors } from 'c/ldsUtils';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import getHighlights from '@salesforce/apex/WhiteSpaceController.getHighlights';

// Import getWhiteSpaceForAccountPlan from '@salesforce/apex/WhiteSpaceController.getWhiteSpaceForAccountPlan';
import getFilters from '@salesforce/apex/WhiteSpaceController.getFilters';
import updateFilters from '@salesforce/apex/WhiteSpaceController.updateFilters';
import getSummaryFormulas from '@salesforce/apex/WhiteSpaceController.getSummaryFormulas';
import getDataTypes from '@salesforce/apex/WhiteSpaceController.getDataTypes';
import getControllingFieldValuesForPicklistValue from '@salesforce/apex/WhiteSpaceUtils.getControllingFieldValuesForPicklistValue';
import getUserSetting from '@salesforce/apex/WhiteSpaceController.getUserSetting';
import updateZoomIndex from '@salesforce/apex/WhiteSpaceController.updateZoomIndex';

// User Record Access
import getAccessForObject from '@salesforce/apex/UserRecordAccessServiceController.getUserRecordAccess';
import createWhiteSpaceTile from '@salesforce/apex/WhiteSpaceController.createWhiteSpaceTile';
import updateWhiteSpaceTile from '@salesforce/apex/WhiteSpaceController.updateWhiteSpaceTile';
import setHighlight from '@salesforce/apex/WhiteSpaceController.setHighlight';
import saveDataForCell from '@salesforce/apex/WhiteSpaceController.saveDataForCell';
import deleteWhiteSpaceTile from '@salesforce/apex/WhiteSpaceController.deleteWhiteSpaceTile';

// Import WS_USER_SETTING_WHITE_SPACE from '@salesforce/schema/WS_User_Setting__c.White_Space__c';

import LABEL_WS_NEEDS_REFRESH from '@salesforce/label/c.WS_Needs_Refresh';
import LABEL_CLICK_ANYWHERE_TO_REFRESH from '@salesforce/label/c.Click_Anywhere_To_Refresh';
import WS_HIGHLIGHT_COLOR from '@salesforce/schema/WS_Highlight__c.Color__c';
import WS_HIGHLIGHT_LABEL from '@salesforce/schema/WS_Highlight__c.Label__c';

import WS_DATA_TYPE from '@salesforce/schema/WS_Data_Type__c';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';

const INFO_FIELD_KEY = 'info';
const ZOOM_SUMMARY_RANGE = [25, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750];
const ZOOM_TILE_RANGE = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600];
const ZOOM_MAX_INDEX = 15;

export default class WhiteSpaceReportLwc extends LightningElement {
    @api isClassic = false;

    @api permissions;

    @api recordId;

    @api whiteSpaceFilters; // Deprecated, but can't remove due to managed package

    @track cells = [];

    @track columns = [];

    @track rows = [];

    @track visibleColumns = [];

    @track visibleRows = [];

    labels = {
        refresh1: LABEL_WS_NEEDS_REFRESH,
        refresh2: LABEL_CLICK_ANYWHERE_TO_REFRESH
    };

    amountTypes = [];

    canCreateDataTypes = false;

    canEditCells = false;

    canEditHeaders = false;

    canDelete = false;

    showRecordPageNavLink = false;

    dataInitialized = false;

    dataTypeCreatable = false;

    highlights = [];

    isLoading;

    panelData;

    selectedCellColumnId = '';

    selectedCellRowId = '';

    selectedTileId = '';

    tileSize = 150;

    recordsPerLoad = 10;

    zoomIndex = 3;

    userSettings;

    columnIdsWithData = new Set();

    allColumnIds = new Set();

    rowIdsWithData = new Set();

    allRowIds = new Set();

    _parentHeadersCollapsed = false;

    _sellectedCellElementRef;

    _whiteSpaceReport;

    @api hiddenHeaderItems = [];

    @api zoomFactor = 1; // Deprecated, but can't remove due to managed package

    @api
    toggleAllParents() {
        this.handleToggleAllParents();
    }

    @api selectedFilters; // Deprecated, but can't remove due to managed package

    @api
    get whiteSpaceReport() {
        return this._whiteSpaceReport;
    }

    set whiteSpaceReport(data) {
        this._whiteSpaceReport = data;
        this.updateSize();
        this.initializeTableData(JSON.parse(JSON.stringify(data)));
    }

    dataTypes = [];

    filterData;

    hiddenHighlights = [];

    hiddenAmountTypes = [];

    hiddenColumns = [];

    hiddenRows = [];

    summaryFormulas = [];

    visibleAmountTypes = [];

    @wire(getObjectInfo, { objectApiName: WS_DATA_TYPE.objectApiName })
    wiredGetObjectInfo({ data }) {
        if (data) {
            this.dataTypeCreatable = data.createable;
            this.canCreateDataTypes = this.permissions && this.permissions.canUpdate && this.dataTypeCreatable;
        }
    }

    /** Re-implement this when all of whitespace is migrated to LWC*/

    // ConnectedCallback() {
    //     If (this.recordId) {
    //         This.getWhiteSpaceReportByAcountPlanId(this.recordId);
    //     }
    // }

    // Async getWhiteSpaceReportByAcountPlanId(recordId) {
    //     Const param = {
    //         AccountPlanId: recordId
    //     };
    //     This.isLoading = true;
    //     Try {
    //         Const result = await getWhiteSpaceForAccountPlan(param);
    //         This.whiteSpaceReport = result;
    //         This.initializeTableData();
    //     } catch (error) {
    //         This.error = error;
    //     } finally {
    //         This.isLoading = false;
    //     }
    // }

    connectedCallback() {
        this.getUserSettings();
        this.setPermissions();
        this.getSummaryFormulas();
        this.getDataTypes();
        this.showRecordPageNavLink = !this.hiddenHeaderItems.includes('recordPageNavLink');
    }

    async getUserSettings() {
        const whitespaceId = this._whiteSpaceReport.id;

        await getUserSetting({ whitespaceId })
            .then((result) => {
                this.userSettings = result;
                if (
                    this.userSettings &&
                    this.userSettings.pqcrush__Zoom_Index__c !== undefined &&
                    this.userSettings.pqcrush__Zoom_Index__c !== null
                ) {
                    this.zoomIndex = this.userSettings.pqcrush__Zoom_Index__c;
                    this.updateSize();
                }
            })
            .catch((error) => {
                this.showNotification('Error', error.message, 'error');
            });
    }

    updateZoom(zoomIndex) {
        const settingId = this.userSettings.Id;

        updateZoomIndex({ settingId, zoomIndex }).catch((error) => {
            this.showNotification('Error', error.message, 'error');
        });
    }

    setPermissions() {
        this.canEditCells = this.permissions && this.permissions.canUpdate && this.permissions.canAddCells;
        this.canEditHeaders =
            this.whiteSpaceReport &&
            this.whiteSpaceReport.cellDisplayType === 'tiles' &&
            this.permissions &&
            this.permissions.canUpdate;
        this.canCreateDataTypes = this.permissions && this.permissions.canUpdate && this.dataTypeCreatable;
        this.canDelete = this.permissions && this.permissions.canDelete && !this.hiddenHeaderItems.includes('delete');
    }

    updateSize() {
        const isTileCell = this.whiteSpaceReport && this.whiteSpaceReport.cellDisplayType === 'tiles';

        this.tileSize = isTileCell ? ZOOM_TILE_RANGE[this.zoomIndex] : ZOOM_SUMMARY_RANGE[this.zoomIndex];
    }

    async initializeTableData(whiteSpaceReport) {
        if (!this.dataInitialized) {
            await this.setFilters();
            this.amountTypes = this.normalizeAmountTypes(whiteSpaceReport.amountTypes);
            this.setVisibleAmountTypes();
            await this.loadHighlights();
        }

        this.columns = this.normalizeColumnData(whiteSpaceReport.columns);
        this.cells = this.normalizeCellData(whiteSpaceReport.cells);
        this.rows = this.normalizeRowData(whiteSpaceReport.rows);

        if (this.visibleColumns.length) {
            this.updateData('visibleColumns', 'columns');
        } else {
            this.appendData('visibleColumns', 'columns');
        }
        if (this.visibleRows.length) {
            this.updateData('visibleRows', 'rows');
        } else {
            this.appendData('visibleRows', 'rows');
        }
        this.rowFilterChanged(this.filterData);
        this.columnFilterChanged(this.filterData);

        if (!this.dataInitialized) {
            this.dataInitialized = true;
        }
    }

    async setFilters() {
        try {
            this.filterData = await getFilters({ whitespaceId: this.whiteSpaceReport.id });
            this.hiddenHighlights = [...this.filterData.hiddenHighlights];
            this.hiddenAmountTypes = [...this.filterData.hiddenAmountTypes];
            this.hiddenColumns = [...this.filterData.hiddenColumns];
            this.hiddenRows = [...this.filterData.hiddenRows];
        } catch (error) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'error',
                    message: reduceErrors(error)[0],
                    variant: 'error',
                    mode: 'pester'
                })
            );
        }
    }

    setVisibleAmountTypes() {
        let visibleTypes = {};

        this.amountTypes.forEach((item) => {
            if (this.hiddenAmountTypes.indexOf(item.Id) === -1) {
                visibleTypes[item.Id] = 'found';
            }
        });
        this.visibleAmountTypes = visibleTypes;
    }

    async getSummaryFormulas() {
        try {
            const summaryFormulas = await getSummaryFormulas({ whiteSpaceId: this.whiteSpaceReport.id });

            this.summaryFormulas = summaryFormulas;
        } catch (error) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'error',
                    message: reduceErrors(error)[0],
                    variant: 'error',
                    mode: 'pester'
                })
            );
        }
    }

    async getDataTypes() {
        try {
            const dataTypes = await getDataTypes({ whiteSpaceId: this.whiteSpaceReport.id });

            this.dataTypes = dataTypes;
        } catch (error) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'error',
                    message: reduceErrors(error)[0],
                    variant: 'error',
                    mode: 'pester'
                })
            );
        }
    }

    async loadHighlights() {
        try {
            const highlights = await getHighlights({ whiteSpaceId: this.whiteSpaceReport.id });

            this.highlights = highlights.map((item) => {
                const {
                    Id: id,
                    [WS_HIGHLIGHT_LABEL.fieldApiName]: label,
                    [WS_HIGHLIGHT_COLOR.fieldApiName]: color
                } = item;

                return {
                    id,
                    label,
                    color,
                    style: `background-color: ${color};`,
                    visible: this.hiddenHighlights.indexOf(id) === -1,
                    filtered: this.hiddenHighlights.indexOf(id) !== -1
                };
            });
        } catch (error) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'error',
                    message: reduceErrors(error)[0],
                    variant: 'error',
                    mode: 'pester'
                })
            );
        }
    }

    async getControllingFieldValuesForPicklistValue(
        objectApiName = '',
        dependFieldApiName = '',
        dependValueApiName = ''
    ) {
        let validControllingFieldValues = [];

        try {
            validControllingFieldValues = await getControllingFieldValuesForPicklistValue({
                objectApiName,
                dependFieldApiName,
                dependValueApiName
            });

            return validControllingFieldValues;
        } catch (error) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'error',
                    message: reduceErrors(error)[0],
                    variant: 'error',
                    mode: 'pester'
                })
            );
        }

        return validControllingFieldValues;
    }

    setTileVisibility() {
        this.rows = this.rows.map((row) => {
            const cells = row.cells.map((cell) => {
                const tiles = cell.tiles.map((tile) => {
                    const updatedTile = {
                        ...tile,
                        visible: this.isTileVisible(tile)
                    };

                    return updatedTile;
                });
                const updatedCell = {
                    ...cell,
                    tiles
                };

                return updatedCell;
            });
            const updatedRow = {
                ...row,
                cells
            };

            return updatedRow;
        });
        this.updateData('visibleRows', 'rows');
    }

    handleShowUnhighlightedChange(event) {
        const { showUnhighlighted } = event.detail;
        const previousFilters = { ...this.filterData };
        const updatedFilterData = { ...this.filterData, showUnhighlighted };

        this.filterData = updatedFilterData;
        this.setTileVisibility();

        updateFilters({ filtersData: updatedFilterData }).catch((error) => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'error',
                    message: reduceErrors(error)[0],
                    variant: 'error',
                    mode: 'pester'
                })
            );

            // Revert filters if error
            this.filterData = previousFilters;
            this.setTileVisibility();
        });
    }

    handleFiltersChange(event) {
        const { name, valuesHidden } = event.detail;

        // Storing copy of previous filters in case we run into an error saving them and need to rollback ui
        const previousFilters = { ...this.filterData };

        let updatedFilterData;

        switch (name) {
            case 'highlights': {
                this.hiddenHighlights = [...valuesHidden];
                updatedFilterData = { ...this.filterData, hiddenHighlights: [...valuesHidden] };
                this.highlightFilterChanged();
                break;
            }
            case 'rows': {
                let showUnpopulatedRows = true;
                let showPopulatedRows = true;

                if (valuesHidden.includes('||EmptyRows||')) {
                    showUnpopulatedRows = false;
                    valuesHidden.splice(valuesHidden.indexOf('||EmptyRows||'), 1);
                }
                if (valuesHidden.includes('||PopulatedRows||')) {
                    showPopulatedRows = false;
                    valuesHidden.splice(valuesHidden.indexOf('||PopulatedRows||'), 1);
                }
                this.hiddenRows = [...valuesHidden];
                updatedFilterData = {
                    ...this.filterData,
                    hiddenRows: [...valuesHidden],
                    showPopulatedRows,
                    showUnpopulatedRows
                };
                this.rowFilterChanged(updatedFilterData);
                break;
            }
            case 'columns': {
                let showUnpopulatedColumns = true;
                let showPopulatedColumns = true;

                if (valuesHidden.includes('||EmptyColumns||')) {
                    showUnpopulatedColumns = false;
                    valuesHidden.splice(valuesHidden.indexOf('||EmptyColumns||'), 1);
                }
                if (valuesHidden.includes('||PopulatedColumns||')) {
                    showPopulatedColumns = false;
                    valuesHidden.splice(valuesHidden.indexOf('||PopulatedColumns||'), 1);
                }
                this.hiddenColumns = [...valuesHidden];
                updatedFilterData = {
                    ...this.filterData,
                    hiddenColumns: [...valuesHidden],
                    showPopulatedColumns,
                    showUnpopulatedColumns
                };
                this.columnFilterChanged(updatedFilterData);
                break;
            }
            case 'amountTypes': {
                this.hiddenAmountTypes = [...valuesHidden];
                updatedFilterData = { ...this.filterData, hiddenAmountTypes: [...valuesHidden] };
                this.amountTypeFilterChanged();
                break;
            }
            default: {
                break;
            }
        }
        this.filterData = updatedFilterData;
        updateFilters({ filtersData: updatedFilterData }).catch((error) => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'error',
                    message: reduceErrors(error)[0],
                    variant: 'error',
                    mode: 'pester'
                })
            );

            // Revert filters if error
            this.filterData = previousFilters;
            this.hiddenHighlights = [...this.filterData.hiddenHighlights];
            this.hiddenAmountTypes = [...this.filterData.hiddenAmountTypes];
            this.hiddenColumns = [...this.filterData.hiddenColumns];
            this.hiddenRows = [...this.filterData.hiddenRows];
            this.highlightFilterChanged();
            this.rowFilterChanged(this.filterData);
            this.columnFilterChanged(this.filterData);
            this.amountTypeFilterChanged();
        });
    }

    normalizeAmountTypes(amountTypes = []) {
        if (Array.isArray(amountTypes) && amountTypes.length) {
            return amountTypes.map((at) => {
                return {
                    ...at,
                    visible: this.hiddenAmountTypes.indexOf(at.Id) === -1,
                    filtered: this.hiddenAmountTypes.indexOf(at.Id) !== -1
                };
            });
        }

        return [];
    }

    normalizeCellData(cells) {
        // Attach stateSelected, stateHovered, stateSiblingHighlighted, stateHeaderHighlighted properties
        // Attach colIndex and rowIndex
        this.rowIdsWithData = new Set();
        this.columnIdsWithData = new Set();
        if (Array.isArray(cells) && cells.length) {
            return cells.map((cell) => {
                const { columnId, rowId } = cell;
                let tileIds = [];
                let colIndex = -1;
                let rowIndex = -1;
                let stateHovered = false;
                let stateSiblingHighlighted = false;
                let stateHeaderHighlighted = false;
                let type = this.whiteSpaceReport.cellDisplayType;

                let _colRef = this.whiteSpaceReport.columns.find((item) => columnId === item.id);
                let _rowRef = this.whiteSpaceReport.rows.find((item) => rowId === item.id);

                if (_colRef) {
                    colIndex = _colRef.collection.pqcrush__Order__c;
                }
                if (_rowRef) {
                    rowIndex = _rowRef.collection.pqcrush__Order__c;
                }

                let hasData = false;
                const tiles = cell.tiles.map((tile) => {
                    const headerData =
                        tile.headerColor && tile.headerText
                            ? { title: tile.headerText, color: tile.headerColor, id: tile.headerAmountTypeId }
                            : null;

                    tileIds.push(tile.id);
                    const displayFields = this.normalizeDisplayFields(tile.displayFields);

                    hasData = tile.displayFields.some((df) => {
                        if (df.isInfoField) {
                            if (df.data.length > 0 && df.data[0].value.length > 0) {
                                return true;
                            }
                        } else {
                            return df.data.length > 0;
                        }

                        return false;
                    });
                    const infoText = displayFields[INFO_FIELD_KEY]?.data[0]?.value;

                    return {
                        ...tile,
                        infoText,
                        headerData,
                        stateSelected: this.selectedTileId === tile.id,
                        stateHovered,
                        displayFields,
                        visible: this.isTileVisible(tile)
                    };
                });

                if (hasData) {
                    this.columnIdsWithData.add(columnId);
                    this.rowIdsWithData.add(rowId);
                }

                return {
                    columnId,
                    tileIds,
                    rowId,
                    colIndex,
                    rowIndex,
                    tiles,
                    type,
                    stateSiblingHighlighted,
                    stateHeaderHighlighted
                };
            });
        }

        return [];
    }

    normalizeDisplayFields(displayFields = []) {
        const displayFieldMap = {};

        displayFields.forEach((df) => {
            const data = df.data.map((item) => {
                const formattedValue = formatDataValue(item.value, df.type);
                const updatedItem = {
                    ...item,
                    value: formattedValue
                };

                return updatedItem;
            });

            const formattedDf = {
                ...df,
                data: [...data]
            };

            const key = df.isInfoField ? INFO_FIELD_KEY : df.id;
            const existingDf = displayFieldMap[key];

            displayFieldMap[key] = existingDf
                ? { ...existingDf, data: [...existingDf.data, ...formattedDf.data] }
                : { ...formattedDf };
        });

        return displayFieldMap;
    }

    normalizeColumnData(columns) {
        // Attach 'headerCollapsed' state boolean
        // Attach 'stateHeaderHighlighted' state
        // Attach 'childIds' collection to Parent objects
        // Future: Attach 'childObjectIds' collection to Parent with list of child collection reference object Ids

        const columnChildIdsMap = this.groupBy(columns, 'parentObjectId', 'relatedObjectId');
        const objectToColumnMap = columns.reduce((currentMap, column) => {
            if (column.relatedObjectId) {
                currentMap[column.relatedObjectId] = column.id;
            }

            return currentMap;
        }, {});

        this.allColumnIds = new Set();
        if (Array.isArray(columns) && columns.length) {
            return columns.map((col) => {
                let mapRef = this.recursivelyGetChildren(columnChildIdsMap, [], col.relatedObjectId, objectToColumnMap);

                if (mapRef && mapRef.length === 0) {
                    mapRef = null;
                }
                this.allColumnIds.add(col.id);

                return {
                    ...col,
                    headerCollapsed: col.parentObjectId !== undefined ? this._parentHeadersCollapsed : false,
                    stateHeaderHighlighted: false,
                    childIds: col.parentObjectId ? null : mapRef,
                    visible: this.hiddenColumns.indexOf(col.id) === -1,
                    filtered: this.hiddenColumns.indexOf(col.id) !== -1
                };
            });
        }

        return [];
    }

    normalizeRowData(rows) {
        // Attach 'headerCollapsed' state boolean
        // Attach 'stateHeaderHighlighted' state
        // Attach 'childIds' collection to Parent objects
        // Future: Attach 'childObjectIds' collection to Parent with list of child collection reference object Ids

        const cellsByRowMap = this.groupBy(this.cells, 'rowId');
        const rowChildIdsMap = this.groupBy(rows, 'parentObjectId', 'relatedObjectId');
        const objectToRowMap = rows.reduce((currentMap, row) => {
            if (row.relatedObjectId) {
                currentMap[row.relatedObjectId] = row.id;
            }

            return currentMap;
        }, {});

        this.allRowIds = new Set();
        if (Array.isArray(rows) && rows.length) {
            return rows.map((row) => {
                const cells = cellsByRowMap[row.id];
                let mapRef = this.recursivelyGetChildren(rowChildIdsMap, [], row.relatedObjectId, objectToRowMap);

                if (mapRef && mapRef.length === 0) {
                    mapRef = null;
                }
                this.allRowIds.add(row.id);

                return {
                    ...row,
                    cells,
                    headerCollapsed: row.parentObjectId !== undefined ? this._parentHeadersCollapsed : false,
                    stateHeaderHighlighted: false,
                    childIds: row.parentObjectId ? null : mapRef,
                    visible: this.hiddenRows.indexOf(row.id) === -1,
                    filtered: this.hiddenRows.indexOf(row.id) !== -1
                };
            });
        }

        return [];
    }

    recursivelyGetChildren(childMap, currentList, currentId, lookupMap) {
        if (!childMap || !Object.keys(childMap).length || !lookupMap || !Object.keys(lookupMap).length) {
            return currentList;
        }
        let listToAdd = childMap[currentId];

        if (!listToAdd || listToAdd.length === 0) {
            return currentList;
        }
        for (let i = 0; i < listToAdd.length; i++) {
            let nextId = listToAdd[i];

            currentList.push(lookupMap[nextId]);
            if (nextId === currentId) {
                continue;
            }
            currentList = this.recursivelyGetChildren(childMap, currentList, nextId, lookupMap);
        }

        return currentList;
    }

    loadMoreColumnsHandler() {
        this.appendData('visibleColumns', 'columns');
    }

    loadMoreRowsHandler() {
        this.appendData('visibleRows', 'rows');
    }

    appendData(visibleDataArray, fullDataArray) {
        const begin = this[visibleDataArray].length;

        let newData = [];
        let recordsLoaded = 0;
        let index = begin;
        let fullArray = this[fullDataArray];

        while (recordsLoaded <= this.recordsPerLoad && index < fullArray.length) {
            let item = fullArray[index];

            if (item.visible) {
                recordsLoaded++;
            }
            newData.push(item);
            index++;
        }

        this[visibleDataArray] = [...this[visibleDataArray], ...newData];
    }

    groupBy(objectArray, property, returnFieldPath) {
        return objectArray.reduce(function (acc, obj) {
            var key = obj[property];

            if (!key) {
                return acc;
            }
            if (!acc[key]) {
                acc[key] = [];
            }
            if (returnFieldPath !== undefined) {
                // Faster, but offends eslint's delicate sensibilities on using Eval
                // Let getter = new Function("obj", "return obj." + returnFieldPath + ";");
                let val = WhiteSpaceReportLwc.getNestedProperty(obj, returnFieldPath);

                acc[key].push(val);
            } else {
                acc[key].push(obj);
            }

            return acc;
        }, {});
    }

    static getNestedProperty(objectArray, path, separator) {
        try {
            separator = separator || '.';

            return path
                .replace('[', separator)
                .replace(']', '')
                .split(separator)
                .reduce(function (obj, property) {
                    return obj[property];
                }, objectArray);
        } catch (err) {
            return undefined;
        }
    }

    updateData(visibleDataArray, fullDataArray) {
        let visibleData = [...this[fullDataArray].slice(0, this[visibleDataArray].length)];

        this[visibleDataArray] = visibleData;
    }

    handleCellSelectedEvent(event) {
        this._sellectedCellElementRef = event.detail;
        const { rowId, columnId, tileId } = event.detail;

        this.handleCellSelected(rowId, columnId, tileId);
    }

    handleCellSelected(rowId, columnId, tileId) {
        const rowObj = this.rows.find((item) => item.id === rowId);
        const selectedCellObj = rowObj ? rowObj.cells.find((item) => item.columnId === columnId) : null;

        if (selectedCellObj) {
            const selectedTileObj = selectedCellObj ? selectedCellObj.tiles.find((item) => item.id === tileId) : null;

            // Check if the current cell is already selected.  Hide panel if so, and deselect cell.
            if (selectedTileObj.stateSelected === true) {
                selectedTileObj.stateSelected = false;
                this.selectedCellColumnId = null;
                this.selectedCellRowId = null;
                this.selectedTileId = null;
                this._sellectedCellElementRef = null;
                this.closePanel();

                return;
            }

            // First deselect prior selected cell
            const priorTileObj = this.getCurrentlySelectedTile();

            if (priorTileObj) {
                priorTileObj.stateSelected = false;
            }

            // Set new cell selection
            this.selectedCellColumnId = selectedCellObj.columnId;
            this.selectedCellRowId = selectedCellObj.rowId;
            this.selectedTileId = tileId;

            selectedTileObj.stateSelected = true;
            selectedTileObj.dataTypes = this.dataTypes;
            const columnMapping = this.whiteSpaceReport?.template?.columnConfiguration?.mapping;
            const rowMapping = this.whiteSpaceReport?.template?.rowConfiguration?.mapping;
            const columnObj = this.columns.find((item) => item.id === selectedCellObj.columnId);
            const rowObjIds = rowObj?.groupedRelatedRecordIds?.length
                ? rowObj.groupedRelatedRecordIds
                : [rowObj.relatedObjectId];
            const columnObjIds = columnObj?.groupedRelatedRecordIds?.length
                ? columnObj.groupedRelatedRecordIds
                : [columnObj.relatedObjectId];

            this.panelData = {
                isFreeForm: !this.whiteSpaceReport.templatedCells,
                columnId: selectedCellObj.columnId,
                columnHeaderLabel: columnMapping ? columnMapping.objectLabel : null,
                columnHeaderValue: columnObj.name,
                columnObjectIds: columnObjIds,
                rowId: selectedCellObj.rowId,
                rowHeaderLabel: rowMapping ? rowMapping.objectLabel : null,
                rowHeaderValue: rowObj.name,
                rowObjectIds: rowObjIds,
                notes: selectedTileObj.displayFields[INFO_FIELD_KEY],
                tileObject: selectedTileObj
            };
        }
    }

    getCurrentlySelectedTile() {
        if (!this.selectedCellRowId || !this.selectedCellColumnId) {
            return null;
        }
        const priorRowObj = this.rows.find((item) => item.id === this.selectedCellRowId);
        const priorCellObj = priorRowObj
            ? priorRowObj.cells.find((item) => item.columnId === this.selectedCellColumnId)
            : null;

        return priorCellObj ? priorCellObj.tiles.find((item) => item.id === this.selectedTileId) : null;
    }

    handlePanelClose() {
        const priorTileObj = this.getCurrentlySelectedTile();

        if (priorTileObj) {
            priorTileObj.stateSelected = false;
        }
        this.selectedCellColumnId = null;
        this.selectedCellRowId = null;
        this.selectedTileId = null;
        this._sellectedCellElementRef = null;
        this.closePanel();
    }

    closePanel() {
        this.panelData = null;
    }

    async handleCreateRecord(event) {
        const { objectApiName, relatedObjects, accountRelationships, navigationLocation } = event.detail;
        accountRelationships?.forEach((field) => {
            if (!hasKey(relatedObjects, [field])) {
                relatedObjects[field] = this.whiteSpaceReport.accountPlan.pqcrush__Account__c;
            }
        });

        if (this.whiteSpaceReport.template?.rowConfiguration?.usePicklistDependency) {
            const { objectName, valueFieldName, valueFieldInfo } =
                this.whiteSpaceReport.template.rowConfiguration.mapping;
            const controllingFieldName = valueFieldInfo?.controllingFieldName;

            if (controllingFieldName) {
                const validControllingFieldValues = await this.getControllingFieldValuesForPicklistValue(
                    objectName,
                    valueFieldName,
                    relatedObjects[valueFieldName]
                );

                relatedObjects[controllingFieldName] = validControllingFieldValues[0] || '';
            }
        }

        if (this.whiteSpaceReport.template?.columnConfiguration?.usePicklistDependency) {
            const { objectName, valueFieldName, valueFieldInfo } =
                this.whiteSpaceReport.template.columnConfiguration.mapping;
            const controllingFieldName = valueFieldInfo?.controllingFieldName;

            if (controllingFieldName) {
                const validControllingFieldValues = await this.getControllingFieldValuesForPicklistValue(
                    objectName,
                    valueFieldName,
                    relatedObjects[valueFieldName]
                );

                relatedObjects[controllingFieldName] = validControllingFieldValues[0] || '';
            }
        }

        let transparentLayer = this.template.querySelector("[data-name='transparent-layer']");

        transparentLayer.setAttribute('class', 'transparent-layer');

        if (this.isClassic) {
            this.dispatchEvent(
                new CustomEvent('createclassic', {
                    detail: { objectApiName, relatedObjects }
                })
            );
        } else {
            this.template
                .querySelector('c-event-navigation')
                .invokeNewRecordEvent(objectApiName, relatedObjects, navigationLocation, 'new', null);
        }
    }

    handleRecordCreated(event) {
        this.dispatchEvent(
            new CustomEvent('recordcreated', {
                detail: event.detail
            })
        );
    }

    getWsAndTileForUpdate(tileId) {
        const wsCopy = JSON.parse(JSON.stringify(this.whiteSpaceReport));
        const cellToUpdate = this.cells.find((cell) => cell.tileIds.includes(tileId));
        const targetCellObj = wsCopy.cells.find(
            (item) => item.rowId === cellToUpdate.rowId && item.columnId === cellToUpdate.columnId
        );
        const targetTileObj = targetCellObj.tiles.find((tile) => tile.id === tileId);

        return { whiteSpace: wsCopy, targetTileObj };
    }

    handleUpdateInfo(event) {
        const { tileId, infoField } = event.detail;
        const { whiteSpace, targetTileObj } = this.getWsAndTileForUpdate(tileId);
        const displayFieldToUpdate = targetTileObj.displayFields.find((df) => df.isInfoField);

        displayFieldToUpdate.data[0].value = infoField.value;
        this.updateWsTile(whiteSpace, targetTileObj);
    }

    handleUpdateHighlight(event) {
        const { tileId, highlightId } = event.detail;

        setHighlight({ cellId: tileId, highlightId }).then((highlight) => {
            const { whiteSpace, targetTileObj } = this.getWsAndTileForUpdate(tileId);

            targetTileObj.highlight = highlight;
            this.handleWhiteSpaceUpdate(whiteSpace);
        });
    }

    handleUpdateDataTypeValue(event) {
        const { tileId, dataTypeId, dataTypeLabel, value, color } = event.detail;

        saveDataForCell({ cellId: tileId, dataTypeId, value }).then((id) => {
            const { whiteSpace, targetTileObj } = this.getWsAndTileForUpdate(tileId);

            if (targetTileObj.dataTypeValues) {
                let dataTypeValueToUpdate = targetTileObj.dataTypeValues.find((dtv) => dtv.dataTypeId === dataTypeId);

                if (dataTypeValueToUpdate) {
                    dataTypeValueToUpdate.value = value;
                } else {
                    targetTileObj.dataTypeValues.push({ id, dataTypeId, dataTypeLabel, value, color });
                }
            }
            this.handleWhiteSpaceUpdate(whiteSpace);
        });
    }

    handleEditRecord(event) {
        getAccessForObject({ recordId: event.detail.recordId })
            .then((result) => {
                event.detail.access = result;
                const createRecordEvent = new CustomEvent('editrecord', {
                    detail: event.detail
                });

                this.dispatchEvent(createRecordEvent);
            })
            .catch((error) => {
                this.handleError(error);
            });
    }

    handleCreateCell(event) {
        // Find hovered cell
        const { rowId, columnId } = event.detail;

        event.detail.showSpinner();

        createWhiteSpaceTile({
            columnId: columnId,
            rowId: rowId,
            whiteSpaceId: this.whiteSpaceReport.id
        })
            .then((result) => {
                const ws = JSON.parse(JSON.stringify(this.whiteSpaceReport));
                const targetCellObj = ws.cells.find((item) => item.columnId === columnId && item.rowId === rowId);

                targetCellObj.tiles.push(result);
                this.handleWhiteSpaceUpdate(ws);
            })
            .catch((error) => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'error',
                        message: reduceErrors(error)[0],
                        variant: 'error',
                        mode: 'pester'
                    })
                );
            })
            .then(() => {
                event.detail.hideSpinner();
            });
    }

    handleTileDeleted(event) {
        const { tileId } = event.detail;
        const panelElement = this.template.querySelector('c-ws-cell-panel-content');

        panelElement.showSpinner();
        this._sellectedCellElementRef.showSpinner();
        deleteWhiteSpaceTile({ tileId })
            .then(() => {
                const cellToUpdate = this.cells.find((cell) => cell.tileIds.includes(tileId));
                const ws = JSON.parse(JSON.stringify(this.whiteSpaceReport));
                const targetCellObj = ws.cells.find(
                    (item) => item.columnId === cellToUpdate.columnId && item.rowId === cellToUpdate.rowId
                );

                targetCellObj.tiles = targetCellObj.tiles.filter((tile) => tile.id !== tileId);
                this.handleWhiteSpaceUpdate(ws);
                this.handlePanelClose();
            })
            .catch((error) => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'error',
                        message: reduceErrors(error)[0],
                        variant: 'error',
                        mode: 'pester'
                    })
                );
                panelElement.hideSpinner();
                this._sellectedCellElementRef.hideSpinner();
            });
    }

    handleFreeformTileDataChanged(event) {
        const { dataId, displayFieldId, tileId, updatedValue, updatedPrimaryDisplayField } = event.detail;
        const { whiteSpace, targetTileObj } = this.getWsAndTileForUpdate(tileId);

        if (displayFieldId) {
            const targetDisplayField = targetTileObj.displayFields.find((df) => df.id === displayFieldId);

            if (dataId) {
                const targetDataObj = targetDisplayField.data.find((data) => data.objectId === dataId);

                targetDataObj.value = updatedValue;
            } else {
                targetDisplayField.data.push({ value: updatedValue });
            }
            targetDisplayField.data = targetDisplayField.data.filter(function (dataItem) {
                return dataItem.value !== 0 || dataItem.objectId !== null; // Only include items with a value or that pre-existed
            });
        }
        if (updatedPrimaryDisplayField) {
            targetTileObj.displayFields.forEach((df) => {
                df.isPrimary = df.id === updatedPrimaryDisplayField;
            });
        }
        this.updateWsTile(whiteSpace, targetTileObj);
    }

    updateWsTile(ws, targetTileObj) {
        const panelElement = this.template.querySelector('c-ws-cell-panel-content');

        panelElement.showSpinner();
        this._sellectedCellElementRef.showSpinner();
        updateWhiteSpaceTile({ wrapper: targetTileObj, whiteSpaceId: ws.id })
            .then((returnedTile) => {
                targetTileObj.headerAmountTypeId = returnedTile.headerAmountTypeId;
                targetTileObj.headerColor = returnedTile.headerColor;
                targetTileObj.headerText = returnedTile.headerText;
                targetTileObj.dataTypeValues = returnedTile.dataTypeValues;
                targetTileObj.displayFields = returnedTile.displayFields;

                this.panelData = {
                    ...this.panelData,
                    tileObject: {
                        ...this.panelData.tileObject,
                        ...targetTileObj,
                        displayFields: this.normalizeDisplayFields(targetTileObj.displayFields)
                    }
                };
                this.handleWhiteSpaceUpdate(ws);
            })
            .catch((error) => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'error',
                        message: reduceErrors(error)[0],
                        variant: 'error',
                        mode: 'pester'
                    })
                );
            })
            .then(() => {
                panelElement.hideSpinner();
                this._sellectedCellElementRef.hideSpinner();
            });
    }

    // --------------------------------------------------

    handleParentHeaderToggled(event) {
        // Toggle the headerCollapsed property on all child headers under the parent that fired this event
        let _index, _coll;

        if (event.detail.parentColumnIndex !== undefined) {
            _index = event.detail.parentColumnIndex;
            _coll = this.columns;
        }
        if (event.detail.parentRowIndex !== undefined) {
            _index = event.detail.parentRowIndex;
            _coll = this.rows;
        }
        if (_coll[_index].childIds !== undefined && _coll[_index].childIds.length > 0) {
            for (let i = 0; i < _coll[_index].childIds.length; i++) {
                let _ref = _coll.find((c) => _coll[_index].childIds[i] === c.id);

                _ref.headerCollapsed = !_ref.headerCollapsed;
            }
        }

        this.visibleRows = [...this.visibleRows];
        this.visibleColumns = [...this.visibleColumns];
    }

    handleToggleAllParents() {
        // Reset all child headers to _parentHeadersCollapsed property
        this._parentHeadersCollapsed = !this._parentHeadersCollapsed;

        for (let i = 0; i < this.columns.length; i++) {
            if (this.columns[i].headerCollapsed !== undefined && this.columns[i].parentObjectId !== undefined) {
                this.columns[i].headerCollapsed = this._parentHeadersCollapsed;
            }
        }

        for (let i = 0; i < this.rows.length; i++) {
            if (this.rows[i].headerCollapsed !== undefined && this.rows[i].parentObjectId !== undefined) {
                this.rows[i].headerCollapsed = this._parentHeadersCollapsed;
            }
        }

        this.visibleRows = [...this.visibleRows];
        this.visibleColumns = [...this.visibleColumns];
    }

    // --------------------------------------------------

    handleCellHighlight(event) {
        // Find hovered cell
        let { rowId, columnId, rowIndex, colIndex, tileId } = event.detail;
        let targetRowId = this.rows.find((item) => item.id === rowId);
        let targetCellObj = targetRowId ? targetRowId.cells.find((item) => item.columnId === columnId) : null;
        let targetTileObj = targetCellObj ? targetCellObj.tiles.find((item) => item.id === tileId) : null;

        if (targetTileObj) {
            targetTileObj.stateHovered = true;
        }

        // Find siblings (same rowIndex or colIndex) to highlight
        let _columnSiblings = this.cells.filter(function (item) {
            return item.colIndex === colIndex;
        });
        let _rowSiblings = this.cells.filter(function (item) {
            return item.rowIndex === rowIndex;
        });

        for (let i = 0; i < _columnSiblings.length; i++) {
            _columnSiblings[i].stateSiblingHighlighted = true;
        }

        for (let i = 0; i < _rowSiblings.length; i++) {
            _rowSiblings[i].stateSiblingHighlighted = true;
        }

        // Highlight headers
        this.rows[rowIndex].stateHeaderHighlighted = true;
        this.columns[colIndex].stateHeaderHighlighted = true;
    }

    handleCellUnHighlight(event) {
        // Find unhovered cell
        let { rowId, columnId, rowIndex, colIndex, tileId } = event.detail;
        let targetRowId = this.rows.find((item) => item.id === rowId);
        let targetCellObj = targetRowId ? targetRowId.cells.find((item) => item.columnId === columnId) : null;
        let targetTileObj = targetCellObj ? targetCellObj.tiles.find((item) => item.id === tileId) : null;

        if (targetTileObj) {
            targetTileObj.stateHovered = false;
        }

        // Find siblings (same rowIndex or colIndex) to highlight
        let _columnSiblings = this.cells.filter(function (item) {
            return item.colIndex === colIndex;
        });
        let _rowSiblings = this.cells.filter(function (item) {
            return item.rowIndex === rowIndex;
        });

        for (let i = 0; i < _columnSiblings.length; i++) {
            _columnSiblings[i].stateSiblingHighlighted = false;
        }

        for (let i = 0; i < _rowSiblings.length; i++) {
            _rowSiblings[i].stateSiblingHighlighted = false;
        }

        // Highlight headers
        this.rows[rowIndex].stateHeaderHighlighted = false;
        this.columns[colIndex].stateHeaderHighlighted = false;
    }

    // --------------------------------------------------

    handleParentHeaderHighlighted(event) {
        this.setCellHeaderHighlightState(event, true);
    }

    handleParentHeaderUnHighlighted(event) {
        this.setCellHeaderHighlightState(event, false);
    }

    setCellHeaderHighlightState(event, highlighted) {
        // Find cells under header or header's children to highlight
        let _collProp = 'columnId';
        let _coll;

        if (event.detail.dimension === 'column') {
            _collProp = 'columnId';
            _coll = this.columns;
            _coll[event.detail.parentColumnIndex].stateHeaderHighlighted = highlighted;
        }

        if (event.detail.dimension === 'row') {
            _collProp = 'rowId';
            _coll = this.rows;
            _coll[event.detail.parentRowIndex].stateHeaderHighlighted = highlighted;
        }

        let _cells = this.cells.filter(function (item) {
            return item[_collProp] === event.detail.parentHeaderObject.id;
        });

        if (event.detail.parentHeaderObject.childIds && event.detail.parentHeaderObject.childIds.length > 0) {
            for (let i = 0; i < event.detail.parentHeaderObject.childIds.length; i++) {
                // Gather additional cells from the child headers
                _cells = _cells.concat(
                    this.cells.filter(function (item) {
                        return item[_collProp] === event.detail.parentHeaderObject.childIds[i];
                    })
                );

                // Highlight the child headers
                let _childHeaders = _coll.filter(function (item) {
                    return item.id === event.detail.parentHeaderObject.childIds[i];
                });

                for (let j = 0; j < _childHeaders.length; j++) {
                    _childHeaders[j].stateHeaderHighlighted = highlighted;
                }
            }
        }

        // Run through final collection of cells to flip their state
        for (let i = 0; i < _cells.length; i++) {
            _cells[i].stateHeaderHighlighted = highlighted;
        }
    }

    // --------------------------------------------------

    // FILTER STUFF
    highlightFilterChanged() {
        this.highlights = this.highlights.map((item) => {
            return {
                ...item,
                visible: this.hiddenHighlights.indexOf(item.id) === -1,
                filtered: this.hiddenHighlights.indexOf(item.id) !== -1
            };
        });
        this.setTileVisibility();
    }

    amountTypeFilterChanged() {
        this.amountTypes = this.amountTypes.map((at) => {
            return {
                ...at,
                visible: this.hiddenAmountTypes.indexOf(at.Id) === -1,
                filtered: this.hiddenAmountTypes.indexOf(at.id) !== -1
            };
        });
        this.setVisibleAmountTypes();
    }

    rowFilterChanged(filterData) {
        let hiddenItems = new Set(this.hiddenRows);

        if (!filterData.showUnpopulatedRows && !filterData.showPopulatedRows) {
            hiddenItems = new Set(this.allRowIds);
        } else if (!filterData.showPopulatedRows) {
            hiddenItems = union(hiddenItems, this.rowIdsWithData);
        } else if (!filterData.showUnpopulatedRows) {
            let unpopulated = difference(this.allRowIds, this.rowIdsWithData);

            hiddenItems = union(hiddenItems, unpopulated);
        }
        this.rows = this.rows.map((row) => {
            return {
                ...row,
                visible: !hiddenItems.has(row.id),
                filtered: this.hiddenRows.indexOf(row.id) !== -1
            };
        });
        this.updateData('visibleRows', 'rows');
    }

    columnFilterChanged(filterData) {
        let hiddenItems = new Set(this.hiddenColumns);

        if (!filterData.showUnpopulatedColumns && !filterData.showPopulatedColumns) {
            hiddenItems = new Set(this.allColumnIds);
        } else if (!filterData.showPopulatedColumns) {
            hiddenItems = union(hiddenItems, this.columnIdsWithData);
        } else if (!filterData.showUnpopulatedColumns) {
            let unpopulated = difference(this.allColumnIds, this.columnIdsWithData);

            hiddenItems = union(hiddenItems, unpopulated);
        }
        this.columns = this.columns.map((column) => {
            return {
                ...column,
                visible: !hiddenItems.has(column.id),
                filtered: this.hiddenColumns.indexOf(column.id) !== -1
            };
        });
        this.updateData('visibleColumns', 'columns');
    }

    handleWhiteSpaceUpdate(whiteSpace) {
        const evt = new CustomEvent('whitespaceupdated', {
            detail: { whiteSpace }
        });

        this.dispatchEvent(evt);
    }

    handleZoomOut() {
        this.zoomIndex--;
        if (this.zoomIndex < 0) {
            this.zoomIndex = 0;
        }
        this.updateZoom(this.zoomIndex);
        this.updateSize();
    }

    handleZoomIn() {
        this.zoomIndex++;
        if (this.zoomIndex > ZOOM_MAX_INDEX) {
            this.zoomIndex = ZOOM_MAX_INDEX;
        }
        this.updateZoom(this.zoomIndex);
        this.updateSize();
    }

    handleEnterFullScreen() {
        const container = this.template.querySelector('.pq-container');

        container.classList.add('fullScreen');
    }

    handleExitFullScreen() {
        const container = this.template.querySelector('.pq-container');

        container.classList.remove('fullScreen');
    }

    handleMenuActionSelected(event) {
        const menuAction = event.detail.value;
        let modal;

        switch (menuAction) {
            case 'formula':
                modal = this.template.querySelector('c-lds-record-w-s-formula');
                modal.isModalOpen = true;
                break;
            case 'datatype':
                modal = this.template.querySelector('c-data-type-modal');
                modal.show();
                break;
            default:
                break;
        }

        this.dispatchEvent(
            new CustomEvent('menuactionselected', {
                detail: {
                    value: menuAction
                }
            })
        );
    }

    handleFormulaCreated() {
        this.getSummaryFormulas();
    }

    handleDataTypeCreated() {
        this.getDataTypes();
        this.dispatchEvent(new CustomEvent('datatypecreated', {}));
    }

    isTileVisible(tile) {
        if (tile.highlight) {
            const notInHiddenList = this.hiddenHighlights.indexOf(tile.highlight.Id) === -1;

            return notInHiddenList;
        }

        return this.filterData.showUnhighlighted;
    }

    handleOpenFilterPopover() {
        this.template.querySelector('c-panel')?.close();
    }

    passthroughEvent(event) {
        const passedEvent = new CustomEvent(event.type, {
            detail: event.detail
        });

        // Dispatches the event.
        this.dispatchEvent(passedEvent);
    }

    transparencylLayerClicked(event) {
        event.target.setAttribute('class', 'slds-hide');
        this.dispatchEvent(new CustomEvent('refresh'));
    }

    showNotification(title, message, variant) {
        const evt = new ShowToastEvent({ title, message, variant });

        this.dispatchEvent(evt);
    }
}