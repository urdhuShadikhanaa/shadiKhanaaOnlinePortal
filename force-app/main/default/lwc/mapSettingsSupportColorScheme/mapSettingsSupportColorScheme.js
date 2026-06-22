import { LightningElement, api } from 'lwc';
import Support_Color_Scheme from '@salesforce/label/c.Support_Color_Scheme';

export default class SupportColorScheme extends LightningElement {
    @api colorItems;

    @api loading = false;

    label = {
        Support_Color_Scheme
    };

    handleOnColorChange(event) {
        const evt = new CustomEvent('colorchange', {
            detail: { value: event.srcElement.value, name: event.srcElement.name }
        });

        this.dispatchEvent(evt);
    }
}