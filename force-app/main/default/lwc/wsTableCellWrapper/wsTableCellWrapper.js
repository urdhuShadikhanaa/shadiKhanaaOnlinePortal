import { LightningElement, api } from 'lwc';

export default class WsTableCellWrapper extends LightningElement {
    @api row;

    @api column;

    @api rowIndex;

    @api colIndex;

    @api headerCollapsed = false;

    @api visibleAmountTypes;

    @api permissions;

    @api tileSize = 150;

    @api
    get elementClassList() {
        if (this.row.headerCollapsed || this.column.headerCollapsed) {
            return 'ws-cell-container hidden';
        }

        return 'ws-cell-container';
    }
}