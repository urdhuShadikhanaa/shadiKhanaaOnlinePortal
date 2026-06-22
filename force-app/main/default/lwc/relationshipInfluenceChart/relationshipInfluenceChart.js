import { LightningElement, track, api, wire } from 'lwc';
import { publish, subscribe, MessageContext } from 'lightning/messageService';
import INFLUENCE_CHART_DATA_CHANNEL from '@salesforce/messageChannel/influenceChartData__c';
import MAP_MEMBER_LIST_DATA_CHANNEL from '@salesforce/messageChannel/mapMemberListData__c';
import RELATIONSHIP_MAP_DATA_CHANNEL from '@salesforce/messageChannel/relationshipMapData__c';

import { formatLabel } from 'c/stringUtils';
import Cancel from '@salesforce/label/c.Cancel';
import Confirm from '@salesforce/label/c.Confirm';
import error_you_do_not_have_permission_to_perform_this_action from '@salesforce/label/c.error_you_do_not_have_permission_to_perform_this_action';
import Exit_Full_Screen from '@salesforce/label/c.Exit_Full_Screen';
import Full_Screen from '@salesforce/label/c.Full_Screen';
import Influence_Chart from '@salesforce/label/c.Influence_Chart';
import Loading from '@salesforce/label/c.Loading';
import Refresh from '@salesforce/label/c.Refresh';
import Remove from '@salesforce/label/c.Remove';
import View_Contact_Details from '@salesforce/label/c.View_Contact_Details';
import View_Map_Member_Details from '@salesforce/label/c.View_Map_Member_Details';

import getUserRecordAccess from '@salesforce/apex/UserRecordAccessServiceController.getUserRecordAccess';

import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import ContactObj from '@salesforce/schema/Contact';
import { deleteRecord } from 'lightning/uiRecordApi';

export default class RelationshipInfluenceChart extends LightningElement {
    @api containerId;

    @api mapId;

    @api canDrag = false;

    @api deleteModalHeader = '';

    @api deleteConfirmationMessage = '';

    @api isLoading = false;

    @track canDeleteMemberRecord = false;

    @track menuItems = [];

    @track isExpanded = false;

    @track isSaving = false;

    @track fullscreenClass = '';

    @track formattedData = [];

    @track visibleSupport = [];

    contactLabel = '';

    recordIdToDelete = null;

    _bodyOverflow;

    subscription = null;

    @wire(MessageContext) messageContext;

    _defaultDeleteModalClasses = 'slds-modal';

    _defaultBackdropClasses = 'slds-backdrop pro-relationship-matrix-print';

    @track deleteModalClasses = this._defaultDeleteModalClasses;

    @track backdropClasses = this._defaultBackdropClasses;

    smallSize = Math.min(3, this.visibleSupport ? this.visibleSupport.length + 1 : 1);

    mediumSize = Math.min(4, this.visibleSupport ? this.visibleSupport.length + 1 : 1);

    largeSize = Math.min(6, this.visibleSupport ? this.visibleSupport.length + 1 : 1);

    regularSizeClass = 'slds-size_1-of-' + this.smallSize;

    smallSizeClass = 'slds-small-size_1-of-' + this.smallSize;

    medSizeClass = 'slds-medium-size_1-of-' + this.mediumSize;

    largeSizeClass = 'slds-large-size_1-of-' + this.largeSize;

    colClass = 'slds-col';

    paddingAroundClass = 'slds-p-around_small';

    sizeClasses = [this.regularSizeClass, this.smallSizeClass, this.medSizeClass, this.largeSizeClass].join(' ');

    @track emptyCornerHeaderClasses = ['empty-header', this.colClass, this.paddingAroundClass, this.sizeClasses].join(
        ' '
    );

    @track supportHeaderClasses = [
        'support-header',
        'slds-theme_shade',
        'slds-text-align_center',
        this.colClass,
        this.paddingAroundClass,
        this.sizeClasses
    ].join(' ');

    @track supportHeaderLastClasses = ['support-header-last', this.supportHeaderClasses].join(' ');

    @track influenceHeaderClasses = [
        'influence-header',
        'slds-text-title_caps',
        'slds-text-align_right',
        this.colClass,
        this.paddingAroundClass,
        this.sizeClasses
    ].join(' ');

    @track cellClasses = [
        'member-container',
        'slds-theme_default',
        'slds-p-horizontal_small',
        this.colClass,
        this.sizeClasses
    ].join(' ');

