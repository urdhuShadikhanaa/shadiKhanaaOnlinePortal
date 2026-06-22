/* eslint-disable no-console */
/* eslint-disable @lwc/lwc/no-document-query */
/* eslint-disable no-undef */

import { LightningElement, api, track } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import gojslib from '@salesforce/resourceUrl/GoJs';
import SVG_AVATAR from '@salesforce/resourceUrl/defaultavatar';
import { formatLabel } from 'c/stringUtils';
import { isLightColor, getUrl, getLinkLabel, containsHtmlLink, isEmail, generateUUID2 } from 'c/utils';
import STYLE from './style.js';
import fuse from '@salesforce/resourceUrl/fuse';
import { CategoryHelper } from './searchMode.js';
import { GeometryStrings } from './geometryStrings.js';
import { getOrgChartLicenseKey } from './key.js';
import orgGraphFunctions from './orggraph-functions.js';

import {
    getMainHorizontalDefinition,
    getVerticalLeafDefinition,
    getHorizontalDefinition,
    getVerticalDefinition
} from './displayTypes.js';

import { templateContact } from './templateContact.js';
import { templateContactFixedSize } from './templateContactFixedSize.js';
import { templateUser } from './templateUser.js';
import { templateUserFixedSize } from './templateUserFixedSize.js';
import { templateLead } from './templateLead.js';
import { templateLeadFixedSize } from './templateLeadFixedSize.js';
import { templateManager } from './templateManager.js';
import { templatePalette } from './templatePalette.js';
import { templateCompact } from './templateCompact.js';
import { templatePlaceholder } from './templatePlaceholder.js';
import { templatePlaceholderFixedSize } from './templatePlaceholderFixedSize.js';
import { templateDetail } from './templateDetail.js';
import { templateDetailFixedSize } from './templateDetailFixedSize.js';
import { templateGroup } from './templateGroup.js';

import LABEL_ADD_THIS_CONTACT from '@salesforce/label/c.Add_This_Contact';
import LABEL_CLEAR from '@salesforce/label/c.Clear';
import LABEL_CREATE_NEW_CONTACT from '@salesforce/label/c.Create_New_Contact';
import LABEL_CREATE_NEW_PLACEHOLDER from '@salesforce/label/c.Create_New_Placeholder';
import LABEL_DRAW_NEW_LINE from '@salesforce/label/c.Draw_New_Line';
import LABEL_DRAW_NEW_RELATIONSHIP from '@salesforce/label/c.Draw_New_Relationship';
import LABEL_EDIT_RELATIONSHIP_LABEL from '@salesforce/label/c.Edit_Relationship_Label';
import LABEL_GROUP_SELECTION from '@salesforce/label/c.Group_Selection';
import LABEL_LOADING from '@salesforce/label/c.Loading';
import LABEL_MARK_CARD from '@salesforce/label/c.Mark_Card';
import LABEL_NEW_TASK from '@salesforce/label/c.New_Task';
import LABEL_NO_RESULTS from '@salesforce/label/c.No_Results';
import LABEL_OPEN_OMNI_VIEWER_DETAILS from '@salesforce/label/c.Open_Omni_Viewer_Details';
import LABEL_REMOVE from '@salesforce/label/c.Remove';
import LABEL_REPLACE_PLACEHOLDER from '@salesforce/label/c.Replace_Placeholder';
import LABEL_REPORTS_TO from '@salesforce/label/c.Reports_To';
import LABEL_SEARCH from '@salesforce/label/c.Search';
import LABEL_SET_HIERARCHY_LEVEL from '@salesforce/label/c.Set_Hierarchy_Level';
import LABEL_THIS_RELATIONSHIP_MAP_HAS_NO_DATA from '@salesforce/label/c.This_Relationship_Map_Has_No_Data';
import LABEL_UNGROUP_SELECTION from '@salesforce/label/c.Ungroup_Selection';
import LABEL_UPDATE_PROFILE_IMAGE from '@salesforce/label/c.Update_Profile_Image';
import LABEL_USER_INFO from '@salesforce/label/c.User_Info';
import LABEL_VIEW_CONTACT_DETAILS from '@salesforce/label/c.View_Contact_Details';
import LABEL_VIEW_MAP_MEMBER_DETAILS from '@salesforce/label/c.View_Map_Member_Details';
import LABEL_VIEW_LEAD_DETAILS from '@salesforce/label/c.View_Lead_Details';
import LABEL_LAYOUT from '@salesforce/label/c.Layout';
import LABEL_HORIZONTAL from '@salesforce/label/c.Horizontal';
import LABEL_VERTICAL from '@salesforce/label/c.Vertical';

export default class Orggraph extends LightningElement {
    constructor() {
        super();

        function bindFunctions(splitFuncObj, thisClass) {
            for (let [key, val] of Object.entries(splitFuncObj)) {
                thisClass[key] = val.bind(thisClass);
            }
        }

        bindFunctions(orgGraphFunctions, this);
    }

    // ---------------------------------------------------

    // #region Private Members

    labels = {
        addContact: LABEL_ADD_THIS_CONTACT,
        clear: LABEL_CLEAR,
        contactDetail: LABEL_VIEW_CONTACT_DETAILS,
        draw: LABEL_DRAW_NEW_RELATIONSHIP,
        editRelationshipLabel: LABEL_EDIT_RELATIONSHIP_LABEL,
        group: LABEL_GROUP_SELECTION,
        horizontal: LABEL_HORIZONTAL,
        layout: LABEL_LAYOUT,
        leadDetail: LABEL_VIEW_LEAD_DETAILS,
        loading: LABEL_LOADING,
        markCard: LABEL_MARK_CARD,
        noResults: LABEL_NO_RESULTS,
        omniViewerDetails: LABEL_OPEN_OMNI_VIEWER_DETAILS,
        placeholder: LABEL_CREATE_NEW_PLACEHOLDER,
        newContact: LABEL_CREATE_NEW_CONTACT,
        newTask: LABEL_NEW_TASK,
        remove: LABEL_REMOVE,
        replacePlaceholder: LABEL_REPLACE_PLACEHOLDER,
        reportsTo: LABEL_REPORTS_TO,
        search: LABEL_SEARCH,
        setHierarchyLevel: LABEL_SET_HIERARCHY_LEVEL,
        thisRelationshipMapHasNoData: LABEL_THIS_RELATIONSHIP_MAP_HAS_NO_DATA,
        ungroup: LABEL_UNGROUP_SELECTION,
        updateProfileImage: LABEL_UPDATE_PROFILE_IMAGE,
        userInfo: LABEL_USER_INFO,
        vertical: LABEL_VERTICAL
    };

    // ---------------------------------------------

    _debug = true;

    _anchors = [];

    _autoLayout;

    _canDrop = false;

    _canEditGraph = false;

    _currentMaxDepth = 0;

    _displayStyle;

    _fuseLinks = null;

    _fuseNodes = null;

    _graphData = {};

    _influenceData;

    _relationshipTypes;

    _relationshipTypesMap;

    _relLinkPort = 'relLinkPort';

    sidePanelVisible = false;

    contactLookupVisible = false;

    omniViewerVisible = true;

    omniViewerDocked = true;

    _showParentNodes = false;

    _showParentUserNodes = false;

    _supportColors = {};

    _supportData;

    _badgeOptions = [];

    _badgeOptionsMap;

    _chartSettings;

    _rmOrgSettings;

    // ---------------------------------------------

    canMarkNodes = false;

    groupLayouts = null;

    canChangeGroupLayout = false;

    compactTemplate;

    contactTemplate;

    fixedSizeContactTemplate;

    userTemplate;

    fixedSizeUserTemplate;

    leadTemplate;

    fixedSizeLeadTemplate;

    managerTemplate;

    detailTemplate;

    fixedSizeDetailTemplate;

    paletteTemplate;

    placeholderTemplate;

    fixedSizePlaceholderTemplate;

    paletteStyle = 'palette slds-visible';

    diagramInitialized = false;

    goGraphObjectMake;

    mainContextMenu;

    orgDiagram;

    overview;

    overviewCSS = 'overview';

    palette;

    svgAvatarUrl = `${SVG_AVATAR}#avatar`;

    horizontalStyle;

    verticalStyle;

    leafVerticalStyle;

    mainHorizontalStyle;

    hasData = true;

    showIntroGraphics = false;

    modelChangedSinceFuseLink = true;

    modelChangedSinceFuseNode = true;

    recentlyRebuildParts = false;

    viewContactTimeout = null;

    zoomBoundaryForViewChange = 0.35;

    currentScale = 1.0;

    hasPaletteInfo = false;

    paletteInfoText = '';

    contactIdsToExclude = [];

    userIdsToExclude = [];

    leadIdsToExclude = [];

    searching = false;

    @api accountId;

    @api allowCreateContact = false;

    @api allowCreateGroup = false;

    @api objectLabel;

    @api rmOrKeystakeholder = 'rm';

    @api mapOrPlanId;

    @track canDrawRel = true;

    @track drawRelObjectId;

    @track menuActions = [];

    defaultDrawRelStyle = {
        background: STYLE.DRAW_REL_ICON_BACKGROUND.replace('{color}', STYLE.REL_LINE_BACKGROUND_COLOR),
        arrow: STYLE.DRAW_REL_ICON_ARROW.replace('{color}', '#505050'),
        dash: STYLE.DRAW_REL_ICON_DASH.replace('{color}', '#505050')
    };

    defaultSvgData;

    get canGroup() {
        return (
            this._canEditGraph &&
            this.allowCreateGroup &&
            this.rmOrgSettings?.pqcrush__Enable_Group_Selection_Context_Menu__c
        );
    }

    // #endregion Private Properties

    // #region Property Getters/Setters

    @api
    get anchors() {
        return this._anchors;
    }

    set anchors(value) {
        this._anchors = value ? JSON.parse(JSON.stringify(value)) : [];
    }

