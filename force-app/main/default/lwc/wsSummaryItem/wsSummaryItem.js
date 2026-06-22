import { LightningElement, api } from 'lwc';

export default class WsSummaryItem extends LightningElement {
    @api label = '';

    @api type = '';

    @api value = '';

    @api color = '';

    get style() {
        return `background-color: ${this.color};`;
    }
}