    @track lastCellClasses = ['member-container-last', this.cellClasses].join(' ');

    @api
    set memberLabel(value) {
        this._memberLabel = value;
        this.updateMenuItems();
    }

    get memberLabel() {
        return this._memberLabel;
    }

    _memberLabel = '';

    @api
    set canDelete(value) {
        this._canDelete = value;
        this.updateMenuItems();
    }

    get canDelete() {
        return this._canDelete;
    }

    _canDelete = false;

    @api
    set members(value) {
        this.formatMembers(value);
    }

    get members() {
        return this.unsortedMembers;
    }

    unsortedMembers = [];

    // Access influence values
    @api
    set influence(value) {
        this._influence = value;
        this._influenceLoaded = true;
        this.formatMembers(this.members);
    }

    get influence() {
        return this._influence;
    }

    _influence = [];

    _influenceLoaded = false;

    // Access support values
    @api
    set support(value) {
        let supportList = [];

        value.forEach((element) => {
            let copy = JSON.parse(JSON.stringify(element));

            copy.style = 'border-bottom-color: ' + element.color + ';';
            supportList.push(copy);
        });
        this._support = supportList;
        this.updateSizeClasses();
        this._supportLoaded = true;
        this.formatMembers(this.members);
    }

    get support() {
        return this._support;
    }

    _support = [];

    _supportLoaded = false;

    label = {
        Cancel,
        Confirm,
        error_you_do_not_have_permission_to_perform_this_action,
        Exit_Full_Screen,
        Full_Screen,
        Influence_Chart,
        Loading,
        Refresh
    };

    @wire(getObjectInfo, { objectApiName: ContactObj })
    wiredGetLabel({ data }) {
        if (data) {
            this.contactLabel = data.label;
        }
    }

    connectedCallback() {
        this.subscribeToChannel();
    }

    updateSizeClasses() {
        this.smallSize = Math.min(3, this.visibleSupport ? this.visibleSupport.length + 1 : 1);
        this.mediumSize = Math.min(4, this.visibleSupport ? this.visibleSupport.length + 1 : 1);
        this.largeSize = Math.min(6, this.visibleSupport ? this.visibleSupport.length + 1 : 1);
        this.regularSizeClass = 'slds-size_1-of-' + this.smallSize;
        this.smallSizeClass = 'slds-small-size_1-of-' + this.smallSize;
        this.medSizeClass = 'slds-medium-size_1-of-' + this.mediumSize;
        this.largeSizeClass = 'slds-large-size_1-of-' + this.largeSize;
        this.sizeClasses = [this.regularSizeClass, this.smallSizeClass, this.medSizeClass, this.largeSizeClass].join(
            ' '
        );
        this.emptyCornerHeaderClasses = ['empty-header', this.colClass, this.paddingAroundClass, this.sizeClasses].join(
            ' '
        );
        this.supportHeaderClasses = [
            'support-header',
            'slds-theme_shade',
            'slds-text-align_center',
            this.colClass,
            this.paddingAroundClass,
            this.sizeClasses
        ].join(' ');
        this.supportHeaderLastClasses = ['support-header-last', this.supportHeaderClasses].join(' ');
        this.influenceHeaderClasses = [
            'influence-header',
            'slds-text-title_caps',
            'slds-text-align_right',
            this.colClass,
            this.paddingAroundClass,
            this.sizeClasses
        ].join(' ');
        this.cellClasses = [
            'member-container',
            'slds-theme_default',
            'slds-p-horizontal_small',
            this.colClass,
            this.sizeClasses
        ].join(' ');
        this.lastCellClasses = ['member-container-last', this.cellClasses].join(' ');
    }

    updateMenuItems() {
        let menuItems = [];

        menuItems.push({
            label: View_Contact_Details,
            value: 'viewContact'
        });

        menuItems.push({
            label: formatLabel(View_Map_Member_Details, [this.memberLabel]),
            value: 'viewMember'
        });
        if (this.canDelete) {
            menuItems.push({
                label: Remove,
                value: 'delete'
            });
        }

        this.menuItems = menuItems;
    }

