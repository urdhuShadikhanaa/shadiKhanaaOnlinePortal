import { LightningElement, api } from 'lwc';
import getMapIdForSObjectId from '@salesforce/apex/RelationshipMapMemberController.getMapIdForSObjectId';
import cannotFetchCreateException from '@salesforce/label/c.error_cannot_retrieve_create_map';
import getRMOrgSettingForType from '@salesforce/apex/SuggestedContactsController.getRMOrgSettingForType';

export default class RelationshipMapForAnyObject extends LightningElement {
    @api recordId;

    @api objectApiName;
    @api skipSuggestedContacts;

    mapId;

    errorMessage = null;
    _settingType;
    settingId;
    showSuggestedContacts = false;
    contactLimit;

    connectedCallback() {
        if (this.objectApiName === 'Account') {
            this._settingType = 'rm';
        } else {
            this._settingType = 'keystakeholder';
        }

        this.getMapId();
        this.loadSettings();
    }

    getMapId() {
        if (!this.objectApiName || !this.recordId) {
            return;
        }
        let self = this;

        getMapIdForSObjectId({ recordId: this.recordId })
            .then((result) => {
                self.mapId = result;
            })
            .catch((error) => {
                this.updateErrorMessage(error.body.message);
                self.mapId = null;
            });
    }

    updateErrorMessage(message) {
        if (this.errorMessage == null) {
            this.errorMessage = cannotFetchCreateException + '<br/>';
        }
        this.errorMessage += message + '<br/>';
    }

    @api
    handleApplicationEvent(eventName, eventValue) {
        const rm = this.template.querySelector('c-relationship-map');

        if (rm) {
            rm.handleApplicationEvent(eventName, eventValue);
        }
    }

    loadSettings() {
        this.errorMessage = null;
        getRMOrgSettingForType({
            type: this._settingType
        })
            .then((result) => {
                if (this.objectApiName === 'pqcrush__Account_Plan__c') {
                    this.showSuggestedContacts = result?.pqcrush__Enable_Suggested_Contacts_For_RM__c;
                    this.contactLimit = result?.pqcrush__contact_limit__c;
                } else if (this.objectApiName === 'Account') {
                    this.showSuggestedContacts = result?.pqcrush__Enable_Sugg_Con_For_RMSettings__c;
                    this.contactLimit = result?.pqcrush__rm_contact_limit__c;
                }
            })
            .catch((error) => {
                this.errorMessage = error?.body?.message;
            });
    }

    passthroughEvent(event) {
        const passedEvent = new CustomEvent(event.type, {
            detail: event.detail
        });

        // Dispatches the event.
        this.dispatchEvent(passedEvent);
    }
}