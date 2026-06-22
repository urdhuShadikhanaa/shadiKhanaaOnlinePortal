import { LightningElement, api } from 'lwc';
import Loading from '@salesforce/label/c.Loading';

export default class PQOmniViewerMain extends LightningElement {
    labels = {
        Loading
    };

    loaded = false;

    _tabHome = true;

    _tabProfile = false;

    _tabInfluenceSupport = false;

    _tabRelatedOpportunity = false;

    _tabRelatedTasks = false;

    _tabRelatedCampaigns = false;

    _tabGroups = false;

    _tabHierarchy = false;

    _tabRelationship = false;

    _selectedTabData;

    @api objectApiName;

    @api objectId;

    @api contactId;

    @api mapOrAccountPlanId;

    @api mapSettings;

    @api rmOrgSettings;

    @api profileImageData;

    @api personMapMemberData;

    @api personContactData;

    @api personContactExtendedData;

    @api selectedTabId;

    @api pageSetData;

    @api memberInfluenceData;

    @api memberInfluenceDataList;

    @api
    get selectedTabData() {
        return this._selectedTabData;
    }

    set selectedTabData(data) {
        this._selectedTabData = data;
        this.setTabVisibility();
    }

    get isLoading() {
        return this.pageSetData?.isLoaded;
    }

    // ----------------------------------------------------

    connectedCallback() {
        this.loadData();
    }

    async loadData() {
        this.loaded = false;

        this.setTabVisibility();

        this.loaded = true;
    }

    // ----------------------------------------------------

    setTabVisibility() {
        this._tabHome = this.selectedTabData?.type === 'pq-omni-home-1';
        this._tabProfile = this.selectedTabData?.type === 'pq-omni-profile-1';
        this._tabInfluenceSupport = this.selectedTabData?.type === 'pq-omni-crush-influence-support-1';
        this._tabRelatedOpportunity = this.selectedTabData?.type === 'pq-omni-rels-opportunities-1';
        this._tabRelatedTasks = this.selectedTabData?.type === 'pq-omni-rels-tasks-1';
        this._tabRelatedCampaigns = this.selectedTabData?.type === 'pq-omni-rels-campaigns-1';
        this._tabGroups = this.selectedTabData?.type === 'pq-omni-crush-groups-1';
        this._tabHierarchy = this.selectedTabData?.type === 'pq-omni-crush-relationships-1';
        this._tabRelationship = this.selectedTabData?.type === 'pq-omni-crush-relationships-2';
    }

    passthroughEvent(event) {
        const passedEvent = new CustomEvent(event.type, {
            detail: event.detail
        });

        // Dispatches the event.
        this.dispatchEvent(passedEvent);
    }
}