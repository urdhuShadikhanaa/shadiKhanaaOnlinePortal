import { LightningElement, api } from 'lwc';

export default class WsTableColumnHeaderWrapper extends LightningElement {
    @api column;

    @api columnIndex;

    @api headerCollapsed = false;

    @api tileSize = 150;

    hasParent = false;

    hasChildren = false;

    @api
    get elementClassList() {
        if (this.column.headerCollapsed) {
            return 'ws-col-header-layer parent hidden';
        }

        return 'ws-col-header-layer parent';
    }

    connectedCallback() {
        if (this.column.parentObjectId) {
            this.hasParent = true;
        }

        if (this.column.childIds) {
            this.hasChildren = true;
        }
    }
}