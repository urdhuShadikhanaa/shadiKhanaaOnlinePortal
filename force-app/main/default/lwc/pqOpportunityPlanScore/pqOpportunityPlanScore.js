import { LightningElement, api } from 'lwc';

import getOpportunityScoreForOpportunityPlan from '@salesforce/apex/OpportunityPlanController.getOpportunityScoreForOpportunityPlan';
import getOpportunityScoreForOpportunity from '@salesforce/apex/OpportunityPlanController.getOpportunityScoreForOpportunity';

// LABELS
import Increase_Opportunity_Win_Chance_Slightly from '@salesforce/label/c.Increase_Opportunity_Win_Chance_Slightly';
import Increase_Opportunity_Win_Chance_Moderately from '@salesforce/label/c.Increase_Opportunity_Win_Chance_Moderately';
import Increase_Opportunity_Win_Chance_Highly from '@salesforce/label/c.Increase_Opportunity_Win_Chance_Highly';
import Opportunity_Contact_Role from '@salesforce/label/c.Opportunity_Contact_Role';
import Opportunity_Score from '@salesforce/label/c.Opportunity_Score';
import Suggestions from '@salesforce/label/c.Suggestions';


export default class PqOpportunityPlanScore extends LightningElement {
    @api recordId;
    @api objectApiName;
    @api title = '';
    opportunityData;
    opportunityScore;
    suggestions = [];
    loaded = false;
    labels = {
        slightlyIncreaseChance: Increase_Opportunity_Win_Chance_Slightly,
        moderatelyIncreaseChance: Increase_Opportunity_Win_Chance_Moderately,
        highlyIncreaseChance: Increase_Opportunity_Win_Chance_Highly,
        oppContactRole: Opportunity_Contact_Role,
        opportunityScore: Opportunity_Score,
        suggestions: Suggestions
    };

    connectedCallback() {
        this.loadData();
    }

    async loadData() {
        if (this.objectApiName === 'pqcrush__PQ_Opportunity_Plan__c') {
            await this.loadDataForOpportunityPlan();
        } else if (this.objectApiName === 'Opportunity') {
            await this.loadDataForOpportunity();
        }

        this.displayResult(this.opportunityData);
    }

    async loadDataForOpportunityPlan() {
        await getOpportunityScoreForOpportunityPlan({ opportunityPlanId: this.recordId }).then((result) => {
            this.opportunityData = result;
        });
    }

    async loadDataForOpportunity() {
        await getOpportunityScoreForOpportunity({ opportunityId: this.recordId }).then((result) => {
            this.opportunityData = result;
        });
    }

    displayResult(oppData) {
        let count = 0;
        oppData?.dataList?.forEach(item => {
            let label = this.labels.slightlyIncreaseChance;
            if (item.value > 0.5) {
                label = this.labels.highlyIncreaseChance;
            } else if (item.value > 0.2) {
                label = this.labels.moderatelyIncreaseChance;
            }
            this.suggestions.push({ id: count++, phrase: label + ' ' + item.name });
        });

        if (count === 0 && oppData.withOpportunityContact > 0) {
            let label = this.labels.slightlyIncreaseChance;
            if (oppData?.withOpportunityContact > 0.5) {
                label = this.labels.highlyIncreaseChance;
            } else if (oppData?.withOpportunityContact > 0.2) {
                label = this.labels.moderatelyIncreaseChance;
            }
            this.suggestions.push({ id: count++, phrase: label + ' ' + this.labels.oppContactRole });
        }
        this.loaded = true;
        this.opportunityScore = oppData.normalizedScore;
    }
}