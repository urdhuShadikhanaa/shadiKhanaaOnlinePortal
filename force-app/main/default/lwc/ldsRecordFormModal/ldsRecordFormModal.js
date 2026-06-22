import { LightningElement, api, track } from 'lwc';
import requiredFieldDet from '@salesforce/apex/SObjectController.getFieldDetails';

export default class LdsRecordFormModal extends LightningElement {
    @api modalTitle;

    @api tempNode;

    @api recordId;

    @api mode = 'edit'; // [view, edit, readonly]

    @api columns = 2;

    error = null;

    layoutType = 'Full';

    objectApiName;

    recordTypeId = null;

    isContact = false;

    @track reqFieldsMap = [];

    mapData = [];

    @api open(objectApiName) {
        this.objectApiName = objectApiName;
        if (this.objectApiName === 'Contact') {
            this.isContact = true;
            this.getFieldDetails(this.objectApiName);
            this.template.querySelector('c-modal-with-record-type-selection').open(objectApiName);
        } else {
            this.template.querySelector('c-modal-with-record-type-selection').open(objectApiName);
        }
    }

   /* handleClick(event) {
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: 'Contact',  // Specify the object is 'Contact'
                actionName: 'new'          // Action is to create a new Contact
            },
            state: {
                recordTypeId: this.recordTypeId,
                navigationLocation: 'RELATED_LIST'  // Pass the selected recordTypeId to load the correct page layout
            }
        });
        
        this.template.querySelector('c-modal-with-record-type-selection').hide();
        this.isContact = false;
        const successEvent = new CustomEvent('success', {
            detail: {
                tempNode: JSON.parse(JSON.stringify(this.tempNode)),
                objectId: event.detail.id
            }
        });

        this.dispatchEvent(successEvent);
    }

    // Programmatically trigger the click event
    triggerButtonClick() {
        // Find the first button using a query selector
        const button = this.template.querySelector('lightning-button');
        if (button) {
            // Dispatch a click event
            button.click();
        }
    }*/

    handleSubmit(event) {
        // Access form elements and their validity
        console.log('field Data *** ' + JSON.stringify(event.detail));
        const fields = this.template.querySelectorAll('lightning-input-field');

        let allValid = true;
        fields.forEach(field => {
            console.log('field Data *** ' +field);
            // Check if each field is valid; if not, display validation message
            if (!field.reportValidity()) {
                allValid = false;
            }
        });

        // Prevent form submission if any fields are invalid
        if (!allValid) {
            event.preventDefault();
        }
    }

    handleSuccess(event) {
        console.log('handleSucess $$$$$');
        this.template.querySelector('c-modal-with-record-type-selection').hide();
        this.isContact = false;
        const successEvent = new CustomEvent('success', {
            detail: {
                tempNode: JSON.parse(JSON.stringify(this.tempNode)),
                objectId: event.detail.id
            }
        });

        this.dispatchEvent(successEvent);
    }

    handleError(event) {
        this.error = event.detail.message;
    }

    handleCancel() {
        this.template.querySelector('c-modal-with-record-type-selection').hide();
        this.isContact = false;
        let cancelEvent;

        if (this.tempNode) {
            let tempId = this.tempNode?.tempId;

            cancelEvent = new CustomEvent('cancel', {
                detail: { tempId }
            });
        } else {
            cancelEvent = new CustomEvent('cancel', {});
        }
        this.dispatchEvent(cancelEvent);
    }

    handleRecordTypeSelected(event) {
        this.recordTypeId = event.detail.recordTypeId;
        console.log('this.recordTypeId ++' + this.recordTypeId);
    }

    async getFieldDetails(objectApiName) {
        console.log('#$%^ObjAPIName' + objectApiName);
        this.reqFieldsMap = [];

        await requiredFieldDet({ sobjectApiName: objectApiName })
            .then((retValues) => {
                this.mapData = retValues;
                console.log('Inside @@@@@@' + JSON.stringify(retValues));
                if (this.mapData) {
                    // eslint-disable-next-line guard-for-in
                    for (let key in this.mapData) {
                        console.log('Inside @@@@@@999' + JSON.stringify(this.mapData[key]));
                        this.reqFieldsMap.push({ key: key, value: this.mapData[key] });
                        console.log('Inside @@@@@@123' + JSON.stringify(this.reqFieldsMap));
                    }
                }
            })
            .catch((error) => {
                this.error = error.message;
            });
    }
}