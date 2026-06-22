import { LightningElement, api } from 'lwc';

import { NavigationMixin } from 'lightning/navigation';

import EXPAND_COLLAPSE from '@salesforce/label/c.Expand_Collapse';
import ZOOM_OUT from '@salesforce/label/c.Zoom_Out';
import ZOOM_IN from '@salesforce/label/c.Zoom_In';
import EXIT_FULL_SCREEN from '@salesforce/label/c.Exit_Full_Screen';
import FULL_SCREEN from '@salesforce/label/c.Full_Screen';
import HIGHLIGHTS from '@salesforce/label/c.Highlights';
import AMOUNT_TYPES from '@salesforce/label/c.Amount_Types';
import ROWS from '@salesforce/label/c.Rows';
import COLUMNS from '@salesforce/label/c.Columns';
import ACTIONS from '@salesforce/label/c.Actions';
import EDIT_ROWS_COLUMNS from '@salesforce/label/c.Edit_Rows_Columns';
import NEW_DATA_TYPE from '@salesforce/label/c.New_Data_Type';
import NEW_SUMMARY_FORMULA from '@salesforce/label/c.New_Summary_Formula';
import DELETE from '@salesforce/label/c.Delete';
import FILTER from '@salesforce/label/c.Filter';
import CROSS_SELL_MAP from '@salesforce/label/c.Cross_Sell_Map';
import SHOW_UNHIGHLIGHTED from '@salesforce/label/c.Show_Unhighlighted';
import REFRESH from '@salesforce/label/c.Refresh';
import ROWS_WITH_DATA from '@salesforce/label/c.Rows_With_Data';
import COLUMNS_WITH_DATA from '@salesforce/label/c.Columns_With_Data';
import ROWS_WITHOUT_DATA from '@salesforce/label/c.Rows_Without_Data';
import COLUMNS_WITHOUT_DATA from '@salesforce/label/c.Columns_Without_Data';

export default class WsHeader extends NavigationMixin(LightningElement) {
    labels = {
        actions: ACTIONS,
        amountTypes: AMOUNT_TYPES,
        existFullScreen: EXIT_FULL_SCREEN,
        columns: COLUMNS,
        emptyColumns: COLUMNS_WITHOUT_DATA,
        populatedColumns: COLUMNS_WITH_DATA,
        delete: DELETE,
        editRowsColumns: EDIT_ROWS_COLUMNS,
        filter: FILTER,
        highlights: HIGHLIGHTS,
        newDataType: NEW_DATA_TYPE,
        newSummaryFormula: NEW_SUMMARY_FORMULA,
        refresh: REFRESH,
        rows: ROWS,
        emptyRows: ROWS_WITHOUT_DATA,
        populatedRows: ROWS_WITH_DATA,
        toggleParents: EXPAND_COLLAPSE,
        wsTitle: CROSS_SELL_MAP,
        zoomIn: ZOOM_IN,
        zoomOut: ZOOM_OUT,
        showUnhighlighted: SHOW_UNHIGHLIGHTED
    };

    amountTypesSelected = [];

    columnsSelected = [];

    highlightsSelected = [];

    isExpanded = false;

    rowsSelected = [];

    showHierarchyButton = false;

    _amountTypes = [];

    _columns = [];

    _highlights = [];

    _rows = [];

    _cellDisplayType = 'tiles';

    @api showCreateDataType = false;

    @api showCreateSummaryFormulas = false;

    @api showDeleteWs = false;

    @api showEditHeaders = false;

    @api showUnhighlghted;

    @api showPopulatedRows;

    @api showUnpopulatedRows;

    @api showPopulatedColumns;

    @api showUnpopulatedColumns;

    @api showRecordPageNavLink = false;

    @api recordId;

    @api get cellDisplayType() {
        return this._cellDisplayType;
    }

    set cellDisplayType(value) {
        this._cellDisplayType = value;
        this.showHierarchyButton = this._cellDisplayType !== 'tiles';
    }

    get showActionMenu() {
        return this.showEditHeaders || this.showCreateSummaryFormulas || this.showDeleteWs || this.showCreateDataType;
    }

    @api get highlights() {
        return this._highlights;
    }

    set highlights(values) {
        if (Array.isArray(values)) {
            const selected = [];

            this._highlights = values.map((value) => {
                if (value.visible) {
                    selected.push(value.id);
                }

                return {
                    label: value.label,
                    value: value.id
                };
            });
            this.highlightsSelected = selected;
        } else {
            this._highlights = [];
        }
    }

