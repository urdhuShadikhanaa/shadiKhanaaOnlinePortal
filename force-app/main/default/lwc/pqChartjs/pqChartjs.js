import { LightningElement, api } from 'lwc';
import chartjs from '@salesforce/resourceUrl/chartjs';
import resizeobserver from '@salesforce/resourceUrl/resizeobserver';
import { loadScript } from 'lightning/platformResourceLoader';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class PqChartjs extends LightningElement {
    @api chartConfig;

    @api width;

    @api height;

    isChartJsInitialized;

    myChart;

    renderedCallback() {
        if (this.isChartJsInitialized) {
            return;
        }

        // Load chartjs from the static resource
        Promise.all([loadScript(this, chartjs), loadScript(this, resizeobserver)])
            .then(() => {
                this.isChartJsInitialized = true;
                const ctx = this.template.querySelector('canvas.barChart');

                this.myChart = new window.Chart(ctx, JSON.parse(JSON.stringify(this.chartConfig)));
            })
            .catch((error) => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error loading Chart',
                        message: error.message,
                        variant: 'error'
                    })
                );
            });
    }

    @api update(newData) {
        if (this.myChart) {
            this.myChart.data = JSON.parse(JSON.stringify(newData));
            this.myChart.update();
        }
    }
}