    handleMemberAction(event) {
        let type = event.detail.type;

        switch (type) {
            case 'delete':
                this.recordIdToDelete = event.detail.id;
                getUserRecordAccess({ recordId: event.detail.id })
                    .then((access) => {
                        let canDeleteRecord = access.HasAllAccess || access.HasDeleteAccess;

                        this.canDeleteMemberRecord = canDeleteRecord && this.canDelete;
                        this.showDeleteModal();
                    })
                    .catch(() => {
                        this.canDeleteMemberRecord = false;
                        this.showDeleteModal();
                    });
                break;
            case 'viewMember':
                if (!this.canDrag) {
                    this.showMemberModal(event.detail.id, false);
                    break;
                }
                getUserRecordAccess({ recordId: event.detail.id })
                    .then((access) => {
                        let canEditRecord = access.HasAllAccess || access.HasEditAccess;

                        this.showMemberModal(event.detail.id, canEditRecord);
                    })
                    .catch(() => {
                        this.showMemberModal(event.detail.id, false);
                    });
                break;
            case 'viewContact':
                if (!this.canDrag) {
                    this.showEditModal(event.detail.contactId, this.contactLabel, false);
                    break;
                }
                getUserRecordAccess({ recordId: event.detail.contactId })
                    .then((access) => {
                        let canEditRecord = access.HasAllAccess || access.HasEditAccess;

                        this.showEditModal(event.detail.contactId, this.contactLabel, canEditRecord);
                    })
                    .catch(() => {
                        this.showEditModal(event.detail.contactId, this.contactLabel, false);
                    });
                break;
            default:
                break;
        }
    }

    fireApplicationEvent(eventName, eventValue, shouldUpdateSystemViews) {
        const evt = new CustomEvent('pqapplicationevent', {
            detail: { name: eventName, value: eventValue, refreshViews: shouldUpdateSystemViews }
        });

        this.dispatchEvent(evt);
    }

    @api
    handleApplicationEvent(eventName, eventValue) {
        switch (eventName) {
            case 'MATRIX_MODAL_SAVED':
                if (eventValue) {
                    this.fireApplicationEvent('MATRIX_UPDATED', eventValue, true);
                    this.fireUpdateMemberEvent(eventValue);
                }
                break;
            case 'RM_EDIT_RECORD_SAVE_SUCCESS':
            case 'STAKEHOLDER_UPDATE':
                if (eventValue) {
                    this.fireUpdateMemberEvent(eventValue);
                }
                break;
            case 'MATRIX_UPDATED':
                this.publishMessage();
                break;
            default:
                break;
        }
    }

    publishMessage() {
        const message = {
            recordId: this.mapId,
            action: 'refresh'
        };

        publish(this.messageContext, INFLUENCE_CHART_DATA_CHANNEL, message);
    }

    subscribeToChannel() {
        if (this.subscription) {
            return;
        }

        // Subscribing to the message channel
        this.subscription = subscribe(this.messageContext, MAP_MEMBER_LIST_DATA_CHANNEL, (message) => {
            this.handleMessage(message);
        });
        subscribe(this.messageContext, RELATIONSHIP_MAP_DATA_CHANNEL, (message) => {
            this.handleMessage(message);
        });
    }

    handleMessage(message) {
        if (message.action === 'refresh' && message.recordId === this.mapId) {
            this.reloadData();
        }
    }

    fireUpdateMemberEvent(memberId) {
        const evt = new CustomEvent('memberupdated', {
            detail: { recordId: memberId }
        });

        this.dispatchEvent(evt);
    }

    fireRemoveMemberEvent(memberId) {
        const evt = new CustomEvent('memberremoved', {
            detail: { recordId: memberId }
        });

        this.dispatchEvent(evt);
    }

    reloadData() {
        const evt = new CustomEvent('refreshmembers', { detail: {} });

        this.dispatchEvent(evt);
    }

    fullScreenHandler() {
        this.isExpanded = !this.isExpanded;
        if (this.isExpanded) {
            document.body.style.overflow = 'hidden';
            this.fullscreenClass = 'fullScreen';
        } else {
            document.body.style.overflow = '';
            this.fullscreenClass = '';
        }
    }

    handleDragLeave(event) {
        event.preventDefault();
        if (!this.canDrag) {
            return;
        }
        event.currentTarget.style.background = '';
    }

    handleDragOver(event) {
        event.preventDefault();
        if (!this.canDrag) {
            return;
        }
        event.currentTarget.style.background = '#FFFBCC';
    }

