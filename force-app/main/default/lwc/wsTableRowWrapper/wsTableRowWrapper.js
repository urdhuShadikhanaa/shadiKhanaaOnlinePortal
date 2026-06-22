import { LightningElement, api } from 'lwc';

export default class WsTableRowWrapper extends LightningElement {
    @api row;

    @api rowIndex;

    @api columns;

    @api headerCollapsed = false;

    @api visibleAmountTypes;

    @api permissions;

    @api tileSize = 150;

    hasParent = false;

    hasChildren = false;

    @api
    get elementClassList() {
        if (this.row.headerCollapsed) {
            return 'ws-row hidden';
        }

        return 'ws-row';
    }

    connectedCallback() {
        if (this.row.parentObjectId) {
            this.hasParent = true;
        }

        if (this.row.childIds) {
            this.hasChildren = true;
        }
    }
}