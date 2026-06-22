/** ***************************
 THIS CLASS IS NO LONGER USED
******************************/

import { LightningElement, api, wire } from 'lwc';
import addContactAsKeyStakeholders from '@salesforce/apex/KeyStakeholderController.addContactAsKeyStakeholders';
import addLeadsAsKeyStakeholders from '@salesforce/apex/KeyStakeholderController.addLeadsAsKeyStakeholders';
import addUserToRelationshipMap from '@salesforce/apex/GraphDataController.createMapMemberUsers';
import deleteKeyStakeholders from '@salesforce/apex/KeyStakeholderController.deleteKeyStakeholders';
import deleteMapMemberUsers from '@salesforce/apex/GraphDataController.deleteMapMemberUsers';
import deleteKeyStakeholderLeads from '@salesforce/apex/KeyStakeholderController.deleteKeyStakeholderLeads';

// Import getGraphData from '@salesforce/apex/KeyStakeholderController.getGraphDataForYourContactsByAccountPlanId';
import getAccountPlanRecordAccess from '@salesforce/apex/AccountPlanController.getUserRecordAccess';
import searchContactRecords from '@salesforce/apex/KeyStakeholderController.getContactGraphDataForSearchTerm';
import searchUserRecords from '@salesforce/apex/GraphDataController.getUserGraphDataForSearchTerm';
import searchLeadRecords from '@salesforce/apex/GraphDataController.getLeadGraphDataForSearchTerm';
import getSettingsRecordAccess from '@salesforce/apex/RMChartSettingController.getRelationshipMapAccessRecordForObject';
import getChartSettings from '@salesforce/apex/RMChartSettingController.getRelationshipMapSettingForObject';
import getRMOrgSettingForType from '@salesforce/apex/RMOrgSettingService.getRMOrgSettingForType';

// Import getMatrixByAccountPlan from '@salesforce/apex/KeyStakeholderController.getMatrixByAccountPlan';
import setAnchor from '@salesforce/apex/GraphDataController.setAnchor';
import getAnchors from '@salesforce/apex/GraphDataController.getAnchors';
import saveAllNodeCoordinates from '@salesforce/apex/GraphDataController.saveAllNodeCoordinates';
import updateNodeCoordinates from '@salesforce/apex/GraphDataController.updateNodeCoordinates';

import LABEL_RELATIONSHIP_MAP_SETTINGS from '@salesforce/label/c.Relationship_Map_Settings';

// Contact Relationship Types
import getRelationshipTypes from '@salesforce/apex/GraphDataController.getContactRelationshipTypes';

// Hierarchy
import updateReportsTo from '@salesforce/apex/GraphDataController.updateReportsTo';

// Links
import newCustomLinks from '@salesforce/apex/GraphDataController.newCustomLinks';

// Groups
import createNewGroup from '@salesforce/apex/GraphDataController.createNewGroup';
import addContactsToGroup from '@salesforce/apex/GraphDataController.addContactsToGroup';

// Placeholder
import createNewPlaceholder from '@salesforce/apex/GraphDataController.createNewPlaceholder';

// Get Parent Nodes
import getParentNodes from '@salesforce/apex/KeyStakeholderController.getParentNodesForContactIds';

// Badge
import getBadgeOptions from '@salesforce/apex/GraphDataController.getBadgeOptions';
import associateBadge from '@salesforce/apex/GraphDataController.associateBadge';
import removeBadge from '@salesforce/apex/GraphDataController.removeBadge';

import KEY_STAKEHOLDER from '@salesforce/schema/Key_Stakeholder__c';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';

// User Access Record
import getUserRecordAccess from '@salesforce/apex/UserRecordAccessServiceController.getUserRecordAccess';

export default class Orggraphstakeholder extends LightningElement {
    /** ***************************
     THIS CLASS IS NO LONGER USED
    ******************************/

    anchors;

    graphData = undefined;

    canEditGraph = false;

    showPanel = false;

    objectLabel;

    supportData = null;

    influenceData = null;

    chartSettings;

    rmOrgSettings;

