import { LightningElement, api } from 'lwc';
import Relationship_Map_Features from '@salesforce/label/c.Relationship_Map_Features';
import Auto_Generate_Maps from '@salesforce/label/c.Auto_Generate_Maps';
import Enabled from '@salesforce/label/c.Enabled';
import Disabled from '@salesforce/label/c.Disabled';
import LeadTab from '@salesforce/label/c.Lead_Tab';
import UserTab from '@salesforce/label/c.User_Tab';
import CreateNewContact from '@salesforce/label/c.Create_New_Contact';
import Show from '@salesforce/label/c.Show';
import Hide from '@salesforce/label/c.Hide';
import Show_Auto_Manual_Layout_Toggle from '@salesforce/label/c.Show_Auto_Manual_Layout_Toggle';
import Enable_Contact_Context_Menu from '@salesforce/label/c.Enable_Contact_Context_Menu';
import Enable_Map_Member_Context_Menu from '@salesforce/label/c.Enable_Map_Member_Context_Menu';
import Enable_Omni_Viewer_Context_Menu from '@salesforce/label/c.Enable_Omni_Viewer_Context_Menu';
import Enable_Group_Selection_Context_Menu from '@salesforce/label/c.Enable_Group_Selection_Context_Menu';
import Show_Clone_Map_Button from '@salesforce/label/c.Show_Clone_Map_Button';
import Show_Settings_Button from '@salesforce/label/c.Show_Settings_Button';

import getRMOrgSettingForType from '@salesforce/apex/RMOrgSettingService.getRMOrgSettingForType';
import setTabsSetting from '@salesforce/apex/RMOrgSettingService.setTabsSetting';

import getAutoGenerateMapFlag from '@salesforce/apex/RelationshipMapSettingsController.getAutoCreateMapFlag';
import setAutoGenerateMapFlag from '@salesforce/apex/RelationshipMapSettingsController.setAutoCreateMapFlag';

export default class MapSettingsAutoCreateMap extends LightningElement {
    showLeadsTab = false;

    showUsersTab = false;

    createNewContact = false;

    showAutoManualToggle = false;

    errorMessage = null;

    enableContactMenu = false;

    enableMapMemberMenu = false;

    enableOmniViewerMenu = false;

    enableGroupSelectionMenu = false;

    showCloneButton = false;

    showSettingsButton = false;

    @api autoGenerate;

    @api loading = false;

    autoGenerateMapFlag = false;

    _settingType = 'rm';

    label = {
        Auto_Generate_Maps,
        CreateNewContact,
        Disabled,
        Enable_Contact_Context_Menu,
        Enable_Map_Member_Context_Menu,
        Enable_Omni_Viewer_Context_Menu,
        Enable_Group_Selection_Context_Menu,
        Enabled,
        Hide,
        LeadTab,
        Relationship_Map_Features,
        Show,
        Show_Auto_Manual_Layout_Toggle,
        Show_Clone_Map_Button,
        Show_Settings_Button,
        UserTab
    };

    @api
    get settingType() {
        return this._settingType;
    }

    set settingType(value) {
        this._settingType = value;
    }

    connectedCallback() {
        this.loadSettings();
    }

    async loadSettings() {
        this.errorMessage = null;
        await getRMOrgSettingForType({ type: this._settingType })
            .then((result) => {
                this.showLeadsTab = result?.pqcrush__Lead_Tab__c;
                this.showUsersTab = result?.pqcrush__User_Tab__c;
                this.createNewContact = result?.pqcrush__Create_New_Contact__c;
                this.showAutoManualToggle = result?.pqcrush__Show_Auto_Manual_Toggle__c;
                this.enableContactMenu = result?.pqcrush__Enable_Contact_Context_Menu__c;
                this.enableMapMemberMenu = result?.pqcrush__Enable_Map_Member_Context_Menu__c;
                this.enableOmniViewerMenu = result?.pqcrush__Enable_Omni_Viewer_Context_Menu__c;
                this.enableGroupSelectionMenu = result?.pqcrush__Enable_Group_Selection_Context_Menu__c;
                this.showCloneButton = result?.pqcrush__Show_Clone_Relationship_Map__c;
                this.showSettingsButton = result?.pqcrush__Show_Chart_Settings__c;
            })
            .catch((error) => {
                this.errorMessage = error?.body?.message;
            });

        await getAutoGenerateMapFlag({ mapType: this.settingType })
            .then((result) => {
                this.autoGenerateMapFlag = JSON.parse(JSON.stringify(result));
            })
            .catch((error) => {
                this.errorMessage = error?.body?.message;
            });
    }

    async saveRelationshipMapData() {
        this.errorMessage = null;
        await setTabsSetting({
            type: this._settingType,
            leadTab: this.showLeadsTab,
            userTab: this.showUsersTab,
            createNewContact: this.createNewContact,
            showAutoManualToggle: this.showAutoManualToggle,
            enableContactMenu: this.enableContactMenu,
            enableMapMemberMenu: this.enableMapMemberMenu,
            enableOmniViewerMenu: this.enableOmniViewerMenu,
            enableGroupSelectionMenu: this.enableGroupSelectionMenu,
            showCloneButton: this.showCloneButton,
            showSettingsButton: this.showSettingsButton
        }).catch((error) => {
            this.errorMessage = error?.body?.message;
        });
    }

    saveAutoGenerateFlagValue(newValue) {
        setAutoGenerateMapFlag({ value: newValue, mapType: this.settingType }).catch((error) => {
            this.errorMessage = error?.body?.message;
        });
    }

    handleChange(event) {
        const newValue = event.srcElement.checked;

        this.saveAutoGenerateFlagValue(newValue);
    }

    handleLeadsChange(event) {
        this.showLeadsTab = event.srcElement.checked;
        this.saveRelationshipMapData();
    }

    handleUsersChange(event) {
        this.showUsersTab = event.srcElement.checked;
        this.saveRelationshipMapData();
    }

    handleNewContactChange(event) {
        this.createNewContact = event.srcElement.checked;
        this.saveRelationshipMapData();
    }

    handleShowAutoManualToggleChange(event) {
        this.showAutoManualToggle = event.srcElement.checked;
        this.saveRelationshipMapData();
    }

    handleEnableContactMenuToggle(event) {
        this.enableContactMenu = event.srcElement.checked;
        this.saveRelationshipMapData();
    }

    handleEnableMapMemberMenuToggle(event) {
        this.enableMapMemberMenu = event.srcElement.checked;
        this.saveRelationshipMapData();
    }

    handleEnableOmniViewerMenuToggle(event) {
        this.enableOmniViewerMenu = event.srcElement.checked;
        this.saveRelationshipMapData();
    }

    handleEnableGroupSelectionMenuToggle(event) {
        this.enableGroupSelectionMenu = event.srcElement.checked;
        this.saveRelationshipMapData();
    }

    handleShowCloneButtonToggle(event) {
        this.showCloneButton = event.srcElement.checked;
        this.saveRelationshipMapData();
    }

    handleShowSettingsButtonToggle(event) {
        this.showSettingsButton = event.srcElement.checked;
        this.saveRelationshipMapData();
    }
}