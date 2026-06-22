import { LightningElement, api } from 'lwc';

export default class WsSummaryAreaGridHeaderItem extends LightningElement {
    @api
    set headerData(data) {
        this._headerData = data;
        this.colorStyle = 'color: ' + data.color + ';';
    }

    get headerData() {
        return this._headerData;
    }

    _headerData;

    colorStyle = 'color: black;';
}