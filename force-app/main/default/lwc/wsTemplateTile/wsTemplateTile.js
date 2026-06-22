import { LightningElement, api, track } from 'lwc';
import columns from '@salesforce/label/c.Columns';
import rows from '@salesforce/label/c.Rows';
import labelLimitException from '@salesforce/label/c.error_exceeds_limit_of';
import labelLessThanMinimum from '@salesforce/label/c.warning_less_than_minimum';
import filterDataByAccount from '@salesforce/label/c.White_Space_Data_By_Account';
import hideUnfilterableCellData from '@salesforce/label/c.Hide_Unfilterable_Cell_Data';

import { formatLabel } from 'c/stringUtils';
import { MaxRecordSize } from 'c/wsTemplatePickerUtils';

const warningIconProps = {
    iconName: 'utility:error',
    alternativeText: 'Error!',
    size: 'xx-small',
    variant: 'error',
    class: 'slds-m-right_xx-small',
    title: formatLabel(labelLimitException, [MaxRecordSize])
};

const warningMinimumIconProps = {
    iconName: 'utility:warning',
    alternativeText: 'Warning!',
    size: 'xx-small',
    variant: 'warning',
    class: 'slds-m-right_xx-small',
    title: formatLabel(labelLessThanMinimum)
};

export default class WsTemplateTile extends LightningElement {
    @api title = '';

    @api columnData;

    @api rowData;

    @api rowCount;

    @api columnCount;

    @api showCellFilter = false;

    @api areCellsFiltered = false;

    @api hasUnrelatedCellTypes = false;

    @api areUnrelatedCellsFiltered = false;

    @api picklistSourceObjectLabel = '';

    label = {
        columns,
        rows,
        filterDataByAccount,
        hideUnfilterableCellData
    };

    @track loading = {
        column: false,
        row: false
    };

    get warningIconProps() {
        return warningIconProps;
    }

    get warningMinimumIconProps() {
        return warningMinimumIconProps;
    }

    get isColumnSizeInvalid() {
        return this.columnData.exceedsLimit;
    }

    get isRowSizeInvalid() {
        return this.rowData.exceedsLimit;
    }

    get isColumnSizeZero() {
        return this.columnData.lessThanMinimum;
    }

    get isRowSizeZero() {
        return this.rowData.lessThanMinimum;
    }

    get showUnrelatedCellFilter() {
        return this.showCellFilter && this.areCellsFiltered && this.hasUnrelatedCellTypes;
    }

    handleHeaderCheck(event) {
        const { name, checked } = event.target;
        const checkEvent = new CustomEvent('headerfiltercheck', {
            detail: {
                name,
                checked
            }
        });

        this.dispatchEvent(checkEvent);
    }

    handleCellCheck(event) {
        const checkEvent = new CustomEvent('cellfiltercheck', {
            detail: {
                checked: event.target.checked
            }
        });

        this.dispatchEvent(checkEvent);
    }

    handleUnrelatedCellCheck(event) {
        const checkEvent = new CustomEvent('unrelatedcellfiltercheck', {
            detail: {
                checked: event.target.checked
            }
        });

        this.dispatchEvent(checkEvent);
    }

    @api setLoading(type, value) {
        this.loading[type] = value;
    }
}