    setBadgeOptions(value) {
        let badgeOptionsMap = {};

        this._badgeOptions = value.map((item) => {
            let result = {
                id: item.Id,
                label: item.pqcrush__Label__c,
                data: {
                    viewBox: item.pqcrush__View_Box__c,
                    fill: item.pqcrush__Fill__c,
                    pathStyle: 'fill: ' + item.pqcrush__Fill__c + ';',
                    geometryString: item.pqcrush__Geometry_String__c
                },
                automation: item.pqcrush__For_Automation_Use_Only__c
            };

            badgeOptionsMap[result.id] = result;

            return result;
        });
        this._badgeOptionsMap = badgeOptionsMap;

        // Filter out for automation only
        this._badgeOptions = this._badgeOptions.filter((item) => item.automation !== true);
    }

    @api
    get relationshipTypes() {
        return this._relationshipTypes;
    }

    set relationshipTypes(value) {
        this._relationshipTypes = [];
        this._relationshipTypesMap = {};
        if (value != null && value.length > 0) {
            value.forEach((item) => {
                const styles = {
                    background: STYLE.DRAW_REL_ICON_BACKGROUND.replace('{color}', STYLE.REL_LINE_BACKGROUND_COLOR),
                    arrow: STYLE.DRAW_REL_ICON_ARROW.replace('{color}', item.pqcrush__Color__c),
                    dash: STYLE.DRAW_REL_ICON_DASH.replace('{color}', item.pqcrush__Color__c)
                };

                this._relationshipTypes.push({
                    id: item.Id,
                    type: item.Id,
                    name: item.Name,
                    label: item.pqcrush__Label__c,
                    styles: styles,
                    color: item.pqcrush__Color__c,
                    editable: item.pqcrush__Label_Editable__c
                });
                this._relationshipTypesMap[item.Id] = {
                    label: item.pqcrush__Label__c,
                    editable: item.pqcrush__Label_Editable__c
                };
            });
        }
        this._relationshipTypesMap.levelLinkType = {
            label: '',
            editable: false
        };
    }

    @api
    get canEditGraph() {
        return this._canEditGraph;
    }

    set canEditGraph(data) {
        this._canEditGraph = data;
        this.updateChartPermissions();
    }

    @api
    get canDrop() {
        return this._canDrop;
    }

    set canDrop(data) {
        this._canDrop = data;
        this.updateChartPermissions();
    }

    @api
    get readOnly() {
        if (this.orgDiagram) {
            return this.orgDiagram.isReadOnly;
        }

        return true;
    }

    set readOnly(value) {
        if (this.orgDiagram) {
            this.orgDiagram.isReadOnly = value;
        }
    }

    @api
    get supportColors() {
        return this._supportColors;
    }

    set supportColors(data) {
        this._supportColors = data;
    }

    @api
    get influenceData() {
        return this._influenceData;
    }

    set influenceData(data) {
        if (data == null) {
            return;
        }
        this._influenceData = {};
        data.forEach((nvp) => {
            this._influenceData[nvp.name] = nvp.value;
        });
    }

    @api
    get chartSettings() {
        return this._chartSettings;
    }

    set chartSettings(value) {
        this._chartSettings = value;
        this.setChartSettings();
    }

    setChartSettings() {
        if (this._chartSettings) {
            this.showParent(this._chartSettings.showParent);
            this.showOverview(this._chartSettings.showOverview);
            this.enableDragSelect(this._chartSettings.enableDragSelect);
            this.setCardStyle(this._chartSettings.cardStyle);
            this.setDisplayStyle();
            // eslint-disable-next-line @lwc/lwc/no-api-reassignments
            this.readOnly = this._chartSettings.readOnly;
        }
    }

    @api
    get rmOrgSettings() {
        return this._rmOrgSettings;
    }

    set rmOrgSettings(value) {
        this._rmOrgSettings = value;
    }

    @api
    get autoLayout() {
        return this._autoLayout;
    }

    set autoLayout(value) {
        this._autoLayout = value;
        this.setAutoLayout(value);
        if (this.orgDiagram) {
            this.dispatchNodeDataArray('savenodecoordinates', this.orgDiagram.model.nodeDataArray);
        }
    }

    @api
    get graphData() {
        return this._graphData;
    }

    set graphData(data) {
        if (!this._influenceData && data.influenceData) {
            this._influenceData = {};
            data.influenceData.forEach((nvp) => {
                this._influenceData[nvp.name] = nvp.value;
            });
        }

        if (!this._supportData && data.supportData) {
            this._supportData = {};
            data.supportData.forEach((nvp) => {
                this._supportData[nvp.name] = nvp.value;
            });
        }

        this.setBadgeOptions(data.badgeOptions);

        this._graphData = {
            groupKeyProperty: data.groupKeyProperty,
            linkFromKeyProperty: data.linkFromKeyProperty,
            linkFromPortIdProperty: data.linkFromPortIdProperty,
            linkToKeyProperty: data.linkToKeyProperty,
            linkToPortIdProperty: data.linkToPortIdProperty,
            linkDataArray: [],
            nodeDataArray: []
        };

        data.linkDataArray.forEach((link) => {
            this._graphData.linkDataArray.push(JSON.parse(JSON.stringify(link)));
        });

        data.nodeDataArray.forEach((node) => {
            let newNode = JSON.parse(JSON.stringify(node));

            newNode.groupKeyCopy = node.groupKey;
            newNode.influenceLabel = this._influenceData[newNode.influence];
            newNode.supportLabel = this._supportData[newNode.support];
            newNode.supportColor = newNode.supportColor ? newNode.supportColor : '#ccc';
            if (newNode.badges && newNode.badges.length > 0) {
                newNode.badges = newNode.badges.map((badge) => {
                    let badgeOption = this._badgeOptionsMap[badge.id];
                    let result = {
                        id: '',
                        geometryString: '',
                        fill: '',
                        label: ''
                    };

                    if (badgeOption) {
                        result.id = badgeOption.id;
                        result.geometryString = badgeOption.data.geometryString;
                        result.fill = badgeOption.data.fill;
                        result.label = badgeOption.label;
                        result.automation = badgeOption.automation;
                        result.bounded = badge.bounded;
                    }

                    return result;
                });
            }

            this._graphData.nodeDataArray.push(newNode);
        });

        this.hasData = false;

        if (this._graphData.nodeDataArray) {
            let _contactMembers = [];
            let _userMembers = [];
            let _leadMembers = [];

            this._graphData.nodeDataArray.forEach((item) => {
                // Get Ids for all members of the graph.
                // If we want only standard members filter by if (item.category === 'keystakeholder') {

                if (!item.isGroup && (item.category === 'contact' || item.category === 'keystakeholder')) {
                    _contactMembers.push(item.key);
                }

                if (!item.isGroup && (item.category === 'manager' || item.category === 'user')) {
                    _userMembers.push(item.key);
                }

                if (!item.isGroup && (item.category === 'lead' || item.category === 'leadmember')) {
                    _leadMembers.push(item.key);
                }
            });

            this.contactIdsToExclude = _contactMembers;
            this.userIdsToExclude = _userMembers;
            this.leadIdsToExclude = _leadMembers;

            if (this._graphData.nodeDataArray.length) {
                this.hasData = true;
            }
        }

        this.updateIntroGraphics();

        if (this.diagramInitialized) {
            this.setIsOngoing(true, null);
            this.orgDiagram.model.nodeDataArray = this._graphData.nodeDataArray;
            this.orgDiagram.model.linkDataArray = this.processPortIdNames(this._graphData.linkDataArray);
        }
    }

    // #endregion Property Getters/Setters

    // #region API Methods

    @api
    closeSidePanel() {
        // Local state toggles
        this.sidePanelVisible = false;
        this.contactLookupVisible = false;

        this.redrawGraph();
        this.updateIntroGraphics();
    }

    @api
    showContactLookup() {
        // If OV is docked, then hide it
        if (this.omniViewerVisible && this.omniViewerDocked) {
            this.closeOmniViewer();
        }

        // If sidepanel was open and contactlookup visible, then toggle off
        if (this.sidePanelVisible && this.contactLookupVisible) {
            this.contactLookupVisible = false;
            this.sidePanelVisible = false;
        } else {
            this.contactLookupVisible = true;
            this.sidePanelVisible = true;
            this.template.querySelector('c-panel').showUndockOption = false;
        }
        this.updateIntroGraphics();
    }

    @api
    get contactLookupDisplay() {
        if (this.contactLookupVisible) {
            return 'display: block;';
        }

        return 'display: none;';
    }

    dockOmniViewer() {
        this.sidePanelVisible = true;
        this.contactLookupVisible = false;
        this.omniViewerVisible = true;
        this.omniViewerDocked = true;
        this.updateIntroGraphics();

        this.template.querySelector('c-panel').showUndockOption = true;
        this.template.querySelector('c-pq-omni-viewer')?.dockViewer();
    }

    handlePanelUnDock() {
        // No other panel type supports docking at this time
        this.unDockOmniViewer();
    }

    unDockOmniViewer() {
        // Local state toggles
        this.omniViewerVisible = true;
        this.omniViewerDocked = false;
        this.contactLookupVisible = false;
        this.sidePanelVisible = false;
        this.updateIntroGraphics();

        this.template.querySelector('c-panel').showUndockOption = false;
        this.template.querySelector('c-pq-omni-viewer').undockViewer();
    }

    closeOmniViewer() {
        this.omniViewerVisible = false;
        this.template.querySelector('c-pq-omni-viewer').hideViewer();
    }

    openOmniViewer(typeHint, objectId, contactId) {
        if (this.omniViewerDocked) {
            this.sidePanelVisible = true;
            this.contactLookupVisible = false;
            this.template.querySelector('c-panel').showUndockOption = true;
        }

        this.omniViewerVisible = true;
        let viewer = this.template.querySelector('c-pq-omni-viewer');
        let objectApiType;

        switch (typeHint) {
            case 'contact':
                objectApiType = 'Contact';
                break;

            case 'keystakeholder':
                objectApiType =
                    this.rmOrKeystakeholder === 'rm'
                        ? 'pqcrush__Relationship_Map_Member__c'
                        : 'pqcrush__Key_Stakeholder__c';
                break;

            default:
                objectApiType = 'Contact';
                break;
        }

        viewer.open(objectApiType, objectId, contactId, '', this.mapOrPlanId, this._rmOrgSettings, this._chartSettings);

        this.redrawGraph();
    }

    @api
    resetView() {
        this.setIsOngoing(true, null);
        this.orgDiagram.zoomToFit();
    }

