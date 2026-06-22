import { LightningElement, api } from 'lwc';
import pqOpportunityEngagementUtils from 'c/pqOpportunityEngagementUtils';
import Active_Users from '@salesforce/label/c.Active_Users';
import Activity_Types from '@salesforce/label/c.Activity_Types';
import Engaged_Contacts from '@salesforce/label/c.Engaged_Contacts';
import Loading from '@salesforce/label/c.Loading';
import No_Engagements from '@salesforce/label/c.No_Engagements';
import Refresh_Engagement_Data from '@salesforce/label/c.Refresh_Engagement_Data';

export default class pqOpportunityEngagementExplorer extends LightningElement {
    @api recordId;
    @api flexipageRegionWidth = 'CLASSIC';

    @api diagramTitle;
    @api showTitle;

    _diagramTools;

    loaded = false;
    _opportunityId;
    _taskRawData;
    _userMin = -1;
    _userMax = -1;
    _activityMin = -1;
    _activityMax = -1;
    _contactMin = -1;
    _contactMax = -1;
    _trimLength = 9;

    labels = {
        Active_Users,
        Activity_Types,
        Engaged_Contacts,
        Loading,
        No_Engagements,
        Refresh_Engagement_Data
    };

    viewModel = {
        users: [],
        activities: [],
        contacts: []
    };

    // ----------------------------------------------------

    get hasData() {
        return (
            this.viewModel.users?.length !== 0 ||
            this.viewModel.activities?.length !== 0 ||
            this.viewModel.contacts?.length !== 0
        );
    }

    get colStyle() {
        switch (this.flexipageRegionWidth) {
            case 'SMALL':
                return 'slds-size_1-of-1';

            case 'MEDIUM':
                return 'slds-size_1-of-1 slds-x-small-size_1-of-1 slds-small-size_1-of-1 slds-medium-size_1-of-1 slds-large-size_1-of-3';

            case 'LARGE':
                return 'slds-size_1-of-1 slds-x-small-size_1-of-1 slds-small-size_1-of-1 slds-medium-size_1-of-3 slds-large-size_1-of-3';

            default:
                return 'slds-size_1-of-1';
        }
    }

    // ----------------------------------------------------

    async connectedCallback() {
        this._opportunityId = this.recordId;
        this._diagramTools = new pqOpportunityEngagementUtils(this._opportunityId);
        if (!this.loaded) {
            this.loadData();
        }
    }

    async loadData() {
        this.loaded = false;
        await Promise.all([this._diagramTools.loadData()])
            .then(([results]) => {
                this.viewModel = results;
                this.loaded = true;
            })
            .catch(() => {});
    }

    async handleRefresh() {
        this.loadData();
    }

    displayToolTip(event) {
        let key = event.currentTarget.dataset.item;
        let selector = "c-pq-opportunity-engagement-tooltip[data-item='" + key + "']";
        let tooltip = this.template.querySelector(selector);
        tooltip.show();
    }
}