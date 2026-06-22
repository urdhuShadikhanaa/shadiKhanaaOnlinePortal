import { LightningElement, api } from 'lwc';
import Relationship_Map_Features from '@salesforce/label/c.Relationship_Map_Features';
import Auto_Generate_Maps from '@salesforce/label/c.Auto_Generate_Maps';
import Enabled from '@salesforce/label/c.Enabled';
import Disabled from '@salesforce/label/c.Disabled';
import LeadTab from '@salesforce/label/c.Lead_Tab';
import UserTab from '@salesforce/label/c.User_Tab';
import CreateNewContact from '@salesforce/label/c.Create_New_Contact';

import getObjectsRelatedToAccount from '@salesforce/apex/StrategySettingsController.getObjectsRelatedToAccount';
import getObjectsRelatedToAccountPlan from '@salesforce/apex/StrategySettingsController.getObjectsRelatedToAccountPlan';

import saveObjectsRelatedToAccount from '@salesforce/apex/StrategySettingsController.saveObjectsRelatedToAccount';
import saveObjectsRelatedToAccountPlan from '@salesforce/apex/StrategySettingsController.saveObjectsRelatedToAccountPlan';

export default class TaskSettingsPage extends LightningElement {
    showLeadsTab = false;

    showUsersTab = false;

    createNewContact = false;

    errorMessageForAccount = null;

    errorMessageForAccountPlan = null;

    objectsRelatedToAccountList = [];

    objectsRelatedToAccountPlanList = [];

    objectsRelatedToAccount;

    objectsRelatedToAccountPlan;

    @api autoGenerate;

    loadingAccount = false;

    loadingAccountPlan = false;

    showAutoGenerateOption = false;

    label = {
        Relationship_Map_Features,
        Auto_Generate_Maps,
        Enabled,
        Disabled,
        LeadTab,
        UserTab,
        CreateNewContact
    };

    connectedCallback() {
        this.loadSettings();
    }

    loadSettings() {
        this.errorMessageForAccount = null;
        this.errorMessageForAccountPlan = null;
        this.loadingAccount = true;
        getObjectsRelatedToAccount()
            .then((result) => {
                this.objectsRelatedToAccount = JSON.parse(JSON.stringify(result));
                this.objectsRelatedToAccountList = [];
                Object.entries(this.objectsRelatedToAccount).forEach((item) => {
                    this.objectsRelatedToAccountList.push({ label: item[0], value: item[1] });
                });

                this.loadingAccount = false;
            })
            .catch((error) => {
                this.errorMessageForAccount = error?.body?.message;
                this.loadingAccount = false;
            });

        this.loadingAccountPlan = true;
        getObjectsRelatedToAccountPlan()
            .then((result) => {
                this.objectsRelatedToAccountPlan = JSON.parse(JSON.stringify(result));
                this.objectsRelatedToAccountPlanList = [];
                Object.entries(this.objectsRelatedToAccountPlan).forEach((item) => {
                    this.objectsRelatedToAccountPlanList.push({ label: item[0], value: item[1] });
                });
                this.loadingAccountPlan = false;
            })
            .catch((error) => {
                this.errorMessageForAccountPlan = error?.body?.message;
                this.loadingAccountPlan = false;
            });
    }

    handleRelatedAccountChange(event) {
        const dataId = event.currentTarget.dataset.id;

        this.objectsRelatedToAccount[dataId] = event.srcElement.checked;
        saveObjectsRelatedToAccount({ input: this.objectsRelatedToAccount }).catch((error) => {
            this.errorMessageForAccount = error?.body?.message;
        });
    }

    handleRelatedAccountPlanChange(event) {
        const dataId = event.currentTarget.dataset.id;

        this.objectsRelatedToAccountPlan[dataId] = event.srcElement.checked;
        saveObjectsRelatedToAccountPlan({ input: this.objectsRelatedToAccountPlan }).catch((error) => {
            this.errorMessageForAccountPlan = error?.body?.message;
        });
    }
}