    @api
    changeCardDetail(cardStyle) {
        this.setCardStyle(cardStyle);
    }

    @api
    increaseZoom() {
        this.setIsOngoing(true, null);
        this.orgDiagram.commandHandler.increaseZoom();
    }

    @api
    decreaseZoom() {
        this.setIsOngoing(true, null);
        this.orgDiagram.commandHandler.decreaseZoom();
    }

    @api
    undoChanges() {
        this.deleteSelection();
        this.orgDiagram.undoManager.undo();
        this.dispatchNodeDataArray('savenodecoordinates', this.orgDiagram.model.nodeDataArray);
    }

    @api
    toggleReadOnly() {
        this.orgDiagram.isReadOnly = !this.readOnly;
        return this.readOnly;
    }

    @api
    toggleDetailVisibility(detailVisibility) {
        if (this.orgDiagram) {
            this.setIsOngoing(true, null);
            this.orgDiagram.startTransaction('toggle all');
            this.orgDiagram.nodes.each(function (node) {
                var pan = node.findObject('PANEL_EXTENDED_FIELDS');

                if (pan !== null) {
                    pan.visible = detailVisibility;
                }
            });
            this.orgDiagram.commitTransaction('toggle all');
        }
    }

    // ---------------------------------------------------

    @api
    updateNodes(graphData) {
        if (this.orgDiagram) {
            this.orgDiagram.startTransaction('update node properties');
            graphData.nodeDataArray.forEach((node) => {
                var contact = this.orgDiagram.model.findNodeDataForKey(node.key);

                if (!contact) {
                    // NEWLY CREATED NODE, LETS HIGHLIGHT IT
                    let nodeFound = this.orgDiagram.findNodeForKey(node.tempId);

                    nodeFound.isSelected = true;
                    contact = nodeFound.data;
                    this.hasData = true;
                    this.updateIntroGraphics();
                }
                if (contact) {
                    // FOUND NODE TO UPDATE
                    Object.entries(node).forEach(([key, value]) => {
                        this.orgDiagram.model.setDataProperty(contact, key, value);
                    });
                }
            });
            this.orgDiagram.commitTransaction('update node properties');
        }
    }

    @api
    addParentNodes(graphData) {
        // Injects parent node data (often just returned from the server) into the local graph
        if (this.orgDiagram) {
            const uniqueDataArray = this.removeDuplicateNodeData(graphData.nodeDataArray);

            this.orgDiagram.startTransaction('add parent nodes');
            this.orgDiagram.model.addNodeDataCollection(uniqueDataArray);
            this.orgDiagram.model.addLinkDataCollection(
                this.processPortIdNames(this.getLinksNotCurrentlyInModel(graphData.linkDataArray))
            );

            let nodeIds = [];

            graphData.nodeDataArray.forEach((nodeData) => {
                nodeIds.push(nodeData.key);
            });

            this.addToContactIdExclusionList(nodeIds);
            this.orgDiagram.commitTransaction('add parent nodes');
        }
    }

    @api
    updateLocalNodeData(graphNodeData) {
        var nodeData = this.orgDiagram.model.findNodeDataForKey(graphNodeData.tempId);

        if (nodeData) {
            this.orgDiagram.model.startTransaction('update node data');
            this.orgDiagram.model.setDataProperty(nodeData, 'key', graphNodeData.key);
            this.orgDiagram.model.setDataProperty(nodeData, 'isKeyTemp', false);
            this.orgDiagram.model.commitTransaction('update node data');

            if (graphNodeData.isGroup) {
                // Find nodes in group & update groupKeyCopy
                let membersInGroup = this.orgDiagram.findNodesByExample({ groupKey: graphNodeData.key });

                membersInGroup?.each((member) => {
                    member.data.groupKeyCopy = member.data.groupKey;
                });
            }
        }
    }

    @api
    updateInfluenceSupport(data) {
        var nodeData = this.orgDiagram.model.findNodeDataForKey(data.memberId);

        if (nodeData) {
            this.orgDiagram.model.startTransaction('update influence support data');
            this.orgDiagram.model.setDataProperty(nodeData, 'influence', data.influence.name);
            this.orgDiagram.model.setDataProperty(nodeData, 'influenceLabel', data.influence.value);
            this.orgDiagram.model.setDataProperty(nodeData, 'support', data.support.name);
            this.orgDiagram.model.setDataProperty(nodeData, 'supportLabel', data.support.value);
            this.orgDiagram.model.setDataProperty(nodeData, 'supportColor', data.support.color);
            this.orgDiagram.model.setDataProperty(nodeData, 'hasInfluenceSupport', true);
            this.orgDiagram.model.commitTransaction('update influence support data');
        }
    }

    @api
    cancelCreateContact(tempId) {
        var nodeData = this.orgDiagram.model.findNodeDataForKey(tempId);

        if (nodeData) {
            this.orgDiagram.model.removeNodeData(nodeData);
        }
    }

    // ---------------------------------------------------

    @api
    redrawGraph() {
        if (this.orgDiagram) {
            // eslint-disable-next-line @lwc/lwc/no-async-operation
            window.setTimeout(() => {
                // First timer is to show data during transition
                this.orgDiagram.requestUpdate();
            }, 250);
            // eslint-disable-next-line @lwc/lwc/no-async-operation
            window.setTimeout(() => {
                // Second timer is to make sure everything is visible once transition finishes
                this.orgDiagram.requestUpdate();
            }, 500);
        }
    }

    @api
    updateProfileImageData(contactId, base64Data) {
        if (this.orgDiagram) {
            const nodeData = this.orgDiagram.model.findNodeDataForKey(contactId);

            if (nodeData) {
                this.orgDiagram.model.startTransaction('update profile image data');
                this.orgDiagram.model.setDataProperty(nodeData, 'profileImageUrlOrData', base64Data);
                this.orgDiagram.model.commitTransaction('update profile image data');
            }
        }
    }

    @api
    handleSearchResults(graphData, mode) {
        this.searching = false;
        this.paletteStyle = 'palette slds-visible';
        this.hasPaletteInfo = false;

        // Maintain distinction of User/Contact/Lead
        if (this.palette) {
            let nodes = {};

            graphData.nodeDataArray.forEach((node) => {
                nodes[node.key] = node.name;
            });

            this.orgDiagram.model.nodeDataArray.forEach((node) => {
                nodes[node.key] = node.name;
            });

            let parentNames = {};

            graphData.linkDataArray.forEach((link) => {
                let parentKey = link[this._graphData.linkFromKeyProperty];

                parentNames[link[this._graphData.linkToKeyProperty]] = nodes[parentKey];
            });

            let hasResult = false;

            graphData.nodeDataArray.forEach((item) => {
                if (mode === 'user') {
                    if (item.isParentNode) {
                        item.category = CategoryHelper.SEARCH_RESULT_CATEGORY_PREFIX + 'manager';
                    } else {
                        item.category = CategoryHelper.SEARCH_RESULT_CATEGORY_PREFIX + 'user';
                        hasResult = true;
                    }
                } else if (mode === 'lead') {
                    item.category = CategoryHelper.SEARCH_RESULT_CATEGORY_PREFIX + 'lead';
                    hasResult = true;
                } else {
                    if (item.isParentNode) {
                        item.category = CategoryHelper.SEARCH_RESULT_CATEGORY_PREFIX + 'contact';
                    } else {
                        hasResult = true;
                        item.category = CategoryHelper.SEARCH_RESULT_CATEGORY_PREFIX + 'keystakeholder';
                        item.reportsTo = parentNames[item.key];
                    }
                }
            });

            this.hasPaletteInfo = !hasResult;
            this.paletteInfoText = this.hasPaletteInfo ? this.labels.noResults : '';
            this.setMemberSearchResultsData(graphData);

            this.palette.model.nodeDataArray = JSON.parse(JSON.stringify(graphData.nodeDataArray));
            this.palette.model.linkDataArray = this.processPortIdNames(graphData.linkDataArray);
        }
    }

    @api updateGroupData(groupId, type) {
        if (this.orgDiagram) {
            const nodeData = this.orgDiagram.model.findNodeDataForKey(groupId);

            if (nodeData) {
                this.orgDiagram.model.startTransaction('update group data');
                this.orgDiagram.model.setDataProperty(nodeData, 'groupLayout', type);
                this.orgDiagram.model.commitTransaction('update group data');
            }
        }
    }

    // #endregion API  Methods

    // ---------------------------------------------------

