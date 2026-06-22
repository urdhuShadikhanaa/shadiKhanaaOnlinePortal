/* eslint-disable @lwc/lwc/no-api-reassignments */
import { LightningElement, api, track } from 'lwc';

// API
import updateProfileImage from '@salesforce/apex/GraphDataController.updateProfileImageData';

// LABELS
import FILE_SIZE_LIMIT_ERROR from '@salesforce/label/c.File_Size_Limit_Error';
import PHOTO_URL from '@salesforce/label/c.Photo_Url';
import SELECT_PROFILE_IMAGE from '@salesforce/label/c.Select_Profile_Image';
import UPDATE_PROFILE_IMAGE from '@salesforce/label/c.Update_Profile_Image';
import UPLOAD_IMAGE from '@salesforce/label/c.Upload_Image';

// UTILS
import { formatLabel } from 'c/stringUtils';

// Initial value is set by Settings value
var stub = '40IgaLl9nZ0tikhBMJ5lGUhLhy3E3hXYDw7ZF5eiTyFbt3rtGmoPcw==';

export default class ProfileImagePicker extends LightningElement {
    contactId = null;

    errorMessage = null;

    isTabUpload = true;

    saveButtonDisabled = true;

    imageProvided = false;

    @api rmOrgSettings;

    @track dropCSS = 'drop-zone';

    @track dropInstructionsCSS = 'drop-zone-instructions';

    @track imageToolsShown = false;

    @track imageToolsCSS = 'hidden';

    @track imageBakerEnabled = false;

    _imageUrl = null;

    _imageData = null;

    imageSize = null;

    imageMimeType = null;

    imageExtension = null;

    get imageData() {
        if (!this.imageProvided) {
            return null;
        }

        return this._imageData;
    }

    set imageData(value) {
        this._imageData = value;
    }

    set imageUrl(value) {
        this.downloadImageData(value).then((responseJSON) => {
            if (this.validateImageMime(responseJSON?.type?.mime)) {
                this.clear();
                this.imageData = 'data:image/png;base64,' + responseJSON.data;
                this.updateImageTools('data:image/png;base64,' + responseJSON.data);
                this.imageProvided = true;
                this.saveButtonDisabled = false;
                this.imageSize = responseJSON?.length;
                this.imageMimeType = responseJSON.type?.mime;
                this.imageExtension = responseJSON.type?.ext;
            } else {
                this.clear('Please specify a valid photo URL.');
            }
        });
    }

    get imageUrl() {
        return this._imageUrl;
    }

    labels = {
        fileSizeError: FILE_SIZE_LIMIT_ERROR,
        photoUrl: PHOTO_URL,
        selectImage: SELECT_PROFILE_IMAGE,
        title: UPDATE_PROFILE_IMAGE,
        uploadImage: UPLOAD_IMAGE
    };

    // ----------------------------------------------

    async renderedCallback() {
        if (
            this.rmOrgSettings.pqcrush__Prolifiq_Extended_Tools_URL__c !== undefined &&
            this.rmOrgSettings.pqcrush__Prolifiq_Extended_Tools_URL__c !== ''
        ) {
            this.imageBakerEnabled = true;
        }
    }

    // ----------------------------------------------

    updateImageTools(data) {
        this.hideDropZone();
        this.hideInstructions();
        this.showImageTools();
        let _cp = this.template.querySelector('c-image-cropper');

        _cp.imageData = data;
    }

    // ----------------------------------------------

