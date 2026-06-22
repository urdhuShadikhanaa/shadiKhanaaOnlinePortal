import { LightningElement, api } from 'lwc';
import picklist from './picklist.html';
import date from './date.html';
import dateTime from './dateTime.html';
import defaultType from './filterType.html';

const renderHtml = {
    picklist: picklist,
    multipicklist: picklist,
    date: date,
    datetime: dateTime
};

export default class FilterType extends LightningElement {
    @api filter = {};

    render() {
        if (renderHtml[this.filter.type]) {
            return renderHtml[this.filter.type];
        }

        return defaultType;
    }

    handleFiltersChange(event) {
        const name = event.target.name;
        const changeValue = event.detail.value;
        const propertyName = 'selectedValues';

        this.dispatchEvent(
            new CustomEvent('filterschange', {
                detail: {
                    name,
                    propertyName,
                    changeValue
                }
            })
        );
    }

    handleDateChange(event) {
        const name = event.currentTarget.dataset.filterName;
        const changeValue = event.detail.value;
        const propertyName = event.target.name;

        this.dispatchEvent(
            new CustomEvent('filterschange', {
                detail: {
                    name,
                    propertyName,
                    changeValue
                }
            })
        );
    }
}