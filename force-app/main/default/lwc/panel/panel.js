import { LightningElement, api } from 'lwc';

const OPEN_CLASS = 'slds-is-open';

export default class Panel extends LightningElement {
    @api showUndockOption = false;

    @api showCloseButton = false;

    @api showFooter = false;

    @api panelHeaderStyle;

    // Optional parameter to set fixed height on the panel
    @api panelStyle;

    @api
    set header(value) {
        this.hasHeaderString = value !== '';
        this._headerPrivate = value;
    }

    get header() {
        return this._headerPrivate;
    }

    hasHeaderString = false;

    _headerPrivate;

    @api show() {
        const outerDivEl = this.template.querySelector('div');

        outerDivEl.classList.add(OPEN_CLASS);
    }

    @api hide() {
        const outerDivEl = this.template.querySelector('div');

        outerDivEl.classList.remove(OPEN_CLASS);
    }

    get panelHeaderClass() {
        let css = 'slds-panel__header ';

        if (this.panelHeaderStyle) {
            css += this.panelHeaderStyle;
        }

        return css;
    }

    @api close() {
        this.handleDialogClose();
    }

    handleDialogClose() {
        this.hide();
        const evt = new CustomEvent('panelclose', {
            bubbles: true
        });

        this.dispatchEvent(evt);
    }

    handlePanelUnDock() {
        this.hide();
        const evt = new CustomEvent('panelundock', {
            bubbles: true
        });

        this.dispatchEvent(evt);
    }
}