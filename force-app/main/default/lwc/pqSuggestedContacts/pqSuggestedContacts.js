import { LightningElement, api, track, wire } from 'lwc';
import { subscribe, publish, MessageContext } from 'lightning/messageService';
import INFLUENCE_CHART_DATA_CHANNEL from '@salesforce/messageChannel/influenceChartData__c';
import RELATIONSHIP_MAP_DATA_CHANNEL from '@salesforce/messageChannel/relationshipMapData__c';
import MAP_MEMBER_LIST_DATA_CHANNEL from '@salesforce/messageChannel/mapMemberListData__c';
// Apex calls
import getUserRecordAccess from '@salesforce/apex/UserRecordAccessServiceController.getUserRecordAccess';
import getMapParent from '@salesforce/apex/RelationshipMapMemberController.getParentIdForRelationshipMapId';
import getMapId from '@salesforce/apex/RelationshipMapMemberController.getMapIdForSObjectIdNoCreate';
import getRMOrgSettingForType from '@salesforce/apex/SuggestedContactsController.getRMOrgSettingForType';
import getSuggestedContactsByAccountPlan from '@salesforce/apex/SuggestedContactsController.getSuggestedContactsByAccountPlan';
import getSuggestedContactsByRelationshipMap from '@salesforce/apex/SuggestedContactsController.getSuggestedContactsByRelationshipMap';
import insertRelationshipMapMember from '@salesforce/apex/SuggestedContactsController.insertRelationshipMapMember';
import getContactsConditions from '@salesforce/apex/SuggestedContactsController.getContactsConditions';

