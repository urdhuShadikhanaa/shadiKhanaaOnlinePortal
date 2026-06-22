import { LightningElement, track, wire, api } from 'lwc';

// Apex calls
import getMatrixByRelationshipMap from '@salesforce/apex/RelationshipMapMemberController.getMatrixByRelationshipMap';
import getMapMembers from '@salesforce/apex/RelationshipMapMemberController.getMapMembersByMapId';
import getIndividualMapMember from '@salesforce/apex/RelationshipMapMemberController.getMatrixMemberByIdORContactId';
import upsertMapMember from '@salesforce/apex/RelationshipMapMemberController.upsertMapMember';
import getUserRecordAccess from '@salesforce/apex/UserRecordAccessServiceController.getUserRecordAccess';
import getMapParent from '@salesforce/apex/RelationshipMapMemberController.getParentIdForRelationshipMapId';

// Labels
import Delete_Map_Member from '@salesforce/label/c.Delete_Relationship_Map_Member';
import Delete_Map_Member_Confirmation from '@salesforce/label/c.Delete_Relationship_Map_Member_Confirmation';

// Object Info
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import MapMemberObj from '@salesforce/schema/Relationship_Map_Member__c';

export default class RelationshipInfluenceForRelationshipMap extends LightningElement {
    _mapId;

    @track canUpdateInfluenceSupport = false;

    @track influence = [];

    @track isLoading = false;

    @track memberLabel = '';

    @track members = [];

    @track support = [];

    permissionDeleteMembers = false;

    canEditParentRecord = false;

    parentId = null;

    label = {
        Delete_Map_Member,
        Delete_Map_Member_Confirmation
    };

    /** *****************
     Flag/label loading
    *******************/

    @wire(getObjectInfo, { objectApiName: MapMemberObj })
    wiredGetLabel({ data }) {
        if (data) {
            this.memberLabel = data.label;
            this.canUpdateInfluenceSupport =
                data.fields.pqcrush__SupportId__c.updateable && data.fields.pqcrush__InfluenceId__c.updateable;
            this.permissionDeleteMembers = data.deletable;
        }
    }

    /** ***********
     Data loading
    *************/

    @api get mapId() {
        return this._mapId;
    }

    set mapId(val) {
        this._mapId = val;
        this.getParentPermission();
        this.loadData();
    }

    get canEdit() {
        return this.canEditParentRecord && this.canUpdateInfluenceSupport;
    }

    get canDelete() {
        return this.permissionDeleteMembers && this.canEditParentRecord;
    }

    loadData() {
        this.isLoading = true;
        this.getInitialData()
            .then(() => {
                return this.getMapMemberData();
            })
            .then(() => {
                this.isLoading = false;
            })
            .catch((error) => {
                this.fireErrorEvent('An error occurred while loading data', error.body.message);
                this.isLoading = false;
            });
    }

    async getInitialData() {
        await this.getMatrixData();
    }

    async getMatrixData() {
        let matrix = await getMatrixByRelationshipMap({ mapId: this.mapId });

        this.influence = matrix?.influenceList;
        this.support = matrix?.supportList;
    }

    async getMapMemberData() {
        let rawSteaks = await getMapMembers({ mapId: this.mapId });

        this.members = rawSteaks;
    }

    async getParentPermission() {
        this.parentId = null;
        this.canEditParentRecord = false;
        getMapParent({ mapId: this.mapId }).then((parentId) => {
            if (parentId) {
                this.parentId = parentId;
                getUserRecordAccess({ recordId: this.parentId }).then((access) => {
                    this.canEditParentRecord = access.HasAllAccess || access.HasEditAccess;
                });
            } else {
                this.canEditParentRecord = true;
            }
        });
    }

    /** ****************
     Data manipulation
    ******************/

    handleRefreshMembers() {
        this.isLoading = true;
        this.getMapMemberData()
            .then(() => {
                this.isLoading = false;
            })
            .catch((error) => {
                this.fireErrorEvent('An error occurred while loading data', error.body.message);
                this.isLoading = false;
            });
    }

    handleMemberMoved(event) {
        let memberId = event.detail.memberId;
        let newInfluence = event.detail.targetInfluence;
        let newSupport = event.detail.targetSupport;

        const index = this.findMemberIndexForId(memberId);
        let member = this.members[index];

        member.influence = newInfluence;
        member.support = newSupport;
        this.replaceMemberAtIndex(member, index);

        let params = {
            memberId: memberId,
            influence: newInfluence,
            support: newSupport
        };

        upsertMapMember(params)
            .then(() => {
                this.fireApplicationEvent('MATRIX_UPDATED', memberId, true);
            })
            .catch((error) => {
                this.handleRefreshMembers();
                this.fireErrorEvent('An error occurred while updating member', error.body.message);
            });
    }

    handleMemberUpdated(event) {
        let recordId = event.detail.recordId;

        getIndividualMapMember({
            objectId: recordId,
            mapId: this._mapId
        }).then((result) => {
            this.findAndUpdateMember(result);
        });
    }

    findAndUpdateMember(updatedMember) {
        if (updatedMember) {
            const index = this.findMemberIndexForId(updatedMember.id);

            this.replaceMemberAtIndex(updatedMember, index);
        }
    }

    findMemberIndexForId(id) {
        const index = this.members.findIndex((item) => {
            return item.id === id;
        });

        return index;
    }

    replaceMemberAtIndex(updatedMember, index) {
        let members = this.members;

        members[index] = updatedMember;
        this.members = [...members];
    }

    handleMemberRemoved(event) {
        let memberId = event.detail.recordId;
        let updatedArray = this.members.filter((item) => {
            return item.id !== memberId;
        });

        this.members = updatedArray;
    }

    handleEditMemberClicked(event) {
        const objectId = event.detail.objectId;
        const canEdit = event.detail.canEdit;
        const modal = this.template.querySelector('c-pq-matrix-member-modal');

        modal.open('pqcrush__Relationship_Map_Member__c', objectId, this.influence, this.support, {}, canEdit);
    }

    handleMatrixMemberSuccess() {
        this.handleRefreshMembers();
        this.fireApplicationEvent('MATRIX_UPDATED', null, true);
    }

    /** *************
     Event handling
    ***************/

    bubbleEvent(event) {
        const passedEvent = new CustomEvent(event.type, {
            detail: event.detail
        });

        this.dispatchEvent(passedEvent);
    }

    fireApplicationEvent(eventName, eventValue, shouldUpdateSystemViews) {
        const evt = new CustomEvent('pqapplicationevent', {
            detail: { name: eventName, value: eventValue, refreshViews: shouldUpdateSystemViews }
        });

        this.dispatchEvent(evt);
    }

    fireErrorEvent(title, message) {
        const evt = new CustomEvent('showerror', {
            detail: { title: title, message: message }
        });

        this.dispatchEvent(evt);
    }

    @api
    handleApplicationEvent(eventName, eventValue) {
        switch (eventName) {
            case 'RM_EDIT_SETTINGS_SAVE_SUCCESS':
                this.loadData();
                break;
            default:
                break;
        }
        let influenceChart = this.template.querySelector('c-relationship-influence-chart');

        if (influenceChart) {
            influenceChart.handleApplicationEvent(eventName, eventValue);
        }
    }
}