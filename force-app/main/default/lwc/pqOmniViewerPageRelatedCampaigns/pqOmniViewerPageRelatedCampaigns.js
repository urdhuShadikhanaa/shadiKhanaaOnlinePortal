import { LightningElement, api } from 'lwc';
import getCampaignMembersForContactId from '@salesforce/apex/CampaignController.getCampaignMembersForContactId';
import Click_Here_To_Refresh from '@salesforce/label/c.Click_Here_To_Refresh';
import Edit from '@salesforce/label/c.Edit';
import Loading from '@salesforce/label/c.Loading';
import No_Related_Campaigns from '@salesforce/label/c.No_Related_Campaigns';
import OmniViewer_Page_Title_Campaigns from '@salesforce/label/c.OmniViewer_Page_Title_Campaigns';
import Open_In_New_Window from '@salesforce/label/c.Open_In_New_Window';
import Show_Active_Campaigns from '@salesforce/label/c.Show_Active_Campaigns';
import Show_All_Campaigns from '@salesforce/label/c.Show_All_Campaigns';

export default class PqOmniViewerPageRelatedCampaigns extends LightningElement {
    campaignList = [];

    loaded = false;

    needsRefresh = false;

    viewType = 'active';

    displayCampaigns = [];

    labels = {
        Click_Here_To_Refresh,
        Edit: Edit,
        Loading,
        No_Related_Campaigns,
        Open_In_New_Window,
        PageTitle: OmniViewer_Page_Title_Campaigns,
        Show_Active_Campaigns,
        Show_All_Campaigns
    };

    // ----------------------------------------------------

    _contactId;

    @api personMapMemberData;

    @api personContactData;

    @api personContactExtendedData;

    @api profileImageData;

    // ----------------------------------------------------

    get hasData() {
        return this.campaignList?.length > 0;
    }

    @api
    set contactId(val) {
        this._contactId = val;
        this.loadData();
    }

    get contactId() {
        return this._contactId;
    }

    connectedCallback() {
        this.loadData();
    }

    get options() {
        return [
            { label: this.labels.Show_Active_Campaigns, value: 'active' },
            { label: this.labels.Show_All_Campaigns, value: 'all' }
        ];
    }

    loadData() {
        this.loaded = false;
        getCampaignMembersForContactId({ contactId: this.contactId }).then((result) => {
            this.campaignList = result;
            this.updateCurrentView(this.viewType);
            this.loaded = true;
        });
    }

    updateCurrentView(viewType) {
        switch (viewType) {
            case 'all':
                this.displayCampaigns = JSON.parse(JSON.stringify(this.campaignList));
                break;
            case 'active':
                this.displayCampaigns = this.campaignList.filter((camp) => camp.campaignIsActive);
                break;
            default:
                break;
        }
    }

    handleChange(event) {
        this.updateCurrentView(event.detail.value);
    }

    handleEditClicked(event) {
        const campaignId = event.currentTarget.dataset.id;

        window.open('/' + campaignId, '_blank');
        this.needsRefresh = true;
    }

    refreshClicked() {
        this.needsRefresh = false;
        this.loadData();
    }
}