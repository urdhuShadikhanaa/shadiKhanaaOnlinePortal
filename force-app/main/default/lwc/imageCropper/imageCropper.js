/* global Cropper */
/* eslint-disable @lwc/lwc/no-api-reassignments */
import { LightningElement, api } from 'lwc';

// UTILS
import { loadStyle, loadScript } from 'lightning/platformResourceLoader';
import cropperjs from '@salesforce/resourceUrl/cropperjs';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class ImageCropper extends LightningElement {
    _errorMessage = null;

    _imageProvided = false;

    _cropper = null;

    _imageEditorInitialized = false;

    _imageEditorNeedsRefresh = false;

    _imageData = null;

    _imageElementRef = null;

    @api
    showImageTools = false;

    @api
    width = 400;

    @api
    height = 400;

    @api
    maxWidth = 400;

    @api
    maxHeight = 400;

    @api
    minWidth = 200;

    @api
    minHeight = 200;

    @api
    get imageData() {
        if (!this._imageProvided) {
            return null;
        }

        return this._imageData;
    }

    set imageData(value) {
        if (value !== null) {
            this._imageEditorNeedsRefresh = true;
            this._imageProvided = true;
            this.showImageTools = true;
        } else {
            this._imageProvided = false;
            this.showImageTools = false;
        }

        this._imageData = value;
    }

    connectedCallback() {}

    renderedCallback() {
        if (!this._imageEditorInitialized) {
            Promise.all([loadStyle(this, cropperjs + '/cropper.css'), loadScript(this, cropperjs + '/cropper.min.js')])
                .then(() => {
                    this._imageEditorInitialized = true;
                })
                .catch((error) => {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Error loading the image tools',
                            message: error.message,
                            variant: 'error'
                        })
                    );
                });
        }

        // New image provided, not yet cropperized
        // When a new image is provided, src will re-render and come here... check flag for editorNeedsUpdate
        if (this._imageEditorNeedsRefresh) {
            // Spin up cropper here
            this.displayImageTools();

            // Set flag so it's not regenerated until new image is loaded
            this._imageEditorNeedsRefresh = false;
        }
    }

    @api
    getCroppedData() {
        if (this._cropper) {
            let _data = this._cropper
                .getCroppedCanvas({
                    width: 400,
                    height: 400,
                    minWidth: 200,
                    minHeight: 200,
                    maxWidth: 400,
                    maxHeight: 400,
                    fillColor: '#fff',
                    imageSmoothingEnabled: false,
                    imageSmoothingQuality: 'high'
                })
                .toDataURL('image/jpeg');

            return _data;
        }

        return null;
    }

    handleImageZoomIn() {
        if (this._cropper) {
            this._cropper.zoom(0.1);
        }
    }

    handleImageZoomOut() {
        if (this._cropper) {
            this._cropper.zoom(-0.1);
        }
    }

    handleImageReset() {
        if (this._cropper) {
            this._cropper.reset();
        }
    }

    handleImageClear() {
        this.imageData = null;
        this._errorMessage = null;
        this._imageProvided = false;
        this._imageEditorNeedsRefresh = false;
    }

    createCropper() {
        return new Cropper(this._imageElementRef, {
            aspectRatio: 1,
            dragMode: 'move',
            background: false,
            autoCropArea: 0.8,
            responsive: false,
            cropBoxMovable: false,
            cropBoxResizable: false,
            toggleDragModeOnDblclick: false
        });
    }

    displayImageTools() {
        if (this._cropper) {
            this._cropper.destroy();
        }

        // Get image hook if not ready
        if (!this._imageElementRef) {
            this._imageElementRef = this.template.querySelector('.imgpreview');
        }

        if (this._imageElementRef) {
            this._cropper = this.createCropper();
        }
    }
}