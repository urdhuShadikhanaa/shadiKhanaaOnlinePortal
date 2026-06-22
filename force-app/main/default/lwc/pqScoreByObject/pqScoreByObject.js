import { LightningElement, api } from 'lwc';
import getHealthScoresForAccountPlan from '@salesforce/apex/HealthScoreController.getIndividualHealthScoresForAccountPlan';

import { formatLabel } from 'c/stringUtils';
import Points_Breakdown_Label from '@salesforce/label/c.Points_Breakdown';
export default class PqScoreByObject extends LightningElement {
    @api recordId;

    @api objectWidth = 180;

    @api objectHeight = 180;

    isLoading = false;

    isLoaded = true;

    scoreWrappers = [];

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
        await getHealthScoresForAccountPlan({ accountPlanId: this.recordId }).then((result) => {
            this.scoreWrappers = result;
            this.setupBarChartConfig();
            this.isLoaded = true;
            this.isLoading = false;
        });
    }

    setupBarChartConfig() {
        this.scoreWrappers.forEach((scoreWrapper) => {
            scoreWrapper.config = {
                type: 'bar',
                data: {
                    labels: [''],
                    datasets: [
                        {
                            label: 'Score',
                            backgroundColor: scoreWrapper.color,
                            data: [scoreWrapper.points]
                        },
                        {
                            backgroundColor: 'rgb(200, 200, 200)',
                            data: [scoreWrapper.maxPoints - scoreWrapper.points]
                        }
                    ]
                },
                options: {
                    indexAxis: 'y',
                    plugins: {
                        title: {
                            display: true,
                            position: 'bottom',
                            font: {
                                size: 12
                            },
                            text: formatLabel(Points_Breakdown_Label, [
                                scoreWrapper.points.toString(),
                                scoreWrapper.maxPoints.toString()
                            ]),
                            padding: {
                                top: -40
                            }
                        },
                        legend: {
                            display: false
                        }
                    },
                    datasets: {
                        bar: {
                            maxBarThickness: 20
                        }
                    },
                    responsive: true,
                    scales: {
                        x: {
                            stacked: true,
                            display: false
                        },
                        y: {
                            stacked: true,
                            display: false
                        }
                    }
                }
            };
        });
    }
}