import { LightningElement, api, wire } from 'lwc';
import getScoreHistoryByMasterAccountPlan from '@salesforce/apex/MasterAccountPlanController.getScoreHistoryByMasterAccountPlan';
import LABEL_NO_TREND_DATA from '@salesforce/label/c.No_Trend_Data';
import LABEL_NO_TREND_DATA_NOTE from '@salesforce/label/c.No_Trend_Data_Note';
import { subscribe, MessageContext } from 'lightning/messageService';
import MASTER_ACCOUNT_PLAN_DATA_CHANNEL from '@salesforce/messageChannel/masterAccountPlanData__c';

export default class PqAccountPlanTrend extends LightningElement {
    @api recordId;

    @wire(MessageContext) messageContext;

    subscription = null;

    trendConfiguration;

    loaded;

    historyData;

    showNoData = false;

    showChart = false;

    labels = {
        noData: LABEL_NO_TREND_DATA,
        noDataNote: LABEL_NO_TREND_DATA_NOTE
    };

    connectedCallback() {
        this.loadCharts();
        this.subscribeToChannel();
    }

    getDateOfWeek(w, y) {
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        var d = 1 + (w - 1) * 7; // 1st of January + 7 days for each week
        const result = new Date(y, 0, d);

        return result.toLocaleDateString(options);
    }

    subscribeToChannel() {
        if (this.subscription) {
            return;
        }

        // Subscribing to the message channel
        this.subscription = subscribe(this.messageContext, MASTER_ACCOUNT_PLAN_DATA_CHANNEL, (message) => {
            this.handleMessage(message);
        });
    }

    handleMessage(message) {
        if (message.action === 'refresh' && message.recordId === this.recordId) {
            this.loadCharts();
        }
    }

    async loadCharts() {
        await getScoreHistoryByMasterAccountPlan({ masterAccountPlanId: this.recordId }).then((result) => {
            this.historyData = result;
        });

        if (this.historyData?.planScores?.length > 0) {
            this.showChart = true;
            this.showNoData = false;
        } else {
            this.showChart = false;
            this.showNoData = true;
        }

        let labelsArray = [];

        const colors = [
            'rgb(255, 46, 105)',
            'rgb(255, 234, 33)',
            'rgb(255, 181, 112)',
            'rgb(107, 33, 255)',
            'rgb(33, 188, 255)',
            'rgb(0, 234, 255)',
            'rgb(238, 0, 255)',
            'rgb(255, 166, 0)',
            'rgb(0, 255, 167)',
            'rgb(0, 54, 255)'
        ];

        this.historyData.labels.forEach((item) => {
            const w = Number(item.slice(-2));
            const y = Number(item.slice(0, 4));
            const dateString = this.getDateOfWeek(w, y);

            labelsArray.push(dateString);
        });

        let dataSets = [];

        this.historyData.planScores.forEach((item, i) => {
            let finalscores = [];

            item.scores.forEach((score) => {
                if (score < 0) {
                    finalscores.push(null);
                } else {
                    finalscores.push(score);
                }
            });
            dataSets.push({
                label: item.name,
                data: finalscores,
                fill: false,
                borderColor: colors[i % 10],
                tension: 0.1
            });
        });

        let dataSet = {
            type: 'line',
            data: {
                labels: labelsArray,
                datasets: dataSets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                spanGaps: true,
                scales: {
                    xAxis: {
                        ticks: {
                            autoSkip: true,
                            maxTicksLimit: 8
                        }
                    }
                },
                plugins: {
                    legend: {
                        align: 'start',
                        position: 'bottom'
                    }
                }
            }
        };

        this.trendConfiguration = dataSet;

        const trendChart = this.template.querySelector('.trendChart');

        trendChart?.update(dataSet.data);

        this.loaded = true;
    }
}