import { LightningElement, api, track } from 'lwc';

export default class pqOmniViewerWidgetHeaderHome extends LightningElement {
    @track _profileImageData = '';

    @track _personContactExtendedData = { pqcrush__Profile_Picture_Data__c: this._profileImageData };

    @api personMapMemberData;

    @api personContactData;

    @api
    get personContactExtendedData() {
        return this._personContactExtendedData;
    }

    set personContactExtendedData(data) {
        this._personContactExtendedData = data;
    }

    @api
    get profileImageData() {
        return this._profileImageData;
    }

    set profileImageData(data) {
        this._profileImageData = data;
    }

    // ----------------------------------------------------

    get hasFullName() {
        return this.personContactData?.Name !== undefined;
    }

    get hasTitle() {
        return this.personContactData?.Title !== undefined;
    }

    get hasAccountName() {
        return this.personContactData?.Account?.Name !== undefined;
    }

    get fullName() {
        if (this.hasFullName) {
            return this.personContactData?.Name;
        }

        return null;
    }

    get title() {
        if (this.hasTitle) {
            return this.personContactData?.Title;
        }

        return null;
    }

    get accountName() {
        if (this.hasAccountName) {
            return this.personContactData?.Account?.Name;
        }

        return null;
    }

    // ----------------------------------------------------
}