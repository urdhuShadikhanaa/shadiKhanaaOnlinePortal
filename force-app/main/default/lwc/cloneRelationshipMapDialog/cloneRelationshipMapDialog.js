import { LightningElement, api, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { getRecord } from 'lightning/uiRecordApi';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';

import { showErrorToast } from 'c/utils';
import { showWarningToast } from 'c/utils';

import cloneRM from '@salesforce/apex/RelationshipMapCloneController.cloneRelationshipMap';
import getRMRelationships from '@salesforce/apex/RelationshipMapCloneController.getInputLookupTypeObjectsForRMRelationships';
import searchObjects from '@salesforce/apex/InputLookupController.searchSObject';
import searchRelatedObjects from '@salesforce/apex/InputLookupController.searchWithInputLookupObjects';
import getCurrentSelection from '@salesforce/apex/InputLookupController.getCurrentSelectionResultObj';

import RM_OBJECT from '@salesforce/schema/Relationship_Map__c';
import RM_NAME_FIELD from '@salesforce/schema/Relationship_Map__c.Name';
import RM_OWNER_FIELD from '@salesforce/schema/Relationship_Map__c.OwnerId';
import currentUserId from '@salesforce/user/Id';

import { formatLabel } from 'c/stringUtils';
import Clone_Obj_Label from '@salesforce/label/c.Clone_Obj';
import Clone_Label from '@salesforce/label/c.Clone';
import Cancel_Label from '@salesforce/label/c.Cancel';
import Cloning_Map_Label from '@salesforce/label/c.Cloning_Relationship_Map';
import Clone_Note from '@salesforce/label/c.Clone_Note';
import Select_A_Related_Record from '@salesforce/label/c.Select_A_Related_Record';
import Select_A_Related_Record_Note from '@salesforce/label/c.Select_A_Related_Record_Note';

export default class cloneRelationshipMapDialog extends NavigationMixin(LightningElement) {
    @api recordId;

    @api objectApiName;

    @api relationshipMapId;

    label = {
        asyncWarning: Clone_Note,
        cancel: Cancel_Label,
        clone: Clone_Label,
        cloningMap: Cloning_Map_Label,
        header: '',
        nameFieldTitle: '',
        ownerFieldTitle: '',
        relatedFieldTitle: Select_A_Related_Record,
        relatedFieldNote: Select_A_Related_Record_Note
    };

    rmFields = [RM_NAME_FIELD, RM_OWNER_FIELD];

    relatedFields = ['Id'];

    relatedLookupTypes = [];

    relationshipMapObj;

    rmName;

    rmOwnerId;

    rmRelatedId;

    rmKeyPrefix;

    isCloning = false;

    setDefaultMap = { ownerSearch: false, relatedSearch: false };

    defaultOwnerObj;

    defaultRelatedSelectionObj = [];

    /** *********
     * RM Wire *
     ***********/

    @wire(getObjectInfo, { objectApiName: RM_OBJECT })
    wiredRMInfo({ data, error }) {
        if (error) {
            showErrorToast(error, this, 'Error loading map object info');   
        } else if (data) {
            this.label.nameFieldTitle = data.fields.Name.label;
            this.label.ownerFieldTitle = data.fields.OwnerId.relationshipName;
            this.rmKeyPrefix = data.keyPrefix;
        }
    }

    @wire(getRecord, { recordId: '$relationshipMapId', fields: '$rmFields' })
    wiredRMRecord({ data, error }) {
        if (error) {
            // Check if the  error is due to us sending the wrong object up.
            // Since this is called on two different Ids to handle two different case
            // It can throw an error for one of those due to the wrong object passed.
            // In this situation it is safe to ignore it as it's expected and not a real issue.
            if (error.body && error.body.statusCode === 400 && error.body.errorCode.toUpperCase() === 'INVALID_INPUT') {
                return;
            }
            showWarningToast(error, this, 'RelationshipMap has been deleted, please refresh the page');
        } else if (data) {
            this.relationshipMapObj = data;
            this.rmName = this.relationshipMapObj.fields.Name.value;
            this.label.header = formatLabel(Clone_Obj_Label, [this.rmName]);
            this.rmOwnerId = this.relationshipMapObj.fields.OwnerId.value;
            const params = {
                id: this.rmOwnerId,
                displayFieldName: 'Name'
            };

            getCurrentSelection(params)
                .then((result) => {
                    this.defaultOwnerObj = result ? result : [];
                    this.setupDefaultSearchOptions('ownerSearch', this.defaultOwnerObj);
                })
                .catch((searchError) => {
                    showErrorToast(searchError, this, 'Error getting map info');
                });
        }
    }

    /** **************
     * Related Wire *
     ****************/

    @wire(getObjectInfo, { objectApiName: '$objectApiName' })
    wiredRelatedInfo({ data, error }) {
        if (this.objectApiName === 'pqcrush__Relationship_Map__c') {
            return;
        }
        if (error && this.objectApiName) {
            showErrorToast(error, this, 'Error loading related object info');
        } else if (data) {
            const nameField = data.nameFields && data.nameFields.length ? data.nameFields[0] : 'Id';

            this.relatedFields = data.nameFields;
            const params = {
                id: this.recordId,
                displayFieldName: nameField
            };

            getCurrentSelection(params)
                .then((result) => {
                    this.defaultRelatedSelectionObj = result ? result : [];
                    this.rmRelatedId = result ? result.id : null;
                    this.setupDefaultSearchOptions('relatedSearch', this.defaultRelatedSelectionObj);
                })
                .catch((searchError) => {
                    showErrorToast(searchError, this, 'Error getting related record');
                });
        }
    }

    @wire(getRecord, { recordId: '$recordId', fields: '$rmFields' })
    wiredRelatedRecord({ data, error }) {
        if (error) {
            // Check if the  error is due to us sending the wrong object up.
            // Since this is called on two different Ids to handle two different case
            // It can throw an error for one of those due to the wrong object passed.
            // In this situation it is safe to ignore it as it's expected and not a real issue.
            if (error.body && error.body.statusCode === 400 && error.body.errorCode.toUpperCase() === 'INVALID_INPUT') {
                return;
            }
            showErrorToast(error, this, 'Error loading existing map field values');
        } else if (data) {
            this.relationshipMapObj = data;
            this.rmName = this.relationshipMapObj.fields.Name.value;
            this.label.header = formatLabel(Clone_Obj_Label, [this.rmName]);
            this.rmOwnerId = this.relationshipMapObj.fields.OwnerId.value;
            const params = {
                id: this.rmOwnerId,
                displayFieldName: 'Name'
            };

            getCurrentSelection(params)
                .then((result) => {
                    this.defaultOwnerObj = result ? result : [];
                    this.setupDefaultSearchOptions('ownerSearch', this.defaultOwnerObj);
                })
                .catch((searchError) => {
                    showErrorToast(searchError, this, 'Error getting default Owner');
                });
        }
    }

    @wire(getRMRelationships, {})
    wiredGetRelationships({ data, error }) {
        if (error) {
            showErrorToast(error, this, 'Error loading relationship types');
        } else if (data) {
            this.relatedLookupTypes = data;
        }
    }

    get isRelatedObjectPage() {
        return this.objectApiName && this.objectApiName !== RM_OBJECT.objectApiName;
    }

    setupDefaultSearchOptions(templateId, defaultObject) {
        const lookup = this.template.querySelector(`[data-id='${templateId}']`);

        if (lookup && defaultObject && !this.setDefaultMap[templateId]) {
            this.setDefaultMap[templateId] = true;
            lookup.setDefaultResults([defaultObject]);
        }
    }

    /** *****************
     * Action Handlers *
     *******************/

    handleNameChange(evt) {
        this.rmName = evt.target.value;
    }

    handleCancel() {
        const cancelEvent = new CustomEvent('cancel', {});

        this.dispatchEvent(cancelEvent);
    }

    async handleClone() {
        this.isCloning = true;
        const clonedMaps = await cloneRM({
            oldMapId: this.relationshipMapId,
            newMapName: this.rmName,
            newMapOwnerId: this.rmOwnerId,
            newRelatedObjectId: this.rmRelatedId
        });

        this.isCloning = false;
        if (clonedMaps.length > 0) {
            this.handleCancel();
            if (this.rmOwnerId === currentUserId) {
                const navId = this.isRelatedObjectPage && this.rmRelatedId ? this.rmRelatedId : clonedMaps[0].Id;
                if (document.referrer.indexOf('.lightning.force.com') > 0) {
                    this[NavigationMixin.Navigate]({
                        type: 'standard__recordPage',
                        attributes: {
                            recordId: navId,
                            actionName: 'view'
                        }
                    });
                } else {
                    window.location.assign('/' + navId);
                }
            } else {
                if (document.referrer.indexOf('.lightning.force.com') > 0) {
                    this[NavigationMixin.Navigate]({
                        type: 'standard__objectPage',
                        attributes: {
                            objectApiName: RM_OBJECT.objectApiName,
                            actionName: 'home'
                        }
                    });
                } else {
                    window.location.assign('/' + this.rmKeyPrefix + '/o');
                }
            }
        }
    }

    /** ************************
     * Object Search Handling *
     **************************/

    handleSearch(event) {
        const target = event.target;
        const params = {
            type: target.dataset.objectType,
            searchString: event.detail.searchTerm,
            displayFieldName: target.dataset.displayField,
            selectedIds: event.detail.selectedIds
        };

        searchObjects(params)
            .then((result) => {
                target.setSearchResults(result);
            })
            .catch((error) => {
                showErrorToast(error, this, `Error getting ${target.dataset.objectType}  objects`);
            });
    }

    handleObjectSearch(event) {
        const target = event.target;
        const params = {
            types: this.relatedLookupTypes,
            searchString: event.detail.searchTerm
        };

        searchRelatedObjects(params)
            .then((result) => {
                target.setSearchResults(result);
            })
            .catch((error) => {
                showErrorToast(error, this, 'Error searching related objects');
            });
    }

    handleOwnerChange(event) {
        this.setupDefaultSearchOptions('ownerSearch', this.defaultOwnerObj);
        const selectedIds = event.detail;

        this.rmOwnerId = selectedIds && selectedIds.length ? selectedIds[0] : null;
    }

    handleRelatedChange(event) {
        this.setupDefaultSearchOptions('relatedSearch', this.defaultRelatedSelectionObj);
        const selectedIds = event.detail;

        this.rmRelatedId = selectedIds && selectedIds.length ? selectedIds[0] : null;
    }

    /** ****************
     * Modal Handling *
     ******************/

    @api
    set isModalOpen(value) {
        this._isModalOpen = value;
        const modal = this.template.querySelector('c-modal');

        if (modal) {
            if (this._isModalOpen) {
                modal.show();
            } else {
                modal.hide();
            }
        }
    }

    get isModalOpen() {
        return this._isModalOpen;
    }

    _isModalOpen;
}