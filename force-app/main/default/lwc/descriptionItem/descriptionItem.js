import { LightningElement, api } from 'lwc';

export default class DescriptionItem extends LightningElement {
    @api detail;

    @api label;

    @api loading = false;

    @api iconName = 'utility:metrics';
}