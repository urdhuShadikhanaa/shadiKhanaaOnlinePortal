import { LightningElement, api, wire } from 'lwc';
import { subscribe, publish, MessageContext } from 'lightning/messageService';
import INFLUENCE_CHART_DATA_CHANNEL from '@salesforce/messageChannel/influenceChartData__c';
import RELATIONSHIP_MAP_DATA_CHANNEL from '@salesforce/messageChannel/relationshipMapData__c';
import MAP_MEMBER_LIST_DATA_CHANNEL from '@salesforce/messageChannel/mapMemberListData__c';

// Apex calls
import getMatrixByAccountPlan from '@salesforce/apex/RelationshipMapMemberController.getMatrixByAccountPlan';
import getMatrixByRelationshipMap from '@salesforce/apex/RelationshipMapMemberController.getMatrixByRelationshipMap';
import getUserRecordAccess from '@salesforce/apex/UserRecordAccessServiceController.getUserRecordAccess';
import getMatrixMembers from '@salesforce/apex/InfluenceSupportMatrixController.getMatrixMembers';
import getMapParent from '@salesforce/apex/RelationshipMapMemberController.getParentIdForRelationshipMapId';
import getMapId from '@salesforce/apex/RelationshipMapMemberController.getMapIdForSObjectIdNoCreate';

// Labels
import Edit from '@salesforce/label/c.Edit';
import Influence from '@salesforce/label/c.Influence';
import Support from '@salesforce/label/c.Support';

export default class DataTableMapMember extends LightningElement {
    labels = {
        Edit,
        Influence,
        Support
    };

    @api recordId;

    @api objectApiName;

    @api title = 'Map Members';

    @api columns = '';

    @api sortableFields = 'name, influence, support';

    @api sortedBy = 'name';

    @api sortedDirection = 'asc';

    @api useRelativeMaxHeight = false;

    @api customRelativeMaxHeight;

    @api showOpportunitiesForDescendentAccounts = false;

    @api filtersBasedOnData = false;

    accountId;

    mapId;

    showSpinner = false;

    filterObj = null;

    subscription = null;

    loaded = false;

    influence = [];

    support = [];

    canEditParentRecord = false;

    matrixData;

    @wire(MessageContext) messageContext;

    get baseDatatable() {
        return this.template.querySelector('c-pq-datatable');
    }

    async connectedCallback() {
        await this.getParentPermission();
        await this.getMatrix();
        await this.initializeTable();
        this.subscribeToChannel();
    }

    async getParentPermission() {
        this.mapId = await getMapId({ recordId: this.recordId });
        this.parentId = await getMapParent({ mapId: this.mapId });
        if (this.parentId) {
            await getUserRecordAccess({ recordId: this.parentId }).then((access) => {
                this.canEditParentRecord = access.HasAllAccess || access.HasEditAccess;
            });
        } else {
            this.canEditParentRecord = true;
        }
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
    }

    handleMessage(message) {
        if (message.action === 'refresh' && message.recordId === this.mapId) {
            this.handleRefresh();
        }
    }

    async initializeTable() {
        let tableData = [];
        const listColumnsString = this.columns?.split(',');
        const additionalFields = listColumnsString?.map((item) => {
            return item.trim();
        });
        const mapOrAccountPlanId = this.recordId;

        this.loaded = false;
        await getMatrixMembers({ mapOrAccountPlanId, additionalFields })
            .then((result) => {
                tableData = result;
                this.loaded = true;
            })
            .catch(() => {
                // Console.log(error.message);
            });

        const actions = [{ label: this.labels.Edit, name: 'edit' }];

        const influenceLabel = this.matrixData?.influenceLabel ? this.matrixData.influenceLabel : this.labels.Influence;
        const supportLabel = this.matrixData?.supportLabel ? this.matrixData.supportLabel : this.labels.Support;

        let tableColumns = [
            {
                label: 'Name',
                type: 'customName',
                fieldName: 'name',
                typeAttributes: {
                    href: {
                        fieldName: 'personId'
                    },
                    target: '_target',
                    columnName: 'Name',
                    objectApiName: 'Contact',
                    fieldApiName: 'Name'
                }
            },
            {
                label: influenceLabel,
                type: 'text',
                fieldName: 'influence'
            },
            {
                label: supportLabel,
                type: 'text',
                fieldName: 'support'
            }
        ];

        if (tableData && tableData.length > 0) {
            tableData[0]?.additionalFields?.forEach((item) => {
                if (item.type === 'id') {
                    tableColumns.push({
                        label: item.label,
                        type: 'customName',
                        fieldName: 'additionalFields.label.' + item.name,
                        typeAttributes: {
                            href: {
                                fieldName: 'additionalFields.value.' + item.name
                            },
                            target: '_target',
                            columnName: 'additionalFields.label.' + item.name,
                            objectApiName: 'Contact',
                            fieldApiName: 'Name'
                        }
                    });
                } else {
                    tableColumns.push({
                        type: this.getLocalType(item.type),
                        label: item.label,
                        fieldName: 'additionalFields.value.' + item.name
                    });
                }
            });

            tableData.forEach((item) => {
                item?.additionalFields?.forEach((field) => {
                    item['additionalFields.value.' + field.name] = field.value;
                    item['additionalFields.label.' + field.name] = field.valueDisplay;
                });
            });
        }

        // Add actions
        if (this.canEditParentRecord) {
            tableColumns.push({
                type: 'action',
                typeAttributes: { rowActions: actions }
            });
        }

        this.baseDatatable.initializeTable(tableColumns, tableData);
    }

    handleRefresh() {
        this.initializeTable();
    }

    getLocalType(apexType) {
        switch (apexType?.toLowerCase()) {
            case 'boolean':
                return 'boolean';
            case 'currency':
                return 'currency';
            case 'date':
            case 'datetime':
                return 'date';
            case 'integer':
            case 'double':
            case 'long':
                return 'number';
            case 'percent':
                return 'customPercent';
            case 'phone':
                return 'phone';
            case 'time':
                return 'text';
            case 'url':
                return 'url';
            case 'address':
            case 'anytype':
            case 'base64':
            case 'datacategorygroupreference':
            case 'email':
            case 'encryptedstring':
            case 'id':
            case 'location':
            case 'multipicklist':
            case 'picklist':
            case 'reference':
            case 'string':
            case 'textarea':
            default:
                return 'text';
        }
    }

    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;

        switch (actionName) {
            case 'edit':
                this.editRow(row);
                break;
            default:
        }
    }

    async getMatrix() {
        if (this.objectApiName === 'pqcrush__Account_Plan__c') {
            this.matrixData = await getMatrixByAccountPlan({ accountPlanId: this.recordId });
        } else {
            this.matrixData = await getMatrixByRelationshipMap({ mapId: this.recordId });
        }

        this.influence = this.matrixData?.influenceList;
        this.support = this.matrixData?.supportList;
    }

    async editRow(row) {
        const objectId = row.id;
        let canEdit = false;

        await getUserRecordAccess({ recordId: objectId }).then((access) => {
            canEdit = access.HasAllAccess || access.HasEditAccess;
        });

        const modal = this.template.querySelector('c-pq-matrix-member-modal');
        const memberType = 'pqcrush__Relationship_Map_Member__c';

        modal.open(memberType, objectId, this.influence, this.support, {}, canEdit);
    }

    handleMatrixMemberSuccess() {
        this.initializeTable();
        this.publishMessage();
    }
}