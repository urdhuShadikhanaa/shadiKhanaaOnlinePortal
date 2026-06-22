import { LightningElement, api } from 'lwc';
import getHealthScoreForAccountPlan from '@salesforce/apex/HealthScoreController.getTotalHealthScoreForAccountPlanPercent';

import { formatLabel } from 'c/stringUtils';
import Points_Breakdown_Label from '@salesforce/label/c.Points_Breakdown';
export default class PqScoreTotalPercent extends LightningElement {
    @api recordId;

    @api width;

    @api height;

    isLoaded = false;

    isLoading = false;

    config = null;

    title;

    connectedCallback() {
        this.loadData();
    }

    @api
    refresh() {
        this.loadData();
    }

    async loadData() {
        this.isLoaded = false;
        this.isLoading = true;
        await getHealthScoreForAccountPlan({ accountPlanId: this.recordId }).then((result) => {
            this.title = result.label;
            this.setupSpeedomoterChartConfig(result);
            this.isLoaded = true;
            this.isLoading = false;
        });
    }

    setupSpeedomoterChartConfig(scoreWrapper) {
        this.config = {
            type: 'doughnut',
            data: {
                labels: ['%', '%'],
                datasets: [
                    {
                        backgroundColor: [scoreWrapper.color, 'rgb(200, 200, 200)'],
                        data: [
                            ((scoreWrapper.points / scoreWrapper.maxPoints) * 100).toFixed(1),
                            100 - ((scoreWrapper.points / scoreWrapper.maxPoints) * 100).toFixed(1)
                        ]
                    }
                ]
            },
            options: {
                animation: {
                    animateRotate: true
                },
                circumference: 180,
                cutout: '70%',
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        position: 'bottom',
                        font: {
                            size: 14
                        },
                        text: formatLabel(Points_Breakdown_Label, [
                            scoreWrapper.points.toString(),
                            scoreWrapper.maxPoints.toString()
                        ]),
                        padding: {
                            top: -40
                        }
                    }
                },
                rotation: -90
            }
        };
    }
}