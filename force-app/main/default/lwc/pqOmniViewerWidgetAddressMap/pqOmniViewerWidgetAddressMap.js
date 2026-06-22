import { LightningElement, api, track } from 'lwc';

export default class pqOmniViewerWidgetAddressMap extends LightningElement {
    @track _addressList;

    @track _selectedIndex = 0;

    hasAddress() {
        return this.addressList != null;
    }

    get hasMultipleAddresses() {
        return this.addressList.length > 1;
    }

    get currentAddressLabel() {
        return this._addressList[this._selectedIndex].label;
    }

    @api
    get addressList() {
        return this._addressList;
    }

    set addressList(data) {
        this._addressList = data;
    }

    get mapMarkers() {
        if (!this.hasAddress) {
            return false;
        }

        let currentAddress = this._addressList[this._selectedIndex];

        if (!currentAddress) {
            return null;
        }

        let markers = [];
        let marker = {};

        marker.title = currentAddress.label;
        marker.description = '';
        marker.location = {};

        // Marker.location => { City, Country, PostalCode, State, and Street }

        if (currentAddress?.data?.street !== undefined) {
            marker.description += currentAddress.data?.street + '<br/>';
            marker.location.Street = currentAddress.data?.street;
        }

        if (currentAddress?.data?.city !== undefined) {
            marker.description += currentAddress.data?.city;
            marker.location.City = currentAddress.data?.city;
        }

        if (currentAddress?.data?.state !== undefined) {
            marker.description += ', ' + currentAddress.data?.state;
            marker.location.State = currentAddress.data?.state;
        }

        if (currentAddress?.data?.postalCode !== undefined) {
            marker.description += ' ' + currentAddress.data?.postalCode + '<br/>';
            marker.location.PostalCode = currentAddress.data?.postalCode;
        }

        if (currentAddress?.data?.country !== undefined) {
            marker.description += currentAddress.data?.country + '<br/>';
            marker.location.Country = currentAddress.data?.country;
        }

        // TODO - validate final marker object or null out to avoid erroneous map display

        markers.push(marker);

        return markers;
    }

    addressBack() {
        this._selectedIndex--;
        if (this._selectedIndex < 0) {
            this._selectedIndex = this._addressList.length - 1;
        }
    }

    addressNext() {
        this._selectedIndex++;
        if (this._selectedIndex >= this._addressList.length) {
            this._selectedIndex = 0;
        }
    }
}