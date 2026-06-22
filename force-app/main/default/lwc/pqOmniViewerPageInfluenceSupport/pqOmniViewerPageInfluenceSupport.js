import { LightningElement, api } from 'lwc';
import Loading from '@salesforce/label/c.Loading';
import No_Relationship_Maps from '@salesforce/label/c.No_Relationship_Maps';
import OmniViewer_Page_Title_Influence_Support from '@salesforce/label/c.OmniViewer_Page_Title_Influence_Support';
import OmniViewer_Current_Relationship_Map from '@salesforce/label/c.OmniViewer_Current_Relationship_Map';
import OmniViewer_Other_Relationship_Maps from '@salesforce/label/c.OmniViewer_Other_Relationship_Maps';
import Show_Active_Items from '@salesforce/label/c.Show_Active_Items';
import Show_Closed_Items from '@salesforce/label/c.Show_Closed_Items';
import No_Influence_And_Support from '@salesforce/label/c.No_Influence_And_Support';

export default class pqOmniViewerPageInfluenceSupport extends LightningElement {
    memberList = [];

    loaded = false;

    labels = {
        Loading,
        No_Relationship_Maps,
        Current_Relationship_Map: OmniViewer_Current_Relationship_Map,
        Other_Relationship_Maps: OmniViewer_Other_Relationship_Maps,
        PageTitle: OmniViewer_Page_Title_Influence_Support,
        Show_Active_Items,
        Show_Closed_Items,
        No_Influence_And_Support
    };

    viewType = 'active';

    showMain = false;

    // ----------------------------------------------------

    @api personMapMemberData;

    @api personContactData;

    @api personContactExtendedData;

    @api profileImageData;

    _memberInfluenceData;

    _memberInfluenceDataList;

    displayInfluenceList = [];

    @api
    get memberInfluenceData() {
        return this._memberInfluenceData;
    }

    set memberInfluenceData(val) {
        this._memberInfluenceData = val;
        this.udpateShowMain(this.viewType);
    }

    @api
    get memberInfluenceDataList() {
        return this._memberInfluenceDataList;
    }

    set memberInfluenceDataList(val) {
        this._memberInfluenceDataList = val;
        this.updateCurrentViewFilter(this.viewType);
    }

    // ----------------------------------------------------

    get hasOtherMapInfluenceData() {
        return this.displayInfluenceList?.length > 0;
    }

    get options() {
        return [
            { label: this.labels.Show_Active_Items, value: 'active' },
            { label: this.labels.Show_Closed_Items, value: 'closed' }
        ];
    }

    udpateShowMain(viewType) {
        this.showMain =
            (this._memberInfluenceData !== undefined &&
                this._memberInfluenceData.containerIsClosed &&
                viewType === 'closed') ||
            (this._memberInfluenceData !== undefined &&
                !this._memberInfluenceData.containerIsClosed &&
                viewType === 'active');
    }

    updateCurrentViewFilter(viewType) {
        switch (viewType) {
            case 'closed':
                this.displayInfluenceList = this._memberInfluenceDataList?.filter((t) => t.containerIsClosed);
                break;
            case 'active':
                this.displayInfluenceList = this._memberInfluenceDataList?.filter((t) => !t.containerIsClosed);
                break;
            default:
                break;
        }
    }

    handleChange(event) {
        this.updateCurrentViewFilter(event.detail.value);
        this.udpateShowMain(event.detail.value);
    }
}