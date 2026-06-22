import { LightningElement, api } from 'lwc';

import LABEL_ADD from '@salesforce/label/c.Add';

export default class wsTableCellTileGroup extends LightningElement {
    @api row;

    @api column;

    @api rowIndex;

    @api colIndex;

    @api canAddTiles = false;

    tiles = [];

    _showSpinner = false;

    @api
    set cell(value) {
        this._cell = value;
        this.processVisibleTiles();
    }

    get cell() {
        return this._cell;
    }

    _cell = {};

    @api
    set visibleAmountTypes(value) {
        this._visibleAmountTypes = value;
        this.processVisibleTiles();
    }

    get visibleAmountTypes() {
        return this._visibleAmountTypes;
    }

    _visibleAmountTypes;

    labels = {
        add: LABEL_ADD
    };

    showSpinner() {
        this._showSpinner = true;
    }

    hideSpinner() {
        this._showSpinner = false;
    }

    processVisibleTiles() {
        this.tiles = [];
        if (this._cell && this._cell.tiles) {
            this.tiles = this._cell.tiles.filter((tile) => {
                return this.hasAmountTypeData(tile);
            });
        }
    }

    handleHighlightEvent(name, tileId) {
        this.dispatchEvent(
            new CustomEvent(name, {
                bubbles: true,
                composed: true,
                detail: {
                    rowIndex: this.rowIndex,
                    colIndex: this.colIndex,
                    rowId: this.row.id,
                    columnId: this.column.id,
                    tileId: tileId
                }
            })
        );
    }

    handleMouseOver() {
        this.handleHighlightEvent('cellhighlight', null);
    }

    handleMouseOut() {
        this.handleHighlightEvent('cellunhighlight', null);
    }

    handleCellHighlight(event) {
        event.stopPropagation();
    }

    handleCellUnHighlight(event) {
        event.stopPropagation();
    }

    hasAmountTypeData(tile) {
        var i = 0;
        let displayFields = Object.values(tile.displayFields);

        let hasAmountTypeHeader = false;
        let hasAmountTypeData = false;
        let amountTypeInSelection = false;

        for (i = 0; i < displayFields.length; i++) {
            let currentDisplayField = displayFields[i];

            if (
                currentDisplayField.fieldType === 'amountType' &&
                currentDisplayField.data &&
                currentDisplayField.data.length
            ) {
                hasAmountTypeData = true;
            }

            if (currentDisplayField.isPrimary) {
                if (this._visibleAmountTypes && this._visibleAmountTypes[currentDisplayField.id]) {
                    hasAmountTypeHeader = true;
                }
            }

            if (
                this._visibleAmountTypes &&
                currentDisplayField.id &&
                this._visibleAmountTypes[currentDisplayField.id] &&
                currentDisplayField.data &&
                currentDisplayField.data.length
            ) {
                amountTypeInSelection = true;
            }
        }

        // Show Tile if there are no amount types (such as when you first create the tile).
        // Or Show Tile if the header is the amount type in the selection
        // So we are only removing the tiles if it has an amount type but not selected
        if (hasAmountTypeHeader || !hasAmountTypeData) {
            return true;
        }

        return amountTypeInSelection;
    }

    handleAddClicked() {
        this.dispatchEvent(
            new CustomEvent('createcell', {
                bubbles: true,
                composed: true,
                detail: {
                    rowId: this.row.id,
                    columnId: this.column.id,
                    showSpinner: this.showSpinner.bind(this),
                    hideSpinner: this.hideSpinner.bind(this)
                }
            })
        );
    }
}