import { LightningElement, api } from 'lwc';

export default class WsTableCellTileHeader extends LightningElement {
    @api headerData;

    get headerBackgroundStyle() {
        return 'background-color:' + this.headerData.color + ';';
    }
}