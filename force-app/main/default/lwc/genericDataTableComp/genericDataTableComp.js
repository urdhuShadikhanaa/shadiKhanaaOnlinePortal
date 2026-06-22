import { LightningElement, wire, api } from 'lwc';
import getOptions from '@salesforce/apex/GetAccountPlanChild.getRelatedChild';
import RelatedListObjects from '@salesforce/label/c.Related_List_Objects';

export default class GenericDataTableComp extends LightningElement {
    options = [];
    _selectedValue = [];
    flagElement = false;
    relatedListLabel = RelatedListObjects;
    @api defaultvalues;
    get selected() {
        return this._selectedValue.length ? this._selectedValue : 'none';
        
    }
    handleChange(event) {
        this._selectedValue = event.detail.value;
        this.dispatchEvent(
            new CustomEvent('sendgenereicdata', {
                detail: { _selectedValue: this._selectedValue },
                bubbles: true,
                composed: true
            })
        );
    }

    @wire(getOptions)
    wiredOptions({ error, data }) {
        if (data) {
            this.options = data.map((option) => ({
                label: option.label,
                value: option.value
            }));
        } else if (error) {
            this.error = error;
        }
    }
}