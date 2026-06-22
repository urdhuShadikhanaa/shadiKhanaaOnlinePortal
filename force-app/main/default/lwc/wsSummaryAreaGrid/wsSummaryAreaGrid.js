import { LightningElement, api } from 'lwc';

export default class WsSummaryAreaGrid extends LightningElement {
    @api headerData;

    @api summaryData;
}