    @api get amountTypes() {
        return this._amountTypes;
    }

    set amountTypes(values) {
        if (Array.isArray(values)) {
            const amountTypesSelected = [];

            this._amountTypes = values.map((value) => {
                if (value.visible) {
                    amountTypesSelected.push(value.Id);
                }

                return {
                    label: value.Name,
                    value: value.Id
                };
            });
            this.amountTypesSelected = amountTypesSelected;
        } else {
            this._amountTypes = [];
        }
    }

    @api get rows() {
        return this._rows;
    }

    set rows(values) {
        let rowValues = [
            { name: this.labels.emptyRows, id: '||EmptyRows||', filtered: !this.showUnpopulatedRows },
            { name: this.labels.populatedRows, id: '||PopulatedRows||', filtered: !this.showPopulatedRows },
            ...values
        ];
        const rowsSelected = [];

        this._rows = rowValues.map((value) => {
            if (!value.filtered) {
                rowsSelected.push(value.id);
            }

            return {
                label: value.name,
                value: value.id
            };
        });
        this.rowsSelected = rowsSelected;
    }

    @api get columns() {
        return this._columns;
    }

    set columns(values) {
        let columnValues = [
            { name: this.labels.emptyColumns, id: '||EmptyColumns||', filtered: !this.showUnpopulatedColumns },
            { name: this.labels.populatedColumns, id: '||PopulatedColumns||', filtered: !this.showPopulatedColumns },
            ...values
        ];
        const columnsSelected = [];

        this._columns = columnValues.map((value) => {
            if (!value.filtered) {
                columnsSelected.push(value.id);
            }

            return {
                label: value.name,
                value: value.id
            };
        });
        this.columnsSelected = columnsSelected;
    }

    get screenSizeLabel() {
        return this.isExpanded ? EXIT_FULL_SCREEN : FULL_SCREEN;
    }

    get screenSizeIcon() {
        return this.isExpanded ? 'utility:contract_alt' : 'utility:expand_alt';
    }

    handleClick(event) {
        switch (event.target.value) {
            case REFRESH:
                this.dispatchEvent(new CustomEvent('refresh'));
                break;
            case EXPAND_COLLAPSE:
                this.dispatchEvent(new CustomEvent('toggleparents'));
                break;
            case ZOOM_OUT:
                this.dispatchEvent(new CustomEvent('zoomout'));
                break;
            case ZOOM_IN:
                this.dispatchEvent(new CustomEvent('zoomin'));
                break;
            case EXIT_FULL_SCREEN:
                this.isExpanded = false;
                this.dispatchEvent(new CustomEvent('exitfullscreen'));
                break;
            case FULL_SCREEN:
                this.isExpanded = true;
                this.dispatchEvent(new CustomEvent('enterfullscreen'));
                break;

            // No Default
        }
    }

    handleMenuSelect(event) {
        const menuAction = event.detail.value;

        this.dispatchEvent(
            new CustomEvent('menuactionselected', {
                detail: {
                    value: menuAction
                }
            })
        );
    }

    handleFiltersChange(event) {
        const name = event.target.name;
        const valuesSelected = event.detail.value;

        this[`${name}Selected`] = [...valuesSelected];
        const valuesHidden = this[name]
            .filter((item) => {
                return valuesSelected.indexOf(item.value) === -1;
            })
            .map((item) => {
                return item.value;
            });

        this.dispatchEvent(
            new CustomEvent('filterschange', {
                detail: {
                    name,
                    valuesHidden
                }
            })
        );
    }

    handleShowUnhighlightedChange(event) {
        const showUnhighlighted = event.detail.checked;

        this.dispatchEvent(
            new CustomEvent('showunhighlightedchange', {
                detail: {
                    showUnhighlighted
                }
            })
        );
    }

    navigateToRecordViewPage() {
        if (document.referrer.indexOf('.lightning.force.com') > 0) {
            this[NavigationMixin.Navigate]({
                type: 'standard__recordPage',
                attributes: {
                    recordId: this.recordId,
                    actionName: 'view'
                }
            });
        } else {
            window.location.assign('/' + this.recordId);
        }
    }

    passthroughEvent(event) {
        const passedEvent = new CustomEvent(event.type, {
            detail: event.detail
        });

        // Dispatches the event.
        this.dispatchEvent(passedEvent);
    }
}