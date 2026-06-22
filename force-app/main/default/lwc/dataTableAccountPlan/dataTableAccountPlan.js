import { LightningElement, api, wire } from 'lwc';

// Apex calls
import getAccountPlansByMasterAccountPlan from '@salesforce/apex/MasterAccountPlanController.getAccountPlansByMasterAccountPlan';
import getClosedPlanFilter from '@salesforce/apex/MasterAccountPlanController.getClosedPlanFilter';
import updateClosedPlanFilter from '@salesforce/apex/MasterAccountPlanService.updateClosedPlanFilter';
import { publish, MessageContext } from 'lightning/messageService';
import MASTER_ACCOUNT_PLAN_DATA_CHANNEL from '@salesforce/messageChannel/masterAccountPlanData__c';

export default class DataTableAccountPlan extends LightningElement {
    @api recordId;

    @api objectApiName;

    @api title = 'Account Plans';

    @api columns = '';

    @api sortableFields = 'Name,AccountName,AccountPlanScore';

    @api sortedBy = 'Name';

    @api sortedDirection = 'asc';

    @api useRelativeMaxHeight = false;

    @api customRelativeMaxHeight;

    @api showOpportunitiesForDescendentAccounts = false;

    @api filtersBasedOnData = false;

    @wire(MessageContext) messageContext;

    accountId;

    showSpinner = false;

    filterObj = null;

    subscription = null;

    loaded = false;

    influence = [];

    support = [];

    canEditAccountPlan = false;

    matrixData;

    showClosedPlans;

    get baseDatatable() {
        return this.template.querySelector('c-pq-datatable');
    }

    async connectedCallback() {
        await this.initializeTable();
    }

    async initializeTable() {
        let tableData = [];
        const masterAccountPlanId = this.recordId;

        this.loaded = false;

        await getClosedPlanFilter({ masterAccountPlanId})
            .then((result) => {
                this.showClosedPlans = result;
            })
            .catch(() => {
                // Console.log(error.message);
            });

        await getAccountPlansByMasterAccountPlan({ masterAccountPlanId })
            .then((result) => {
                tableData = result;
                this.loaded = true;
            })
            .catch(() => {
                // Console.log(error.message);
            });

        let tableColumns = [
            {
                label: 'Account Plan',
                type: 'customName',
                fieldName: 'Name',
                typeAttributes: {
                    href: {
                        fieldName: 'Id'
                    },
                    target: '_target',
                    columnName: 'Account Plan',
                    objectApiName: 'pqcrush__Account_Plan__c',
                    fieldApiName: 'Name'
                }
            },
            {
                label: 'Account',
                type: 'customName',
                fieldName: 'AccountName',
                typeAttributes: {
                    href: {
                        fieldName: 'AccountId'
                    },
                    target: '_target',
                    columnName: 'Account',
                    objectApiName: 'Account',
                    fieldApiName: 'AccountName'
                }
            },
            {
                label: 'Score',
                type: 'text',
                fieldName: 'AccountPlanScore'
            }
        ];

        this.baseDatatable.initializeTable(tableColumns, this.flattenData(tableData));
    }

    flattenData(tableData) {
        tableData.forEach((item) => {
            item.AccountName = item.pqcrush__Account__r.Name;
            item.AccountId = item.pqcrush__Account__r.Id;
            item.AccountPlanScore = item.pqcrush__Account_Plan_Score__c;
        });

        return tableData;
    }

    handleRefresh() {
        this.initializeTable();
    }

    handleMenuSelect(event) {
        const selectedItemValue = event.detail.value;

        if (selectedItemValue === 'showDescendantOpps') {
            updateClosedPlanFilter( {showClosedPlans: !this.showClosedPlans, masterAccountPlanId: this.recordId}).then((result) => {
                this.showClosedPlans = result;
                this.initializeTable();
                this.publishMessage();
            });
        }
    }

    publishMessage() {
        const message = {
            recordId: this.recordId,
            action: 'refresh'
        };

        publish(this.messageContext, MASTER_ACCOUNT_PLAN_DATA_CHANNEL, message);
    }

    handleRowAction() {}

    handleMatrixMemberSuccess() {
        this.initializeTable();
    }
}