    handleDrop(event) {
        event.preventDefault();
        if (!this.canDrag) {
            return;
        }
        event.currentTarget.style.background = '';
        let influence = event.target.getAttribute('data-influence-name');
        let support = event.target.getAttribute('data-support-name');
        let originalSupport = event.dataTransfer.getData('support');
        let originalInfluence = event.dataTransfer.getData('influence');

        if (influence === originalInfluence && support === originalSupport) {
            return;
        }
        const evt = new CustomEvent('memberdropped', {
            detail: {
                targetInfluence: influence,
                targetSupport: support,
                memberId: event.dataTransfer.getData('memberId')
            }
        });

        this.dispatchEvent(evt);
    }

    showEditModal(recordId, title, canEdit) {
        let evt = new CustomEvent('showeditmodal', {
            detail: { recordId: recordId, title: title, canEdit: canEdit }
        });

        this.dispatchEvent(evt);
    }

    showMemberModal(objectId, canEdit) {
        const evt = new CustomEvent('showmembermodal', {
            detail: { objectId, canEdit }
        });

        this.dispatchEvent(evt);
    }

    showDeleteModal() {
        this.deleteErrorText = null;
        this.deleteModalClasses = this._defaultDeleteModalClasses + ' slds-fade-in-open';
        this.backdropClasses = this._defaultBackdropClasses + ' slds-backdrop_open';
        this._bodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
    }

    hideDeleteModal() {
        this.deleteErrorText = null;
        this.deleteModalClasses = this._defaultDeleteModalClasses;
        this.backdropClasses = this._defaultBackdropClasses;
        document.body.style.overflow = this._bodyOverflow;
    }

    handleDeleteConfirm() {
        if (this.recordIdToDelete) {
            this.isSaving = true;
            deleteRecord(this.recordIdToDelete)
                .then(() => {
                    this.fireRemoveMemberEvent(this.recordIdToDelete);
                    this.fireApplicationEvent('MATRIX_UPDATED', this.recordIdToDelete, true);
                    this.recordIdToDelete = null;
                    this.hideDeleteModal();
                    this.isSaving = false;
                })
                .catch((error) => {
                    this.isSaving = false;
                    this.deleteErrorText = error.body.message;
                });
        }
    }

    handleDeleteCancel() {
        this.isSaving = false;
        this.deleteErrorText = null;
        this.hideDeleteModal();
    }

    formatMembers(newMemberList) {
        if (!this._influenceLoaded || !this._supportLoaded) {
            return;
        }
        let newMemberString = JSON.stringify(newMemberList);
        let memberList = JSON.parse(newMemberString);

        this.unsortedMembers = JSON.parse(newMemberString);

        let members = [];

        memberList.sort(function (first, second) {
            if (first.name < second.name) {
                return -1;
            }
            if (first.name > second.name) {
                return 1;
            }

            return 0;
        });

        let skipNulls = true;

        if (memberList) {
            for (let i = 0; i < memberList.length; i++) {
                let member = memberList[i];

                if (!member.influence || !member.support) {
                    skipNulls = false;
                    break;
                }
            }
        }

        if (skipNulls) {
            let supportValues = JSON.parse(JSON.stringify(this.support));

            this.visibleSupport = supportValues.filter((support) => {
                return support.name;
            });
        } else {
            this.visibleSupport = this.support;
        }
        this.updateSizeClasses();

        for (let i = 0; i < this.influence.length; i++) {
            let rows = [];
            let currentInfluence = this.influence[i];

            if (skipNulls && !currentInfluence.name) {
                continue;
            }
            for (let j = 0; j < this.visibleSupport.length; j++) {
                let items = [];
                let currentSupport = this.visibleSupport[j];

                if (skipNulls && !currentSupport.name) {
                    continue;
                }
                for (let k = 0; k < memberList.length; k += 1) {
                    let sh = memberList[k];

                    // Specifically using == below so that matches correctly if null or undefined
                    if (
                        sh.influence == currentInfluence.name && // eslint-disable-line eqeqeq
                        sh.support == currentSupport.name // eslint-disable-line eqeqeq
                    ) {
                        items.push(sh);
                    }
                }
                rows.push({
                    name: currentSupport.name,
                    label: currentSupport.name,
                    color: currentSupport.color,
                    items: items
                });
            }

            members.push({
                name: currentInfluence.name,
                label: currentInfluence.value,
                items: rows
            });
        }

        this.formattedData = members;
    }
}