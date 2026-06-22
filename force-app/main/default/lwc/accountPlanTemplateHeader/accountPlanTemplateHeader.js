import { LightningElement, api } from 'lwc';
import upload from '@salesforce/resourceUrl/upload';
import Header from '@salesforce/label/c.Header';
import Logo from '@salesforce/label/c.Logo';
import Title from '@salesforce/label/c.Title';
import EnterTitle from '@salesforce/label/c.EnterTitle';
import AccountPlanLogoHeading from '@salesforce/label/c.AccountPlanLogoHeading';
import Upload_Files from '@salesforce/label/c.Upload_Files';
import getTemplateById from '@salesforce/apex/AccountPlanTemplateController.getTemplateById';
import getContentVersion from '@salesforce/apex/AccountPlanTemplateController.getContentVersion';
export default class AccountPlanTemplateHeader extends LightningElement {
    upload = upload;
    Header = Header;
    Logo = Logo;
    Title = Title;
    EnterTitle = EnterTitle;
    AccountPlanLogoHeading = AccountPlanLogoHeading;
    Upload_Files = Upload_Files;
    base64 = '';
    headerTitle = '';
    fileName;
    message;
    @api recordId;
    @api previewData;
    defaultHeaderTitle = '';
    imageSrc = '';
    isPreview = true;
    connectedCallback() {
        if (this.recordId !== '') {
            getTemplateById({ id: this.recordId })
                .then((result) => {
                    if (result) {
                        if (result.pqcrush__Header_Title__c !== undefined) {
                            this.defaultHeaderTitle = result.pqcrush__Header_Title__c;
                        } else {
                            this.defaultHeaderTitle = '';
                        }
                        this.headerTitle = this.defaultHeaderTitle;
                    }
                })
                .catch((error) => {
                    this.error = error;
                });

            getContentVersion({ id: this.recordId })
                .then((result) => {
                    if (result) {
                        let logoDiv = this.template.querySelector('.logo');
                        let lastChildOfLogoDiv = logoDiv.lastElementChild;
                        lastChildOfLogoDiv.style.display = 'block';
                        let imageContainerDiv = this.template.querySelector('.imageContainer');
                        logoDiv.firstElementChild.classList.remove('editIcon');
                        logoDiv.firstElementChild.classList.add('showEditIcon');
                        let imgElement = new Image();
                        imgElement.style.width = '100%';
                        imgElement.style.height = '100%';
                        imgElement.style.objectFit = 'contain';
                        imgElement.src = result[0];
                        let uploadFileInt = this.template.querySelector('.uploadBtn');
                        uploadFileInt.classList.add('hideUploadBtn');
                        imageContainerDiv.appendChild(imgElement);
                        this.imageSrc = result[0];
                        this.dispatchEvent(
                            new CustomEvent('fromLwc', {
                                detail: {
                                    titleHeader: this.defaultHeaderTitle,
                                    headerImage: result[1],
                                    fileTitle: result[2],
                                    imageURL: this.imageSrc
                                },
                                bubbles: true,
                                composed: true
                            })
                        );
                    }
                })
                .catch((error) => {
                    this.error = error;
                });
        }
    }

    renderedCallback() {
        let tempImg = '';
        let tempBase = '';
        let tempFileName = '';
        if (this.isPreview && this.previewData !== undefined) {
            if (this.previewData.templateTitle !== '') {
                this.defaultHeaderTitle = this.previewData.templateTitle;
                this.headerTitle = this.defaultHeaderTitle;
            }
            if (this.previewData.templateImage !== undefined && this.previewData.templateImage !== '') {
                let logoDiv = this.template.querySelector('.logo');
                let imgElement = new Image();
                let lastChildOfLogoDiv = logoDiv.lastElementChild;
                lastChildOfLogoDiv.style.display = 'block';
                let imageContainerDiv = this.template.querySelector('.imageContainer');
                logoDiv.firstElementChild.classList.remove('editIcon');
                logoDiv.firstElementChild.classList.add('showEditIcon');
                imgElement.style.width = '100%';
                imgElement.style.height = '100%';
                imgElement.style.objectFit = 'contain';
                imgElement.src = this.previewData.templateImage;
                let uploadFileInt = this.template.querySelector('.uploadBtn');
                uploadFileInt.classList.add('hideUploadBtn');
                imageContainerDiv.appendChild(imgElement);
                this.imageSrc = this.previewData.templateImage;
                tempImg = this.imageSrc;
                tempBase = this.previewData.templateImage.split(',')[1];
                tempFileName = this.previewData.templateFileName;
            }
            this.isPreview = false;
            this.dispatchEvent(
                new CustomEvent('fromLwc', {
                    detail: {
                        titleHeader: this.defaultHeaderTitle,
                        headerImage: tempBase,
                        fileTitle: tempFileName,
                        imageURL: tempImg
                    },
                    bubbles: true,
                    composed: true
                })
            );
        }
    }

