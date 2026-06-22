import { LightningElement, api } from 'lwc';

export default class WsTemplateList extends LightningElement {
    @api templates;

    selectedTemplateId;

    get templateItems() {
        return this.templates.map((template) => {
            return {
                ...template,
                isSelected: this.selectedTemplateId === template.id
            };
        });
    }

    handleSelect(event) {
        const templateId = event.detail;

        this.selectedTemplateId = templateId;
        const selectionEvent = new CustomEvent('optionselected', {
            detail: templateId
        });

        this.dispatchEvent(selectionEvent);
    }
}