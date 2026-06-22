import { LightningElement, api } from 'lwc';
import LABEL_FILTER from '@salesforce/label/c.Filter';

export default class AccountOppFilters extends LightningElement {
    labels = {
        filter: LABEL_FILTER
    };

    _filters = [];

    @api
    get filters() {
        return this._filters;
    }

    set filters(value = []) {
        this._filters = value;
    }

    @api isFiltered = false;

    get buttonVariant() {
        return this.isFiltered ? 'brand' : 'border-filled';
    }

    handleFiltersChange(event) {
        this.dispatchEvent(
            new CustomEvent('filterschange', {
                detail: event.detail
            })
        );
    }
}