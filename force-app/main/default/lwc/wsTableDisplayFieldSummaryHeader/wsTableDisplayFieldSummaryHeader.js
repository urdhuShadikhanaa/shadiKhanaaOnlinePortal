import { LightningElement, api } from 'lwc';
import { formattedSummaryDisplayData } from 'c/wsDataUtils';

export default class WsTableDisplayFieldSummaryHeader extends LightningElement {
    summaryType;

    summaryValue;

    buttonStyle;

    _displayField;

    @api alternativeText;

    @api canCreateObject = false;

    @api showCount = false;

    @api showTotal = false;

    @api hasMultipleRecords = false;

    rowSelection;

    columnSelection;

    _rowOptions = [];

    @api get rowOptions() {
        return this._rowOptions;
    }

    set rowOptions(value) {
        this._rowOptions = value;
        this.rowSelection = value[0]?.value;
    }

    get hasRowSelection() {
        return this.rowOptions.length > 0;
    }

    _columnOptions = [];

    @api get columnOptions() {
        return this._columnOptions;
    }

    set columnOptions(value) {
        this._columnOptions = value;
        this.columnSelection = value[0]?.value;
    }

    get hasColumnSelection() {
        return this.columnOptions.length > 0;
    }

    @api
    get displayField() {
        return this._displayField;
    }

    set displayField(displayField) {
        this._displayField = displayField;
        this.summaryType = displayField.type;
        this.buttonStyle = `border-color: ${displayField.color};`;
        this.summaryValue = formattedSummaryDisplayData(displayField.type, displayField.data);
    }

    get displayName() {
        const count = this.displayField?.data?.length ?? 0;

        return this.showCount ? `${count} ${this.displayField.displayName}` : this.displayField.displayName;
    }

    handleRowSelectionChange(event) {
        this.rowSelection = event.detail.value;
    }

    handleColumnSelectionChange(event) {
        this.columnSelection = event.detail.value;
    }

    buttonClickHandler() {
        const evt = new CustomEvent('addnewentry', {
            detail: {
                rowId: this.rowSelection,
                columnId: this.columnSelection
            }
        });

        this.dispatchEvent(evt);
    }
}