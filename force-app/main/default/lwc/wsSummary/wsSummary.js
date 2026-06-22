import { LightningElement, api } from 'lwc';
import { getAmountSumsForCells } from 'c/wsDataUtils';
import { getMathResult } from 'c/utils';

import ROW_SUMMARIES from '@salesforce/label/c.Row_Summaries';
import COLUMN_SUMMARIES from '@salesforce/label/c.Column_Summaries';

export default class WsSummary extends LightningElement {
    labels = {
        rowSummaries: ROW_SUMMARIES,
        columnSummaries: COLUMN_SUMMARIES
    };

    showSummaryBreakDown = false;

    summaryValues = [];

    rowSummaries = [];

    columnSummaries = [];

    _rows = [];

    _columns = [];

    _cells = [];

    _amountTypes = [];

    _highlights = [];

    _summaryFormulas = [];

    @api get summaryFormulas() {
        return this._summaryFormulas;
    }

    set summaryFormulas(summaryFormulas) {
        this._summaryFormulas = summaryFormulas;
        this.calculateSummary();
    }

    @api get rows() {
        return this._rows;
    }

    set rows(values) {
        this._rows = values.filter((value) => {
            return value.visible;
        });
        this.calculateSummary();
    }

    @api get columns() {
        return this._columns;
    }

    set columns(values) {
        this._columns = values.filter((value) => {
            return value.visible;
        });
        this.calculateSummary();
    }

    @api get cells() {
        return this._cells;
    }

    set cells(values) {
        this._cells = [...values];
        this.calculateSummary();
    }

    @api get amountTypes() {
        return this._amountTypes;
    }

    set amountTypes(values) {
        this._amountTypes = values.filter((value) => value.visible);
        this.showSummaryBreakDown = this._amountTypes.length > 0;
        this.calculateSummary();
    }

    @api get highlights() {
        return this._highlights;
    }

    set highlights(values) {
        this._highlights = values.filter((value) => value.visible).map((value) => value.id);
        this.calculateSummary();
    }

    @api filters = {
        hiddenHighlights: [],
        hiddenRows: [],
        hiddenColumns: [],
        hiddenAmountTypes: []
    };

    connectedCallback() {
        this.calculateSummary();
    }

    calculateSummary() {
        if (this.template.isConnected) {
            const visibleCells = this.cells.filter((cell) => {
                return (
                    this.rows.find((row) => row.id === cell.rowId) &&
                    this.columns.find((column) => column.id === cell.columnId)
                );
            });

            const pre_summaryItems = getAmountSumsForCells(visibleCells, this.highlights);
            const summaryItems = this.addSummaryFormula(pre_summaryItems);

            this.rowSummaries = this.rows.map((row) => {
                return {
                    id: row.id,
                    name: row.name,
                    data: this.filterOutAmountTypes(summaryItems.rows[row.id])
                };
            });

            this.columnSummaries = this.columns.map((column) => {
                return {
                    id: column.id,
                    name: column.name,
                    data: this.filterOutAmountTypes(summaryItems.columns[column.id])
                };
            });

            if (summaryItems.displayFields && summaryItems.displayFields.length) {
                this.summaryValues = this.filterOutAmountTypes(summaryItems.displayFields);
            }
        }
    }

    addSummaryFormula(summaryItems) {
        Object.values(summaryItems.rows).forEach((row) => {
            this.processRowOrCol(row);
        });

        Object.values(summaryItems.columns).forEach((col) => {
            this.processRowOrCol(col);
        });

        if (summaryItems.displayFields && summaryItems.displayFields.length) {
            summaryItems.displayFields.forEach((item) => {
                item.visible = true;
            });
        } else {
            summaryItems.displayFields = [];
        }

        if (this.summaryFormulas) {
            this.summaryFormulas.forEach((formula) => {
                summaryItems.displayFields.push({
                    displayName: formula.pqcrush__Label__c,
                    id: formula.Id,
                    type: formula.pqcrush__Display_Type__c,
                    color: formula.pqcrush__Color__c,
                    visible: false,
                    isFormula: true
                });
            });
        }

        return summaryItems;
    }

    processRowOrCol(rowOrCol) {
        if (!this.summaryFormulas) {
            return;
        }

        this.summaryFormulas.forEach((formula) => {
            let equation = formula.pqcrush__Formula__c;

            rowOrCol.forEach((item) => {
                let keyx = '{'.concat(item.displayName);

                keyx = keyx.concat('}');
                equation = equation.replace(new RegExp(keyx, 'gi'), item.value);
                keyx = '{'.concat(item.abbreviation);
                keyx = keyx.concat('}');
                equation = equation.replace(new RegExp(keyx, 'gi'), item.value);
            });
            let isInvalidResult = /{\s*[^}{]*}(.*?)/g.test(equation); // Test if there are any params not matched above (anything inside curly braces)

            // eslint-disable-next-line no-useless-escape
            const sanitizedEquation = equation.replace(/[^-*()\d\/+.]/g, ''); // Remove everything except numbers, +, -, *, /, (, ), .

            let result = 0;

            try {
                result = getMathResult(sanitizedEquation);
            } catch (e) {
                if (e instanceof SyntaxError) {
                    isInvalidResult = true;
                    // eslint-disable-next-line no-console
                    console.log(e.message);
                }
            }

            rowOrCol.push({
                displayName: formula.pqcrush__Label__c,
                id: formula.Id,
                type: isInvalidResult ? 'text' : formula.pqcrush__Display_Type__c,
                color: formula.pqcrush__Color__c,
                value: isInvalidResult ? '-' : result,
                sum: result,
                selected: true,
                isFormula: true
            });
        });
    }

    filterOutAmountTypes(data) {
        if (!data) {
            return [];
        }

        const newData = data.filter((dataItem) => {
            return dataItem.isFormula || this.amountTypes.find((at) => at.Id === dataItem.id);
        });

        return newData;
    }
}