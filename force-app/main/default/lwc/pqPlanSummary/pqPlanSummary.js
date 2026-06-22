import { LightningElement, api } from 'lwc';

import Account_Plan_Score from '@salesforce/label/c.Account_Plan_Score';
import getOrgSettings from '@salesforce/apex/StrategySettingsController.getOrgSettings';

export default class PqPlanSummary extends LightningElement {
    @api recordId;

    loadPercentComponent = false;
    loadingSetting = true;

    labels = {
        Account_Plan_Score
    };

    connectedCallback() {
        this.loadData();
    }

    loadData() {
        getOrgSettings().then((result) => {
            this.loadPercentComponent = result.usePercentageAPScoring;
            this.loadingSetting = false;
        });
    }

    handleRefresh() {
        if (!this.loadPercentComponent) {
            const totalComponent = this.template.querySelector('c-pq-score-total');
            const scoreByObjectComponent = this.template.querySelector('c-pq-score-by-object');
            totalComponent?.refresh();
            scoreByObjectComponent?.refresh();
        } else {
            const totalComponent = this.template.querySelector('c-pq-score-total-percent');
            const scoreByObjectComponent = this.template.querySelector('c-pq-score-by-object-percent');
            totalComponent?.refresh();
            scoreByObjectComponent?.refresh();
        }
    }
}