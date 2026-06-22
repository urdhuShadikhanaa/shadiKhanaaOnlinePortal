import { LightningElement, api } from 'lwc';

import cancel_label from '@salesforce/label/c.Cancel';

export default class ModalForConfirmation extends LightningElement {
    message;

    callerData;

    modalTitle;

    mainActionLabel;

    alternativeActionLabel;

    messageOptions;

    messageOptionsValue;

    messageSelectedValue;

    labels = {
        cancel_label
    };

    @api open(
        title,
        message,
        callerData,
        mainActionTitle,
        alternativeActionTitle,
        messageOptions,
        messageOptionsValue
    ) {
        this.modalTitle = title;
        this.message = message;
        this.callerData = callerData;
        this.mainActionLabel = mainActionTitle;
        this.alternativeActionLabel = alternativeActionTitle;
        this.messageOptions = messageOptions;
        this.messageOptionsValue = messageOptionsValue;
        if (Array.isArray(messageOptionsValue)) {
            this.messageSelectedValue = messageOptionsValue;
        }
        this.template.querySelector('c-modal').show();
    }

    handleCancelClick() {
        this.hide();
    }

    handleOptionChange(event) {
        this.messageSelectedValue = event.detail.value;
    }

    handleMainActionClick() {
        const evt = new CustomEvent('mainactionclicked', {
            detail: {
                callerData: this.callerData,
                messageOptions: this.messageOptions,
                messageSelectedValue: Array.isArray(this.messageSelectedValue)
                    ? this.messageSelectedValue[0]
                    : undefined
            }
        });

        this.dispatchEvent(evt);
        this.hide();
    }

    handleAlternativeActionClick() {
        const evt = new CustomEvent('alternativeactionclicked', {
            detail: {
                callerData: this.callerData,
                messageOptions: this.messageOptions,
                messageSelectedValue: Array.isArray(this.messageSelectedValue)
                    ? this.messageSelectedValue[0]
                    : undefined
            }
        });

        this.dispatchEvent(evt);
        this.hide();
    }

    hide() {
        const modal = this.template.querySelector('c-modal');

        modal.hide();
    }

    handleCancel() {}
}