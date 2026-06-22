import { LightningElement, wire, api } from 'lwc';
import getData from '@salesforce/apex/AccountPlanTemplateData.getData';
import showDefaultPlan from '@salesforce/apex/AccountPlanTemplateData.showDefaultPlan';
import getAllAccountPlan from '@salesforce/apex/AccountPlanTemplateData.getAllAccountPlan';
import { CurrentPageReference } from 'lightning/navigation';
import { NavigationMixin } from 'lightning/navigation';
import { CloseActionScreenEvent } from 'lightning/actions';
import Submit from '@salesforce/label/c.Submit';
import Cancel from '@salesforce/label/c.Cancel';
import NoDataFound from '@salesforce/label/c.NoDataFound';
import SearchTemplate from '@salesforce/label/c.SearchTemplate';
import Available_Template from '@salesforce/label/c.Available_Template';
import Enter_Account_Plan_Template_Name from '@salesforce/label/c.Enter_Account_Plan_Template_Name';
import Templates from '@salesforce/label/c.Templates';
import modal from '@salesforce/resourceUrl/custommodalcss';
import { loadStyle } from 'lightning/platformResourceLoader';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
export default class PrintButton extends NavigationMixin(LightningElement) {
    recordId;
    options;
    value;
    Submit = Submit;
    Cancel = Cancel;
    NoDataFound = NoDataFound;
    SearchTemplate = SearchTemplate;
    Available_Template = Available_Template;
    Enter_Account_Plan_Template_Name=Enter_Account_Plan_Template_Name;
    Templates = Templates;
    accountPlanData = [];
    error;
    searchKey;
    isrecordsList = false;
    inputSelectedValue = '';
    isShowMessage = false;
    accountPlanRecordId;
    iconUp = false;
    iconDown = true;
    isShowChangeTemplate = false;
    isShowPrintButton = true;
    checkAvailabelTemplate = false;
    nameSpace;
    @api isChangeTemplate;
    @api recId;
    variant;
    messageText;
    titleText;
    isOuterSpinner = false;
    @wire(CurrentPageReference)
    getStateParameters(currentPageReference) {
        if (currentPageReference) {
            this.recordId = currentPageReference.state.recordId;
        }
    }

    connectedCallback() {
        loadStyle(this, modal);
        if (this.isChangeTemplate) {
            this.isShowPrintButton = false;
            this.isShowChangeTemplate = this.isChangeTemplate;
            this.recordId = this.recId;
        }
        getAllAccountPlan()
            .then((result) => {
                if (result) {
                    this.accountPlanData = [...result];
                    if (this.accountPlanData.length > 0) {
                        this.checkAvailabelTemplate = true;
                    } else {
                        this.checkAvailabelTemplate = false;
                        this.dispatchEvent(new CloseActionScreenEvent());
                        this.variant = 'warning';
                        this.messageText = 'Template is not available. Please connect to the admin for assistance.';
                        this.titleText = 'Warning';
                        this.showNotification();
                    }
                }
            })
            .catch((error) => {
                this.variant = 'error';
                this.messageText = error.message;
                this.titleText = 'Error';
                this.showNotification();
            });

        if (this.isShowPrintButton) {
            showDefaultPlan()
                .then((result) => {
                    if (result !== null) {
                        this.value = result;
                        this.dispatchEvent(new CloseActionScreenEvent());
                        this.handleSubmitClick();
                    }
                })
                .catch((err) => {
                    this.error = err;
                });
        }
    }

    async handleSubmitClick() {
        this.isOuterSpinner = true;
        let listViewUrl = `/apex/pqcrush__PqPresentAccountPlan?recordId=${this.recordId}&planId=${this.value}`;
        // Redirect to the Carousel
        if (this.isShowPrintButton) {
            window.open(listViewUrl, '_blank');
        } else {
            window.open(listViewUrl, '_self');
        }
        this.dispatchEvent(new CloseActionScreenEvent());
    }
    handleCancelClick() {
        if (this.isChangeTemplate) {
            this.isShowChangeTemplate = false;
        } else {
            this.dispatchEvent(new CloseActionScreenEvent());
        }
    }

    hideModalBox() {
        this.isShowChangeTemplate = false;
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
        let inputValue = this.template.querySelector('.inputClass').value;
        if (inputValue === '') {
            getAllAccountPlan()
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

    fetchMethod(templateName) {
        this.accountPlanData = [];
        getData({ accTempName: templateName })
            .then((result) => {
                if (result.length !== 0) {
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
        this.template.querySelector('.inputClass').value = strAccName;
        this.inputSelectedValue = strAccName;
        this.value = selectedRecId;
        this.searchKey = strAccName;
        this.isrecordsList = false;
        this.refs.submitBtn.disabled = false;
        this.iconUp = false;
        this.iconDown = true;
    }

    handleChange() {
        this.searchKey = this.template.querySelector('.inputClass').value;
        if (this.searchKey !== '' && this.searchKey !== ' ') {
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
    showNotification() {
        const evt = new ShowToastEvent({
            title: this.titleText,
            message: this.messageText,
            variant: this.variant
        });
        this.dispatchEvent(evt);
    }
}