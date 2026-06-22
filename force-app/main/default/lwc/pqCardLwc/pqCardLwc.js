import { LightningElement, api } from 'lwc';

export default class PqCardLwc extends LightningElement {
    @api iconName;

    @api title;

    @api variant;

    @api footer;
}