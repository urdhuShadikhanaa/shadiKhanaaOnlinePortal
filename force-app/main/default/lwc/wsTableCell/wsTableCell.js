import { LightningElement, api } from 'lwc';

export default class WsTableCell extends LightningElement {
    @api row;

    @api column;

    @api rowIndex;

    @api colIndex;

    @api visibleAmountTypes;

    @api permissions;

    displayStyle = 'height: 150px; width: 150px; max-height: 150px; max-width: 150px;';

    get canAddTiles() {
        return this.permissions && this.permissions.canUpdate && this.permissions.canAddCells;
    }

    @api
    get tileSize() {
        return this._tileSize;
    }

    set tileSize(value) {
        if (!value || value === this._tileSize) {
            return;
        }
        this._tileSize = value;
        this.updateSizeStyling();
    }

    _tileSize = 400;

    renderedCallback() {
        this.updateSizeStyling();
    }

    get cellData() {
        return this.row.cells.find((cell) => this.column.id === cell.columnId);
    }

    get isTileCell() {
        return this.cellData.type === 'tiles';
    }

    get isSummaryCell() {
        return this.cellData.type === 'summary';
    }

    updateSizeStyling() {
        this.displayStyle =
            'height: ' +
            this._tileSize +
            'px; width: ' +
            this._tileSize +
            'px; max-height: ' +
            this._tileSize +
            'px; max-width: ' +
            this._tileSize +
            'px;';
    }
}