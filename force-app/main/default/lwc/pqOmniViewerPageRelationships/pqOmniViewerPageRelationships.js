import { LightningElement, api } from 'lwc';
import getRelationshipsForContact from '@salesforce/apex/OmniViewerController.getRelationshipsForContact';
import Click_Here_To_Refresh from '@salesforce/label/c.Click_Here_To_Refresh';
import Loading from '@salesforce/label/c.Loading';
import No_Custom_Relationships from '@salesforce/label/c.No_Custom_Relationships';
import OmniViewer_Page_Title_Custom_Relationships from '@salesforce/label/c.OmniViewer_Page_Title_Custom_Relationships';

export default class PqOmniViewerPageRelationship extends LightningElement {
    relationships = [];

    loaded = false;

    needsRefresh = false;

    error = null;

    labels = {
        Click_Here_To_Refresh,
        Loading,
        No_Custom_Relationships,
        PageTitle: OmniViewer_Page_Title_Custom_Relationships
    };

    // ----------------------------------------------------

    _contactId;

    @api personMapMemberData;

    @api personContactData;

    @api personContactExtendedData;

    @api profileImageData;

    @api mapOrAccountPlanId;

    currentMapRelData;

    globalRelData;

    otherMapRels = [];

    // ----------------------------------------------------

    get hasOtherMapData() {
        return this.otherMapRels?.length > 0;
    }

    @api
    set contactId(val) {
        this._contactId = val;
        this.loadData();
    }

    get contactId() {
        return this._contactId;
    }

    loadData() {
        this.currentMapRelData = null;
        this.globalRelData = null;
        this.otherMapRels = [];
        this.loaded = false;
        this.error = null;
        getRelationshipsForContact({ contactId: this.contactId })
            .then((result) => {
                this.relationships = result;
                this.relationships?.forEach((item) => {
                    if (
                        item.relationshipMapId === this.mapOrAccountPlanId ||
                        item.accountPlanId === this.mapOrAccountPlanId
                    ) {
                        this.currentMapRelData = item;
                    } else if (item.isGlobalRelationship) {
                        this.globalRelData = item;
                    } else {
                        this.otherMapRels.push(item);
                    }
                });
                this.loaded = true;
            })
            .catch((error) => {
                this.error = error.message;
                this.loaded = true;
            });
    }

    refreshClicked() {
        this.needsRefresh = false;
        this.loadData();
    }
}