import { LightningElement, api } from 'lwc';
import getTasksForContact from '@salesforce/apex/TasksController.getTasksForContact';
import Click_Here_To_Refresh from '@salesforce/label/c.Click_Here_To_Refresh';
import Edit from '@salesforce/label/c.Edit';
import Loading from '@salesforce/label/c.Loading';
import No_Related_Tasks from '@salesforce/label/c.No_Related_Tasks';
import Open_In_New_Window from '@salesforce/label/c.Open_In_New_Window';
import Show_Closed_Tasks from '@salesforce/label/c.Show_Closed_Tasks';
import Show_Open_Tasks from '@salesforce/label/c.Show_Open_Tasks';
import OmniViewer_Page_Title_Tasks from '@salesforce/label/c.OmniViewer_Page_Title_Tasks';

export default class PqOmniViewerPageRelatedTasks extends LightningElement {
    _personTaskData = [];

    displayTasks = [];

    loaded = false;

    viewType = 'open';

    needsRefresh = false;

    labels = {
        Click_Here_To_Refresh,
        Edit,
        Loading,
        No_Related_Tasks,
        Open_In_New_Window,
        Show_Closed_Tasks,
        Show_Open_Tasks,
        PageTitle: OmniViewer_Page_Title_Tasks
    };

    // ----------------------------------------------------

    _contactId;

    @api personMapMemberData;

    @api personContactData;

    @api personContactExtendedData;

    @api profileImageData;

    @api
    get personTaskData() {
        return this._personTaskData;
    }

    set personTaskData(data) {
        this._personTaskData = data;
    }

    // ----------------------------------------------------

    get hasData() {
        return this._personTaskData?.length > 0;
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
            { label: this.labels.Show_Closed_Tasks, value: 'closed' },
            { label: this.labels.Show_Open_Tasks, value: 'open' }
        ];
    }

    loadData() {
        this.loaded = false;
        getTasksForContact({ contactId: this.contactId }).then((result) => {
            this._personTaskData = result;
            this.updateCurrentViewTasks(this.viewType);
            this.loaded = true;
        });
    }

    updateCurrentViewTasks(viewType) {
        switch (viewType) {
            case 'closed':
                this.displayTasks = this.personTaskData.filter((t) => t.isClosed);
                break;
            case 'open':
                this.displayTasks = this.personTaskData.filter((t) => !t.isClosed);
                break;
            default:
                break;
        }
    }

    handleChange(event) {
        this.updateCurrentViewTasks(event.detail.value);
    }

    handleTaskClicked(event) {
        const taskId = event.currentTarget.dataset.id;

        window.open('/' + taskId, '_blank');
        this.needsRefresh = true;
    }

    refreshClicked() {
        this.needsRefresh = false;
        this.loadData();
    }
}