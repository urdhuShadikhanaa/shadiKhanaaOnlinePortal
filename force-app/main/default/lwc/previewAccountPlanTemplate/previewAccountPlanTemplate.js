import { LightningElement, track } from 'lwc';
import getAllAccountPlans from '@salesforce/apex/AccountPlanTemplateControllerWrapper.getAllAccountPlans';
import getAccountPlan from '@salesforce/apex/AccountPlanTemplateController.getAccountPlan';
import Submit from '@salesforce/label/c.Submit';
import Cancel from '@salesforce/label/c.Cancel';
import Close from '@salesforce/label/c.Close';
import preview_button from '@salesforce/label/c.preview_button';
import SelectAccountPlanRecord from '@salesforce/label/c.SelectAccountPlanRecord';
import SelectAccountPlanData from '@salesforce/label/c.SelectAccountPlanData';
import NoAccountPlanData from '@salesforce/label/c.NoAccountPlanData';
import Search_Available_Templates from '@salesforce/label/c.Search_Available_Templates';
import getContentVersion from '@salesforce/apex/AccountPlanTemplateController.getContentVersion';
export default class PreviewAccountPlanTemplate extends LightningElement {
    Close = Close;
    SelectAccountPlanRecord = SelectAccountPlanRecord;
    Cancel = Cancel;
    Submit = Submit;
    preview_button = preview_button;
    SelectAccountPlanData = SelectAccountPlanData;
    NoAccountPlanData = NoAccountPlanData;
    Search_Available_Templates = Search_Available_Templates;
    @track isShowModal = true;
    accountPlanData = [];
    error = '';
    searchKey;
    selectedAccountId;
    isrecordsList = false;
    inputSelectedValue = '';
    isShowMessage = false;
    iconUp = false;
    iconDown = true;
    isOuterSpinner = false;
    accountPlanRecordId;

    hideModalBox() {
        this.isShowModal = false;
    }

    handleUp() {
        this.iconUp = false;
        this.iconDown = true;
        this.isrecordsList = false;
    }

    handleDown() {
        if (this.accountPlanData.length !== 0) {
            this.isrecordsList = true;
            this.iconUp = true;
            this.iconDown = false;
        } else {
            this.isrecordsList = false;
            this.iconUp = false;
            this.iconDown = true;
        }
    }

    inputFocus() {
        this.accountPlanData = [];
        let inputValue = this.template.querySelector('.changeTemplateinputField').value;
        if (inputValue === '') {
            getAllAccountPlans()
                .then((result) => {
                    if (result) {
                        this.accountPlanData = [...result];
                        this.isrecordsList = true;
                        this.isShowMessage = false;
                        this.iconUp = true;
                        this.iconDown = false;
                    }
                })
                .catch((error) => {
                    this.error = error;
                });
        } else {
            this.fetchMethod(inputValue);
        }
    }

    fetchMethod(planName) {
        this.accountPlanData = [];
        getAccountPlan({ planName: planName })
            .then((result) => {
                if (result !== null) {
                    this.accountPlanData = [...result];
                    this.isShowMessage = false;
                    this.isrecordsList = true;
                } else {
                    this.isShowMessage = true;
                    this.isrecordsList = false;
                    this.refs.submitBtn.disabled = true;
                }
            })
            .catch((error) => {
                this.error = error;
            });
    }

    handleSelect(event) {
        let strIndex = event.currentTarget.dataset.id;
        let tempRecs = JSON.parse(JSON.stringify(this.accountPlanData));
        let selectedRecId = tempRecs[strIndex].Id;
        this.accountPlanRecordId = tempRecs[strIndex].Id;
        let strAccName = tempRecs[strIndex].Name;
        this.template.querySelector('.changeTemplateinputField').value = strAccName;
        this.inputSelectedValue = strAccName;
        this.selectedAccountId = selectedRecId;
        this.isrecordsList = false;
        this.refs.submitBtn.disabled = false;
        this.iconUp = false;
        this.iconDown = true;
    }

    handleChange() {
        this.searchKey = this.template.querySelector('.changeTemplateinputField').value;
        if (this.searchKey !== '' && this.searchKey !== ' ' && this.searchKey.length !== 0) {
            this.fetchMethod(this.searchKey);
            this.refs.submitBtn.disabled = true;
            this.iconUp = true;
            this.iconDown = false;
        } else {
            this.isrecordsList = false;
            this.isShowMessage = false;
            this.refs.submitBtn.disabled = true;
            this.iconUp = false;
            this.iconDown = true;
        }
    }

    handleSubmit() {
        this.isOuterSpinner = true;
        this.handleContentVersion();
    }

    handleContentVersion() {
        let image;
        this.isOuterSpinner = true;
        this.isShowModal = false;
        getContentVersion({ id: this.accountPlanRecordId })
            .then((result) => {
                if (result) {
                    image = result[0];
                } else {
                    image = '';
                }
                this.dispatchEvent(
                    new CustomEvent('previewTemplate', {
                        detail: {
                            accountPlanImage: image,
                            planId: this.accountPlanRecordId,
                            planName: this.inputSelectedValue
                        },
                        bubbles: true,
                        composed: true
                    })
                );
            })
            .catch((error) => {
                this.error = error;
            });
    }
}