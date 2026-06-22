import { LightningElement, api } from 'lwc';

export default class WsTableCellTile extends LightningElement {
    displayFields;

    displayFieldsTrimmed = [];

    note = '';

    @api tileCount = 1;

    @api row;

    @api column;

    @api rowIndex;

    @api colIndex;

    displayFieldCount = 0;

    displayFieldMaxDisplay = 4;

    displayFieldMore = false;

    displayFieldMoreCount = 0;

    displayDataTypeValues = [];

    isEmpty = true;

    showHeader = false;

    @api
    set visibleAmountTypes(data) {
        this._visibleAmountTypes = data;
        this.processDisplayFields();
    }

    get visibleAmountTypes() {
        return this._visibleAmountTypes;
    }

    _visibleAmountTypes;

    @api
    set tile(tileData) {
        this._tile = tileData;
        this.note = this.tile.infoText;
        this.processDisplayFields();
    }

    get tile() {
        return this._tile;
    }

    _tile = {};

    get tileClass() {
        let style = 'ws-tile-main';

        if (this.tile.stateSelected) {
            style += ' ws-tile-main-selected';

            return style;
        }

        return style;
    }

    @api
    set cell(cellData) {
        this._cell = cellData;
    }

    get cell() {
        return this._cell;
    }

    _cell = {};

    get hideNote() {
        return !this.note || this.note.length === 0;
    }

    processDisplayFields() {
        var i = 0;

        this.displayFields = Object.values(this.tile.displayFields);

        let tempArray = [];

        this.showHeader = false;

        // Clean through display fields to pull only entries that contain data
        for (i = 0; i < this.displayFields.length; i++) {
            let _keep = true;

            if (this.displayFields[i].isInfoField) {
                _keep = false;
            } else if (this.displayFields[i].data.length === 0) {
                _keep = false;
            } else if (
                this._visibleAmountTypes &&
                this.displayFields[i].id &&
                this.displayFields[i].fieldType === 'amountType' &&
                !this._visibleAmountTypes[this.displayFields[i].id]
            ) {
                _keep = false;
            }

            if (this.displayFields[i].isPrimary && this._visibleAmountTypes) {
                this.showHeader = !!this._visibleAmountTypes[this.displayFields[i].id];
            }

            if (_keep) {
                tempArray.push(this.displayFields[i]);
            }
        }

        // Full count
        this.displayFieldCount = tempArray.length;
        this.isEmpty = tempArray.length === 0;

        // Trim down for display
        this.displayFieldsTrimmed = tempArray.slice(0, this.displayFieldMaxDisplay);

        this.displayFieldMore = this.displayFieldCount > this.displayFieldMaxDisplay;
        if (this.displayFieldMore) {
            this.displayFieldMoreCount = this.displayFieldCount - this.displayFieldMaxDisplay;
        }

        let count = 0;
        let dtValues = [];

        if (this.tile.dataTypeValues) {
            this.tile.dataTypeValues.forEach((item) => {
                if (item.value) {
                    dtValues.push({ id: count++, name: item.dataTypeLabel, value: item.value });
                }
            });
        }

        this.displayDataTypeValues = dtValues;
    }
}