import { LightningElement, api, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { hexToRgb, isLightColor } from 'c/utils';

import getAccountPlanRecordAccess from '@salesforce/apex/AccountPlanController.getUserRecordAccess';
import getPlanOverviewByAccountPlan from '@salesforce/apex/PlanOverviewController.getPlanOverviewByAccountPlan';
import createPlanOverviewForAccountPlan from '@salesforce/apex/PlanOverviewController.createPlanOverviewForAccountPlan';
import updatePlanOverview from '@salesforce/apex/PlanOverviewController.updatePlanOverview';
import getPermissions from '@salesforce/apex/PlanOverviewController.getPermissions';
import deletePlanOverview from '@salesforce/apex/PlanOverviewController.deletePlanOverview';

// LABELS
import Delete from '@salesforce/label/c.Delete';
import Delete_Confirmation_Message from '@salesforce/label/c.Delete_Confirmation_Message';
import New_Plan_Overview from '@salesforce/label/c.New_Plan_Overview';
import Overview from '@salesforce/label/c.Overview';

export default class PqPlanOverview extends LightningElement {
    @api recordId;

    @api overviewKey;

    @api isGlobal;

    @api title;

    planOverviews;

    createable = false;

    canEditGraph = false;

    labels = {
        Delete,
        Delete_Confirmation_Message,
        New_Plan_Overview,
        Overview
    };

    get showCreateOverviewButton() {
        return this.createable && this.canEditGraph;
    }

    @wire(getAccountPlanRecordAccess, { accountPlanId: '$recordId' })
    wiredAccountPlanAccess({ data }) {
        if (data) {
            this.canEditGraph = data.HasAllAccess || data.HasEditAccess;
        }
    }

    connectedCallback() {
        this.loadData();
    }

    async loadData() {
        const isGlobal = !!this.isGlobal;

        await getPermissions()
            .then((result) => {
                this.createable = result?.createable;
            })
            .catch((error) => {
                this.showNotification('Error', error.message, 'error');
            });
        getPlanOverviewByAccountPlan({ accountPlanId: this.recordId, dataKey: this.overviewKey, isGlobal })
            .then((result) => {
                this.planOverviews = JSON.parse(JSON.stringify(result));
                this.process(this.planOverviews);
            })
            .catch((error) => {
                this.showNotification('Error', error.message, 'error');
            });
    }

    process(planOverviews) {
        if (!planOverviews || planOverviews.length <= 0) {
            return;
        }

        planOverviews.forEach((overview) => {
            let txtColorStyle = isLightColor(overview.backgroundColor) ? 'color: black;' : 'color: white;';

            overview.overviewStyle =
                txtColorStyle + ' background-color: ' + hexToRgb(overview.backgroundColor, 0.7) + ';';
            overview.titleStyle = txtColorStyle + ' background-color: ' + overview.backgroundColor + ';';
        });
    }

    handleEdit(event) {
        const planOverviewId = event.currentTarget.dataset.id;
        const planOverview = this.planOverviews.find((item) => item.id === planOverviewId);
        const modal = this.template.querySelector('c-pq-plan-overview-edit-modal');

        modal.open(planOverview);
    }

    handleDelete(event) {
        const planOverviewId = event.currentTarget.dataset.id;
        const title = event.currentTarget.dataset.title;
        const modal = this.template.querySelector('c-modal-for-confirmation');
        const message = this.labels.Delete_Confirmation_Message + ': ' + title;

        modal.open(this.labels.Delete, message, { planOverviewId }, this.labels.Delete);
    }

    handleDeleteClicked(event) {
        const planOverviewId = event.detail.callerData.planOverviewId;

        deletePlanOverview({ planOverviewId })
            .then(() => {
                this.loadData();
            })
            .catch((error) => {
                this.showNotification('Error', error.message, 'error');
            });
    }

    handleNewOverviewClick() {
        const modal = this.template.querySelector('c-pq-plan-overview-edit-modal');

        modal.open(null);
    }

    handleSave(event) {
        const { id, color, title, description } = event.detail;

        if (id) {
            this.updateOverview(id, color, title, description);
        } else {
            this.createNewOverview(color, title, description);
        }
    }

    createNewOverview(color, title, description) {
        const accountPlanId = this.recordId;
        const dataKey = this.overviewKey;
        const isGlobal = !!this.isGlobal;

        createPlanOverviewForAccountPlan({ accountPlanId, color, title, description, dataKey, isGlobal })
            .then(() => {
                this.loadData();
            })
            .catch((error) => {
                this.showNotification('Error', error.message, 'error');
            });
    }

    updateOverview(planOverviewId, color, title, description) {
        updatePlanOverview({ planOverviewId, color, title, description })
            .then(() => {
                this.loadData();
            })
            .catch((error) => {
                this.showNotification('Error', error.message, 'error');
            });
    }

    showNotification(title, message, variant) {
        const evt = new ShowToastEvent({ title, message, variant });

        this.dispatchEvent(evt);
    }
}