    async connectedCallback() {
        // This gets triggered after initially loading a map's data
        this.labels.memberDetail = formatLabel(LABEL_VIEW_MAP_MEMBER_DETAILS, [this.objectLabel]);

        await loadScript(this, fuse);

        await loadScript(this, gojslib + '/GoJs/go.js').catch((error) => {
            const graphErrorEvent = new CustomEvent('grapherror', { detail: error });

            this.dispatchEvent(graphErrorEvent);
        });

        await loadScript(this, gojslib + '/GoJs/HyperlinkText.js');
        await loadScript(this, gojslib + '/GoJs/RoundedRectangles.js');

        // Add a reference to this instance so callbacks inside callbacks have a reference.
        let self = this;

        let style = document.createElement('style');

        style.appendChild(document.createTextNode(''));
        document.head.appendChild(style);

        // --------------------------------------------
        // FOR SECURITY REVIEW: FALSE POSITIVE
        document.styleSheets[0].insertRule(
            '.gshHeader { border-color: #ed7ab7; opacity: 70%; margin-bottom: 17px; } ',
            0
        );

        // --------------------------------------------

        go.licenseKey = getOrgChartLicenseKey();
        const $ = go.GraphObject.make;

        this.goGraphObjectMake = $;

        // Console.log('go.version = ' + go.version);

        // This is the actual HTML context menu:
        let cxElement = this.template.querySelector('.action-menu');

        // Since we have only one main element, we don't have to declare a hide method,
        // We can set mainElement and GoJS will hide it automatically

        this.mainContextMenu = $(go.HTMLInfo, {
            show: showContextMenu,
            hide: hideContextMenu
        });

        function handleClick() {
            self.hideCX();
        }

        function squelchEvent(e) {
            e.preventDefault();
        }

        function showContextMenu(obj) {
            // Show only the relevant buttons given the current state.

            let category,
                objectId,
                memberId = '';

            if (obj != null) {
                category = obj.part.data.category;
                objectId = obj.part.data.key;
                if (objectId == null) {
                    objectId = obj.part.data.id;
                }
                memberId = obj.part.data.secondaryKey;
            }

            let canMarkNode,
                canDraw,
                canViewContact,
                canViewGroup,
                canUngroup,
                canRemove,
                canViewMember,
                canViewLead,
                canViewUser,
                canTurnContactToMember,
                canTurnManagerIntoUser,
                canCreatePlaceholder,
                canCreateContact,
                canEditRelationshipLabel,
                canSetTargetAnchor,
                canUpdateProfileImage,
                canCreateTasks,
                canImportContact,
                canChangeGroupLayouts,
                canImportUser = false;

            let selection = obj?.diagram?.selection;
            let selectedNodeCount = 0;

            if (selection) {
                selection.each((item) => {
                    if (item instanceof go.Node && !(item instanceof go.Group)) {
                        selectedNodeCount++;
                    }
                });
            }

            if (obj && obj.part && obj.part instanceof go.Node && !(obj.part instanceof go.Group)) {
                let rootNode = obj.part.findTreeRoot();
                const nodeData = obj.part.data;
                const groupKey = nodeData[self._graphData.groupKeyProperty];

                // If groupKey exists, then the node is in a group
                if (
                    rootNode.key === obj.part.key &&
                    self._canEditGraph &&
                    !groupKey &&
                    (category === 'contact' ||
                        category === 'keystakeholder' ||
                        category === 'placeholder' ||
                        category === 'user')
                ) {
                    canSetTargetAnchor = true;
                }
            }

            const hasRelTypes = self._relationshipTypes && self._relationshipTypes.length > 0;

            if (obj == null) {
                canCreatePlaceholder = self._canEditGraph;
                canCreateContact =
                    self._canEditGraph && self.allowCreateContact && self._chartSettings.createNewContact;
                canImportContact = self._canEditGraph && self.allowCreateMapMember;
                canImportUser = self._canEditGraph && self.allowCreateMapMemberUser;
            } else if (obj.part instanceof go.Link) {
                canRemove = self._canEditGraph;
                if (category) {
                    canEditRelationshipLabel =
                        self._canEditGraph &&
                        self._relationshipTypesMap[category] &&
                        self._relationshipTypesMap[category].editable;
                }
            } else if (obj.part instanceof go.Group) {
                canUngroup = self.canGroup;
                canDraw = hasRelTypes && self._canEditGraph;
                canChangeGroupLayouts = self.canGroup && self._autoLayout;
            } else if (obj.part instanceof go.Node) {
                canMarkNode = self._canEditGraph;
                canDraw =
                    hasRelTypes &&
                    self._canEditGraph &&
                    (category === 'placeholder' ||
                        category === 'contact' ||
                        category === 'keystakeholder' ||
                        category === 'user' ||
                        category === 'manager' ||
                        category === 'leadmember');
                canViewContact = category === 'contact' || category === 'keystakeholder';
                canViewGroup = self.canGroup;
                canRemove =
                    self._canEditGraph &&
                    (category === 'keystakeholder' ||
                        category === 'placeholder' ||
                        category === 'user' ||
                        category === 'leadmember');
                canViewMember = category === 'keystakeholder';
                canViewLead = category === 'leadmember' || category === 'lead';
                canViewUser = category === 'user';
                canTurnContactToMember = self._canEditGraph && category === 'contact';

                // Deferred
                // CanTurnManagerIntoUser = self._canEditGraph && category === 'manager';
                canUpdateProfileImage =
                    selectedNodeCount === 1 &&
                    self._canEditGraph &&
                    (category === 'contact' || category === 'keystakeholder');
                canCreateTasks =
                    self._canEditGraph &&
                    (category === 'contact' || category === 'keystakeholder' || category === 'user');
            }

            let newMenuActions = [];

            self.canDrawRel = false;
            self.canMarkNodes = false;
            self.canChangeGroupLayout = false;

            if (canChangeGroupLayouts) {
                self.groupLayouts = [
                    {
                        id: 0,
                        groupId: objectId,
                        type: 'Horizontal'
                    },
                    {
                        id: 1,
                        groupId: objectId,
                        type: 'Vertical'
                    }
                ];
                self.canChangeGroupLayout = true;
            }

            if (canMarkNode) {
                if (self._badgeOptions.length > 0) {
                    // Add menu options for marking a node
                    self.defaultSvgData = {
                        viewBox: '0 0 52 52',
                        pathStyle: 'fill: #0080ff;',
                        geometryString:
                            'M46,2H6A3.2,3.2,0,0,0,2.82,5.18V46.82a3.19,3.19,0,0,0,4.87,2.7L26,38.11,44.31,49.52a3.19,3.19,0,0,0,4.87-2.7V5.18A3.2,3.2,0,0,0,46,2ZM39,17.49,31.53,23l2.85,8.81a.57.57,0,0,1-.35.72.54.54,0,0,1-.52-.07L26,27l-7.51,5.46a.58.58,0,0,1-.8-.13.6.6,0,0,1-.07-.52L20.47,23,13,17.49a.58.58,0,0,1,0-.82.55.55,0,0,1,.38-.18h9.25L25.5,7.67a.56.56,0,0,1,.69-.39.55.55,0,0,1,.39.39l2.89,8.82h9.25a.58.58,0,0,1,.46.68A.57.57,0,0,1,39,17.49Z'
                    };
                    self.drawRelObjectId = objectId;
                    self.canMarkNodes = true;
                }
            }

            if (canDraw) {
                if (self._relationshipTypes.length === 1) {
                    let styles = {
                        background: STYLE.DRAW_REL_ICON_BACKGROUND.replace('{color}', STYLE.REL_LINE_BACKGROUND_COLOR),
                        arrow: STYLE.DRAW_REL_ICON_ARROW.replace('{color}', self._relationshipTypes[0].color),
                        dash: STYLE.DRAW_REL_ICON_DASH.replace('{color}', self._relationshipTypes[0].color)
                    };
                    let label = formatLabel(LABEL_DRAW_NEW_LINE, [self._relationshipTypes[0].label]);

                    newMenuActions.push({
                        name: 'draw',
                        label: label,
                        objectId: objectId,
                        type: self._relationshipTypes[0].type,
                        color: self._relationshipTypes[0].color,
                        styles: styles
                    });
                } else {
                    self.drawRelObjectId = objectId;
                    self.canDrawRel = true;
                }
            }

            if (canSetTargetAnchor) {
                newMenuActions.push({
                    name: 'settargetanchor',
                    label: self.labels.setHierarchyLevel,
                    objectId: objectId
                });
            }

            if (canViewContact && self.rmOrgSettings?.pqcrush__Enable_Contact_Context_Menu__c) {
                newMenuActions.push({ name: 'contact', label: self.labels.contactDetail, objectId: objectId });
            }

            if (canViewMember && self.rmOrgSettings?.pqcrush__Enable_Map_Member_Context_Menu__c) {
                newMenuActions.push({ name: 'member', label: self.labels.memberDetail, objectId: memberId });
            }

            if (canViewContact && self.rmOrgSettings?.pqcrush__Enable_Omni_Viewer_Context_Menu__c) {
                newMenuActions.push({
                    name: 'omni',
                    label: self.labels.omniViewerDetails,
                    objectId: memberId,
                    contactId: objectId
                });
            }

            if (canViewLead) {
                newMenuActions.push({ name: 'lead', label: self.labels.leadDetail, objectId: objectId });
            }

            if (canViewUser) {
                newMenuActions.push({ name: 'userprofile', label: self.labels.userInfo, objectId: objectId });
            }

            if (canViewGroup) {
                newMenuActions.push({ name: 'group', label: self.labels.group, objectId: objectId });
            }

            if (canUngroup) {
                newMenuActions.push({ name: 'ungroup', label: self.labels.ungroup, objectId: objectId });
            }

            if (canTurnContactToMember) {
                newMenuActions.push({ name: 'contacttomember', label: self.labels.addContact, objectId: objectId });
            }

            if (canTurnManagerIntoUser) {
                newMenuActions.push({ name: 'managertouser', label: self.labels.addManager, objectId: objectId });
            }

            if (canCreatePlaceholder) {
                newMenuActions.push({ name: 'placeholder', label: self.labels.placeholder, objectId: objectId });
            }

            if (canCreateContact) {
                newMenuActions.push({ name: 'newcontact', label: self.labels.newContact, objectId: objectId });
            }

            if (canImportContact) {
                newMenuActions.push({ name: 'importcontact', label: self.labels.importContact, objectId: objectId });
            }

            if (canImportUser) {
                newMenuActions.push({ name: 'importuser', label: self.labels.importUser, objectId: objectId });
            }

            if (canEditRelationshipLabel) {
                newMenuActions.push({
                    name: 'editlabel',
                    label: self.labels.editRelationshipLabel,
                    objectId: objectId
                });
            }

            if (canUpdateProfileImage) {
                newMenuActions.push({
                    name: 'updateprofileimage',
                    label: self.labels.updateProfileImage,
                    objectId: objectId
                });
            }

            if (canRemove) {
                newMenuActions.push({ name: 'remove', label: self.labels.remove, objectId: objectId });
            }

            if (canCreateTasks) {
                newMenuActions.push({
                    name: 'newtask',
                    label: self.labels.newTask,
                    objectId: objectId,
                    category: category
                });
            }

            self.menuActions = newMenuActions;
            let estimateWidth = 230;

            if (canDraw) {
                estimateWidth = 350;
            }

            if (newMenuActions.length > 0) {
                cxElement.classList.add('show-menu');
                let position = self.calculateModalOrigin(estimateWidth, newMenuActions.length);

                cxElement.style.left = position.x + 'px';
                cxElement.style.top = position.y + 'px';
                window.addEventListener('click', handleClick, true);
                window.addEventListener('contextmenu', squelchEvent, true);
            }
        }

        function hideContextMenu() {
            cxElement.classList.remove('show-menu');
            window.removeEventListener('click', handleClick, true);
            window.removeEventListener('contextmenu', squelchEvent, true);
        }

        this.mainHorizontalStyle = getMainHorizontalDefinition(go);
        this.leafVerticalStyle = getVerticalLeafDefinition(go);
        this.verticalStyle = getVerticalDefinition(go);
        this.horizontalStyle = getHorizontalDefinition(go);

        // This custom LinkingTool just turns on Diagram.allowLink when it starts,
        // And turns it off again when it stops so that users cannot draw new links modelessly.
        function CustomLinkingTool() {
            go.LinkingTool.call(this);
        }
        go.Diagram.inherit(CustomLinkingTool, go.LinkingTool);

        // User-drawn linking is normally disabled,
        // But needs to be turned on when using this tool
        CustomLinkingTool.prototype.doStart = function () {
            this.diagram.allowLink = true;
            go.LinkingTool.prototype.doStart.call(this);
        };

        CustomLinkingTool.prototype.doStop = function () {
            go.LinkingTool.prototype.doStop.call(this);
            this.diagram.allowLink = false;
        };

        // #region - Setup the Diagram's properties
        this.orgDiagram = $(go.Diagram, this.template.querySelector('.main'), {
            initialAutoScale: go.Diagram.Uniform,
            validCycle: go.Diagram.CycleDestinationTree,
            contextMenu: this.mainContextMenu,
            allowLink: false,
            linkingTool: new CustomLinkingTool(),

            mouseDrop: function (e) {
                // If drop is out of the viewport bounds of the main diagram, then cancel the drop
                if (self.orgDiagram.viewportBounds.containsPoint(self.orgDiagram.lastInput.documentPoint)) {
                    finishDrop(e, null);
                } else {
                    e.diagram.currentTool.doCancel();
                    e.doCancel();
                }
            },

            // 'animationManager.isEnabled': false,
            // 'undoManager.isEnabled': false,
            'undoManager.isEnabled': true, // enable undo & redo
            'commandHandler.archetypeGroupData': {
                text: 'Group',
                isGroup: true,
                color: 'blue'
            }
        });

        self.updateChartPermissions();

        // Adjust the speed before tooltips are displayed (default is 850)
        self.orgDiagram.toolManager.hoverDelay = 20;

        // Handle mouse wheel zooming, speed adjustment
        self.orgDiagram.toolManager.standardMouseWheel = function () {
            const diagram = this.diagram;
            const e = diagram.lastInput;

            if (!e.control) {
                return;
            }
            this.diagram.commandHandler.zoomFactor = e.shift ? '1.25' : '1.05';
            go.Tool.prototype.standardMouseWheel.call(this);
        };

        // #endregion

        // #region - Handlers

        function handleNodeDetailViewClicked(e, obj) {
            let part = obj.part;

            if (part !== null) {
                switch (part.category) {
                    case 'contact':
                    case 'palette-contact':
                    case 'palette-keystakeholder':
                        if (self.rmOrgSettings?.pqcrush__Enable_Omni_Viewer_Context_Menu__c) {
                            self.openOmniViewer('contact', part.data.key, part.data.key);
                        } else {
                            if (self.rmOrgSettings?.pqcrush__Enable_Contact_Context_Menu__c) {
                                self.viewObjectDetail('standard', 'contact', part.data.key);
                            }
                        }
                        break;

                    case 'keystakeholder':
                        if (self.rmOrgSettings?.pqcrush__Enable_Omni_Viewer_Context_Menu__c) {
                            self.openOmniViewer('keystakeholder', part.data.secondaryKey, part.data.key);
                        } else {
                            if (self.rmOrgSettings?.pqcrush__Enable_Contact_Context_Menu__c) {
                                self.viewObjectDetail('standard', 'contact', part.data.key);
                            }
                        }
                        break;

                    case 'lead':
                    case 'leadmember':
                    case 'palette-lead':
                    case 'palette-leadmember':
                        self.viewObjectDetail('standard', 'lead', part.data.key);
                        break;

                    default:
                        break;
                }
            }
        }

        // This function is used to highlight a Group that the selection may be dropped into
        function highlightGroup(e, grp, show) {
            if (!self.canGroup) {
                return;
            }
            if (!grp) {
                return;
            }
            const tool = e.diagram.toolManager.draggingTool;

            e.handled = true;
            if (show) {
                // Cannot depend on the grp.diagram.selection in the case of external drag-and-drops;
                // Instead depend on the DraggingTool.draggedParts or .copiedParts
                const map = tool.draggedParts || tool.copiedParts; // This is a Map

                // Now we can check to see if the Group will accept membership of the dragged Parts
                if (grp.canAddMembers(map.toKeySet())) {
                    grp.isHighlighted = true;

                    return;
                }
            }
            grp.isHighlighted = false;
        }

        // Upon a drop onto a Group, we try to add the selection as members of the Group.
        // Upon a drop onto the background, or onto a top-level Node, make selection top-level.
        // If this is OK, we're done; otherwise we cancel the operation to rollback everything.
        function finishDrop(e, grp) {
            if (!self.canGroup) {
                return;
            }
            self.setIsOngoing(true, grp);
            let ok;

            if (grp !== null) {
                ok = grp.addMembers(grp.diagram.selection, true);
                if (ok) {
                    let contactIds = [];
                    let grpIds = [];

                    grp.diagram.selection.each((part) => {
                        if (part instanceof go.Node) {
                            if (part.data.isGroup) {
                                grpIds.push(part.data.key);
                            } else {
                                contactIds.push(part.data.key);
                            }
                        }
                    });
                    self.addContactsToGroup(grp.data, contactIds);
                    self.addGroupsToGroup(grp.data, grpIds);
                }
            } else {
                self.handleSelectionDroppedOnCanvas(e.diagram.selection);
                ok = e.diagram.commandHandler.addTopLevelParts(e.diagram.selection, true);
            }
            if (!ok) {
                e.diagram.currentTool.doCancel();
            }
        }

        function customLinkDoubleClicked(e, obj) {
            if (!self._canEditGraph) {
                return;
            }
            self.customLinkLabelStartEdit(obj.data.id);
        }

        function customLinkLabelEdited(e) {
            if (!self._canEditGraph) {
                return;
            }

            let model;
            let _textBlock = e;
            let _link = e.part;
            let _labelPanel = _link.findObject('CUSTOMLINKLABELPANEL');

            // Update the local data model for this link
            if (_link instanceof go.Link && _link.data !== null) {
                model = self.orgDiagram.model;
                model.startTransaction('modified ' + _textBlock.name);
                model.setDataProperty(_link.data, 'text', _textBlock.text);
                model.commitTransaction('modified ' + _textBlock.name);
                self.dispatchCustomLinks([_link.data], 'updatecustomlinks');
            }

            _labelPanel.visible = _textBlock.text !== '';
            _link.isSelected = false;
        }

        // #endregion

        // #region - Node Templates
        const badgeTemplate = $(
            go.Panel,
            'Horizontal',
            {
                alignment: go.Spot.Right,
                shadowVisible: false,
                stretch: go.GraphObject.Horizontal
            },
            $(
                go.Shape,
                {
                    margin: new go.Margin(0, 10, 0, 0),
                    alignment: go.Spot.Left,
                    geometryString: '',
                    fill: '#ff0055',
                    stroke: 'transparent',
                    strokeWidth: 0,
                    visible: true,
                    maxSize: new go.Size(30, 30),
                    geometryStretch: go.GraphObject.Uniform
                },
                new go.Binding('geometryString', 'geometryString', (data) => {
                    let newString = data.replaceAll('z ', ' ');

                    newString = data.replaceAll('Z ', ' ');
                    newString = newString.replaceAll(' x M', ' x F M');
                    newString = newString.replaceAll(' x m', ' x F M');

                    return 'F ' + newString;
                }),
                new go.Binding('fill', 'fill', (data) => {
                    return data;
                })
            )
        );

        const extendedFieldsTopForUrlTemplate = $(
            go.Panel,
            'Horizontal',
            {
                shadowVisible: false,
                margin: new go.Margin(0, 0, 0, 0),
                stretch: go.GraphObject.Horizontal
            },
            $(
                go.Shape,
                {
                    height: 30,
                    width: 30,
                    fill: '#3A559F',
                    background: 'transparent',
                    strokeWidth: 0,
                    name: 'Facebook',
                    margin: new go.Margin(0, 5, 0, 0),
                    visible: true,
                    cursor: 'pointer'
                },
                new go.Binding('click', function (nodeData) {
                    return function () {
                        window.open(nodeData.value, '_blank');
                    };
                }),
                new go.Binding('geometryString', function (nodeData) {
                    if (nodeData.type === 'linkedin') {
                        return GeometryStrings.LINKEDIN;
                    }

                    if (nodeData.type === 'facebook') {
                        return GeometryStrings.FACEBOOK;
                    }

                    if (nodeData.type === 'twitter') {
                        return GeometryStrings.TWITTER;
                    }

                    return '';
                }),
                new go.Binding('fill', function (nodeData) {
                    if (nodeData.type === 'linkedin') {
                        return '#0077B7';
                    }

                    if (nodeData.type === 'facebook') {
                        return '#3A559F';
                    }

                    if (nodeData.type === 'twitter') {
                        return '#1ba1f3';
                    }

                    return '#ffffff';
                })
            ),
            new go.Binding('visible', function (nodeData) {
                if (!self.hasValue(nodeData.value)) {
                    return false;
                }
                if (!nodeData.isMainSection) {
                    return false;
                }
                if (nodeData.type === 'linkedin' || nodeData.type === 'facebook' || nodeData.type === 'twitter') {
                    return true;
                }

                return false;
            })
        );

        const toolTipTemplate = $(
            go.Adornment,
            'Auto',
            $(go.Shape, { fill: 'white' }),
            $(
                go.TextBlock,
                { margin: 4 },
                new go.Binding('text', function (node) {
                    if (isEmail(node.data.value)) {
                        return node.data.value;
                    }

                    return getLinkLabel(node.data.value);
                }).ofObject()
            )
        );

        const extendedFieldsTopTemplate = $(
            go.Panel,
            'Horizontal',
            {
                shadowVisible: false
            },
            $(
                'HyperlinkText',
                function (node) {
                    if (isEmail(node.data.value)) {
                        return 'mailto:' + node.data.value;
                    }

                    return getUrl(node.data.value);
                },
                $(
                    go.Panel,
                    'Auto',
                    $(
                        go.TextBlock,
                        { font: '11pt sans-serif', stroke: STYLE.NODE_TITLE_COLOR },
                        new go.Binding('text', function (nodeData) {
                            if (isEmail(nodeData.value)) {
                                return nodeData.value;
                            }

                            return getUrl(nodeData.value);
                        })
                    )
                ),
                {
                    toolTip: toolTipTemplate
                },
                new go.Binding('visible', 'value', function (val) {
                    return containsHtmlLink(val) || isEmail(val);
                })
            ),
            $(
                go.TextBlock,
                { font: '11pt sans-serif', stroke: STYLE.NODE_TITLE_COLOR },
                new go.Binding('text', function (nodeData) {
                    if (!self.hasValue(nodeData.value)) {
                        return '[' + nodeData.title + ']';
                    }

                    return nodeData.value;
                }),
                new go.Binding('visible', 'value', function (val) {
                    return !containsHtmlLink(val) && !isEmail(val);
                })
            ),
            new go.Binding('visible', function (nodeData) {
                if (!nodeData.isMainSection) {
                    return false;
                }
                if (!self.hasValue(nodeData.value) && !self._chartSettings.showEmptyFields) {
                    return false;
                }
                if (nodeData.type === 'linkedin' || nodeData.type === 'facebook' || nodeData.type === 'twitter') {
                    return false;
                }

                return true;
            })
        );

        const extendedFieldsTemplate = $(
            go.Panel,
            'Horizontal',
            {
                alignment: go.Spot.Left,
                shadowVisible: false
            },
            $(go.TextBlock, { font: 'bold 8.5pt sans-serif' }, new go.Binding('text', 'title')),
            $(go.TextBlock, ' ', { font: '7pt sans-serif' }),
            $(
                'HyperlinkText',
                function (node) {
                    if (isEmail(node.data.value)) {
                        return 'mailto:' + node.data.value;
                    }

                    return getUrl(node.data.value);
                },
                function (node) {
                    if (isEmail(node.data.value)) {
                        return node.data.value;
                    }

                    return getLinkLabel(node.data.value);
                }
            ),
            $(
                go.TextBlock,
                { font: '8.5pt sans-serif' },
                new go.Binding('text', 'value'),
                new go.Binding('visible', 'value', function (val) {
                    return !containsHtmlLink(val) && !isEmail(val);
                })
            ),
            new go.Binding('visible', function (nodeData) {
                if (nodeData.isMainSection) {
                    return false;
                }
                if (!self.hasValue(nodeData.value) && !self._chartSettings.showEmptyFields) {
                    return false;
                }

                return true;
            })
        );

        const groupTemplateEvents = {
            mouseDragEnter: function (e, grp) {
                highlightGroup(e, grp, true);
            },
            mouseDragLeave: function (e, grp) {
                highlightGroup(e, grp, false);
            },
            mouseDrop: finishDrop
        };

        this.orgDiagram.groupTemplate = templateGroup(
            go,
            $,
            groupTemplateEvents,
            this,
            this.horizontalStyle,
            this.verticalStyle
        );
        this.detailTemplate = templateDetail(
            go,
            $,
            this,
            handleNodeDetailViewClicked,
            extendedFieldsTemplate,
            extendedFieldsTopTemplate,
            extendedFieldsTopForUrlTemplate,
            this.svgAvatarUrl,
            badgeTemplate
        );
        this.fixedSizeDetailTemplate = templateDetailFixedSize(
            go,
            $,
            this,
            handleNodeDetailViewClicked,
            extendedFieldsTemplate,
            extendedFieldsTopTemplate,
            extendedFieldsTopForUrlTemplate,
            this.svgAvatarUrl,
            badgeTemplate
        );
        this.compactTemplate = templateCompact(go, $, this, handleNodeDetailViewClicked, badgeTemplate);
        this.contactTemplate = templateContact(go, $, this, handleNodeDetailViewClicked, badgeTemplate);
        this.fixedSizeContactTemplate = templateContactFixedSize(go, $, this, badgeTemplate);
        this.userTemplate = templateUser(go, $, this, badgeTemplate);
        this.fixedSizeUserTemplate = templateUserFixedSize(go, $, this, badgeTemplate);
        this.leadTemplate = templateLead(go, $, this, badgeTemplate);
        this.fixedSizeLeadTemplate = templateLeadFixedSize(go, $, this, badgeTemplate);
        this.managerTemplate = templateManager(go, $, this);
        this.paletteTemplate = templatePalette(go, $, this, handleNodeDetailViewClicked);
        this.placeholderTemplate = templatePlaceholder(go, $, this, badgeTemplate);
        this.fixedSizePlaceholderTemplate = templatePlaceholderFixedSize(go, $, this, badgeTemplate);

        // Register newly defined Templates
        this.orgDiagram.nodeTemplateMap.add('placeholder', this.placeholderTemplate);
        this.orgDiagram.nodeTemplateMap.add('keystakeholder', this.detailTemplate);
        this.orgDiagram.nodeTemplateMap.add('contact', this.contactTemplate);
        this.orgDiagram.nodeTemplateMap.add('leadmember', this.leadTemplate);
        this.orgDiagram.nodeTemplateMap.add('user', this.userTemplate);
        this.orgDiagram.nodeTemplateMap.add('manager', this.managerTemplate);

        this.orgDiagram.nodeTemplateMap.add(
            CategoryHelper.SEARCH_RESULT_CATEGORY_PREFIX + 'keystakeholder',
            this.paletteTemplate
        );
        this.orgDiagram.nodeTemplateMap.add(
            CategoryHelper.SEARCH_RESULT_CATEGORY_PREFIX + 'user',
            this.paletteTemplate
        );
        this.orgDiagram.nodeTemplateMap.add(
            CategoryHelper.SEARCH_RESULT_CATEGORY_PREFIX + 'lead',
            this.paletteTemplate
        );

        // #endregion

        // #region - Link Templates

        this.orgDiagram.linkTemplate = $(
            go.Link,
            go.Link.Orthogonal,
            {
                name: 'linkStandard',
                deletable: false,
                corner: 5,
                zOrder: 28,
                relinkableFrom: false,
                relinkableTo: false,
                contextMenu: this.mainContextMenu
            },
            $(go.Shape, {
                isPanelMain: true,
                name: 'STROKEOUTER',
                stroke: STYLE.STANDARD_LINK_OUTER_STROKE_COLOR,
                strokeWidth: STYLE.STANDARD_LINK_OUTER_STROKE_WIDTH
            }),
            $(go.Shape, {
                isPanelMain: true,
                name: 'STROKEINNER',
                stroke: STYLE.STANDARD_LINK_INNER_STROKE_COLOR,
                strokeWidth: STYLE.STANDARD_LINK_INNER_STROKE_WIDTH,
                strokeDashArray: STYLE.STANDARD_LINK_LINE_DASH
            }),
            new go.Binding('fromSpot').makeTwoWay(),
            new go.Binding('toSpot').makeTwoWay(),
            new go.Binding('deletable', 'deletable', function (deletable) {
                return deletable === true;
            }),
            new go.Binding('opacity', 'isHighlighted', function (isHighlighted) {
                return isHighlighted ? 1.0 : self._chartSettings.reportsToLineOpacity;
            }).ofObject()
        );

        // Custom Relationship Link Templates
        this.relationshipTypes.forEach((item) => {
            const lightBackground = isLightColor(item.color);

            this.orgDiagram.linkTemplateMap.add(
                item.type,
                $(
                    go.Link,
                    go.Link.Bezier,
                    { contextMenu: this.mainContextMenu },
                    { doubleClick: item.editable ? customLinkDoubleClicked : null },
                    { isLayoutPositioned: false, isTreeLink: false },
                    {
                        name: 'linkCustom',
                        deletable: true,
                        zOrder: 29,
                        relinkableFrom: true,
                        relinkableTo: true,
                        selectionAdorned: false,
                        opacity: self._chartSettings.relationshipLineOpacity
                    },
                    new go.Binding('deletable', 'deletable', function (deletable) {
                        return deletable === true;
                    }),
                    new go.Binding('opacity', 'isHighlighted', function (isHighlighted) {
                        return isHighlighted ? 1.0 : self._chartSettings.relationshipLineOpacity;
                    }).ofObject(),
                    $(
                        go.Shape,
                        {
                            isPanelMain: true,
                            name: 'STROKEOUTER',
                            stroke: STYLE.CUSTOM_LINK_OUTER_STROKE_COLOR,
                            strokeWidth: STYLE.CUSTOM_LINK_OUTER_STROKE_WIDTH,
                            opacity: 0.15
                        },
                        new go.Binding('opacity', 'isHighlighted', function (isHighlighted) {
                            return isHighlighted ? 0.5 : 0.15;
                        }).ofObject(),
                        new go.Binding('stroke', 'isHighlighted', function (h) {
                            return h ? 'yellow' : STYLE.CUSTOM_LINK_OUTER_STROKE_COLOR;
                        }).ofObject()
                    ),
                    $(
                        go.Shape,
                        {
                            isPanelMain: true,
                            name: 'STROKEINNER',
                            strokeWidth: STYLE.CUSTOM_LINK_INNER_STROKE_WIDTH,
                            stroke: item.color
                        },
                        new go.Binding('strokeDashArray', 'isSelected', function (h) {
                            return h ? null : STYLE.CUSTOM_LINK_LINE_DASH;
                        }).ofObject('')
                    ),
                    $(go.Shape, {
                        toArrow: 'Triangle',
                        name: 'STROKEARROW',
                        fill: item.color,
                        stroke: item.color,
                        strokeWidth: STYLE.CUSTOM_LINK_INNER_STROKE_WIDTH
                    }),
                    $(
                        go.Panel,
                        'Auto',
                        {
                            // SegmentIndex: 0, segmentOffset: new go.Point(30, 0.5),
                            name: 'CUSTOMLINKLABELPANEL',
                            visible: false
                        },
                        $(go.Shape, 'RoundedRectangle', {
                            fill: item.color,
                            stroke: item.color,
                            strokeWidth: 2,
                            opacity: lightBackground ? 0.95 : 0.75
                        }),
                        $(
                            go.TextBlock,
                            'Enter Text',
                            {
                                textEdited: customLinkLabelEdited,
                                name: 'LINKLABEL',
                                editable: item.editable,
                                font: 'bold 14pt sans-serif',
                                margin: new go.Margin(5, 10, 5, 10),
                                stroke: lightBackground ? '#000000' : '#ffffff',
                                minSize: new go.Size(0, NaN)
                            },
                            new go.Binding('text', 'text')
                        ),
                        new go.Binding('visible', 'text', function (txt) {
                            return txt !== '';
                        })
                    )
                )
            );
        });

        // Alignment Level Link Template
        this.orgDiagram.linkTemplateMap.add(
            'levelLinkType',
            $(
                go.Link,
                go.Link.Bezier,
                { contextMenu: this.mainContextMenu },
                { isLayoutPositioned: false, isTreeLink: false },
                {
                    name: 'linkCustom',
                    deletable: true,
                    zOrder: 29,
                    relinkableFrom: true,
                    relinkableTo: true,
                    selectionAdorned: false,
                    opacity: 0.0
                }
            )
        );

        // #endregion

        // #region - Import Search Palette Template
        this.palette = $(
            go.Palette,
            this.template.querySelector('.palette'), // Must name or refer to the DIV HTML element
            {
                allowZoom: false,
                nodeTemplate: this.paletteTemplate,
                allowDragOut: true,
                allowMove: false,
                allowDelete: true,
                isReadOnly: false
            }
        );

        // Palette group template
        this.palette.groupTemplate = $(go.Group, 'Auto', {
            background: 'transparent'
        });

        // #endregion

        // #region - Workaround for LWS drag & drop issue
        this.palette.doMouseUp = function () {
            self.setRealTarget(self.palette);
            go.Diagram.prototype.doMouseUp.call(self.palette);
        };

        this.palette.doMouseMove = function () {
            self.setRealTarget(self.palette);
            go.Diagram.prototype.doMouseMove.call(self.palette);
        };

        // #endregion

        // #region - Listener Handlers

        self.orgDiagram.addDiagramListener('LinkDrawn', function (e) {
            var link = e.subject;

            if (link.data.category === 'levelLinkType') {
                let fromKey = link.data[self._graphData.linkFromKeyProperty];
                let toKey = link.data[self._graphData.linkToKeyProperty];

                self._anchors = self._anchors.filter((anchor) => {
                    if (anchor.from === fromKey) {
                        return false;
                    }

                    return true;
                });
                self._anchors.push({
                    from: fromKey,
                    to: toKey
                });
                self.setTargetAnchor(fromKey, toKey);
                if (self.recentlyRebuildParts) {
                    self.setDisplayStyle();
                    self.recentlyRebuildParts = false;
                } else {
                    self.orgDiagram.layout.invalidateLayout();
                }
            } else {
                self.orgDiagram.model.startTransaction('linkDrawn');
                self.orgDiagram.model.setDataProperty(link.data, 'tempId', generateUUID2());
                self.orgDiagram.model.setDataProperty(
                    link.data,
                    'text',
                    self._relationshipTypesMap[link.data.category].label
                );
                self.orgDiagram.model.commitTransaction('linkDrawn');
                self.dispatchCustomLinks([link.data], 'newcustomlinks');
            }
        });

        self.orgDiagram.addDiagramListener('LinkRelinked', function (e) {
            var link = e.subject;

            if (link.data.category && link.data.category !== CategoryHelper.HIERARCHY_LINK_CATEGORY) {
                self.dispatchCustomLinks([link.data], 'updatecustomlinks');
            }
        });

        self.orgDiagram.addDiagramListener('SelectionMoved', function (e) {
            if (!self._autoLayout) {
                let parts = e.subject;
                let nodesDataToUpdate = [];

                if (parts) {
                    parts.each((part) => {
                        if (part instanceof go.Node) {
                            nodesDataToUpdate.push(part.data);
                        }
                    });
                }
                self.dispatchNodeDataArray('updatenodecoordinates', nodesDataToUpdate);
            }
        });

        self.orgDiagram.addDiagramListener('SelectionDeleting', function (e) {
            var customLinksToDelete = [];
            var hierarchyLinksToDelete = [];
            var parts = e.subject;
            var hasLinks = false;
            var hasNodes = false;

            if (parts) {
                parts.each((part) => {
                    if (part instanceof go.Link) {
                        hasLinks = true;
                    } else if (part instanceof go.Node) {
                        hasNodes = true;
                    }
                });
            }

            if (parts) {
                parts.each((part) => {
                    if (part instanceof go.Link && part.deletable) {
                        if (hasNodes && hasLinks) {
                            part.isSelected = false;
                        }

                        // Else --> Find Custom Links pointing To this node
                        else if (part.data.category && part.data.category !== CategoryHelper.HIERARCHY_LINK_CATEGORY) {
                            customLinksToDelete.push(part.data);
                        } else {
                            let linkToDelete = JSON.parse(JSON.stringify(part.data));

                            linkToDelete[self._graphData.linkFromKeyProperty] = '';
                            hierarchyLinksToDelete.push(linkToDelete);
                        }
                    } else if (part instanceof go.Group) {
                        part.isSelected = false;
                    }
                });
            }
            self.dispatchCustomLinks(customLinksToDelete, 'deletecustomlinks');
            self.updateHierarchyLinks(hierarchyLinksToDelete);
        });

        self.orgDiagram.addDiagramListener('SelectionDeleted', function () {
            self.removeExtraNonMemberNodes();
            if (self.orgDiagram.model.nodeDataArray.length <= 0) {
                self.hasData = false;
                self.updateIntroGraphics();
            }
        });

        self.orgDiagram.addDiagramListener('SelectionGrouped', function (e) {
            var group = e.subject;
            var tempKey = generateUUID2();

            self.orgDiagram.model.startTransaction('selectionGrouped');
            self.orgDiagram.model.setDataProperty(group.data, 'key', tempKey);
            self.orgDiagram.model.setDataProperty(group.data, 'isKeyTemp', true);
            self.orgDiagram.model.setDataProperty(group.data, 'tempId', tempKey);
            self.orgDiagram.model.setDataProperty(group.data, 'groupLayout', 'Horizontal');
            self.orgDiagram.model.commitTransaction('selectionGrouped');

            const parts = e.subject.memberParts;
            let contactIds = [];

            if (parts) {
                parts.each((part) => {
                    if (part instanceof go.Node) {
                        contactIds.push(part.data.key);
                    }
                });
            }

            self.createNewGroup(group.data, contactIds);
        });

        self.orgDiagram.addDiagramListener('SelectionUngrouped', function (e) {
            var parts = e.parameter;
            var graphNodeDataList = [];

            if (parts) {
                parts.each((part) => {
                    if (part instanceof go.Node) {
                        if (part.containingGroup) {
                            if (part instanceof go.Group) {
                                self.addGroupsToGroup(part.containingGroup.data, [part.data.key]);
                            } else {
                                self.addContactsToGroup(part.containingGroup.data, [part.data.key]);
                            }
                        } else {
                            let copyData = JSON.parse(JSON.stringify(part.data));

                            copyData.groupKey = copyData.groupKeyCopy;
                            graphNodeDataList.push(copyData);
                        }
                    }
                });
            }
            self.removeNodesFromGroup(graphNodeDataList);
        });

        self.orgDiagram.addDiagramListener('ExternalObjectsDropped', function (e) {
            var contactIds = [];
            var userIds = [];
            var leadIds = [];
            var linksToAdd = [];
            var contactParentIds = [];
            var userParentIds = [];
            var nodeDataArray = [];

            self.orgDiagram.model.startTransaction('ExternalObjectsDropped');
            e.subject.each(function (part) {
                if (part instanceof go.Node) {
                    const regex = CategoryHelper.SEARCH_RESULT_CATEGORY_PREFIX_REGEX;
                    let newCat = part.data.category.replace(regex, '');

                    e.diagram.model.setDataProperty(part.data, 'category', newCat);
                    e.diagram.model.setDataProperty(part.data, 'supportLabel', self._supportData[part.data.support]);
                    e.diagram.model.setDataProperty(
                        part.data,
                        'influenceLabel',
                        self._influenceData[part.data.influence]
                    );

                    let nodeFromPalette = self.palette.model.findNodeDataForKey(part.data.key);

                    nodeFromPalette.location = part.data.location;
                    e.diagram.model.setDataProperty(
                        part.data,
                        self._graphData.groupKeyProperty,
                        nodeFromPalette.groupKey
                    );

                    switch (part.data.category.toLowerCase()) {
                        case 'contact':
                        case 'keystakeholder':
                            contactIds.push(part.data.key);
                            break;
                        case 'user':
                            userIds.push(part.data.key);
                            break;
                        case 'lead':
                            leadIds.push(part.data.key);
                            break;
                        default:
                            break;
                    }

                    nodeDataArray.push(part.data);

                    // Pull in group info from the palette data
                    self.addGroupsFromPaletteNotInCurrentData(part.data);
                }
            });

            let nodeIds = [];

            contactIds.forEach((entry) => {
                nodeIds.push(entry);
            });
            userIds.forEach((entry) => {
                nodeIds.push(entry);
            });
            leadIds.forEach((entry) => {
                nodeIds.push(entry);
            });

            // FIND LINK DATA THAT EXISTS FOR EACH NODE
            self.palette.model.linkDataArray.forEach((link) => {
                if (
                    nodeIds.indexOf(link[self._graphData.linkToKeyProperty]) > -1 ||
                    nodeIds.indexOf(link[self._graphData.linkFromKeyProperty]) > -1
                ) {
                    linksToAdd.push(link);
                }

                if (
                    contactIds.indexOf(link[self._graphData.linkToKeyProperty]) > -1 &&
                    link.category === CategoryHelper.HIERARCHY_LINK_CATEGORY
                ) {
                    contactParentIds.push(link[self._graphData.linkFromKeyProperty]);
                }

                if (
                    userIds.indexOf(link[self._graphData.linkToKeyProperty]) > -1 &&
                    link.category === CategoryHelper.HIERARCHY_LINK_CATEGORY
                ) {
                    userParentIds.push(link[self._graphData.linkFromKeyProperty]);
                }
            });

            // FIND LINK DATA THAT EXISTS FOR EACH PARENT
            self.palette.model.linkDataArray.forEach((link) => {
                if (
                    contactParentIds.indexOf(link[self._graphData.linkToKeyProperty]) > -1 ||
                    contactParentIds.indexOf(link[self._graphData.linkFromKeyProperty]) > -1 ||
                    userParentIds.indexOf(link[self._graphData.linkToKeyProperty]) > -1 ||
                    userParentIds.indexOf(link[self._graphData.linkFromKeyProperty]) > -1
                ) {
                    linksToAdd.push(link);
                }
            });

            // Find and add unique links to the model if they don't already exist
            let uniqueNewLinks = self.getLinksNotCurrentlyInModel(linksToAdd);

            e.diagram.model.addLinkDataCollection(self.processPortIdNames(uniqueNewLinks));

            // Bring in parent nodes to the local graph -- This pulls parent nodes from palette data array and adds them to the graph
            let filteredContactParentIds = [];

            if (self._showParentNodes) {
                filteredContactParentIds = contactParentIds.filter((parentId) => contactIds.indexOf(parentId) < 0);
                self.addParentNodesToCollection(filteredContactParentIds, 'contact');
            }

            let filteredUserParentIds = [];

            if (self._showParentUserNodes) {
                filteredUserParentIds = userParentIds.filter((parentId) => userIds.indexOf(parentId) < 0);
                self.addParentNodesToCollection(filteredUserParentIds, 'manager');
            }

            self.orgDiagram.model.commitTransaction('ExternalObjectsDropped');

            // Refactored to handle Users and Contacts
            self.addNodesToChart(nodeDataArray);

            if (nodeDataArray.length) {
                self.hasData = true;
                self.updateIntroGraphics();
            }

            // REMOVE NODES FROM THE PALETTE
            if (self.palette.commandHandler.canDeleteSelection()) {
                self.palette.commandHandler.deleteSelection();
                self.addToContactIdExclusionList(contactIds.concat(filteredContactParentIds));
                self.addToUserIdExclusionList(userIds.concat(filteredUserParentIds));
                self.addToLeadIdExclusionList(leadIds);
            }
        });

        // #endregion

        // #region - Command Override handlers

        this.orgDiagram.commandHandler.doKeyDown = () => {
            // Override keyboard press and do nothing
        };

        this.orgDiagram.commandHandler.deleteSelection = function () {
            let parts = self.orgDiagram.selection;

            let contactIdsToReInclude = [];
            let userIdsToReInclude = [];
            let mapMemberIdsToDelete = [];
            let mapMemberUserIdsToDelete = [];
            let placeholderIdsToDelete = [];
            let leadIdsToDelete = [];
            let mapMemberUserNodesToRemoveLocally = [];
            let leadMemberNodesToRemoveLocally = [];

            parts.each((part) => {
                if (part instanceof go.Node && !(part instanceof go.Group)) {
                    // Check if there is a standard hierarchy link from this node, meaning it's a parent
                    let example = {};

                    example[self._graphData.linkFromKeyProperty] = part.key;
                    const links = self.orgDiagram.findLinksByExample(example);
                    let linksFound = false;

                    if (links && links.count) {
                        links.each((link) => {
                            if (link.category && link.category === CategoryHelper.HIERARCHY_LINK_CATEGORY) {
                                linksFound = true;
                            }
                        });
                    }

                    switch (part.data.category) {
                        case 'keystakeholder':
                            mapMemberIdsToDelete.push(part.data.secondaryKey);

                            // If this keystakeholder was a Parent, then deselect and turn it into a Contact
                            if (linksFound && self._showParentNodes) {
                                part.isSelected = false;
                                self.orgDiagram.model.setDataProperty(part.data, 'category', 'contact');
                                self.orgDiagram.model.setDataProperty(part.data, 'secondaryKey', null);
                                self.orgDiagram.model.setDataProperty(part.data, 'influence', null);
                                self.orgDiagram.model.setDataProperty(part.data, 'support', null);
                            } else {
                                // Childless keystakeholder node to be deleted, removed from exclude list
                                contactIdsToReInclude.push(part.data.key);
                            }
                            break;

                        case 'user':
                            mapMemberUserIdsToDelete.push(part.data.secondaryKey);

                            // If this MMU was a Parent, then deselect and turn into a Manager
                            if (linksFound && self._showParentUserNodes) {
                                part.isSelected = false;
                                self.orgDiagram.model.setDataProperty(part.data, 'category', 'manager');
                                self.orgDiagram.model.setDataProperty(part.data, 'secondaryKey', null);
                            } else {
                                // Childless MMU node to be deleted, removed from exclude list
                                userIdsToReInclude.push(part.data.key);
                                mapMemberUserNodesToRemoveLocally.push(part);
                            }

                            break;

                        case 'placeholder':
                            placeholderIdsToDelete.push(part.data.key);
                            break;

                        case 'leadmember':
                            leadIdsToDelete.push(part.data.key);
                            leadMemberNodesToRemoveLocally.push(part);
                            break;

                        default:
                            break;
                    }
                }
            });

            self.removeFromContactIdExclusionList(contactIdsToReInclude);
            self.removeFromUserIdExclusionList(userIdsToReInclude);
            self.removeFromLeadIdExclusionList(leadIdsToDelete);

            // Call Super to cleanup local graph natively
            go.CommandHandler.prototype.deleteSelection.call(this);

            // HACK -- Normal selection delete command is not working for MMU diagram nodes.
            // If an MMU is marked for deletion, remove it from the map manually.
            // Call cleanup routine afterwards to sweep away any 'orphaned' parents
            if (mapMemberUserNodesToRemoveLocally.length > 0) {
                self.orgDiagram.removeParts(mapMemberUserNodesToRemoveLocally);
                self.removeExtraNonMemberNodes();
            }

            if (leadMemberNodesToRemoveLocally.length > 0) {
                self.orgDiagram.removeParts(leadMemberNodesToRemoveLocally);
                self.removeExtraNonMemberNodes();
            }

            // CALL TO REMOVE FROM SERVER
            self.removeGraphMember(mapMemberIdsToDelete);
            self.deletePlaceholders(placeholderIdsToDelete);
            self.deleteMapMemberUsers(mapMemberUserIdsToDelete);
            self.removeLeadMembers(leadIdsToDelete);
        };

        // #endregion

        // #region - Define the temporary link shape and node styles
        self.orgDiagram.toolManager.linkingTool.temporaryFromNode = $(
            go.Node,
            { layerName: 'Tool' },
            $(go.Shape, 'RoundedRectangle', {
                stretch: go.GraphObject.Fill,
                parameter1: STYLE.NODE_CORNER_RADIUS,
                stroke: STYLE.NODE_SELECTED_STROKE_COLOR,
                strokeWidth: 0 * STYLE.NODE_STROKE_WIDTH,
                fill: STYLE.NODE_SELECTED_FILL_COLOR,
                portId: '',
                width: 1,
                height: 1
            })
        );
        self.orgDiagram.toolManager.linkingTool.temporaryFromPort =
            self.orgDiagram.toolManager.linkingTool.temporaryFromNode.port;

        self.orgDiagram.toolManager.linkingTool.temporaryToNode = $(
            go.Node,
            { layerName: 'Tool' },
            $(go.Shape, 'RoundedRectangle', {
                stretch: go.GraphObject.Fill,
                parameter1: STYLE.NODE_CORNER_RADIUS,
                stroke: STYLE.NODE_SELECTED_STROKE_COLOR,
                strokeWidth: 0 * STYLE.NODE_STROKE_WIDTH,
                fill: STYLE.NODE_SELECTED_FILL_COLOR,
                portId: '',
                width: 1,
                height: 1
            })
        );
        self.orgDiagram.toolManager.linkingTool.temporaryToPort =
            self.orgDiagram.toolManager.linkingTool.temporaryToNode.port;

        // Apply the same temp style when re-linking nodes
        self.orgDiagram.toolManager.relinkingTool.temporaryFromNode =
            self.orgDiagram.toolManager.linkingTool.temporaryFromNode;
        self.orgDiagram.toolManager.relinkingTool.temporaryFromPort =
            self.orgDiagram.toolManager.linkingTool.temporaryFromPort;
        self.orgDiagram.toolManager.relinkingTool.temporaryToNode =
            self.orgDiagram.toolManager.linkingTool.temporaryToNode;
        self.orgDiagram.toolManager.relinkingTool.temporaryToPort =
            self.orgDiagram.toolManager.linkingTool.temporaryToNode.port;

        // #endregion

        // #region - Final Settings

        this.setChartSettings();
        if (this._chartSettings) {
            self.orgDiagram.toolManager.dragSelectingTool.isEnabled = this._chartSettings.enableDragSelect;
        }

        // Setup the Diagram's data
        // Link Direction: fromKey == Parent Node, toKey == Child Node
        self.orgDiagram.model = $(go.GraphLinksModel, {
            linkKeyProperty: 'id',
            linkFromKeyProperty: this._graphData.linkFromKeyProperty,
            linkToKeyProperty: this._graphData.linkToKeyProperty,
            linkFromPortIdProperty: this._graphData.linkFromPortIdProperty,
            linkToPortIdProperty: this._graphData.linkToPortIdProperty,
            nodeGroupKeyProperty: this._graphData.groupKeyProperty,
            nodeDataArray: this._graphData.nodeDataArray,
            linkDataArray: self.processPortIdNames(this._graphData.linkDataArray)
        });

        this.orgDiagram.model.addChangedListener(function () {
            self.modelChangedSinceFuseLink = true;
            self.modelChangedSinceFuseNode = true;
        });

        this.setDisplayStyle();
        this.diagramInitialized = true;

        // Overview
        self.overview = $(
            go.Overview,
            this.template.querySelector('.overview'), // The HTML DIV element for the Overview
            {
                observed: self.orgDiagram,
                contentAlignment: go.Spot.Center
            }
        );

        // #endregion
    }

    setRealTarget(diagram) {
        const e = diagram.lastInput;

        e.targetDiagram = this.orgDiagram;
    }

    // ---------------------------------------------------
}