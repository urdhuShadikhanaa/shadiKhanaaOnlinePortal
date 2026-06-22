import { LightningElement, api } from 'lwc';

const CSS_CLASS = 'modal-hidden';

export default class PPOmniViewerModal extends LightningElement {
    showViewer = false;

    showHeader = true;

    showFooter = true;

    hasHeaderString = false;

    isDocked = true;

    _header;

    @api
    set header(value) {
        this.hasHeaderString = value !== '';
        this._header = value;
    }

    get header() {
        return this._header;
    }

    @api show() {
        this.showViewer = true;
    }

    @api hide() {
        this.showViewer = false;
    }

    @api dockViewer() {
        this.isDocked = true;
        const dockViewer = new CustomEvent('dockomniviewer');

        this.dispatchEvent(dockViewer);
    }

    @api undockViewer() {
        this.isDocked = false;
    }

    async connectedCallback() {
        document.addEventListener('keyup', (e) => {
            if (e.key === 'Escape') {
                this.hide();
            }
        });
    }

    handleDialogClose(event) {
        if (event.currentTarget === event.target) {
            // Let parent know that dialog is closed (mainly by that cross button) so it can set proper variables if needed
            const closedialog = new CustomEvent('closedialog');

            this.dispatchEvent(closedialog);
            this.hide();
        }
    }

    handleSlotFooterChange() {
        // Only needed in "show" state. If hiding, we're removing from DOM anyway
        // Added to address Issue #344 where querySelector would intermittently return null element on hide
        if (this.showViewer === false) {
            return;
        }
        const footerEl = this.template.querySelector('footer');

        footerEl?.classList?.remove(CSS_CLASS);
    }
}