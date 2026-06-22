import { LightningElement, api } from 'lwc';

export default class WsTableColumnHeader extends LightningElement {
    @api colIndex;

    @api headerObject = {};

    hasParent = false;

    hasChildren = false;

    isBlock = false;

    labelStyle = 'width: 150px;';

    @api
    get tileSize() {
        return this._tileSize;
    }

    set tileSize(value) {
        if (!value || value === this._tileSize) {
            return;
        }
        this._tileSize = value;
        this.labelStyle = `width: ${value}px;`;
    }

    _tileSize = 150;

    @api get currentStyle() {
        let style = 'ws-col-header ws-col-header-block';

        if (this.hasParent) {
            style += '-child';
        }
        if (this.hasChildren) {
            style += '-parent';
        }
        if (this.headerObject.stateHeaderHighlighted) {
            style += '-highlight';
        }

        return style;
    }

    connectedCallback() {
        if (this.headerObject.parentObjectId) {
            this.hasParent = true;
        }

        if (this.headerObject.childIds) {
            this.hasChildren = true;
        }

        this.isBlock = !this.hasParent && !this.hasChildren;
    }

    // ---------------------------------------

    handleParentHeaderClick() {
        // Fire event so that all child headers and cells in row/column will hide
        this.dispatchEvent(
            new CustomEvent('parentheadertoggled', {
                bubbles: true,
                composed: true,
                detail: {
                    parentColumnIndex: this.colIndex,
                    parentHeaderObject: this.headerObject
                }
            })
        );
    }

    // ---------------------------------------

    handleMouseOver() {
        // Fire event that this parent header is highlighted.  Handled by child column headers and cells.
        this.dispatchEvent(
            new CustomEvent('parentheaderhighlighted', {
                bubbles: true,
                composed: true,
                detail: {
                    dimension: 'column',
                    parentColumnIndex: this.colIndex,
                    parentHeaderObject: this.headerObject
                }
            })
        );
    }

    handleMouseOut() {
        // Fire event that this parent header is unhighlighted.  Handled by child column headers and cells.
        this.dispatchEvent(
            new CustomEvent('parentheaderunhighlighted', {
                bubbles: true,
                composed: true,
                detail: {
                    dimension: 'column',
                    parentColumnIndex: this.colIndex,
                    parentHeaderObject: this.headerObject
                }
            })
        );
    }

    // ---------------------------------------
}