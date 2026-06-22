import { LightningElement, api, track } from 'lwc';
import OmniViewer_Global_Influence_Support_Title from '@salesforce/label/c.OmniViewer_Global_Influence_Support_Title';
import OmniViewer_Influence_Support_Not_Set from '@salesforce/label/c.OmniViewer_Influence_Support_Not_Set';

export default class pqOmniViewerPageHome extends LightningElement {
    @track pageSetDataLoaded = false;

    @track lastActivityDate;

    _selectedTabData = {};

    _showTabHome = false;

    _showTabProfile = false;

    _showTabInfluenceSupport = false;

    labels = {
        influenceSupportTitle: OmniViewer_Global_Influence_Support_Title,
        influenceSupportNotSet: OmniViewer_Influence_Support_Not_Set
    };

    // ----------------------------------------------------

    @api objectApiName;

    @api objectId;

    @api selectedTabId;

    @api mapOrAccountPlanId;

    @api mapSettings;

    @api rmOrgSettings;

    @api pageSetData;

    @api personMapMemberData;

    @api personContactData;

    @api personContactExtendedData;

    @api profileImageData;

    _memberInfluenceData;

    containerName = '';

    influence = '';

    support = '';

    supportColor = '';

    isGlobal = false;

    influenceLabel = '';

    supportLabel = '';

    influenceOverrideValue;

    supportOverrideValue;

    @api
    get memberInfluenceData() {
        return this._memberInfluenceData;
    }

    set memberInfluenceData(val) {
        this._memberInfluenceData = val;
        this.supportLabel = val?.supportLabel;
        this.influenceLabel = val?.influenceLabel;
        this.influenceOverrideValue = val?.influenceOverrideValue;
        this.supportOverrideValue = val?.supportOverrideValue;

        if (this.objectApiName === 'Contact') {
            this.containerName = this.labels?.influenceSupportTitle;
            this.influence = this.getGlobalInfluenceValue();
            this.support = this.getGlobalSupportValue();
            this.supportColor = this.getGlobalSupportColor();
            this.isGlobal = true;
        } else {
            this.containerName = val?.containerName;
            this.influence = val?.influence;
            this.support = val?.support;
            this.supportColor = val?.supportColor;
            this.isGlobal = val?.isUsingGlobalInfluence;
        }
    }

    @api
    get selectedTabData() {
        return this._selectedTabData;
    }

    set selectedTabData(data) {
        this._selectedTabData = data;
    }

    // ----------------------------------------------------
    // Last Activity

    get hasLastActivity() {
        return this.personContactData?.LastActivityDate !== undefined;
    }

    get lastActivity() {
        if (!this.hasLastActivity) {
            return '';
        }

        return 'Last Activity ' + this.personContactData?.LastActivityDate;
    }

    // ----------------------------------------------------
    // Email & Phone Fields

    get email() {
        let val = this.personContactData?.Email;

        if (val === undefined) {
            val = '';
        }

        return val;
    }

    get phone() {
        let val = this.personContactData?.Phone;

        if (val === undefined) {
            val = this.personContactData?.MobilePhone;
            if (val === undefined) {
                val = this.personContactData?.HomePhone;
                if (val === undefined) {
                    val = '';
                }
            }
        }

        return val;
    }

    // ----------------------------------------------------

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
}