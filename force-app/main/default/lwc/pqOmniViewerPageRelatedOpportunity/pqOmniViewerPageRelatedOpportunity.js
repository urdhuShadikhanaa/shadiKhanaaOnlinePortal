import { LightningElement, api } from 'lwc';
import CURRENCY from '@salesforce/i18n/currency';
import getOpportunityContactsForContactId from '@salesforce/apex/OpportunityController.getOpportunityContactsForContactId';
import getUserRecordAccess from '@salesforce/apex/UserRecordAccessServiceController.getUserRecordAccess';
import Click_Here_To_Refresh from '@salesforce/label/c.Click_Here_To_Refresh';
import Edit from '@salesforce/label/c.Edit';
import Loading from '@salesforce/label/c.Loading';
import No_Related_Opportunities from '@salesforce/label/c.No_Related_Opportunities';
import OmniViewer_Page_Title_Opportunities from '@salesforce/label/c.OmniViewer_Page_Title_Opportunities';
import Open_In_New_Window from '@salesforce/label/c.Open_In_New_Window';
import Show_All_Opportunities from '@salesforce/label/c.Show_All_Opportunities';
import Show_Closed_Opportunities from '@salesforce/label/c.Show_Closed_Opportunities';
import Show_Open_Opportunities from '@salesforce/label/c.Show_Open_Opportunities';

export default class PqOmniViewerPageRelatedOpportunity extends LightningElement {
    currencyCode = CURRENCY;

    oppList = [];

    loaded = false;

    needsRefresh = false;

    viewType = 'open';

    displayOpps = [];

    labels = {
        Click_Here_To_Refresh,
        Edit: Edit,
        Loading,
        No_Related_Opportunities,
        Open_In_New_Window,
        PageTitle: OmniViewer_Page_Title_Opportunities,
        Show_All_Opportunities,
        Show_Closed_Opportunities,
        Show_Open_Opportunities
    };

    // ----------------------------------------------------

    _contactId;

    @api personMapMemberData;

    @api personContactData;

    @api personContactExtendedData;

    @api profileImageData;

    // ----------------------------------------------------

    get hasData() {
        return this.oppList?.length > 0;
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
            { label: this.labels.Show_All_Opportunities, value: 'all' },
            { label: this.labels.Show_Open_Opportunities, value: 'open' },
            { label: this.labels.Show_Closed_Opportunities, value: 'closed' }
        ];
    }

    loadData() {
        this.loaded = false;
        getOpportunityContactsForContactId({ contactId: this.contactId }).then((result) => {
            this.oppList = result;
            this.updateCurrentView(this.viewType);
            this.loaded = true;
        });
    }

    updateCurrentView(viewType) {
        switch (viewType) {
            case 'all':
                this.displayOpps = JSON.parse(JSON.stringify(this.oppList));
                break;
            case 'open':
                this.displayOpps = this.oppList.filter((opp) => !opp.isClosed);
                break;
            case 'closed':
                this.displayOpps = this.oppList.filter((opp) => opp.isClosed);
                break;
            default:
                break;
        }
    }

    handleChange(event) {
        this.updateCurrentView(event.detail.value);
    }

    handleRedirectClicked(event) {
        const oppId = event.currentTarget.dataset.id;

        window.open('/' + oppId, '_blank');
        this.needsRefresh = true;
    }

    async getAccessForRecord(recordId) {
        let canEdit = false;
        await getUserRecordAccess({ recordId: recordId }).then((access) => {
            canEdit = access.HasAllAccess || access.HasEditAccess;
        });
        return canEdit;
    }

    async handleEditClicked(event) {
        this.needsRefresh = true;
        const recordId = event.currentTarget.dataset.id;

        if (!this.hasContainer) {
            const eventNavigation = this.template.querySelector('c-event-navigation');
            eventNavigation.invokeNewRecordEvent('OpportunityContactRole', [], 'RELATED_LIST', 'edit', recordId);
        } else {
            const canEdit = await this.getAccessForRecord(recordId);
            const evt = new CustomEvent('objectedit', {
                detail: { canEdit, recordId }
            });
            this.dispatchEvent(evt);
        }

        let transparentLayer = this.template.querySelector("[data-name='transparent-layer']");
        transparentLayer.setAttribute('class', 'transparent-layer');
    }

    refreshClicked() {
        this.needsRefresh = false;
        this.loadData();
    }
}