    openCreateModal;

    contactTempId;

    badgeOptions = [];

    currentSearchKey;

    subscription = null;

    @wire(getObjectInfo, { objectApiName: KEY_STAKEHOLDER.objectApiName })
    wiredGetObjectInfo({ data }) {
        if (data) {
            this.objectLabel = data.label;
        }
    }

    @wire(getAccountPlanRecordAccess, { accountPlanId: '$accountPlanId' })
    wiredAccountPlanAccess({ data }) {
        if (data) {
            this.canEditGraph = data.HasAllAccess || data.HasEditAccess;
        }
    }

    @api
    set accountPlanId(value) {
        this._accountPlanId = value;
        this.getSettingsAndData();
        this.getAnchors();
    }

    get accountPlanId() {
        return this._accountPlanId;
    }

    async getSettingsAndData() {
        Promise.all([
            getChartSettings({ objectId: this._accountPlanId }),
            getRMOrgSettingForType({ type: 'keystakeholder' }),
            getBadgeOptions({ mapOrAccountPlanId: this._accountPlanId }),
            getRelationshipTypes({ mapOrAccountPlanId: this._accountPlanId })
        ])
            .then(([resultChartSettings, resultGetRMOrgSetting, resultBadgeOptions, resultRelationshipTypes]) => {
                this.chartSettings = resultChartSettings;
                this.rmOrgSettings = resultGetRMOrgSetting;
                this.badgeOptions = resultBadgeOptions;
                this.relationshipTypes = resultRelationshipTypes;

                this.retrieveData(this._accountPlanId);
            })
            .catch((error) => {
                this.handleError(error);
            });
    }

    getAnchors() {
        getAnchors({ objectId: this._accountPlanId })
            .then((result) => {
                if (result) {
                    let arr = [];

                    result.forEach((anchor) => {
                        arr.push({
                            from: anchor.pqcrush__From__c,
                            to: anchor.pqcrush__To__c
                        });
                    });
                    this.anchors = arr;
                }
            })
            .catch((error) => {
                this.handleError(error);
            });
    }

    editSettings() {
        getSettingsRecordAccess({ objectId: this._accountPlanId })
            .then((result) => {
                const detail = {
                    name: 'settings',
                    objectLabel: LABEL_RELATIONSHIP_MAP_SETTINGS,
                    objectId: result.RecordId,
                    access: result
                };

                const objectEditClickedEvent = new CustomEvent('requestobjectviewer', {
                    detail: detail
                });

                // Dispatches the event.
                this.dispatchEvent(objectEditClickedEvent);
            })
            .catch((error) => {
                this.handleError(error);
            });
    }

    async retrieveData() {
        // Var self = this;
        // If (!accountPlanId) {
        //     Return;
        // }
        // If (!this.influenceData || !this.supportData) {
        //     Let matrix = await getMatrixByAccountPlan({ accountPlanId });
        //     This.influenceData = matrix?.influenceList;
        //     This.supportData = matrix?.supportList;
        // }
        // GetGraphData({ accountPlanId: accountPlanId })
        //     .then((result) => {
        //         Self.graphData = result;
        //         Self.graphData.influenceData = this.influenceData;
        //         Self.graphData.supportData = this.supportData;
        //         Self.graphData.badgeOptions = this.badgeOptions;
        //     })
        //     .catch((error) => {
        //         Const graphErrorEvent = new CustomEvent('grapherror', { detail: error });
        //         Self.dispatchEvent(graphErrorEvent);
        //         Self.graphData = undefined;
        //     });
    }

    handleError(error) {
        this.updateSaving(false);
        this.createErrorEvent(error);
        this.retrieveData(this._accountPlanId);
    }

    createErrorEvent(error) {
        const graphErrorEvent = new CustomEvent('grapherror', { detail: { error: error } });

        this.dispatchEvent(graphErrorEvent);
    }

    updateSaving(isSaving) {
        const rmp = this.template.querySelector('c-relationship-map-controller');

        if (rmp && rmp.updateSaving) {
            rmp.updateSaving(isSaving);
        }
    }

