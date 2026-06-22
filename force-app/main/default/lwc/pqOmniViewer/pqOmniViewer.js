import { LightningElement, api, track } from 'lwc';
import SVG_AVATAR from '@salesforce/resourceUrl/defaultavatar';
import getContactById from '@salesforce/apex/OmniViewerController.getContactById';
import getKeyStakeholderByIdORContactId from '@salesforce/apex/OmniViewerController.getKeyStakeholderByIdORContactId';
import getMapMemberByIdORContactId from '@salesforce/apex/OmniViewerController.getMapMemberByIdORContactId';
import getContactExtendedFields from '@salesforce/apex/OmniViewerController.getContactExtendedFields';
import getMatrixMembersByContactId from '@salesforce/apex/OmniViewerController.getMatrixMembersByContactId';

export default class PQOmniViewer extends LightningElement {
    @track _pageSetData;

    _selectedTabData;

    _personMapMemberData;

    _personContactExtendedData;

    _profileImageData;

    _svgAvatarUrl = `${SVG_AVATAR}#avatar`;

    _objectApiName;

    _mapOrAccountPlanId;

    _mapSettings;

    _rmOrgSettings;

    _dockOmniViewer = true;

    personContactData;

    error;

    title;

    objectId;

    contactId;

    selectedTabId = 0;

    loaded = false;

    memberInfluenceData;

    memberInfluenceDataList;

    // -----------------------------------------------------------

    passthroughEvent(event) {
        const passedEvent = new CustomEvent(event.type, {
            detail: event.detail
        });

        this.dispatchEvent(passedEvent);
    }

    get selectedTabData() {
        return this._selectedTabData;
    }

    set selectedTabData(data) {
        this._selectedTabData = data;
    }

    get objectApiName() {
        return this._objectApiName;
    }

    set objectApiName(data) {
        this._objectApiName = data;
    }

    get mapOrAccountPlanId() {
        return this._mapOrAccountPlanId;
    }

    set mapOrAccountPlanId(data) {
        this._mapOrAccountPlanId = data;
    }

    get mapSettings() {
        return this._mapSettings;
    }

    set mapSettings(data) {
        this._mapSettings = data;
    }

    get rmOrgSettings() {
        return this._rmOrgSettings;
    }

    set rmOrgSettings(data) {
        this._rmOrgSettings = data;
    }

    get pageSetData() {
        return this._pageSetData;
    }

    set pageSetData(data) {
        this._pageSetData = data;
    }

    get personMapMemberData() {
        return this._personMapMemberData;
    }

    set personMapMemberData(data) {
        this._personMapMemberData = data;
    }

    get personContactExtendedData() {
        return this._personContactExtendedData;
    }

    set personContactExtendedData(data) {
        this._personContactExtendedData = data;
    }

    get profileImageData() {
        return this._profileImageData;
    }

    // -----------------------------------------------------------

    @api
    open(objectApiName, objectId, contactId, title, mapOrAccountPlanId, rmOrgSettings, mapSettings) {
        this._objectApiName = objectApiName;
        this.objectId = objectId;
        this.contactId = contactId;
        this.title = title;
        this._mapOrAccountPlanId = mapOrAccountPlanId;
        this._rmOrgSettings = rmOrgSettings;
        this._mapSettings = mapSettings;

        this.showViewer();
        this.loadInitialData();
    }

    @api
    dockViewer() {
        this._dockOmniViewer = true;
    }

    @api
    undockViewer() {
        this._dockOmniViewer = false;
        this.template.querySelector('c-pq-omni-viewer-display-manager')?.undockViewer();
    }

    @api
    showViewer() {
        this.template.querySelector('c-pq-omni-viewer-display-manager')?.show();
    }

    @api
    hideViewer() {
        this.template.querySelector('c-pq-omni-viewer-display-manager')?.hide();
    }

    // -----------------------------------------------------------

    handleCancel() {
        this.hideViewer();
    }

    handleError(error) {
        this.error = error;
    }

    // -----------------------------------------------------------

