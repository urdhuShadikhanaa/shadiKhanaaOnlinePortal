import { LightningElement, api } from 'lwc';
import getGroupsForContactId from '@salesforce/apex/GraphDataController.getGroupsForContactId';
import Click_Here_To_Refresh from '@salesforce/label/c.Click_Here_To_Refresh';
import Loading from '@salesforce/label/c.Loading';
import No_Related_Groups from '@salesforce/label/c.No_Related_Groups';
import Open_In_New_Window from '@salesforce/label/c.Open_In_New_Window';
import OmniViewer_Page_Title_Groups from '@salesforce/label/c.OmniViewer_Page_Title_Groups';

export default class PqOmniViewerPageGroups extends LightningElement {
    groupList = [];

    loaded = false;

    needsRefresh = false;

    labels = {
        Click_Here_To_Refresh,
        Loading,
        No_Related_Groups,
        Open_In_New_Window,
        PageTitle: OmniViewer_Page_Title_Groups
    };

    // ----------------------------------------------------

    _contactId;

    @api personMapMemberData;

    @api personContactData;

    @api personContactExtendedData;

    @api profileImageData;

    // ----------------------------------------------------

    get hasData() {
        return this.groupList?.length > 0;
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

    loadData() {
        this.loaded = false;
        getGroupsForContactId({ contactId: this.contactId }).then((result) => {
            this.groupList = result;
            this.loaded = true;
        });
    }

    handleEditClicked(event) {
        const accountPlanId = event.currentTarget.dataset.accountplanid;
        const rmId = event.currentTarget.dataset.rmid;

        if (rmId) {
            window.open('/' + rmId, '_blank');
        } else if (accountPlanId) {
            window.open('/' + accountPlanId, '_blank');
        }
    }
}