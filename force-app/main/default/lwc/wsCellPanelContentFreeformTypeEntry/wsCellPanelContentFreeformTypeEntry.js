import { LightningElement, api } from 'lwc';

export default class WsCellPanelContentFreeformTypeEntry extends LightningElement {
    @api allowEdit = false;

    @api
    set amount(amountObject) {
        const field = JSON.parse(JSON.stringify(amountObject));

        if (!field.data) {
            field.data = [];
        }
        if (field.data.length === 0) {
            field.data.push({ value: 0, displayName: field.displayName, objectId: null });
        }
        this._amount = field;
    }

    get amount() {
        return this._amount;
    }

    _amount = null;

    // --------------------------------------------------

    handleValueSaved(event) {
        const { dataObjId, updatedValue } = event.detail;
        let displayFieldId = this.amount.id;

        const detail = {
            dataId: dataObjId,
            displayFieldId: displayFieldId,
            updatedValue: updatedValue
        };

        const editRecordEvent = new CustomEvent('freeformsaved', {
            detail: detail
        });

        this.dispatchEvent(editRecordEvent);
    }

    // --------------------------------------------------
}