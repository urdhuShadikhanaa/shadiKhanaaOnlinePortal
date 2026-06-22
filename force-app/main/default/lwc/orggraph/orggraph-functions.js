/* eslint-disable @lwc/lwc/no-document-query */
/* eslint-disable no-undef */

import { getUrl, getLinkLabel, containsHtmlLink, generateUUID2 } from 'c/utils';
import { CategoryHelper } from './searchMode.js';
import STYLE from './style.js';

export default {
    passthroughEvent(event) {
        const passedEvent = new CustomEvent(event.type, {
            detail: event.detail
        });

        // Dispatches the event.
        this.dispatchEvent(passedEvent);
    },

    removeDuplicateNodeData(nodeDataArray) {
        const uniqueDataArray = nodeDataArray.filter((nodeData) => {
            if (nodeData.isGroup) {
                const node = this.orgDiagram.model.findNodeDataForKey(nodeData.key);

                if (node) {
                    return false;
                }
            }

            return true;
        });

        return uniqueDataArray;
    },

    setDisplayStyle() {
        if (!this.orgDiagram) {
            return;
        }
        this.setIsOngoing(true, null);
        this.orgDiagram.startTransaction('setDisplayStyle');

        this.leafVerticalStyle.isInitial = this._autoLayout;
        this.verticalStyle.isInitial = this._autoLayout;
        this.mainHorizontalStyle.isInitial = this._autoLayout;
        this.horizontalStyle.isInitial = this._autoLayout;
        this.verticalStyle.isOngoing = this._autoLayout;

        this.orgDiagram.groupTemplate.layout = this.goGraphObjectMake(go.TreeLayout, this.verticalStyle);

        switch (this._chartSettings.displayStyle) {
            case 'Leaf_Vertical':
                this.orgDiagram.layout = this.goGraphObjectMake(go.TreeLayout, this.leafVerticalStyle);
                break;
            default:
                this.orgDiagram.layout = this.goGraphObjectMake(go.TreeLayout, this.mainHorizontalStyle);
                break;
        }

        this.orgDiagram.commitTransaction('setDisplayStyle');
        this.setIsOngoing(true);
        this.setDiagramLayoutArrangeTrees();

        // Without this little delay, the graph renders the link in the wrong place for trees with vertical offsets
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        window.setTimeout(() => {
            this.orgDiagram.layout.invalidateLayout();
        }, 100);
    },

    setDiagramLayoutArrangeTrees() {
        let self = this;

        this.orgDiagram.layout.arrangeTrees = function () {
            go.TreeLayout.prototype.arrangeTrees.call(this);

            if (!self._anchors) {
                return;
            }

            self._anchors.forEach((anchor) => {
                this.roots.each((vertex) => {
                    // Loop through vertices & shift down appropriate nodes of the trees
                    if (vertex instanceof go.TreeVertex && vertex.node.key === anchor.from) {
                        if (anchor.to) {
                            let targetNode = self.orgDiagram.findNodeForKey(anchor.to);

                            if (targetNode) {
                                let vertexTargetNode = this.network.findVertex(targetNode);

                                if (vertexTargetNode) {
                                    self.assignAbsolutePositions(vertex, 0, vertexTargetNode.y);
                                }
                            }
                        }
                    }
                });
            });
        };
    },

    updateChartPermissions() {
        if (!this.orgDiagram) {
            return;
        }
        this.orgDiagram.allowCopy = false;
        this.orgDiagram.allowDelete = this._canEditGraph;
        this.orgDiagram.allowDrop = this._canEditGraph && this._canDrop;
        this.orgDiagram.allowGroup = this._canEditGraph;
        this.orgDiagram.allowInsert = this._canEditGraph;
        this.orgDiagram.allowRelink = this._canEditGraph;
        this.orgDiagram.allowTextEdit = this._canEditGraph;
        this.orgDiagram.allowUngroup = this._canEditGraph;
    },

    handleNodeDropped(node) {
        if (!this.orgDiagram.allowDrop) {
            return;
        }
        this.setIsOngoing(true, node);
        let diagram = node.diagram;
        let selnodes = diagram.selection;
        let newLinkArray = [];

        selnodes.each((selnode) => {
            if (this.canDropNode(selnode, node)) {
                this.reconnectNodes(selnode, node, diagram, newLinkArray);
            }
        });
        this.updateHierarchyLinks(newLinkArray);
        this.removeExtraNonMemberNodes();
    },

    canDropNode(node1, node2) {
        // Determine if the dragged node may be dropped onto the target
        if (!this.orgDiagram.allowDrop) {
            return false;
        }
        if (!(node1 instanceof go.Node)) {
            return false;
        } // Must be a Node
        if (node1 === node2) {
            return false;
        } // Cannot work for yourself
        if (node1.data.isGroup || node2.data.isGroup) {
            return false;
        }
        if (
            this.isKindOfUserType(node1) ||
            this.isKindOfUserType(node2) ||
            this.isKindOfLeadType(node1) ||
            this.isKindOfLeadType(node2)
        ) {
            return false;
        }
        if (node1.category === 'contact') {
            return false;
        }
        if (node2.isInTreeOf(node1)) {
            return false;
        } // Cannot work for someone who works for you

        return true;
    },

    canDropNodes(selection, node) {
        if (!this.orgDiagram.allowDrop) {
            return false;
        }

        let copiedParts = this.orgDiagram.toolManager.draggingTool.copiedParts;

        // Check to see if dropping from Palette
        if (copiedParts) {
            let canBeDropped = this.palette.selection.all((item) => {
                if (this.isKindOfUserType(item) || this.isKindOfUserType(node)) {
                    return false;
                }

                return true;
            });

            if (!canBeDropped) {
                return false;
            }

            return true;
        }
        if (selection.count <= 0) {
            return false;
        }
        let canDrop = selection.all((item) => {
            if (this.canDropNode(item, node)) {
                return true;
            }

            return false;
        });

        if (!canDrop) {
            return false;
        }

        return true;
    },

    isKindOfUserType(node) {
        if (
            node.category === 'user' ||
            node.category === 'manager' ||
            node.category === 'palette-user' ||
            node.category === 'palette-manager'
        ) {
            return true;
        }

        return false;
    },

    isKindOfContactType(node) {
        if (
            node.category === 'contact' ||
            node.category === 'keystakeholder' ||
            node.category === 'palette-contact' ||
            node.category === 'palette-keystakeholder'
        ) {
            return true;
        }

        return false;
    },

    isKindOfLeadType(node) {
        if (
            node.category === 'lead' ||
            node.category === 'leadmember' ||
            node.category === 'palette-lead' ||
            node.category === 'palette-leadmember'
        ) {
            return true;
        }

        return false;
    },

    addGroupsFromPaletteNotInCurrentData(node) {
        const groupKey = node[this._graphData.groupKeyProperty];

        if (groupKey) {
            let example = {
                isGroup: true,
                key: groupKey
            };
            let foundGroups = this.palette.findNodesByExample(example);
            let foundGroupsInDiagram = this.orgDiagram.findNodesByExample(example);

            // Found in palette but not in model, so we add to the model
            if (foundGroups && (!foundGroupsInDiagram || !foundGroupsInDiagram.count)) {
                foundGroups.each((group) => {
                    this.orgDiagram.model.addNodeData(group.data);
                });
            }
        }
    },

    addParentNodesToCollection(parentIds, category) {
        parentIds.forEach((parentId) => {
            const foundNodes = this.orgDiagram.model.findNodeDataForKey(parentId);

            if (!foundNodes) {
                const nodesFromPalette = this.palette.model.findNodeDataForKey(parentId);

                if (nodesFromPalette) {
                    nodesFromPalette.category = category;
                    nodesFromPalette.location = this.orgDiagram.lastInput.documentPoint;
                    nodesFromPalette.location.y = nodesFromPalette.location.y - this.orgDiagram.layout.nodeSpacing;
                    this.dispatchNodeDataArray('updatenodecoordinates', [nodesFromPalette]);
                    this.orgDiagram.model.addNodeData(nodesFromPalette);
                }
            }
        });
    },

    handleSelectionDroppedOnCanvas(selection) {
        // THIS HANDLES NODES DROP ON EMPTY CANVAS (NOT IN A GROUP)
        // If it's parts from the palette do skip processing
        if (this.orgDiagram.toolManager.draggingTool.copiedParts) {
            return;
        }

        let graphNodeDataList = [];

        this.setIsOngoing(true, null);
        if (selection) {
            selection.each((sel) => {
                if (sel instanceof go.Node) {
                    graphNodeDataList.push(sel.data);
                }
            });
        }
        this.removeNodesFromGroup(graphNodeDataList);
    },

    removeNodesFromGroup(graphNodeDataList) {
        if (!graphNodeDataList || graphNodeDataList.length <= 0) {
            return;
        }
        this.dispatchEvt('removenodesfromgroup', graphNodeDataList);
    },

    createNewGroup(groupData, memberIds) {
        this.dispatchEvt('createnewgroup', { groupData: groupData, memberIds: memberIds });
    },

    dispatchCustomLinks(linkData, eventName) {
        if (!linkData || linkData.length <= 0) {
            return;
        }
        this.dispatchEvt(eventName, linkData);
    },

    updateHierarchyLinks(linkData) {
        if (!linkData || linkData.length <= 0) {
            return;
        }
        this.dispatchEvt('updatehierarchylinks', linkData);
    },

    setTargetAnchor(rootNodeKey, anchorNodeKey) {
        this.dispatchEvt('settargetanchor', { rootNodeKey, anchorNodeKey });
    },

    dispatchEvt(eventName, detail) {
        const event = new CustomEvent(eventName, { detail });

        this.dispatchEvent(event);
    },

    removeExtraNonMemberNodes() {
        // Cleanup routine - look for any nodes that are Parents (Managers, Contacts) that no longer have child nodes related by standard hierarchy links.
        // Remove any non member nodes that don't have any member as children
        let nonMemberNodes = [];
        let contactNodesToDelete = [];
        let contactIdsToInclude = [];
        let mapMemberUserNodesToDelete = [];
        let mapMemberUserIdsToInclude = [];

        // Find non member nodes
        this.orgDiagram.model.nodeDataArray.forEach((node) => {
            if (node.category === 'contact' || node.category === 'manager') {
                nonMemberNodes.push(node);
            }
        });

        nonMemberNodes.forEach((nonMember) => {
            // Find links where non members are the parent
            let example = {};

            example[this._graphData.linkFromKeyProperty] = nonMember.key;
            const links = this.orgDiagram.findLinksByExample(example);
            let foundLinks = false;

            if (links && links.count) {
                links.each((link) => {
                    // Find standard hierarchy links (reports to, manager id)
                    if (
                        link.category === null ||
                        link.category === '' ||
                        link.category === CategoryHelper.HIERARCHY_LINK_CATEGORY
                    ) {
                        // If it is a hiearchy link, does it go to a member node (keystakeholder)
                        let toKey = link.data[this._graphData.linkToKeyProperty];

                        const contactNodes = this.orgDiagram.findNodesByExample({
                            key: toKey,
                            category: 'keystakeholder'
                        });

                        if (contactNodes && contactNodes.count) {
                            // We've found a hierarchy link to a member node
                            foundLinks = true;
                        }

                        const managerNodes = this.orgDiagram.findNodesByExample({ key: toKey, category: 'user' });

                        if (managerNodes && managerNodes.count) {
                            // We've found a hierarchy link to a user node
                            foundLinks = true;
                        }
                    }
                });
            }

            // Has 0 Children, mark for deletion
            if (!foundLinks) {
                let node = this.orgDiagram.findNodeForKey(nonMember.key);

                if (this.isKindOfContactType(node)) {
                    contactNodesToDelete.push(node);
                    contactIdsToInclude.push(node.data.key);
                }
                if (this.isKindOfUserType(node)) {
                    mapMemberUserNodesToDelete.push(node);
                    mapMemberUserIdsToInclude.push(node.data.key);
                }
            }
        });

        this.removeFromContactIdExclusionList(contactIdsToInclude);
        this.removeFromUserIdExclusionList(mapMemberUserIdsToInclude);
        this.orgDiagram.removeParts(contactNodesToDelete);
        this.orgDiagram.removeParts(mapMemberUserNodesToDelete);
    },

    removeFromContactIdExclusionList(nodeIds) {
        this.contactIdsToExclude = this.contactIdsToExclude.filter((item) => !nodeIds.includes(item));
    },

    addToContactIdExclusionList(nodeIds) {
        this.contactIdsToExclude = [...this.contactIdsToExclude, ...nodeIds];
    },

    removeFromUserIdExclusionList(nodeIds) {
        this.userIdsToExclude = this.userIdsToExclude.filter((item) => !nodeIds.includes(item));
    },

    addToUserIdExclusionList(nodeIds) {
        this.userIdsToExclude = [...this.userIdsToExclude, ...nodeIds];
    },

    removeFromLeadIdExclusionList(nodeIds) {
        this.leadIdsToExclude = this.leadIdsToExclude.filter((item) => !nodeIds.includes(item));
    },

    addToLeadIdExclusionList(nodeIds) {
        this.leadIdsToExclude = [...this.leadIdsToExclude, ...nodeIds];
    },

    findGroupDepth(nodeData) {
        let depth = 0;

        while (nodeData && nodeData.isGroup) {
            nodeData = this.orgDiagram.model.findNodeDataForKey(nodeData[this._graphData.groupKeyProperty]);
            depth++;
        }

        return depth;
    },

    getLinksNotCurrentlyInModel(links) {
        let flags = {};
        let uniqueNewLinks = links.filter((link) => {
            if (flags[link.id]) {
                return false;
            }
            flags[link.id] = true;
            const returnLink = this.orgDiagram.findLinkForKey(link.id);

            if (returnLink) {
                return false;
            }

            return true;
        });

        return uniqueNewLinks;
    },

    hasValue(input) {
        if (!input) {
            return false;
        }
        if (input.length <= 0) {
            return false;
        }
        if (containsHtmlLink(input)) {
            const url = getUrl(input);

            if (!url || url.length <= 1) {
                return false;
            }
            const label = getLinkLabel(input);

            if (!label || label.length <= 0) {
                return false;
            }
        }

        return true;
    },

    viewObjectDetail(viewerType, typeHint, objectId, contactId) {
        // TODO -> Since this is now a double click handler, do we still need this timeout?
        // The double clicks trigger the clicks twice so to prevent, we set it so that you can't successively
        // Select the view object twice in a row (within 1/2 a second)
        if (!this.viewContactTimeout) {
            const objectViewerRequestedEvent = new CustomEvent('requestobjectviewer', {
                detail: {
                    viewerType: viewerType,
                    typeHint: typeHint,
                    objectId: objectId,
                    contactId: contactId
                }
            });

            this.dispatchEvent(objectViewerRequestedEvent);
            // eslint-disable-next-line @lwc/lwc/no-async-operation
            this.viewContactTimeout = window.setTimeout(() => {
                this.viewContactTimeout = null;
            }, 500);
        }
    },

    // ---------------------------
    // Utilities

    findNodeDataForKey(key) {
        // Find the Node Data object based on its key, since orgjs method fails from newly created & swapped nodes
        if (
            this.orgDiagram === null ||
            this.orgDiagram.model === null ||
            this.orgDiagram.model.nodeDataArray === null
        ) {
            return null;
        }
        for (let i = 0; i < this.orgDiagram.model.nodeDataArray.length; i++) {
            let node = this.orgDiagram.model.nodeDataArray[i];

            if (node.key === key) {
                return node;
            }
        }

        return null;
    },

    findNodeForData(key) {
        // Find the Node reference based on its key, since orgjs method fails from newly created & swapped nodes
        let _node1 = this.findNodeDataForKey(key); // Need Node reference, not just the node data
        let _node2 = this.orgDiagram.findNodeForData(_node1);

        return _node2;
    },

    updateArrayValue(collection, matchKey, matchVal, updateProp, updateVal) {
        if (collection === undefined || collection === null) {
            return null;
        }
        for (let i = 0; i < collection.length; i++) {
            if (collection[i][matchKey] === matchVal) {
                collection[i][updateProp] = updateVal;
            }
        }

        return collection;
    },

    // ---------------------------

    addNodesToChart(nodeDataArray) {
        this.dispatchEvt('addnodestochart', { nodeDataArray });
    },

    groupNameChanged(newName, groupData) {
        this.dispatchEvt('groupnamechanged', { groupData: groupData, newName: newName });
    },

    removeGraphMember(memberIdList) {
        if (memberIdList && memberIdList.length > 0) {
            this.dispatchEvt('removegraphmember', memberIdList);
        }
    },

    deleteMapMemberUsers(mapMemberUserIdList) {
        if (mapMemberUserIdList && mapMemberUserIdList.length > 0) {
            this.dispatchEvt('deletemapmemberusers', mapMemberUserIdList);
        }
    },

    removeLeadMembers(leadMemberIdList) {
        if (leadMemberIdList && leadMemberIdList.length > 0) {
            this.dispatchEvt('removeleadmembers', leadMemberIdList);
        }
    },

    deletePlaceholders(placeholderIdList) {
        if (placeholderIdList && placeholderIdList.length > 0) {
            this.dispatchEvt('deleteplaceholders', placeholderIdList);
        }
    },

    addContactsToGroup(groupData, contactIds) {
        this.dispatchEvt('addcontactstogroup', { groupData: groupData, contactIds: contactIds });
    },

    addGroupsToGroup(groupData, groupIds) {
        this.dispatchEvt('addgroupstogroup', { groupData: groupData, groupIds: groupIds });
    },

    createNewPlaceholder(nodeData) {
        this.dispatchEvt('createnewplaceholder', { nodeData });
    },

    createNewContact(nodeData) {
        this.dispatchEvt('createnewcontact', { nodeData });
    },

    viewUser(userId) {
        this.dispatchEvt('viewuser', { userId });
    },

    createNewTask(category, dataId) {
        let detail = {};

        if (category === 'user') {
            detail = { userId: dataId };
        } else {
            detail = { contactId: dataId };
        }

        this.dispatchEvt('createnewtask', detail);
    },

    updateProfileImage(contactId) {
        this.dispatchEvt('updateprofileimage', { contactId: contactId });
    },

    dispatchNodeDataArray(eventName, nodeDataArray) {
        this.dispatchEvt(eventName, { nodeDataArray });
    },

    addParentNodesToChart(nodeDataArray) {
        // Retrieve parent contacts if graph wants to show parent and they dont exists in the graph
        if (this._showParentNodes || this._showParentUserNodes) {
            let contactNodesThatNeedParents = [];
            let userNodesThatNeedParents = [];

            nodeDataArray.forEach((node) => {
                var nodeId = node.key;
                let example = {};
                let needsParent = false;

                example[this._graphData.linkToKeyProperty] = nodeId;
                const links = this.orgDiagram.findLinksByExample(example);

                if (links && links.count > 0) {
                    // Find parent node
                    let found = false;

                    links.each((eachLink) => {
                        if (eachLink.category && eachLink.category === CategoryHelper.HIERARCHY_LINK_CATEGORY) {
                            const pnode = this.orgDiagram.model.findNodeDataForKey(
                                eachLink.data[this._graphData.linkFromKeyProperty]
                            );

                            if (pnode) {
                                found = true;
                            }
                        }
                    });
                    if (!found) {
                        needsParent = true;
                    }
                } else {
                    needsParent = true;
                }

                if (needsParent) {
                    if (this.isKindOfContactType(node)) {
                        if (this._showParentNodes) {
                            contactNodesThatNeedParents.push(nodeId);
                        }
                    }
                    if (this.isKindOfUserType(node)) {
                        if (this._showParentUserNodes) {
                            userNodesThatNeedParents.push(nodeId);
                        }
                    }
                }
            });

            if (contactNodesThatNeedParents.length > 0) {
                this.dispatchEvt('addparentcontactstochart', contactNodesThatNeedParents);
            }

            if (userNodesThatNeedParents.length > 0) {
                this.dispatchEvt('addparentuserstochart', userNodesThatNeedParents);
            }
        }
    },

    processPortIdNames(LinkData) {
        // The server data for each link will only maintain the Category name itself.
        // For each GraphLinkData node, inject the appropriate toPort and fromPort names based on the current UI design.
        LinkData.forEach((link) => {
            if (link.category !== null && link.category === CategoryHelper.HIERARCHY_LINK_CATEGORY) {
                link.fromPort = CategoryHelper.HIERARCHY_LINK_CATEGORY;
                link.toPort = CategoryHelper.HIERARCHY_LINK_CATEGORY;
            } else {
                link.fromPort = this._relLinkPort;
                link.toPort = this._relLinkPort;
            }
        });

        return LinkData;
    },

    setMemberSearchResultsData(graphData) {
        if (this.palette) {
            this.palette.model.nodeDataArray = JSON.parse(JSON.stringify(graphData.nodeDataArray));
            this.palette.model.linkDataArray = graphData.linkDataArray;
        }
    },

    handlePanelClose() {
        // eslint-disable-next-line @lwc/lwc/no-api-reassignments
        this.showPanel = false;
        const event = new CustomEvent('closepanel', {});

        this.dispatchEvent(event);
    },

    // CONTEXT MENU ACTIONS
    menuClicked(event) {
        const action = event.currentTarget.dataset.action;
        const dataId = event.currentTarget.dataset.id;
        const category = event.currentTarget.dataset.category;
        const contactId = event.currentTarget.dataset.contact;

        switch (action) {
            case 'draw':
                this.drawLink(event.currentTarget.dataset.type, dataId, event.currentTarget.dataset.color);
                break;
            case 'group':
                this.groupNodes();
                break;
            case 'remove':
                this.deleteSelection();
                break;
            case 'omni':
                this.openOmniViewer('keystakeholder', dataId, contactId);
                break;
            case 'contact':
                this.viewObjectDetail('standard', 'contact', dataId);
                break;
            case 'member':
                this.viewObjectDetail('standard', 'keystakeholder', dataId);
                break;
            case 'lead':
                this.viewObjectDetail('standard', 'lead', dataId);
                break;
            case 'userprofile':
                this.viewUser(dataId);
                break;
            case 'contacttomember':
                this.turnParentIntoMember(dataId);
                break;
            case 'managertouser':
                this.turnParentIntoMember(dataId);
                break;
            case 'ungroup':
                this.unGroupNodes();
                break;
            case 'placeholder':
                this.makeNewPlaceHolder();
                break;
            case 'newcontact':
                this.makeNewContact();
                break;
            case 'newtask':
                this.createNewTask(category, dataId);
                break;
            case 'editlabel':
                this.customLinkLabelStartEdit(dataId);
                break;
            case 'settargetanchor':
                this.drawLink('levelLinkType', dataId, '#0080ff');
                break;
            case 'updateprofileimage':
                this.updateProfileImage(dataId);
                break;
            default:
                break;
        }
        this.hideCX();
    },

    drawLink(type, key, color) {
        if (!this._canEditGraph) {
            return;
        }

        this.setTemporaryLink(color);

        let node = this.orgDiagram.findNodeForKey(key);

        this.orgDiagram.model.setCategoryForLinkData(this.orgDiagram.toolManager.linkingTool.archetypeLinkData, type);

        let tool = this.orgDiagram.toolManager.linkingTool;
        let NODEBASESHAPE = node.findObject('NODEBASESHAPE');

        tool.startObject = NODEBASESHAPE;
        this.orgDiagram.currentTool = tool;
        tool.doActivate();
    },

    groupNodes() {
        if (!this._canEditGraph) {
            return;
        }
        this.setIsOngoing(true, null);
        this.orgDiagram.commandHandler.groupSelection();
    },

    deleteSelection() {
        if (!this._canEditGraph) {
            return;
        }
        this.orgDiagram.commandHandler.deleteSelection();
    },

    turnParentIntoMember(key) {
        let node = this.orgDiagram.findNodeForKey(key);

        this.addNodesToChart([node.data]);
        this.addParentNodesToChart([node.data]);
    },

    unGroupNodes() {
        if (!this._canEditGraph) {
            return;
        }
        this.orgDiagram.commandHandler.ungroupSelection();
    },

    makeNewPlaceHolder() {
        if (!this._canEditGraph) {
            return;
        }
        this.setIsOngoing(false, null);
        const newLocation = this.orgDiagram.lastInput.documentPoint;
        const tempKey = generateUUID2();
        const newPlaceholder = {
            category: 'placeholder',
            name: 'Placeholder',
            title: 'Description',
            key: tempKey,
            tempId: tempKey,
            location: {
                x: newLocation.x,
                y: newLocation.y
            }
        };

        this.createNewPlaceholder(newPlaceholder);

        this.orgDiagram.model.startTransaction('newplaceholder');
        this.orgDiagram.model.addNodeData(newPlaceholder);
        this.orgDiagram.model.commitTransaction('newplaceholder');
        let placeholderNode = this.orgDiagram.findNodeForKey(tempKey);

        placeholderNode.location = newLocation;
    },

    makeNewContact() {
        if (!this._canEditGraph) {
            return;
        }
        this.setIsOngoing(false, null);
        const newLocation = this.orgDiagram.lastInput.documentPoint;
        const tempKey = generateUUID2();
        const newContact = {
            category: 'keystakeholder',
            name: 'New Contact',
            title: '',
            key: tempKey,
            tempId: tempKey,
            location: {
                x: newLocation.x,
                y: newLocation.y
            }
        };

        this.createNewContact(newContact);

        this.orgDiagram.model.startTransaction('newcontact');
        this.orgDiagram.model.addNodeData(newContact);
        this.orgDiagram.model.commitTransaction('newcontact');
        let contactNode = this.orgDiagram.findNodeForKey(tempKey);

        contactNode.location = newLocation;
    },

    customLinkLabelStartEdit(key) {
        let node = this.orgDiagram.findLinkForKey(key);
        let _labelPanel = node.findObject('CUSTOMLINKLABELPANEL');
        let _label = node.findObject('LINKLABEL');

        _labelPanel.visible = true;
        this.orgDiagram.commandHandler.editTextBlock(_label);
    },

    hideCX() {
        if (this.orgDiagram.currentTool instanceof go.ContextMenuTool) {
            this.orgDiagram.currentTool.doCancel();
        }
    },

    dropMenuClicked(event) {
        const action = event.currentTarget.dataset.action;
        const dataId = event.currentTarget.dataset.id;

        let node = this.orgDiagram.findNodeForKey(dataId);

        switch (action) {
            case 'reportsto':
                this.handleNodeDropped(node);
                break;
            case 'replace':
                this.replacePlaceholderNode(node);
                break;

            default:
                break;
        }
        this.hidePlaceholderCX();
    },

    handleNodeDroppedOnPlaceholder(placeholderNode) {
        let diagram = placeholderNode.diagram;

        if (!diagram.allowDrop) {
            return;
        }

        this.setIsOngoing(true, placeholderNode);

        let selnodes = diagram.selection;

        if (selnodes.count !== 1) {
            return;
        }
        let selnode = selnodes.first();

        if (!this.canDropNode(selnode, placeholderNode)) {
            return;
        }

        let replaceElement = this.template.querySelector('.replace');
        let reportstoElement = this.template.querySelector('.reportsto');

        replaceElement.dataset.id = placeholderNode.data.key;
        reportstoElement.dataset.id = placeholderNode.data.key;

        this.showPlaceholderCX();
    },

    replacePlaceholderNode(placeholderNode) {
        let diagram = placeholderNode.diagram;
        let selnodes = diagram.selection;
        let newLinkArray = [];
        let customLinkArray = [];
        let customLinksToDelete = [];
        let node = placeholderNode.findTreeParentNode();
        let selnode = selnodes.first();

        if (this.canDropNode(selnode, placeholderNode)) {
            this.reconnectNodes(selnode, node, diagram, newLinkArray);
            this.reconfigurePlaceholderToLinks(diagram, placeholderNode, selnode, customLinkArray, customLinksToDelete);
            this.reconfigurePlaceholderFromLinks(
                diagram,
                placeholderNode,
                selnode,
                customLinkArray,
                newLinkArray,
                customLinksToDelete
            );

            diagram.model.removeNodeData(placeholderNode.data);
            this.deletePlaceholders([placeholderNode.data.key]);
            if (customLinkArray.length > 0) {
                this.dispatchCustomLinks(customLinkArray, 'updatecustomlinks');
            }
            if (customLinksToDelete.length > 0) {
                this.dispatchCustomLinks(customLinksToDelete, 'deletecustomlinks');
            }
            this.updateAnchors(selnode, placeholderNode);
            this.updateHierarchyLinks(newLinkArray);
            this.removeExtraNonMemberNodes();
        }
    },

    lightenNodes(selection) {
        var ksShape;
        var sShape;
        var hShape;

        if (this.orgDiagram.toolManager.draggingTool.copiedParts) {
            return;
        }

        selection.each((node) => {
            ksShape = node.findObject('KSIconPanel');
            if (ksShape) {
                ksShape.opacity = 0.5;
            }
            sShape = node.findObject('NODEBASESHAPE');
            if (sShape) {
                sShape.opacity = 0.5;
            }
            hShape = node.findObject('HeadRightEdge');
            if (hShape) {
                hShape.opacity = 0.0;
            }
        });
    },

    darkenNodes(selection) {
        var ksShape;
        var sShape;
        var hShape;

        selection.each((node) => {
            ksShape = node.findObject('KSIconPanel');
            if (ksShape) {
                ksShape.opacity = 1.0;
            }
            sShape = node.findObject('NODEBASESHAPE');
            if (sShape) {
                sShape.opacity = 1.0;
            }
            hShape = node.findObject('HeadRightEdge');
            if (hShape) {
                hShape.opacity = 1.0;
            }
        });
    },

    reconnectNodes(selnode, node, diagram, newLinkArray) {
        diagram.startTransaction('reconnectNodes');

        // Find any existing link into the selected node
        let link = selnode.findTreeParentLink();

        if (!link) {
            //
            let example = {};

            example[this._graphData.linkToKeyProperty] = selnode.key;
            const links = this.palette.findLinksByExample(example);

            if (links && links.count) {
                link = links.first();
            }
        }

        if (link !== null) {
            if (node !== null) {
                // Reconnect any existing link
                link.fromNode = node;
                link.data[this._graphData.linkFromKeyProperty] = node.key;
                newLinkArray.push(link.data);
            } else {
                // Remove link because placeholder has 0 parent
                diagram.model.removeLinkData(link.data);
                let linkToDelete = JSON.parse(JSON.stringify(link.data));

                linkToDelete[this._graphData.linkFromKeyProperty] = '';
                newLinkArray.push(linkToDelete);
            }
        } else if (node !== null) {
            // Else create a new standard link to new parent (placeholder's parent)
            diagram.model.setCategoryForLinkData(
                diagram.toolManager.linkingTool.archetypeLinkData,
                CategoryHelper.HIERARCHY_LINK_CATEGORY
            );
            const newlink = diagram.toolManager.linkingTool.insertLink(node, node.port, selnode, selnode.port);

            if (node.data.category !== 'contact' || selnode.data.category !== 'contact') {
                diagram.model.setDataProperty(newlink.data, 'deletable', true);
                newLinkArray.push(newlink.data);
            }
        }
        diagram.commitTransaction('reconnectNodes');
    },

    reconfigurePlaceholderFromLinks(
        diagram,
        placeholderNode,
        selnode,
        customLinkArray,
        newLinkArray,
        customLinksToDelete
    ) {
        diagram.startTransaction('reconfigurePlaceholderFromLinks');
        let example = {};

        example[this._graphData.linkFromKeyProperty] = placeholderNode.key;
        const links = diagram.findLinksByExample(example);

        links.each((link) => {
            if (link.data[this._graphData.linkToKeyProperty] !== selnode.key) {
                link.fromNode = selnode;
                if (link.data.category && link.data.category !== CategoryHelper.HIERARCHY_LINK_CATEGORY) {
                    customLinkArray.push(link.data);
                } else {
                    newLinkArray.push(link.data);
                }
            } else {
                // Remove link since it points to itself
                customLinksToDelete.push(link.data);
                diagram.model.removeLinkData(link.data);
            }
        });
        diagram.commitTransaction('reconfigurePlaceholderFromLinks');
    },

    reconfigurePlaceholderToLinks(diagram, placeholderNode, selnode, customLinkArray, customLinksToDelete) {
        diagram.startTransaction('reconfigurePlaceholderToLinks');
        let example = {};

        example[this._graphData.linkToKeyProperty] = placeholderNode.key;
        const links = diagram.findLinksByExample(example);

        links.each((link) => {
            if (link.data[this._graphData.linkFromKeyProperty] !== selnode.key) {
                link.toNode = selnode;
                if (link.data.category && link.data.category !== CategoryHelper.HIERARCHY_LINK_CATEGORY) {
                    customLinkArray.push(link.data);
                } else {
                    customLinksToDelete.push(link.data);
                    diagram.model.removeLinkData(link.data);
                }
            } else {
                // Remove link since it points to itself
                customLinksToDelete.push(link.data);
                diagram.model.removeLinkData(link.data);
            }
        });
        diagram.commitTransaction('reconfigurePlaceholderToLinks');
    },

    calculateModalOrigin(estimateWidth, numberOfMenus) {
        let estimatedHeight = numberOfMenus * 40;
        let mousePt = this.orgDiagram.lastInput.viewPoint;
        let x = mousePt.x + 5;
        let elm = this.template.querySelector('.main');

        if (x > elm.scrollWidth - estimateWidth) {
            x = elm.scrollWidth - estimateWidth - 20;
        }
        let y = mousePt.y;

        if (y > elm.scrollHeight - estimatedHeight) {
            y = elm.scrollHeight - estimatedHeight - 20;
        }

        return { x, y };
    },

    showPlaceholderCX() {
        let cxElement = this.template.querySelector('.placeholder-menu');

        cxElement.classList.add('show-menu');
        let position = this.calculateModalOrigin(200, 2);

        cxElement.style.left = position.x + 'px';
        cxElement.style.top = position.y + 'px';

        function hideMenu() {
            cxElement.classList.remove('show-menu');
            window.removeEventListener('click', hideMenu, true);
        }

        // eslint-disable-next-line @lwc/lwc/no-async-operation
        window.setTimeout(() => {
            window.addEventListener('click', hideMenu, true);
        }, 100);
    },

    hidePlaceholderCX() {
        let cxElement = this.template.querySelector('.placeholder-menu');

        cxElement.classList.remove('show-menu');
    },

    relTypeClicked(event) {
        const { type, id, color } = event.currentTarget.dataset;

        this.drawLink(type, id, color);
    },

    badgeOptionClicked(event) {
        const { id } = event.currentTarget.dataset;
        let parts = this.orgDiagram.selection;
        let nodeIds = [];

        this.orgDiagram.model.startTransaction('update badge');
        parts.each((part) => {
            if (part instanceof go.Node && !(part instanceof go.Group)) {
                nodeIds.push(part.key);
                let badge = this._badgeOptionsMap[id];
                let currentBadges = part.data.badges;
                let newBadges = [];

                if (!currentBadges) {
                    newBadges = [
                        {
                            id: badge.id,
                            geometryString: badge.data.geometryString,
                            fill: badge.data.fill,
                            label: badge.label,
                            automation: badge.automation,
                            bounded: false
                        }
                    ];
                } else {
                    let found = currentBadges.find((element) => element.id === badge.id);

                    newBadges = JSON.parse(JSON.stringify(currentBadges));
                    if (!found) {
                        let optionFound = this._badgeOptions.find((element) => element.id === badge.id);

                        if (optionFound) {
                            newBadges.push({
                                id: optionFound.id,
                                geometryString: optionFound.data.geometryString,
                                fill: optionFound.data.fill,
                                label: optionFound.label,
                                automation: optionFound.automation,
                                bounded: false
                            });
                        }
                    }
                }

                this.orgDiagram.model.setDataProperty(part.data, 'badges', newBadges);
            }
        });
        this.orgDiagram.model.commitTransaction('update badge');

        let detail = {
            badgeId: id,
            nodeIds: nodeIds
        };

        this.dispatchEvent(new CustomEvent('associatebadge', { detail }));
    },

    badgeClearClicked() {
        let parts = this.orgDiagram.selection;
        let nodeIds = [];

        this.orgDiagram.model.startTransaction('remove badge');
        parts.each((part) => {
            if (part instanceof go.Node && !(part instanceof go.Group)) {
                nodeIds.push(part.key);
                const newBadges = part.data.badges.filter((item) => item.automation === true || item.bounded === true);

                this.orgDiagram.model.setDataProperty(part.data, 'badges', newBadges);
            }
        });
        this.orgDiagram.model.commitTransaction('remove badge');

        let detail = {
            nodeIds: nodeIds
        };

        this.dispatchEvent(new CustomEvent('removebadge', { detail }));
    },

    groupLayoutClicked(event) {
        const groupId = event.currentTarget.dataset.group;
        const type = event.currentTarget.dataset.type;

        this.dispatchEvent(
            new CustomEvent('grouplayoutchange', {
                detail: {
                    groupId,
                    type
                }
            })
        );
    },

    setTemporaryLink(color) {
        this.orgDiagram.toolManager.linkingTool.temporaryLink = this.goGraphObjectMake(
            go.Link,
            { layerName: 'Tool' },
            this.goGraphObjectMake(go.Shape, {
                isPanelMain: true,
                stroke: STYLE.CUSTOM_LINK_OUTER_STROKE_COLOR,
                strokeWidth: STYLE.CUSTOM_LINK_OUTER_STROKE_WIDTH,
                opacity: 0.15
            }),
            this.goGraphObjectMake(go.Shape, {
                isPanelMain: true,
                stroke: color,
                strokeWidth: STYLE.CUSTOM_LINK_INNER_STROKE_WIDTH,
                strokeDashArray: STYLE.CUSTOM_LINK_LINE_DASH
            }),
            this.goGraphObjectMake(go.Shape, {
                toArrow: 'Triangle',
                fill: color,
                stroke: color,
                strokeWidth: STYLE.CUSTOM_LINK_INNER_STROKE_WIDTH
            })
        );

        this.orgDiagram.toolManager.relinkingTool.temporaryLink = this.orgDiagram.toolManager.linkingTool.temporaryLink;
    },

    showOverview(show) {
        if (show) {
            this.overviewCSS = 'overview';
        } else {
            this.overviewCSS = 'overview slds-hidden';
        }
    },

    showParent(show) {
        this._showParentNodes = show;

        // Disabled showing User's Manager nodes 4-29-2021
        // This._showParentUserNodes = show;
        this.setIsOngoing(true, null);
    },

    enableDragSelect(value) {
        if (this.orgDiagram) {
            this.orgDiagram.toolManager.dragSelectingTool.isEnabled = value;
        }
    },

    setCardStyle(value) {
        if (this.orgDiagram) {
            switch (value) {
                case 'Detail':
                    this.orgDiagram.nodeTemplateMap.set('keystakeholder', this.detailTemplate);
                    this.orgDiagram.nodeTemplateMap.add('placeholder', this.placeholderTemplate);
                    this.orgDiagram.nodeTemplateMap.add('user', this.userTemplate);
                    this.orgDiagram.nodeTemplateMap.add('leadmember', this.leadTemplate);
                    this.orgDiagram.nodeTemplateMap.add('contact', this.contactTemplate);
                    break;
                case 'Compact':
                    this.orgDiagram.nodeTemplateMap.set('keystakeholder', this.compactTemplate);
                    this.orgDiagram.nodeTemplateMap.add('placeholder', this.placeholderTemplate);
                    this.orgDiagram.nodeTemplateMap.add('user', this.userTemplate);
                    this.orgDiagram.nodeTemplateMap.add('leadmember', this.leadTemplate);
                    this.orgDiagram.nodeTemplateMap.add('contact', this.contactTemplate);
                    break;
                case 'FixedSize':
                    this.orgDiagram.nodeTemplateMap.set('keystakeholder', this.fixedSizeDetailTemplate);
                    this.orgDiagram.nodeTemplateMap.add('placeholder', this.fixedSizePlaceholderTemplate);
                    this.orgDiagram.nodeTemplateMap.add('user', this.fixedSizeUserTemplate);
                    this.orgDiagram.nodeTemplateMap.add('leadmember', this.fixedSizeLeadTemplate);
                    this.orgDiagram.nodeTemplateMap.add('contact', this.fixedSizeContactTemplate);
                    break;
                default:
                    this.orgDiagram.nodeTemplateMap.set('keystakeholder', this.detailTemplate);
                    break;
            }
            if (this.diagramInitialized) {
                this.orgDiagram.rebuildParts();
            }
        }
    },

    setAutoLayout(value) {
        if (this.orgDiagram) {
            this.orgDiagram.layout.isInitial = value;
            this.orgDiagram.layout.isOngoing = value;

            this.orgDiagram.groupTemplate.layout.isInitial = value;
            this.orgDiagram.groupTemplate.layout.isOngoing = value;

            let groups = this.orgDiagram.findNodesByExample({ isGroup: true });

            if (groups) {
                groups.each((group) => {
                    group.layout.isInitial = value;
                    group.layout.isOngoing = value;
                    if (value) {
                        group.layout.invalidateLayout();
                    }
                });
            }

            if (value) {
                this.orgDiagram.layout.invalidateLayout();
            }
        }
    },

    setIsOngoing(value, node) {
        if (!this.orgDiagram) {
            return;
        }

        const canSetNode = node?.containingGroup;
        const canSetGroup = node?.data?.isGroup;

        if (this._autoLayout) {
            this.orgDiagram.layout.isOngoing = value;
            if (canSetNode) {
                node.containingGroup.layout.isOngoing = value;
                node.containingGroup.layout.isInitial = value;
            }
            if (canSetGroup) {
                node.layout.isOngoing = value;
                node.layout.isInitial = value;
            }
        } else {
            this.orgDiagram.layout.isOngoing = false;
            if (canSetNode) {
                node.containingGroup.layout.isOngoing = false;
                node.containingGroup.layout.isInitial = false;
            }
            if (canSetGroup) {
                node.layout.isOngoing = false;
                node.layout.isInitial = false;
            }
        }
    },

    assignAbsolutePositions(v, xOffSet, yOffset) {
        if (v === null) {
            return;
        }
        if (!(v instanceof go.TreeVertex)) {
            return;
        }
        if (yOffset) {
            v.x = v.x + xOffSet;
            v.y = v.y + yOffset;
        }
        const children = v.children;

        for (let i = 0; i < children.length; i++) {
            const c = children[i];

            this.assignAbsolutePositions(c, xOffSet, yOffset);
        }
    },

    updateAnchors(selnode, placeholderNode) {
        if (!this._anchors || this._anchors.length <= 0) {
            return;
        }
        if (!selnode || !placeholderNode) {
            return;
        }

        this._anchors.forEach((anchor) => {
            if (anchor.to === placeholderNode.data.key) {
                anchor.to = selnode.key;
                this.setTargetAnchor(anchor.from, anchor.to);
            }
            if (anchor.from === placeholderNode.data.key) {
                anchor.from = selnode.key;
                this.setTargetAnchor(anchor.from, anchor.to);
            }
        });
    },

    getFuseLinks() {
        if (this._fuseLinks && !this.modelChangedSinceFuseLink) {
            return this._fuseLinks;
        }

        const options = {
            minMatchCharLength: 2,
            findAllMatches: true,
            ignoreLocation: true,
            threshold: 0,
            keys: ['text']
        };

        this._fuseLinks = new Fuse(this._graphData.linkDataArray, options);
        this.modelChangedSinceFuseLink = false;

        return this._fuseLinks;
    },

    getFuseNodes() {
        if (this._fuseNodes && !this.modelChangedSinceFuseNode) {
            return this._fuseNodes;
        }

        const options = {
            minMatchCharLength: 2,
            findAllMatches: true,
            ignoreLocation: true,
            threshold: 0,
            keys: [
                'name',
                'accountName',
                'influence',
                'influenceLabel',
                'support',
                'supportLabel',
                'text',
                'label',
                'title',
                'additionalFields.value',
                'badges.label'
            ]
        };

        this._fuseNodes = new Fuse(this._graphData.nodeDataArray, options);
        this.modelChangedSinceFuseNode = false;

        return this._fuseNodes;
    },

    handleSearchChange(event) {
        const textInput = event.currentTarget.value;

        this.search(textInput);
    },

    getOrgChartLicenseKey() {
        let key = '73f04ee';

        key += '6b41c28c';
        key += '702d90776';
        key += '423d6af91';
        key += '9a17564cf';
        key += '814aa3090';
        key += '310f6ef0d';
        key += '3a06329fb';
        key += 'b2856d3df';
        key += '9787ac1df';
        key += 'f187cc3d0';
        key += '8dc03a79c';
        key += '4480c3db3';
        key += '31d7db42e';
        key += '086aeb733';
        key += '20e5410b4';
        key += '79cb40573';
        key += '939ffa78f';
        key += '1fd6a61f1';
        key += 'c3b676bdd';
        key += 'f678cf5';

        return key;
    },

    updateIntroGraphics() {
        this.showIntroGraphics = !this.hasData && !this.sidePanelVisible;
    },

    handleSidePanelSearch(event) {
        this.searching = true;
        this.paletteStyle = 'palette slds-hidden';
        this.hasPaletteInfo = true;
        this.paletteInfoText = this.labels.loading;
        const { searchTerm } = event.detail;

        this.search(searchTerm);
        this.passthroughEvent(event);
    },

    search(textInput) {
        var results = [];

        if (textInput.length > 2) {
            const fl = this.getFuseLinks();
            const fn = this.getFuseNodes();

            const resultLinks = fl.search(textInput);
            const resultNodes = fn.search(textInput);

            this.orgDiagram.startTransaction('highlight search');

            resultLinks.forEach((item) => {
                const foundLink = this.orgDiagram.findLinkForKey(item.item.id);

                if (foundLink) {
                    results.push(foundLink);
                }
            });

            let groupSet = new Set();

            resultNodes.forEach((item) => {
                const foundLink2 = this.orgDiagram.findNodeForKey(item.item.key);

                if (foundLink2) {
                    results.push(foundLink2);
                }

                let foundGroup = this.orgDiagram.findNodeForKey(foundLink2.data[this._graphData.groupKeyProperty]);

                while (foundGroup) {
                    if (!foundGroup.isSubGraphExpanded && !groupSet.has(foundGroup.key)) {
                        groupSet.add(foundGroup.key);
                        results.push(foundGroup);
                    }
                    foundGroup = this.orgDiagram.findNodeForKey(foundGroup.data[this._graphData.groupKeyProperty]);
                }
            });

            this.orgDiagram.highlightCollection(results);
            if (results.count > 0) {
                this.orgDiagram.centerRect(results.first().actualBounds);
            }

            this.orgDiagram.commitTransaction('highlight search');
        } else {
            this.orgDiagram.startTransaction('highlight clear');
            this.orgDiagram.clearHighlighteds();
            this.orgDiagram.commitTransaction('highlight clear');
        }
    }
};