    graphError(event) {
        this.createErrorEvent(event.detail.error);
    }

    addKeyStakeholder(event) {
        console.log('OrgGraph stake holder call $$$$$');
        let contactIds = [];

        event.detail.nodeDataArray.forEach((node) => {
            contactIds.push(node.key);
        });

        const gd = {
            nodeDataArray: event.detail.nodeDataArray,
            linkDataArray: []
        };

        let graphDataJsonString = JSON.stringify(gd);
        let accountPlanId = this._accountPlanId;

        try {
            // Switch on type being added, fork to add Contacts or Users
            switch (gd.nodeDataArray[0].category) {
                case 'keystakeholder':
                case 'contact':
                    addContactAsKeyStakeholders({ accountPlanId, graphDataJsonString })
                        .then((graphData) => {
                            this.updateSaving(false);
                            if (event.detail.tempId) {
                                graphData.nodeDataArray.forEach((node) => {
                                    node.tempId = event.detail.tempId;
                                });
                            }
                            this.template.querySelector('c-relationship-map-controller')?.updateNodes(graphData);
                            this.fireApplicationEvent('RM_ADD_REMOVE_SUCCESS', contactIds, true);
                        })
                        .catch((error) => {
                            this.handleError(error);
                        });
                    break;

                case 'user':
                case 'manager':
                    addUserToRelationshipMap({
                        graphDataJsonString: graphDataJsonString,
                        mapOrAccountPlanId: accountPlanId
                    })
                        .then((graphData) => {
                            if (event.detail.tempId) {
                                graphData.nodeDataArray.forEach((node) => {
                                    node.tempId = event.detail.tempId;
                                });
                            }
                            this.template.querySelector('c-relationship-map-controller')?.updateNodes(graphData);
                            this.fireApplicationEvent('RM_ADD_REMOVE_SUCCESS', null, false);
                        })
                        .catch((error) => {
                            this.handleError(error);
                        });
                    break;
                case 'lead':
                    addLeadsAsKeyStakeholders({ graphDataJsonString, accountPlanId })
                        .then((graphData) => {
                            if (event.detail.tempId) {
                                graphData.nodeDataArray.forEach((node) => {
                                    node.tempId = event.detail.tempId;
                                });
                            }
                            this.template.querySelector('c-relationship-map-controller')?.updateNodes(graphData);
                            this.fireApplicationEvent('RM_ADD_REMOVE_SUCCESS', null, false);
                        })
                        .catch((error) => {
                            this.handleError(error);
                        });
                    break;
                case null:
                    return null;
                default:
                    return null;
            }
        } catch (error) {
            this.handleError(error);
        }

        return null;
    }

    // Get Parent Nodes
    handleAddParentContactsToChart(event) {
        const contactIds = event.detail;

        this.updateSaving(true);
        getParentNodes({ contactIds: contactIds, mapOrAccountPlanId: this._accountPlanId })
            .then((graphData) => {
                this.updateSaving(false);
                this.template.querySelector('c-relationship-map-controller').addParentNodes(graphData);
            })
            .catch((error) => {
                this.handleError(error);
            });
    }

    handleDeleteKeyStakeholders(event) {
        this.updateSaving(true);
        deleteKeyStakeholders({ stakeholderIds: event.detail })
            .then(() => {
                this.updateSaving(false);
                this.fireApplicationEvent('RM_ADD_REMOVE_SUCCESS', event.detail, true);
            })
            .catch((error) => {
                this.handleError(error);
            });
    }

    handleDeleteKeyStakeholderLeads(event) {
        this.updateSaving(true);
        deleteKeyStakeholderLeads({ stakeholderIds: event.detail })
            .then(() => {
                this.updateSaving(false);
                this.fireApplicationEvent('RM_ADD_REMOVE_SUCCESS', event.detail, true);
            })
            .catch((error) => {
                this.handleError(error);
            });
    }

    handleDeleteMapMemberUsers(event) {
        deleteMapMemberUsers({ mapMemberUserIds: event.detail })
            .then(() => {
                this.fireApplicationEvent('RM_ADD_REMOVE_SUCCESS', event.detail, true);
            })
            .catch((error) => {
                this.handleError(error);
            });
    }

