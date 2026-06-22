import { LightningElement, api } from 'lwc';

export default class PqIllustrationLwc extends LightningElement {
    @api imageUrl;

    @api title;

    @api body;

    @api detail;
}