    async loadPageSetData() {
        // TODO - Phase 2 : load this from the backend
        return {
            isLoaded: true,
            tabSets: [
                {
                    id: 'tabset_0',
                    name: 'Home Group',
                    tabs: [
                        {
                            id: 'tab_0',
                            selected: true,
                            name: 'Home',
                            type: 'pq-omni-home-1',
                            icon: {
                                source: 'lwc',
                                name: 'utility:home',
                                fgColor: '#fff',
                                fgColorSelected: '#97d700',
                                bgColor: '#c0c0c0',
                                bgColorSelected: '#fff'
                            }
                        },
                        {
                            id: 'tab_1',
                            selected: false,
                            name: 'Profile',
                            type: 'pq-omni-profile-1',
                            icon: {
                                source: 'lwc',
                                name: 'utility:user',
                                fgColor: '#fff',
                                fgColorSelected: '#97d700',
                                bgColor: '#c0c0c0',
                                bgColorSelected: '#fff'
                            }
                        }
                    ]
                },
                {
                    id: 'tabset_1',
                    name: 'CRUSH/RM',
                    tabs: [
                        {
                            id: 'tab_2',
                            selected: false,
                            name: 'Influence & Support',
                            type: 'pq-omni-crush-influence-support-1',
                            icon: {
                                source: 'lwc',
                                name: 'utility:emoji',
                                fgColor: '#fff',
                                fgColorSelected: '#72b3dc',
                                bgColor: '#72b3dc',
                                bgColorSelected: '#fff'
                            }
                        },
                        {
                            id: 'tab_3',
                            selected: false,
                            name: 'Contact Groups',
                            type: 'pq-omni-crush-groups-1',
                            icon: {
                                source: 'lwc',
                                name: 'utility:groups',
                                fgColor: '#fff',
                                fgColorSelected: '#72b3dc',
                                bgColor: '#72b3dc',
                                bgColorSelected: '#fff'
                            }
                        },
                        {
                            id: 'tab_4',
                            selected: false,
                            name: 'Hierarchy Relationships',
                            type: 'pq-omni-crush-relationships-1',
                            icon: {
                                source: 'lwc',
                                name: 'utility:hierarchy',
                                fgColor: '#fff',
                                fgColorSelected: '#72b3dc',
                                bgColor: '#72b3dc',
                                bgColorSelected: '#fff'
                            }
                        },
                        {
                            id: 'tab_5',
                            selected: false,
                            name: 'Custom Relationships',
                            type: 'pq-omni-crush-relationships-2',
                            icon: {
                                source: 'lwc',
                                name: 'utility:org_chart',
                                fgColor: '#fff',
                                fgColorSelected: '#72b3dc',
                                bgColor: '#72b3dc',
                                bgColorSelected: '#fff'
                            }
                        }
                    ]
                },
                {
                    id: 'tabset_2',
                    name: 'Related Objects',
                    tabs: [
                        {
                            id: 'tab_6',
                            selected: false,
                            name: 'Opportunities',
                            type: 'pq-omni-rels-opportunities-1',
                            icon: {
                                source: 'lwc',
                                name: 'utility:advertising',
                                fgColor: '#fff',
                                fgColorSelected: '#97d700',
                                bgColor: '#c0c0c0',
                                bgColorSelected: '#fff'
                            }
                        },
                        {
                            id: 'tab_7',
                            selected: false,
                            name: 'Tasks',
                            type: 'pq-omni-rels-tasks-1',
                            icon: {
                                source: 'lwc',
                                name: 'utility:task',
                                fgColor: '#fff',
                                fgColorSelected: '#97d700',
                                bgColor: '#c0c0c0',
                                bgColorSelected: '#fff'
                            }
                        },
                        {
                            id: 'tab_8',
                            selected: false,
                            name: 'Campaigns',
                            type: 'pq-omni-rels-campaigns-1',
                            icon: {
                                source: 'lwc',
                                name: 'utility:campaign',
                                fgColor: '#fff',
                                fgColorSelected: '#97d700',
                                bgColor: '#c0c0c0',
                                bgColorSelected: '#fff'
                            }
                        }
                    ]
                }
            ]
        };
    }

    async loadInitialData() {
        await Promise.all([
            this.loadPageSetData(),
            this.loadMapMemberData(this.objectId, this.mapOrAccountPlanId),
            this.loadContactData(this.contactId),
            this.loadExtendedContactData(this.contactId)
        ])
            .then(([resultPageSetData, resultMemberData, resultContactData, resultExtendedContactData]) => {
                let currentTabId;

                this._pageSetData?.tabSets?.forEach((tabSet) => {
                    tabSet.tabs?.forEach((tab) => {
                        if (tab.selected) {
                            currentTabId = tab.id;
                        }
                    });
                });

                this._pageSetData = JSON.parse(JSON.stringify(resultPageSetData));

                // Update page data with current tab (remember the tabs)
                if (currentTabId) {
                    for (let i = 0; i < this._pageSetData.tabSets.length; i++) {
                        let tabSet = this._pageSetData.tabSets[i];

                        for (let j = 0; j < tabSet.tabs.length; j++) {
                            const tab = tabSet.tabs[j];

                            if (tab.id === currentTabId) {
                                tab.selected = true;
                            } else {
                                tab.selected = false;
                            }
                        }
                    }
                }
                this._personMapMemberData = resultMemberData;
                this.personContactData = JSON.parse(JSON.stringify(resultContactData));
                this._personContactExtendedData = resultExtendedContactData;

                this.extractProfileImageData();
                this.pullSelectedTabData();
                this.loaded = true;
            })
            .catch(() => {});

        // Need to load this after because the logic for global needs to contact data
        await this.loadInfluenceSupportData(this.contactId, this.mapOrAccountPlanId).then((result) => {
            this.memberInfluenceData = result.data;
            this.memberInfluenceDataList = result.dataList;
        });
    }

