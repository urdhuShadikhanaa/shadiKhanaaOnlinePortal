import { LightningElement, api } from 'lwc';

export default class WsTemplateListItem extends LightningElement {
    @api templateId;

    @api name;

    @api columnName;

    @api rowName;

    @api isSelected;

    get computedClass() {
        const isSelectedClass = this.isSelected ? 'slds-has-focus' : '';

        return `slds-listbox__option slds-listbox__option_plain ${isSelectedClass}`;
    }

    handleClick() {
        const selectEvent = new CustomEvent('select', {
            detail: this.templateId
        });

        this.dispatchEvent(selectEvent);
    }
}