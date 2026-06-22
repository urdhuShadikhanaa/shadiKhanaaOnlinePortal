import { LightningElement, api } from 'lwc';
import LABEL_INFLUENCE from '@salesforce/label/c.Open_Tasks';

export default class pqOmniViewerWidgetTaskList extends LightningElement {
    _personTaskData = [];

    labels = {
        openTasks: LABEL_INFLUENCE
    };

    // ----------------------------------------------------

    @api
    get personTaskData() {
        return this._personTaskData;
    }

    set personTaskData(data) {
        this._personTaskData = data;
    }

    // ----------------------------------------------------

    get hasData() {
        return this.personTaskData?.length > 0;
    }

    get taskListSumary() {
        let data = this.personTaskData.filter((t) => !t.isClosed);

        data.splice(3);

        return data;
    }
}