    pullSelectedTabData() {
        // Extract currently selected tab data
        for (let i = 0; i < this._pageSetData?.tabSets?.length; i++) {
            for (let j = 0; j < this._pageSetData.tabSets[i].tabs.length; j++) {
                if (this._pageSetData.tabSets[i].tabs[j].selected) {
                    this._selectedTabData = this._pageSetData.tabSets[i].tabs[j];
                }
            }
        }
    }

    extractProfileImageData() {
        this._profileImageData = '';

        if (this.personContactExtendedData) {
            this._profileImageData =
                this.personContactExtendedData[
                    this.personMapMemberData?.pqcrush__Contact__c
                ]?.pqcrush__Profile_Picture_Data__c;
        }

        if (this._profileImageData === undefined) {
            this._profileImageData = this._svgAvatarUrl;
        }
    }

    getGlobalInfluenceValue() {
        if (
            this.personContactExtendedData &&
            this.personContactExtendedData[this.personMapMemberData?.pqcrush__Contact__c]?.pqcrush__Influence__r
                ?.Name !== undefined
        ) {
            return this.personContactExtendedData[
                this.personMapMemberData?.pqcrush__Contact__c
            ]?.pqcrush__Influence__r?.Name?.toUpperCase();
        }

        return this.labels?.influenceSupportNotSet;
    }

    getGlobalSupportValue() {
        if (
            this.personContactExtendedData &&
            this.personContactExtendedData[this.personMapMemberData?.pqcrush__Contact__c]?.pqcrush__Support__r?.Name !==
                undefined
        ) {
            return this.personContactExtendedData[
                this.personMapMemberData?.pqcrush__Contact__c
            ]?.pqcrush__Support__r?.Name?.toUpperCase();
        }

        return this.labels?.influenceSupportNotSet;
    }

    getGlobalSupportColor() {
        if (
            this.personContactExtendedData &&
            this.personContactExtendedData[this.personMapMemberData?.pqcrush__Contact__c]?.pqcrush__Support__r
                ?.pqcrush__Color__c !== undefined
        ) {
            return this.personContactExtendedData[this.personMapMemberData?.pqcrush__Contact__c]?.pqcrush__Support__r
                ?.pqcrush__Color__c;
        }

        return null;
    }

    // -----------------------------------------------------------

    async handlePageSetTabChanged(event) {
        let newTabId = event.detail.newTabId;

        // TODO -> move to lambda, this._pageSetData.tabSets.forEach(ts => { ts.tabs.forEach(t => { t.selected = t.id === newTabId; } ); });
        // Update selected tabs
        for (let i = 0; i < this._pageSetData.tabSets.length; i++) {
            for (let j = 0; j < this._pageSetData.tabSets[i].tabs.length; j++) {
                this._pageSetData.tabSets[i].tabs[j].selected = this._pageSetData.tabSets[i].tabs[j].id === newTabId;
            }
        }

        this.selectedTabId = newTabId;
        this.pullSelectedTabData();
    }

    async loadMapMemberData(objectId, mapOrAccountPlanId) {
        switch (this.objectApiName) {
            case 'pqcrush__Key_Stakeholder__c':
                return getKeyStakeholderByIdORContactId({
                    objectId: objectId,
                    planId: mapOrAccountPlanId
                });

            case 'pqcrush__Relationship_Map_Member__c':
                return getMapMemberByIdORContactId({
                    objectId: objectId,
                    mapId: mapOrAccountPlanId
                });

            default:
                // Unsupported Object Type
                return null;
        }
    }

    async loadContactData(contactId) {
        let _result = await getContactById({
            contactId: contactId
        });

        return _result;
    }

    async loadExtendedContactData(contactId) {
        let _result = await getContactExtendedFields({
            contactId: contactId
        });

        return _result;
    }

    async loadInfluenceSupportData(contactId, mapOrAccountPlanId) {
        let _data, _dataList;
        let _result = await getMatrixMembersByContactId({
            contactId: contactId
        });

        if (_result != null && _result.length > 0) {
            const index = _result.findIndex((element) => element.containerId === mapOrAccountPlanId);
            let _resultCopy = JSON.parse(JSON.stringify(_result));

            if (index >= 0) {
                _data = _resultCopy[index];
                if (_data.isUsingGlobalInfluence) {
                    _data.influence = this.getGlobalInfluenceValue();
                    _data.support = this.getGlobalSupportValue();
                    _data.supportColor = this.getGlobalSupportColor();
                }
                _resultCopy.splice(index, 1);
            }
            _dataList = _resultCopy;
            _dataList?.forEach((item) => {
                if (item.isUsingGlobalInfluence) {
                    item.influence = this.getGlobalInfluenceValue();
                    item.support = this.getGlobalSupportValue();
                    item.supportColor = this.getGlobalSupportColor();
                }
            });
        }

        return {
            data: _data,
            dataList: _dataList
        };
    }

    refreshContactClicked() {
        this.loadInitialData();
    }
}