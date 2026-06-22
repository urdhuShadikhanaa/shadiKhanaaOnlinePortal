import { LightningElement, api, track } from 'lwc';

export default class WsTableCellSummary extends LightningElement {
    @track displayFields;

    @track allDisplayFieldsFormatted = [];

    @track displayFieldsTrimmed = [];

    @track tile = {};

    @track cellNotes = '';

    @api row;

    @api column;

    @api rowIndex;

    @api colIndex;

    displayFieldCount = 0;

    displayFieldMaxDisplay = 4;

    displayFieldMore = false;

    displayFieldMoreCount = 0;

    isEmpty = true;

    privateCell;

    cellId = '';

    _visibleAmountTypes;

    _tileSize;

    @api
    set visibleAmountTypes(data) {
        this._visibleAmountTypes = data;
        this.processDisplayFields();
    }

    get visibleAmountTypes() {
        return this._visibleAmountTypes;
    }

    @api
    set tileSize(data) {
        this._tileSize = data;
        this.displayFieldMaxDisplay = Math.floor((data - 50) / 25); // Currently we fit 4 fields in a space of 150px and they're 25px high each
        this.setupDisplayDataForDisplayFieldArray(this.allDisplayFieldsFormatted);
    }

    get tileSize() {
        return this._tileSize;
    }

    @api
    set cell(cellData) {
        this.privateCell = cellData;
        this.tile = cellData.tiles[0];
        this.cellNotes = this.tile.infoText;
        this.processDisplayFields();
    }

    get cell() {
        return this.privateCell;
    }

    processDisplayFields() {
        this.displayFields = Object.values(this.privateCell.tiles[0].displayFields);
        this.cellId = this.privateCell.tiles[0].id;

        const dataTypeField = [];

        // Add Data Type Values
        this.cell.tiles[0].dataTypeValues?.forEach((item) => {
            if (item.value) {
                dataTypeField.push({
                    id: item.id,
                    type: 'text',
                    color: item.color ?? '#666666',
                    data: [{ value: item.value }]
                });
            }
        });

        // //Clean through display fields to pull only entries that contain data
        const displayFieldsToShow = this.displayFields.filter((field) => {
            if (field.fieldType === 'info' || field.data.length === 0) {
                return false;
            }

            if (field.fieldType === 'amountType') {
                return this.visibleAmountTypes?.[field.id];
            }

            return true;
        });

        this.allDisplayFieldsFormatted = [...dataTypeField, ...displayFieldsToShow];
        this.setupDisplayDataForDisplayFieldArray(this.allDisplayFieldsFormatted);
    }

    setupDisplayDataForDisplayFieldArray(displayFieldArray) {
        // Full count
        this.displayFieldCount = displayFieldArray.length;

        // Trim down for display
        this.displayFieldsTrimmed = displayFieldArray.slice(0, this.displayFieldMaxDisplay);

        this.displayFieldMore = this.displayFieldCount > this.displayFieldMaxDisplay;
        if (this.displayFieldMore) {
            this.displayFieldMoreCount = this.displayFieldCount - this.displayFieldMaxDisplay;
        }

        this.isEmpty = displayFieldArray.length === 0;
    }
}