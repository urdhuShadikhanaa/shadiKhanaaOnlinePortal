import { LightningElement, api } from 'lwc';

export default class WsTableCellBackground extends LightningElement {
    @api rowId;

    @api columnId;

    @api rowIndex;

    @api colIndex;

    @api cell = {};

    @api isEmpty = false;

    @api highlightAsSibling = false;

    @api highlightAsChild = false;

    @api type = '';

    backgroundColor = '';

    cssClass = '';

    _initialRender = true;

    _showSpinner = false;

    showSpinner() {
        this._showSpinner = true;
    }

    hideSpinner() {
        this._showSpinner = false;
    }

    @api
    set tile(data) {
        this._tile = data;
        this.updateHighlightStyling();
    }

    get tile() {
        return this._tile;
    }

    _tile;

    @api
    set tileCount(count) {
        this._tileCount = count === 0 ? 1 : count;
    }

    get tileCount() {
        return this._tileCount;
    }

    _tileCount = 1;

    get cellBackingStyle() {
        // Cell Backing Style States
        // Default                  Pass-through to empty/data
        // StateSelected            Selected
        // StateHovered             Highlighted on hover
        // StateSiblingHighlighted  Highlighed as sibling
        // StateHeaderHighlighted   Highlighted as child of header or child of header parent

        let _style = this._tile.id + '-ws-cell ws-cell'; // Default

        if (this.type === 'tiles') {
            let colCount = Math.ceil(Math.sqrt(this._tileCount));

            colCount = colCount > 5 ? 5 : colCount;
            _style += ' ws-cell-tiles ws-cell-col-count-' + colCount;
        } else {
            _style += ' ws-cell-single';
        }

        if (this.isEmpty) {
            _style += ' ws-cell-empty';
        }

        if (this._tile.stateSelected) {
            _style += ' ws-cell-selected';

            return _style;
        }

        if (this._tile.stateHovered) {
            _style += ' highlightCell';

            return _style;
        }

        if (this.highlightAsSibling) {
            _style += ' highlightSiblings';
        }

        if (this.highlightAsChild) {
            _style += ' highlightAsChild';
        }

        if (!this.tile.visible) {
            _style += ' hidden';
        }

        return _style;
    }

    get cellHighlightClass() {
        return this._tile.id + '-ws-highlight-layer ws-highlight-layer';
    }

    renderedCallback() {
        if (this._initialRender) {
            this.updateHighlightStyling();
        }
        this._initialRender = false;
    }

    updateHighlightStyling() {
        let color =
            this._tile && this._tile.highlight && this._tile.highlight.pqcrush__Color__c
                ? this._tile.highlight.pqcrush__Color__c
                : 'unset';

        this.backgroundColor = 'background-color:' + color;
    }

    handleMouseOver() {
        this.dispatchEvent(
            new CustomEvent('cellhighlight', {
                bubbles: true,
                composed: true,
                detail: {
                    rowIndex: this.rowIndex,
                    colIndex: this.colIndex,
                    rowId: this.rowId,
                    columnId: this.columnId,
                    tileId: this._tile.id
                }
            })
        );
    }

    handleMouseOut() {
        this.dispatchEvent(
            new CustomEvent('cellunhighlight', {
                bubbles: true,
                composed: true,
                detail: {
                    rowIndex: this.rowIndex,
                    colIndex: this.colIndex,
                    rowId: this.rowId,
                    columnId: this.columnId,
                    tileId: this._tile.id
                }
            })
        );
    }

    handleCellClick() {
        this.dispatchEvent(
            new CustomEvent('cellselected', {
                bubbles: true,
                composed: true,
                detail: {
                    rowId: this.rowId,
                    columnId: this.columnId,
                    tileId: this._tile.id,
                    showSpinner: this.showSpinner.bind(this),
                    hideSpinner: this.hideSpinner.bind(this)
                }
            })
        );
    }
}