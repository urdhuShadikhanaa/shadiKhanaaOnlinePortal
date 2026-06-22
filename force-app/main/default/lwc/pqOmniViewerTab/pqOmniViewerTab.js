import { LightningElement, api, track } from 'lwc';

export default class PQOmniViewerTab extends LightningElement {
    @track _tabData;

    @api objectApiName;

    @api objectId;

    @api
    get tabData() {
        return this._tabData;
    }

    set tabData(data) {
        this._tabData = data;
    }

    // If the icon type is set to lwc, then look for the name field

    get iconName() {
        return this._tabData?.icon?.name;
    }

    get tabName() {
        return this._tabData?.name;
    }

    get tabStyle() {
        if (this._tabData.selected) {
            return 'background-color: ' + this._tabData?.icon?.bgColorSelected + ';';
        }

        return 'background-color: ' + this._tabData?.icon?.bgColor + ';';
    }

    handleClick() {
        let evt = new CustomEvent('pagesettabchanged', {
            detail: {
                newTabId: this._tabData.id
            }
        });

        this.dispatchEvent(evt);
    }
}