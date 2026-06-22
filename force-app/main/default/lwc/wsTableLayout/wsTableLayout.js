import { LightningElement, api } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import lodash from '@salesforce/resourceUrl/lodash';

const tableDataTypes = {
    column: 'column',
    row: 'row'
};

export default class WsTableLayout extends LightningElement {
    @api zoomFactor = 1; // Deprecated but cannot remove due to managed package

    @api columns = [];

    @api rows = [];

    @api totalRowCount = 0;

    @api totalColumnCount = 0;

    @api isLoading;

    @api visibleAmountTypes;

    @api permissions;

    @api tileSize = 150;

    _checkIfNeedsMoreRows;

    _checkIfNeedsMoreColumns;

    _tableInitialized = false;

    async renderedCallback() {
        if (this._tableInitialized) {
            this.evaluateScrollers();

            return;
        }

        this._tableInitialized = true;
        this._tableContainerRef = this.template.querySelector('.ws-table-container');

        try {
            await loadScript(this, lodash);
            this._checkIfNeedsMoreRows = _.throttle(this.checkIfNeedsMoreRows, 300).bind(this);
            this._checkIfNeedsMoreColumns = _.throttle(this.checkIfNeedsMoreColumns, 300).bind(this);
        } catch (error) {
            this._checkIfNeedsMoreRows = this.checkIfNeedsMoreRows.bind(this);
            this._checkifNeedsMoreColumns = this.checkIfNeedsMoreColumns.bind(this);
        } finally {
            this.evaluateScrollers();
        }
    }

    evaluateScrollers() {
        if (this.rows.length < this.totalRowCount) {
            if (this.hasVerticalOverflow()) {
                this._tableContainerRef.addEventListener('scroll', this._checkIfNeedsMoreRows);
                this.checkIfNeedsMoreRows();
            } else {
                this.requestMoreData(tableDataTypes.row);
            }
        } else {
            this._tableContainerRef.removeEventListener('scroll', this._checkIfNeedsMoreRows);
        }
        if (this.columns.length < this.totalColumnCount) {
            if (this.hasHorizontalOverflow()) {
                this._tableContainerRef.addEventListener('scroll', this._checkIfNeedsMoreColumns);
                this.checkIfNeedsMoreColumns();
            } else {
                this.requestMoreData(tableDataTypes.column);
            }
        } else {
            this._tableContainerRef.removeEventListener('scroll', this._checkIfNeedsMoreColumns);
        }
    }

    // Handles the scroll event for infinite row loading
    checkIfNeedsMoreRows() {
        if (
            this._tableContainerRef.scrollTop + this._tableContainerRef.clientHeight >=
            this._tableContainerRef.scrollHeight - 100
        ) {
            this.requestMoreData(tableDataTypes.row);
        }
    }

    // Handles the scroll event for infinite column loading
    checkIfNeedsMoreColumns() {
        if (
            this._tableContainerRef.scrollLeft + this._tableContainerRef.clientWidth >=
            this._tableContainerRef.scrollWidth - 100
        ) {
            this.requestMoreData(tableDataTypes.column);
        }
    }

    hasHorizontalOverflow() {
        return this._tableContainerRef.scrollWidth > this._tableContainerRef.clientWidth;
    }

    hasVerticalOverflow() {
        return this._tableContainerRef.scrollHeight > this._tableContainerRef.clientHeight;
    }

    requestMoreData(tableDataType) {
        switch (tableDataType) {
            case tableDataTypes.column:
                this.dispatchEvent(new CustomEvent('loadmorecolumns'));
                break;
            case tableDataTypes.row:
                this.dispatchEvent(new CustomEvent('loadmorerows'));
                break;
            default:
                break;
        }
    }
}