import { LightningElement, api } from 'lwc';
import getReportingStructureForContact from '@salesforce/apex/OmniViewerController.getReportingStructureForContact';
import Click_Here_To_Refresh from '@salesforce/label/c.Click_Here_To_Refresh';
import Loading from '@salesforce/label/c.Loading';
import No_Reporting_Hierarchy from '@salesforce/label/c.No_Reporting_Hierarchy';
import Open_In_New_Window from '@salesforce/label/c.Open_In_New_Window';
import OmniViewer_Page_Title_Hierarchy_Relationships from '@salesforce/label/c.OmniViewer_Page_Title_Hierarchy_Relationships';

export default class PqOmniViewerPageHierarchy extends LightningElement {
    displayList = [];

    loaded = false;

    needsRefresh = false;

    labels = {
        Click_Here_To_Refresh,
        Loading,
        No_Reporting_Hierarchy,
        Open_In_New_Window,
        PageTitle: OmniViewer_Page_Title_Hierarchy_Relationships
    };

    // ----------------------------------------------------

    _contactId;

    @api personMapMemberData;

    @api personContactData;

    @api personContactExtendedData;

    @api profileImageData;

    // ----------------------------------------------------

    get hasData() {
        return this.displayList?.length > 0;
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
        getReportingStructureForContact({ contactId: this.contactId }).then((result) => {
            this.processHierarchyListForDisplay(result);
            this.loaded = true;
        });
    }

    processHierarchyListForDisplay(hierarchyList) {
        let counter = 0;
        let tempList = [];

        hierarchyList?.forEach((item) => {
            let tempEntryList = [];

            item?.peopleTheyReportTo?.forEach((person) => {
                tempEntryList.push({
                    id: counter++,
                    verb: 'reports to',
                    person: person,
                    rmId: item.relationshipMapId,
                    apId: item.accountPlanId
                });
            });

            item?.peopleTheyManage?.forEach((person) => {
                tempEntryList.push({
                    id: counter++,
                    verb: 'manages',
                    person: person,
                    rmId: item.relationshipMapId,
                    apId: item.accountPlanId
                });
            });

            const isGlobal = item.containerName === '__global';
            let sectionName = isGlobal ? 'Global' : item.containerName;

            if (tempEntryList.length !== 0) {
                tempList.push({
                    id: counter++,
                    isGlobal: isGlobal,
                    containerName: sectionName,
                    entries: tempEntryList
                });
            }
        });
        this.displayList = tempList;
    }

    refreshClicked() {
        this.needsRefresh = false;
        this.loadData();
    }
}