    handleUpdateGraph() {
        this.template.querySelector('c-relationship-map-controller').showMap(false);
        this.getSettingsAndData();
    }

    handlePerformSearch(event) {
        const { searchMode, searchTerm, excludeIds, accountId, searchKey } = event.detail;
        const mapOrAccountPlanId = this._accountPlanId;

        this.currentSearchKey = searchKey;

        if (searchMode === 'user') {
            searchUserRecords({ searchTerm, excludeIds, accountId, mapOrAccountPlanId, searchKey })
                .then((result) => {
                    if (this.currentSearchKey === result.searchKey) {
                        this.template
                            .querySelector('c-relationship-map-controller')
                            .handleSearchResults(result, 'user');
                    }
                })
                .catch((error) => {
                    this.handleError(error);
                });
        } else if (searchMode === 'lead') {
            searchLeadRecords({ searchTerm, excludeIds, mapOrAccountPlanId, searchKey })
                .then((result) => {
                    if (this.currentSearchKey === result.searchKey) {
                        this.template
                            .querySelector('c-relationship-map-controller')
                            .handleSearchResults(result, 'lead');
                    }
                })
                .catch((error) => {
                    this.handleError(error);
                });
        } else if (searchMode === 'contact') {
            searchContactRecords({ searchTerm, excludeIds, accountId, mapOrAccountPlanId, searchKey })
                .then((result) => {
                    if (this.currentSearchKey === result.searchKey) {
                        this.template
                            .querySelector('c-relationship-map-controller')
                            .handleSearchResults(result, 'contact');
                    }
                })
                .catch((error) => {
                    this.handleError(error);
                });
        }
    }

    handleSetTargetAnchor(event) {
        const { rootNodeKey, anchorNodeKey } = event.detail;

        this.updateSaving(true);
        let objectId = this._accountPlanId;

        setAnchor({ objectId, rootNodeKey, anchorNodeKey })
            .then(() => {
                this.updateSaving(false);
            })
            .catch((error) => {
                this.handleError(error);
            });
    }

    // Placeholder
    handleCreateNewPlaceholder(event) {
        const graphData = { nodeDataArray: [event.detail.nodeData] };

        this.updateSaving(true);
        createNewPlaceholder({
            graphDataJsonString: JSON.stringify(graphData),
            objectId: this.accountPlanId
        })
            .then((nodeData) => {
                this.updateSaving(false);
                this.template.querySelector('c-relationship-map-controller').updateLocalNodeData(nodeData);
            })
            .catch((error) => {
                this.handleError(error);
            });
    }

    @api
    handleApplicationEvent(eventName, eventValue) {
        const rmc = this.template.querySelector('c-relationship-map-controller');

        if (rmc) {
            rmc.handleApplicationEvent(eventName, eventValue);
        }
    }

    fireApplicationEvent(eventName, eventValue, shouldUpdateSystemViews) {
        const evt = new CustomEvent('pqapplicationevent', {
            detail: { name: eventName, value: eventValue, refreshViews: shouldUpdateSystemViews }
        });

        this.dispatchEvent(evt);
    }

    passthroughEvent(event) {
        const passedEvent = new CustomEvent(event.type, {
            detail: event.detail
        });

        // Dispatches the event.
        this.dispatchEvent(passedEvent);
    }

    handleSaveAllNodeCoordinates(event) {
        let gd = {
            nodeDataArray: event.detail.nodeDataArray,
            linkDataArray: []
        };
        let graphDataJsonString = JSON.stringify(gd);
        let objectId = this._accountPlanId;

        this.updateSaving(true);
        saveAllNodeCoordinates({ objectId, graphDataJsonString })
            .then(() => {
                this.updateSaving(false);
            })
            .catch((error) => {
                this.handleError(error);
            });
    }

