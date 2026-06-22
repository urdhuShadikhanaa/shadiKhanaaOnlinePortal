import { LightningElement, api, wire, track } from 'lwc';
import getFieldLableAndFieldAPI from '@salesforce/apex/GetFieldLableAndFieldAPIForColumns.getFieldLableAndFieldAPI';
import getchildrecordata from '@salesforce/apex/GetChildRecordsWithFieldSet.childRecordsWithFieldSet';
import getObjectNameForLabel from '@salesforce/apex/GetChildRecordsWithFieldSet.getObjectName';
import No_Data_Available from '@salesforce/label/c.No_Data_Available';
export default class GenericDataTableComponent extends LightningElement {
    @api sObjectName;
    @api recordId;
    objectName = '';
    columns = [];
    loaded = false;
    @track data = [];
    @track sortBy;
    @track sortDirection;
    @api planId;
    No_Data_Available = No_Data_Available;

    get isData() {
        return this.data.length > 0 ? true : false;
    }

    renderedCallback() {
        if (this.loaded) {
            let style = document.createElement('style');
            style.innerText =
                '.slds-card__body {margin-bottom: 0 !important;} .dt-outer-container .slds-table_header-fixed_container .slds-scrollable_y {width:100% !important;} .slds-table.slds-table_header-fixed.slds-table_bordered: {width:100% !important;}';
        }
    }

    connectedCallback() {
        getObjectNameForLabel({ objectApiName: this.sObjectName })
            .then((result) => {
                this.objectName = result;
            })
            .catch((error) => {
                this.error = error;
            });
        getchildrecordata({ objectApiName: this.sObjectName, parentId: this.recordId })
            .then((result) => {
                let temp = JSON.parse(result);
                for (let i = 0; i < temp.length; i++) {
                    // eslint-disable-next-line guard-for-in
                    for (let key in temp[i]) {
                        let str = key;
                        let res = str.split('__');
                        // eslint-disable-next-line no-useless-concat
                        if (res[2] === 'r') {
                            let kee = res[0] + '__' + res[1] + '__c';
                            temp[i][kee] = temp[i][key].Name;
                        }
                    }
                }
                this.data = temp;
                this.loaded = true;
            })
            .catch((error) => {
                this.error = error;
            });
    }
    @wire(getFieldLableAndFieldAPI, { objectName: '$sObjectName' })
    wiredChildRecords({ error, data }) {
        if (data) {
            this.columns = data.map((field) => {
                return {
                    label: field.label,
                    fieldName: field.value,
                    type: 'text', // Adjust the type based on your field types
                    sortable: 'true'
                };
            });
        } else if (error) {
            this.error = error;
            this.contacts = undefined;
        }
    }
    doSorting(event) {
        this.sortBy = event.detail.fieldName;
        this.sortDirection = event.detail.sortDirection;
        this.sortData(this.sortBy, this.sortDirection);
    }

    sortData(fieldname, direction) {
        let parseData = JSON.parse(JSON.stringify(this.data));
        // Return the value stored in the field
        let keyValue = (a) => {
            return a[fieldname];
        };
        // cheking reverse direction
        let isReverse = direction === 'asc' ? 1 : -1;
        // sorting data
        parseData.sort((x, y) => {
            x = keyValue(x) ? keyValue(x) : ''; // handling null values
            y = keyValue(y) ? keyValue(y) : '';
            // sorting values based on direction
            return isReverse * ((x > y) - (y > x));
        });
        this.data = parseData;
    }
}