import { LightningElement, api } from 'lwc';
import pqOpportunityEngagementUtils from 'c/pqOpportunityEngagementUtils';
import Loading from '@salesforce/label/c.Loading';
import No_Engagements from '@salesforce/label/c.No_Engagements';
import Refresh_Engagement_Score from '@salesforce/label/c.Refresh_Engagement_Score';

export default class pqOpportunityEngagementExplorer extends LightningElement {
    @api recordId;
    @api flexipageRegionWidth = 'CLASSIC';

    @api diagramTitle;
    @api showTitle;
    @api scoreSize;
    @api scoreBold;
    @api scoreColor;

    @api weightTasks;
    @api weightCall;
    @api weightEvents;
    @api weightEmail;
    @api colorDefault;
    @api sizeDefault;

    _opportunityId;
    _diagramTools;
    _score = '--';
    _loaded = false;

    labels = {
        Loading,
        No_Engagements,
        Refresh_Engagement_Score
    };

    viewModel = {
        users: [],
        activities: [],
        contacts: []
    };

    // ----------------------------------------------------

    get score() {
        let weightedScore = 0;
        this.viewModel.activities.forEach((activity) => {
            switch (activity.rollup) {
                case 'Task':
                    weightedScore += this.weightTasks * activity.score;
                    break;
                case 'Call':
                    weightedScore += this.weightCall * activity.score;
                    break;
                case 'Email':
                    weightedScore += this.weightEmail * activity.score;
                    break;
                case 'Event':
                    weightedScore += this.weightEvents * activity.score;
                    break;
                default:
                    break;
            }
        });

        return weightedScore;
    }

    get engagementScoreCssClass() {
        let base = 'engagementScore';

        if (this.scoreSize) {
            base += ' ' + this.scoreSize;
        }

        if (this.scoreBold) {
            base += ' ' + this.scoreBold;
        }

        if (this.scoreColor) {
            base += ' ' + this.scoreColor;
        }

        return base;
    }

    // ----------------------------------------------------

    async connectedCallback() {
        this._opportunityId = this.recordId;
        this._diagramTools = new pqOpportunityEngagementUtils(this._opportunityId);
        if (!this._loaded) {
            this.loadData();
        }
    }

    async loadData() {
        this._loaded = false;
        await Promise.all([this._diagramTools.loadData()])
            .then(([results]) => {
                this.viewModel = results;
                this._loaded = true;
            })
            .catch(() => {
                this._loaded = true;
                this.viewModel = null;
            });
    }

    async handleRefresh() {
        this.loadData();
    }
}