    downloadImageData(url) {
        // URL Encode the provided image URL to be a param
        let _encImageUrl = encodeURIComponent(url);
        let _apiRoot = this.rmOrgSettings.pqcrush__Prolifiq_Extended_Tools_URL__c;
        let _apiUrl = _apiRoot + '/api/pqssb-image-tools';

        _apiUrl += '?op=baker';
        _apiUrl += '&code=' + stub;
        _apiUrl += '&imageUrl=' + _encImageUrl;

        return fetch(_apiUrl, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then((response) => response.json())
            .then((responseJSON) => {
                if (responseJSON?.data !== '' && responseJSON?.length > 0) {
                    return responseJSON;
                }

                return null;
            })
            .catch(() => {
                this.clear('Unable to load a Photo from that URL.  Please try again.');
            });
    }

    // ----------------------------------------------

    validateImageMime(mimeType) {
        return (
            mimeType?.toLowerCase?.() === 'image/bmp' ||
            mimeType?.toLowerCase?.() === 'image/jpeg' ||
            mimeType?.toLowerCase?.() === 'image/x-png' ||
            mimeType?.toLowerCase?.() === 'image/png' ||
            mimeType?.toLowerCase?.() === 'image/gif'
        );
    }

    clear(errorMessage) {
        this.showInstructions();
        this.hideImageTools();
        this.imageData = null;
        this.errorMessage = errorMessage;
        this.imageProvided = false;
        this.saveButtonDisabled = true;
    }

    @api showModal(contactId) {
        this.imageProvided = false;
        this.imageData = null;
        this.contactId = contactId;
        const modal = this.template.querySelector('c-modal');

        modal.show();
    }

    // ----------------------------------------------

    handleCancel() {
        this.clear();
        const modal = this.template.querySelector('c-modal');

        modal.hide();
    }

    handleSave() {
        // Get cropper component reference
        const _cp = this.template.querySelector('c-image-cropper');
        const _data = _cp.getCroppedData();

        if (_data.length > 100000) {
            this.errorMessage = formatLabel(this.labels.fileSizeError, ['75 KB']);
        } else {
            updateProfileImage({ contactId: this.contactId, base64Data: _data })
                .then(() => {
                    const event = new CustomEvent('profileimagedatachange', {
                        detail: { contactId: this.contactId, base64Data: _data }
                    });

                    this.dispatchEvent(event);
                    this.clear();
                    const modal = this.template.querySelector('c-modal');

                    modal.hide();
                })
                .catch((error) => {
                    this.error = error.message;
                });
        }
    }

    // ----------------------------------------------

    readFileData(file) {
        let reader = new FileReader();

        reader.onload = () => {
            this.updateImageTools(reader.result);
            this.imageData = reader.result;
            this.imageProvided = true;
            this.saveButtonDisabled = false;
        };
        reader.readAsDataURL(file);
    }

    openFileDialog() {
        this.template.querySelector('.file-input').click();
    }

    showDropZone() {
        this.dropCSS = 'drop-zone-over';
    }

    hideDropZone() {
        this.dropCSS = 'drop-zone';
    }

    showInstructions() {
        this.dropInstructionsCSS = 'drop-zone-instructions';
    }

    hideInstructions() {
        this.dropInstructionsCSS = 'hidden';
    }

    showImageTools() {
        this.imageToolsShown = true;
        this.imageToolsCSS = 'image-tools';
    }

    hideImageTools() {
        this.imageToolsShown = false;
        this.imageToolsCSS = 'hidden';
    }

    fileDropHandler(event) {
        event.preventDefault();
        this.errorMessage = null;
        let _file = null;

        this.hideDropZone();
        this.hideInstructions();
        this.showImageTools();

        if (event.dataTransfer.items) {
            _file = event.dataTransfer.items[0].getAsFile();
        } else {
            _file = event.dataTransfer.files[0];
        }

        if (this.validateImageMime(_file.type)) {
            this.readFileData(_file);
        } else {
            this.clear('Please drop a valid photo file.');
        }
    }

    fileDragOverHandler(event) {
        event.preventDefault();
        this.showDropZone();
    }

    fileDragLeaveHandler(event) {
        event.preventDefault();
        this.hideDropZone();
    }

    handleFilesChange(event) {
        this.clear();
        this.errorMessage = null;
        let _file = event.target.files[0];

        this.hideDropZone();
        this.hideInstructions();
        this.showImageTools();

        if (this.validateImageMime(_file.type)) {
            this.readFileData(_file);
        } else {
            this.clear('Please upload a valid photo file.');
        }
    }

    handlePhotoUrlEntered(event) {
        this._imageUrl = event.target.value;
    }

    handleDownloadPhotoUrl() {
        this.imageUrl = this._imageUrl;
    }

    // ----------------------------------------------

    handleUploadTabActive() {
        this.isTabUpload = true;
        if (this.imageData) {
            this.saveButtonDisabled = false;
        }
    }

    handlePhotoUrlTabActive() {
        this.isTabUpload = false;
        if (this.imageData) {
            this.saveButtonDisabled = false;
        }
    }

    // ----------------------------------------------
}