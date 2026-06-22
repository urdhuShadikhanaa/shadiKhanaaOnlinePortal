/* eslint-disable @lwc/lwc/no-api-reassignments */
import { LightningElement, api } from 'lwc';
import getDatatableData from '@salesforce/apex/AccountOppDataTableController.getDatatableData';
import getFilters from '@salesforce/apex/AccountOppDataTableController.getFilters';
import getAccountPlanById from '@salesforce/apex/AccountPlanController.getAccountPlanById';

import { updateRecord } from 'lightning/uiRecordApi';

import FILTER_ID from '@salesforce/schema/Opportunity_List_User_Filter__c.Id';
import FILTER_FILTERS from '@salesforce/schema/Opportunity_List_User_Filter__c.Filters__c';
import LABEL_SHOW_CHILD_ACCOUNTS from '@salesforce/label/c.Show_Data_For_Child_Accounts';

import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { reduceErrors } from 'c/ldsUtils';
import { flattenQueryResult } from './utils';
import { isNotEmpty } from 'c/utils';

const buildFilterObj = (filters = [], tableData = [], filtersBasedOnData = false) => {
    const filterObj = {};

    filters.forEach((filter) => {
        if (filter.type === 'picklist' || filter.type === 'multipicklist') {
            if (filtersBasedOnData) {
                const existingValues = tableData.map((row) => row[filter.name]);

                filter.values = filter.values.filter((filterItem) => existingValues.includes(filterItem.value));
            }
            if (filter.selectedValues?.length > 0) {
                filterObj[filter.name] = {
                    type: filter.type,
                    selectedValues: filter.selectedValues
                };
            }
        }
        if (filter.type === 'date' || filter.type === 'datetime') {
            if (isNotEmpty(filter.startDate) || isNotEmpty(filter.endDate)) {
                filterObj[filter.name] = {
                    type: filter.type,
                    startDate: filter.startDate,
                    endDate: filter.endDate
                };
            }
        }
    });

    return filterObj;
};

export default class AccountOppDatatable extends LightningElement {
    labels = {
        showChildAccounts: LABEL_SHOW_CHILD_ACCOUNTS
    };

    @api recordId;

    @api objectApiName;

    @api title = 'Account Opportunities';

    @api columns = 'Name, Account.Name, Amount, StageName';

    @api sortableFields;

    @api sortedBy;

    @api sortedDirection = 'asc';

    @api useRelativeMaxHeight = false;

    @api customRelativeMaxHeight;

    @api showOpportunitiesForDescendentAccounts = false;

    @api filtersBasedOnData = false;

    accountId;

    showSpinner = false;

    loaded = false;

    showSettingsMenu = false;

    @api expressions;

    get baseDatatable() {
        return this.template.querySelector('c-pq-datatable');
    }

    filterObj = {};

    get isFiltered() {
        return Object.keys(this.filterObj).length > 0;
    }

    filterId;

    filters = [];

    connectedCallback() {
        this.showSettingsMenu = false;
        getAccountPlanById({ accountPlanId: this.recordId }).then((accountPlan) => {
            if (accountPlan?.pqcrush__Account__c) {
                this.showSettingsMenu = true;
                this.accountId = accountPlan.pqcrush__Account__c;
                getFilters({ accountPlanId: this.recordId, columnsString: this.columns })
                    .then((result) => {
                        this.filterId = result.id;
                        this.filters = result.filters;
                        this.fetchTableCache().then((cache) => {
                            this.filterObj = buildFilterObj(this.filters, cache?.tableData, this.filtersBasedOnData);
                            this.refreshTable();
                        });
                    })
                    .catch((filtersError) => {
                        this._notifyError(`${this.title} error`, reduceErrors(filtersError)[0]);
                    });
            } else {
                this.refreshTable();
            }
        });
    }

    @api async refreshTable() {
        this.showSpinner = true;
        const cache = await this.fetchTableCache();

        this.showSpinner = false;
        if (cache) {
            this.initializeTable(cache);
        }
    }

    async fetchTableCache() {
        const isMaster = this.objectApiName === 'pqcrush__pq_Master_Account_Plan__c';
        let cache;
        let showDesc = isMaster || this.showOpportunitiesForDescendentAccounts;
        let masterAccountPlanId = isMaster ? this.recordId : null;

        try {
            cache = await getDatatableData({
                masterAccountPlanId: masterAccountPlanId,
                accountId: this.accountId,
                columnsString: this.columns,
                conditionString: this.expressions,
                includeDescendantData: showDesc
            });
        } catch (error) {
            this.loaded = true;
            this._notifyError(`${this.title} error`, reduceErrors(error)[0]);
        }
        this.loaded = true;

        return cache;
    }

    handleRefresh() {
        this.refreshTable();
    }

    handleMenuSelect(event) {
        const selectedItemValue = event.detail.value;

        if (selectedItemValue === 'showDescendantOpps') {
            this.showOpportunitiesForDescendentAccounts = !this.showOpportunitiesForDescendentAccounts;
            this.refreshTable();
        }
    }

    handleFiltersChange(event) {
        const { name, propertyName, changeValue } = event.detail;

        this.filters = this.filters.map((filter) => {
            if (filter.name !== name) {
                return filter;
            }

            const updatedFilter = {
                ...filter,
                [propertyName]: changeValue
            };

            return updatedFilter;
        });

        this.fetchTableCache().then((cache) => {
            const filterObj = buildFilterObj(this.filters, cache?.tableData, this.filtersBasedOnData);

            this.filterObj = filterObj;
            this.saveFilters(filterObj);
        });
    }

    initializeTable(cache) {
        const tableData = flattenQueryResult(cache.tableData, cache.objectApiName);

        this.baseDatatable?.initializeTable(cache.tableColumns, tableData);
    }

    saveFilters(filterObj = {}) {
        const fields = {};

        fields[FILTER_ID.fieldApiName] = this.filterId;
        fields[FILTER_FILTERS.fieldApiName] = JSON.stringify(filterObj);
        const recordInput = { fields };

        updateRecord(recordInput).catch((error) => {
            this._notifyError('error', reduceErrors(error)[0]);
        });
    }

    _notifyError(title, error = '') {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message: error,
                variant: 'error',
                mode: 'sticky'
            })
        );
    }
}