    handleFileUpload() {
        // Click the hidden file input to trigger the file selection dialog
        const fileInput = this.template.querySelector('input[type="file"]');
        fileInput.click();
        fileInput.value = '';
    }

    openfileUpload(event) {
        const file = event.target.files[0];
        var reader = new FileReader();
        // Your base64 image data
        var imgElement = new Image();
        imgElement.style.width = '100%';
        imgElement.style.height = '100%';
        imgElement.style.objectFit = 'contain';
        this.fileName = event.target.files[0].name;

        let fileSize = event.target.files[0].size;

        let fileSizeInMB = fileSize / (1024 * 1024);

        let fileType = event.target.files[0].type;

        if (fileType === 'image/png' || fileType === 'image/svg+xml') {
            if (fileSizeInMB <= 1) {
                let logoDiv = this.template.querySelector('.logo');
                let lastChildOfLogoDiv = logoDiv.lastElementChild;
                lastChildOfLogoDiv.style.display = 'block';
                let imageContainerDiv = this.template.querySelector('.imageContainer');
                logoDiv.firstElementChild.classList.remove('editIcon');
                logoDiv.firstElementChild.classList.add('showEditIcon');
                reader.onload = () => {
                    this.base64 = reader.result.split(',')[1];
                    imgElement.src = 'data:' + fileType + ';base64,' + this.base64;
                    this.imageSrc = 'data:' + fileType + ';base64,' + this.base64;
                    this.dispatchEvent(
                        new CustomEvent('fromLwc', {
                            detail: {
                                titleHeader: this.headerTitle,
                                headerImage: this.base64,
                                fileTitle: this.fileName,
                                imageURL: this.imageSrc
                            },
                            bubbles: true,
                            composed: true
                        })
                    );
                };
                reader.readAsDataURL(file);

                let uploadFileInt = this.template.querySelector('.uploadBtn');
                uploadFileInt.classList.add('hideUploadBtn');

                // Append the image element to the image container
                imageContainerDiv.appendChild(imgElement);
            } else {
                this.message = 'Maximum allowed logo size is 1024KB.';
                this.dispatchEvent(
                    new CustomEvent('showToast', {
                        detail: { showToastMessage: this.message },
                        bubbles: true,
                        composed: true
                    })
                );
            }
        } else {
            this.message = 'Only logo with the extension ".png / .svg" are allowed.';
            this.dispatchEvent(
                new CustomEvent('showToast', {
                    detail: { showToastMessage: this.message },
                    bubbles: true,
                    composed: true
                })
            );
        }
    }

    headerInput() {
        this.headerTitle = '';
        this.dispatchEvent(
            new CustomEvent('fromLwc', {
                detail: {
                    titleHeader: this.headerTitle,
                    headerImage: this.base64,
                    fileTitle: this.fileName,
                    imageURL: this.imageSrc
                },
                bubbles: true,
                composed: true
            })
        );
    }

    handleEditIcon() {
        this.base64 = '';
        this.imageSrc = '';
        let logoDiv = this.template.querySelector('.logo');
        let imageContainerDiv = this.template.querySelector('.imageContainer');
        logoDiv.firstElementChild.classList.remove('showEditIcon');
        logoDiv.firstElementChild.classList.add('editIcon');
        imageContainerDiv.removeChild(imageContainerDiv.firstElementChild);
        imageContainerDiv.style.display = 'none';
        let uploadFileInt = this.template.querySelector('.uploadBtn');
        uploadFileInt.classList.remove('hideUploadBtn');
        this.dispatchEvent(
            new CustomEvent('fromLwc', {
                detail: {
                    titleHeader: this.headerTitle,
                    headerImage: this.base64,
                    fileTitle: this.fileName,
                    imageURL: this.imageSrc
                },
                bubbles: true,
                composed: true
            })
        );
    }
}