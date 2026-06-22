import { LightningElement, wire } from 'lwc';
import saveAccountPlanLogo from '@salesforce/apex/SaveAccountPlanLogo.saveAccountPlanUploadLogo';
import getContentVersion from '@salesforce/apex/SaveAccountPlanLogo.getContentVersion';
import AccountPlanLogoHeading from '@salesforce/label/c.AccountPlanLogoHeading';
import HeaderLogoDesc from '@salesforce/label/c.Header_Logo';
import Save from '@salesforce/label/c.Save';
import Drop_Files from '@salesforce/label/c.Drop_Files';
import { CloseActionScreenEvent } from 'lightning/actions';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import modal from '@salesforce/resourceUrl/custommodalcss';
import { loadStyle } from 'lightning/platformResourceLoader';
import { CurrentPageReference } from 'lightning/navigation';
export default class HeaderFooterLogo extends LightningElement {
    fileName = '';
    base64 = '';
    AccountPlanLogoHeading = AccountPlanLogoHeading;
    HeaderLogoDesc = HeaderLogoDesc;
    Drop_Files = Drop_Files;
    recordId;
    isShowModal = false;
    message;
    showSpinner = false;
    Save = Save;
    error;

    @wire(CurrentPageReference)
    wiredPageRef(pageRef) {
        if (pageRef) {
            this.recordId = pageRef.state.recordId;
        }
    }

    connectedCallback() {
        loadStyle(this, modal);
        this.showSpinner = true;
        getContentVersion({ planId: this.recordId, description: HeaderLogoDesc })
            .then((result) => {
                if (result) {
                    let imgElement = new Image();
                    this.refs.saveBtn.disabled = false;
                    let imageContainerDiv = this.template.querySelector('.imageContainer');
                    imageContainerDiv.firstElementChild.classList.remove('editIcon');
                    imageContainerDiv.firstElementChild.classList.add('showEditIcon');
                    imgElement.src = result[0];
                    imgElement.classList.add('Imagetagcls');
                    let icon = this.template.querySelector('.imageContainer').firstElementChild;
                    let uploadFileInt = this.template.querySelector('.uploadBtn');
                    uploadFileInt.classList.add('hideUploadBtn');
                    imageContainerDiv.classList.add('ImgaeSetCls');
                    icon.before(imgElement);
                    this.base64 = result[1];
                    this.fileName = result[2];
                    this.showSpinner = false;
                } else {
                    this.showSpinner = false;
                }
            })
            .catch((error) => {
                this.error = error;
            });
    }

    handleFileUpload() {
        const fileInput = this.template.querySelector('input[type="file"]');
        fileInput.click();
        fileInput.value = '';
    }
    openfileUpload(event) {
        const file = event.target.files[0];
        var reader = new FileReader();
        var imgElement = new Image();
        this.fileName = event.target.files[0].name;
        let fileSize = event.target.files[0].size;
        let fileSizeInMB = fileSize / (1024 * 1024);
        let fileType = event.target.files[0].type;
        if (fileType === 'image/png' || fileType === 'image/svg+xml') {
            if (fileSizeInMB <= 1) {
                this.refs.saveBtn.disabled = false;
                let imageContainerDiv = this.template.querySelector('.imageContainer');
                imageContainerDiv.firstElementChild.classList.remove('editIcon');
                imageContainerDiv.firstElementChild.classList.add('showEditIcon');

                reader.onload = () => {
                    this.base64 = reader.result.split(',')[1];
                    imgElement.src = 'data:' + fileType + ';base64,' + this.base64;
                    imgElement.classList.add('Imagetagcls');
                };
                reader.readAsDataURL(file);
                let icon = this.template.querySelector('.imageContainer').firstElementChild;
                let uploadFileInt = this.template.querySelector('.uploadBtn');
                uploadFileInt.classList.add('hideUploadBtn');
                imageContainerDiv.classList.add('ImgaeSetCls');
                icon.insertBefore(imgElement);
            } else {
                this.message = 'Maximum allowed logo size is 1024KB.';
                this.showToast(this.message, 'info', 'Information');
            }
        } else {
            this.message = 'Only logo with the extension ".png / .svg" are allowed.';
            this.showToast(this.message, 'info', 'Information');
        }
    }
    handleEditIcon() {
        this.fileName = '';
        this.base64 = '';
        const fileInput = this.template.querySelector('input[type="file"]');
        fileInput.value = '';
        let imageContainerDiv = this.template.querySelector('.imageContainer');
        imageContainerDiv.classList.remove('ImgaeSetCls');
        imageContainerDiv.lastElementChild.classList.remove('showEditIcon');
        imageContainerDiv.lastElementChild.classList.add('editIcon');
        imageContainerDiv.removeChild(imageContainerDiv.firstElementChild);
        let uploadFileInt = this.template.querySelector('.uploadBtn');
        uploadFileInt.classList.remove('hideUploadBtn');
    }