    handleUpdateNodeCoordinates(event) {
        let gd = {
            nodeDataArray: event.detail.nodeDataArray,
            linkDataArray: []
        };
        let graphDataJsonString = JSON.stringify(gd);
        let objectId = this._accountPlanId;

        this.updateSaving(true);
        updateNodeCoordinates({ objectId, graphDataJsonString })
            .then(() => {
                this.updateSaving(false);
            })
            .catch((error) => {
                this.handleError(error);
            });
    }

    handleCreateNewGroup(event) {
        const memberIds = event.detail.memberIds;
        const graphData = { nodeDataArray: [event.detail.groupData] };

        this.updateSaving(true);
        createNewGroup({
            graphDataJsonString: JSON.stringify(graphData),
            idList: memberIds,
            objectId: this._accountPlanId
        })
            .then((graphNodeData) => {
                this.updateSaving(false);
                this.template.querySelector('c-relationship-map-controller').updateLocalNodeData(graphNodeData);
            })
            .catch((error) => {
                this.handleError(error);
            });
    }

    handleAddContactsToGroup(event) {
        const graphData = { nodeDataArray: [event.detail.groupData] };

        this.updateSaving(true);
        addContactsToGroup({
            graphDataJsonString: JSON.stringify(graphData),
            contactIds: event.detail.contactIds,
            mapOrAccountPlanId: this._accountPlanId
        })
            .then(() => {
                this.updateSaving(false);
            })
            .catch((error) => {
                this.handleError(error);
            });
    }

    handleNewCustomLinks(event) {
        const graphData = { linkDataArray: event.detail };

        this.updateSaving(true);
        newCustomLinks({ graphDataJsonString: JSON.stringify(graphData), mapOrAccountPlanId: this._accountPlanId })
            .then(() => {
                this.updateSaving(false);
            })
            .catch((error) => {
                this.handleError(error);
            });
    }

    // Hierarchy
    handleUpdateHierarchyLinks(event) {
        const graphData = { linkDataArray: event.detail };

        this.updateSaving(true);
        updateReportsTo({ graphDataJsonString: JSON.stringify(graphData), mapOrAccountPlanId: this._accountPlanId })
            .then(() => {
                this.updateSaving(false);
                let contactIds = [];

                graphData.linkDataArray.forEach((node) => {
                    contactIds.push(node.toKey);
                });
                this.fireApplicationEvent('RM_HIERARCHY_UPDATED', contactIds, true);
            })
            .catch((error) => {
                this.handleError(error);
            });
    }

    handleAssociateBadge(event) {
        this.updateSaving(true);
        associateBadge({
            mapOrAccountPlanId: this._accountPlanId,
            badgeId: event.detail.badgeId,
            nodeIds: event.detail.nodeIds
        })
            .then(() => {
                this.updateSaving(false);
            })
            .catch((error) => {
                this.handleError(error);
                this.getSettingsAndData();
            });
    }

    handleRemoveBadge(event) {
        this.updateSaving(true);
        removeBadge({
            mapOrAccountPlanId: this._accountPlanId,
            nodeIds: event.detail.nodeIds
        })
            .then(() => {
                this.updateSaving(false);
            })
            .catch((error) => {
                this.handleError(error);
            });
    }

    async handleObjectViewerRequested(event) {
        const { typeHint, objectId } = event.detail;
        let modal;
        let canEdit = false;

        switch (typeHint) {
            case 'keystakeholder':
                await getUserRecordAccess({ recordId: objectId }).then((access) => {
                    canEdit = access.HasAllAccess || access.HasEditAccess;
                });
                modal = this.template.querySelector('c-pq-matrix-member-modal');
                modal.open('pqcrush__Key_Stakeholder__c', objectId, this.influenceData, this.supportData, {}, canEdit);
                break;

            case 'contact':
                this.passthroughEvent(event);
                break;

            default:
                this.passthroughEvent(event);
                break;
        }
    }

    handleMatrixMemberSuccess(event) {
        this.template.querySelector('c-relationship-map-controller').updateInfluenceSupport(event.detail);
        this.fireApplicationEvent('RM_ADD_REMOVE_SUCCESS', event.detail, true);
    }
}