export default class PqSuggestedContacts extends LightningElement {
    @api recordId;
    @api objectApiName;
    @api contactLimit;
    @api settingType;
    @track columns = [];
    @track resultJsonList = [];
    @track selectedContacts = [];
    @track filtereddContacts = [];
    @track getSuggestedContactsResult = [];
    selectedContactsSize = [];
    _settingType = '';
    errorMessage = '';
    accountId;
    settingId;
    conditionOperator;
    conditions;
    mapId;
    subscription = null;
    loaded = false;
    canEditParentRecord = false;
    settings = null;
    // showSuggestedContacts = true;
    _contactLimit = '';
    page = 1; //initialize 1st page
    items = []; //contains all the records.
    data = []; //data displayed in the table
    startingRecord = 1; //start record position per page
    endingRecord = 0; //end record position per page
    pageSize; //default value we are assigning
    totalRecountCount = 0; //total record count received from all retrieved records
    totalPage = 0; //total number of page is needed to display all records
    selectedRows = [];
    isPreviousDisable = true;
    isNextDisable = true;
    @wire(MessageContext) messageContext;
    get disableAddSelectedRecButton() {
        return this.selectedContactsSize.length < 1;
    }
    publishMessage() {
        const message = {
            recordId: this.mapId,
            action: 'refresh'
        };
        publish(this.messageContext, MAP_MEMBER_LIST_DATA_CHANNEL, message);
    }
    subscribeToChannel() {
        if (this.subscription) {
            return;
        }
        // Subscribing to the message channel
        this.subscription = subscribe(this.messageContext, INFLUENCE_CHART_DATA_CHANNEL, (message) => {
            this.handleMessage(message);
        });
        subscribe(this.messageContext, RELATIONSHIP_MAP_DATA_CHANNEL, (message) => {
            this.handleMessage(message);
        });
        subscribe(this.messageContext, MAP_MEMBER_LIST_DATA_CHANNEL, (message) => {
            this.handleMessage(message);
        });
    }
    handleMessage(message) {
        if (message.action === 'refresh' && message.recordId === this.mapId) {
            this.handleRefresh();
        }
    }
    async connectedCallback() {
        await this.loadSettings();
        //if (this.showSuggestedContacts) {
        await this.getParentPermission();
        await this.loadContactConditions();
        await this.getSuggestedContacts();
        await this.initializeTable();
        //}
    }
    async loadSettings() {
        this.errorMessage = null;
        if (this.settingType !== null && this.settingType !== undefined) {
            this._settingType = this.settingType;
        } else if (this.objectApiName === 'Account') {
            this._settingType = 'rm';
        } else {
            this._settingType = 'keystakeholder';
        }

        await getRMOrgSettingForType({
            type: this._settingType
        })
            .then((result) => {
                this.settingId = result?.Id;
                this.conditionOperator = result?.pqcrush__Operator__c;
                //this.showSuggestedContacts = result?.pqcrush__Enable_Suggested_Contacts_For_RM__c;
                if (this.contactLimit !== null && this.contactLimit !== undefined) {
                    this._contactLimit = this.contactLimit;
                } else {
                    this._contactLimit = result?.pqcrush__contact_limit__c;
                }
            })
            .catch((error) => {
                this.errorMessage = error?.body?.message;
            });
    }
    async loadContactConditions() {
        await getContactsConditions({
            settingId: this.settingId
        }).then((result) => {
            this.conditions = result;
        });
    }
    async getParentPermission() {
        this.mapId = await getMapId({
            recordId: this.recordId
        });
        this.parentId = await getMapParent({
            mapId: this.mapId
        });
        if (this.parentId) {
            await getUserRecordAccess({
                recordId: this.parentId
            }).then((access) => {
                this.canEditParentRecord = access.HasAllAccess || access.HasEditAccess;
            });
        } else {
            this.canEditParentRecord = true;
        }
    }
    async getSuggestedContacts() {
        if (this.objectApiName === 'pqcrush__Account_Plan__c') {
            this.getSuggestedContactsResult = await getSuggestedContactsByAccountPlan({
                accountPlanId: this.recordId,
                conditions: this.conditions,
                operator: this.conditionOperator
            });
        } else {
            this.getSuggestedContactsResult = await getSuggestedContactsByRelationshipMap({
                mapId: this.recordId,
                conditions: this.conditions,
                operator: this.conditionOperator
            });
        }
    }
    async initializeTable() {
        this.columns = [
            {
                label: 'Name',
                fieldName: 'contactName'
            },
            {
                label: 'Title',
                fieldName: 'contactTitle'
            },
            {
                label: 'Days Since Last Activity',
                fieldName: 'activityDays'
            }
        ];
        let jsonData = [];
        if (this.getSuggestedContactsResult !== null) {
            for (let member of this.getSuggestedContactsResult) {
                const date1 = new Date(member.relatedContact.LastModifiedDate);
                const date2 = new Date();
                const dayDifference = date2.getTime() - date1.getTime();

                let dataTableJson = {
                    mapId: member.member.pqcrush__Relationship_Map__c,
                    activityDays: Math.floor(dayDifference / (1000 * 60 * 60 * 24)),
                    contactId: member.relatedContact.Id,
                    contactName: member.relatedContact.Name,
                    contactFirstName: member.relatedContact.FirstName,
                    contactLastName: member.relatedContact.LastName,
                    contactTitle: member.relatedContact.Title ? member.relatedContact.Title : ''
                };
                jsonData = [...jsonData, dataTableJson];
            }
            this.filtereddContacts = jsonData;
            this.pageSize = this._contactLimit;
            this.resultJsonList = jsonData;
            this.items = this.resultJsonList;
            this.totalRecountCount = this.resultJsonList.length;
            this.pageSize = this.totalRecountCount < this._contactLimit ? this.totalRecountCount : this._contactLimit;
            this.totalPage = Math.ceil(this.totalRecountCount / this.pageSize);
            //here we slice the data according page size
            this.resultJsonList = this.items.slice(0, this.pageSize);
            this.endingRecord = this.pageSize;
            this.isNextDisable = this.page === this.totalPage || this.totalPage === 0;
            this.isPreviousDisable = this.page === 1 || this.totalRecountCount < this.pageSize;
            this.loaded = true;
        } else {
            this.loaded = true;
        }
    }
    async handleRefresh() {
        this.loaded = false;
        await this.getSuggestedContacts();
        await this.initializeTable();
    }
    handleRowSelect(event) {
        let updatedItemsSet = new Set();
        let selectedItemsSet = new Set(this.selectedContactsSize);
        let loadedItemsSet = new Set();
        this.resultJsonList.map((ele) => {
            loadedItemsSet.add(ele.contactId);
            return ele;
        });
        if (event.detail.selectedRows) {
            event.detail.selectedRows.map((ele) => {
                updatedItemsSet.add(ele.contactId);
                return ele;
            });
            updatedItemsSet.forEach((id) => {
                if (!selectedItemsSet.has(id)) {
                    selectedItemsSet.add(id);
                }
            });
        }
        loadedItemsSet.forEach((id) => {
            if (selectedItemsSet.has(id) && !updatedItemsSet.has(id)) {
                // Remove any items that were unselected.
                selectedItemsSet.delete(id);
            }
        });
        this.selectedContactsSize = [...selectedItemsSet];
    }
    handleAddSelectedRec() {
        this.page = 1; //initialize 1st page
        this.items = []; //contains all the records.
        this.startingRecord = 1; //start record position per page
        this.endingRecord = 0; //end record position per page
        this.totalRecountCount = 0; //total record count received from all retrieved records
        this.totalPage = 0; //total number of page is needed to display all records
        this.isPreviousDisable = true;
        this.isNextDisable = true;
        if (this.selectedContactsSize.length > 0) {
            for (let contactId of this.selectedContactsSize) {
                for (let i = 0; i < this.filtereddContacts.length; i++) {
                    if (this.filtereddContacts[i].contactId === contactId) {
                        this.selectedContacts.push(this.filtereddContacts[i]);
                    }
                }
            }
            let recordsToInsert = [];
            for (let contact of this.selectedContacts) {
                let record = {
                    pqcrush__Contact__c: contact.contactId,
                    pqcrush__Relationship_Map__c: contact.mapId
                };
                recordsToInsert = [...recordsToInsert, record];
            }
            insertRelationshipMapMember({
                mapMember: recordsToInsert
            }).then((result) => {
                for (let relationshipMapMember of result) {
                    this.filtereddContacts = this.filtereddContacts.filter(
                        (item) => item.contactId !== relationshipMapMember.pqcrush__Contact__c
                    );
                }
                this.resultJsonList = this.filtereddContacts;
                this.pageSize = this._contactLimit;
                this.items = this.resultJsonList;
                this.totalRecountCount = this.resultJsonList.length;
                this.pageSize =
                    this.totalRecountCount < this._contactLimit ? this.totalRecountCount : this._contactLimit;
                this.totalPage = Math.ceil(this.totalRecountCount / this.pageSize);
                //here we slice the data according page size
                this.resultJsonList = this.items.slice(0, this.pageSize);
                this.endingRecord = this.pageSize;
                this.isNextDisable = this.page === this.totalPage || this.totalPage === 0;
                this.isPreviousDisable = this.page === 1 || this.totalRecountCount < this.pageSize;
                this.selectedContactsSize = [];
                this.selectedContacts = [];
                this.publishMessage();
            });
        }
    }
    previousHandler() {
        if (this.page > 1) {
            this.page = this.page - 1;
            this.displayRecordPerPage(this.page);
        }
    }
    //press on next button this method will be called
    nextHandler() {
        if (this.page < this.totalPage && this.page !== this.totalPage) {
            this.page = this.page + 1;
            this.displayRecordPerPage(this.page);
        }
    }
    displayRecordPerPage(page) {
        this.startingRecord = (page - 1) * this.pageSize;
        this.endingRecord = this.pageSize * page;
        this.endingRecord = this.endingRecord > this.totalRecountCount ? this.totalRecountCount : this.endingRecord;
        this.resultJsonList = this.items.slice(this.startingRecord, this.endingRecord);
        this.startingRecord = this.startingRecord + 1;
        this.isNextDisable = this.page === this.totalPage || this.totalPage === 0;
        this.isPreviousDisable = this.page === 1 || this.totalRecountCount < this.pageSize;
        this.template.querySelector('[data-id="datatable"]').selectedRows = this.selectedContactsSize;
    }
}