    closeModal() {
        this.dispatchEvent(new CloseActionScreenEvent());
    }
    saveLogo() {
        this.showSpinner = true;
        this.refs.saveBtn.disabled = true;
        saveAccountPlanLogo({
            fileName: this.fileName,
            fileData: this.base64,
            recordId: this.recordId,
            description: HeaderLogoDesc
        })
            .then((response) => {
                this.showSpinner = false;
                if (this.base64 !== '') {
                    if (response.status === 'Success') {
                        this.showToast('Logo is uploaded Successfully.', 'success', 'Success');
                    } else {
                        this.showToast(response.msg, 'error', 'Error');
                    }
                } else {
                    this.showToast('No Logo is Uploaded', 'info', 'Information');
                }
                this.dispatchEvent(new CloseActionScreenEvent());
            })
            .catch((error) => {
                this.showSpinner = false;
                this.error = error;
            });
    }
    showToast(Message, variant, title) {
        const event = new ShowToastEvent({
            title: title,
            message: Message,
            variant: variant
        });
        this.dispatchEvent(event);
    }

    showModalBox() {
        this.isShowModal = true;
    }
    hideModalBox() {
        this.isShowModal = false;
    }

    handleDragDropImage(event) {
        event.stopPropagation();
        event.preventDefault();
        let file = event.dataTransfer.files[0];
        let imgElement = new Image();
        let reader = new FileReader();
        this.fileName = event.dataTransfer.files[0].name;
        let fileSize = event.dataTransfer.files[0].size;
        let fileSizeInMB = fileSize / (1024 * 1024);
        let fileType = event.dataTransfer.files[0].type;
        if (fileType === 'image/png' || fileType === 'image/svg+xml') {
            if (fileSizeInMB <= 1) {
                this.refs.saveBtn.disabled = false;
                let imageContainerDiv = this.template.querySelector('.imageContainer');
                imageContainerDiv.firstElementChild.classList.remove('editIcon');
                imageContainerDiv.firstElementChild.classList.add('showEditIcon');

                reader.onload = () => {
                    this.base64 = reader.result.split(',')[1];
                    imgElement.src = 'data:' + fileType + ';base64,' + this.base64;
                    imgElement.classList.add('Imagetagcls');
                };
                reader.readAsDataURL(file);
                let icon = this.template.querySelector('.imageContainer').firstElementChild;
                let uploadFileInt = this.template.querySelector('.uploadBtn');
                uploadFileInt.classList.add('hideUploadBtn');
                imageContainerDiv.classList.add('ImgaeSetCls');
                icon.before(imgElement);
            } else {
                this.message = 'Maximum allowed logo size is 1024 Kb.';
                this.showToast(this.message, 'info', 'Information');
            }
        } else {
            this.message = 'Only logo with the extension ".png / .svg" are allowed.';
            this.showToast(this.message, 'info', 'Information');
        }
    }
    handleDragOver(event) {
        event.preventDefault();
    }
}