import { LightningElement, track, api } from 'lwc';
import receiveCanvasData from '@salesforce/apex/AccountPlanTemplateController.receiveCanvasData';
import getAccountPlanTemplate from '@salesforce/apex/AccountPlanTemplateController.getAccountPlanTemplate';
import getTemplateById from '@salesforce/apex/AccountPlanTemplateController.getTemplateById';
import Submit from '@salesforce/label/c.Submit';
import Cancel from '@salesforce/label/c.Cancel';
import Close from '@salesforce/label/c.Close';
import SaveTemplate from '@salesforce/label/c.SaveTemplate';
import Template_Name from '@salesforce/label/c.Template_Name';
import Save_as_default from '@salesforce/label/c.Save_as_default';
export default class SaveModalAccountPlanTemplate extends LightningElement {
    Close = Close;
    SaveTemplate = SaveTemplate;
    Template_Name = Template_Name;
    Save_as_default = Save_as_default;
    Cancel = Cancel;
    Submit = Submit;
    @track isShowModal = true;
    @api headerTitle;
    @api headerImage;
    @api componentAvailable;
    @api uploadfileName;
    @api recordId;
    templateinput;
    nameOfTemplate = '';
    sameTemplateName = '';
    message = '';
    isEditName = false;
    isSpinner = true;
    isOuterSpinner = false;
    recSaveId = '';

    hideModalBox() {
        this.isShowModal = false;
    }

    connectedCallback() {
        this.recSaveId = this.recordId;
        if (this.recSaveId !== null) {
            getTemplateById({ id: this.recSaveId })
                .then((result) => {
                    if (result) {
                        this.nameOfTemplate = result.Name;
                        this.refs.submitBtn.disabled = false;
                        this.templateinput = result.Name;
                        this.sameTemplateName = result.Name;
                        if (result.pqcrush__Default__c) {
                            this.template.querySelector('.saveAsDraftCheckbox').checked = true;
                        } else {
                            this.template.querySelector('.saveAsDraftCheckbox').checked = false;
                        }
                    }
                    this.isSpinner = false;
                })
                .catch((error) => {
                    this.error = error;
                });
        } else {
            this.isSpinner = false;
        }
    }

    handletemplateName() {
        var name = this.refs.nameTemplate.value;
        name = name.trim();
        this.templateinput = name;
        this.nameOfTemplate = name;
        this.message = '';
        if (name !== '') {
            this.refs.submitBtn.disabled = false;
        } else {
            this.refs.submitBtn.disabled = true;
        }
    }

    async handleDuplicateTemplate() {
        await getAccountPlanTemplate({ templateName: this.templateinput })
            .then((result) => {
                if (!result) {
                    this.message = '';
                } else {
                    this.message = 'This Name is already used.';
                    this.nameOfTemplate = this.templateinput;
                    this.refs.submitBtn.disabled = true;
                }
            })
            .catch((error) => {
                this.error = error;
            });
    }

    async handleSubmit(event) {
        event.preventDefault();
        this.refs.submitBtn.disabled = true;
        let saveAsDraft = this.template.querySelector('.saveAsDraftCheckbox').checked;
        if (this.recSaveId !== '') {
            if (this.templateinput.toUpperCase() === this.sameTemplateName.toUpperCase()) {
                this.isEditName = false;
            } else {
                this.isEditName = true;
            }
        } else {
            this.isEditName = true;
        }
        if (this.isEditName) {
            await this.handleDuplicateTemplate();
        }

        if (this.message === '') {
            this.isOuterSpinner = true;
            receiveCanvasData({
                componentName: this.templateinput,
                title: this.headerTitle,
                image: this.headerImage,
                components: this.componentAvailable,
                uploadfileName: this.uploadfileName,
                saveAsDraft: saveAsDraft,
                recordIdOfTemplate: this.recSaveId
            })
                .then((result) => {
                    this.dispatchEvent(
                        new CustomEvent('navigateRecordPage', {
                            detail: { recId: result, error: '' },
                            bubbles: true,
                            composed: true
                        })
                    );
                    this.isShowModal = false;
                })
                .catch((error) => {
                    this.dispatchEvent(
                        new CustomEvent('navigateRecordPage', {
                            detail: { recId: '', error: error },
                            bubbles: true,
                            composed: true
                        })
                    );
                    this.isShowModal = false;
                });
        }
    }
}