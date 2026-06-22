import { LightningElement, api } from 'lwc';

import LABEL_NOTES from '@salesforce/label/c.Notes';
import LABEL_CLICK_TO_EDIT from '@salesforce/label/c.Click_To_Edit';
import LABEL_SAVE from '@salesforce/label/c.Save';
import LABEL_CANCEL from '@salesforce/label/c.Cancel';
import LABEL_CLEAR from '@salesforce/label/c.Clear';
import LABEL_HIGHLIGHT from '@salesforce/label/c.Highlight';
import LABEL_SELECT_HIGHLIGHT from '@salesforce/label/c.Select_Highlight';
import LABEL_NONE from '@salesforce/label/c.None';
import LABEL_DELETE from '@salesforce/label/c.Delete_Tile';
import LABEL_HEADER from '@salesforce/label/c.Header_Label';

const INFO_FIELD_KEY = 'info';
const DEFAULT_OPTION = {
    label: `--${LABEL_NONE}--`,
    value: 'none'
};

export default class WsCellPanelContent extends LightningElement {
    @api columnHeaderLabel;

    @api columnHeaderValue;

    @api columnObjectIds;

    @api notes;

    @api rowHeaderLabel;

    @api rowHeaderValue;

    @api rowObjectIds;

    @api isFreeForm = false;

    @api allowEdit = false;

    displayFieldOptions = [];

    selectedOption = 'none';

    infoObject;

    labels = {
        notes: LABEL_NOTES,
        clickToEdit: LABEL_CLICK_TO_EDIT,
        save: LABEL_SAVE,
        cancel: LABEL_CANCEL,
        clear: LABEL_CLEAR,
        highlight: LABEL_HIGHLIGHT,
        selectHighlight: LABEL_SELECT_HIGHLIGHT,
        none: LABEL_NONE,
        delete: LABEL_DELETE,
        displayFieldSelector: LABEL_HEADER
    };

    infoEditMode = false;

    highlightOptions = [];

    highlightValue = {};

    highlightData = [];

    hasHighlights = false;

    _showSpinner = false;

    _wsDataTypeOptionsArray = [];

    hasDataTypes = false;

    amountTypeFields = [];

    basicFields = [];

    relatedFields = [];

    @api showSpinner() {
        this._showSpinner = true;
    }

    @api hideSpinner() {
        this._showSpinner = false;
    }

    @api
    set highlights(data) {
        this.highlightData = data;
        this.highlightOptions = [DEFAULT_OPTION];

        data.forEach((item) => {
            this.highlightOptions.push({
                label: item.label,
                value: item.id
            });
        });
        this.hasHighlights = this.highlightOptions && this.highlightOptions.length > 1;
    }

    get highlights() {
        return this.highlightData;
    }

    @api
    set amountTypes(data) {
        this._amountTypes = data;
        this.setupHeaderOptions();
    }

    get amountTypes() {
        return this._amountTypes;
    }

    _amountTypes = [];

    @api
    set tileObject(data) {
        this._tileObject = data;
        this.highlightValue = data.highlight ? data.highlight.Id : 'none';
        const infoField = this.tileObject ? this.tileObject.displayFields[INFO_FIELD_KEY] : null;

        if (infoField && infoField.data && infoField.data.length > 0) {
            this.infoObject = infoField.data[0];
        } else {
            this.infoObject = {};
        }

        const fields = Object.values(data.displayFields);

        this.amountTypeFields = fields.filter((field) => {
            return field.fieldType === 'amountType';
        });

        this.basicFields = fields.filter((field) => {
            return field.fieldType === 'basicMapping';
        });

        this.relatedFields = fields.filter((field) => {
            return field.fieldType === 'relatedMapping';
        });

        // SET DATA TYPE SELECTIONS
        this.configureDataTypes(this._tileObject.dataTypes, this._tileObject.dataTypeValues);

        // SET HEADER VALUE
        this.selectedOption = data.headerAmountTypeId || 'none';
    }

    get tileObject() {
        return this._tileObject;
    }

    _tileObject;

    get infoText() {
        return this.infoObject && this.infoObject.value ? this.infoObject.value : '';
    }

    get canDeleteTile() {
        return this.isFreeForm && this.allowEdit;
    }

    get isReadOnly() {
        return !this.allowEdit;
    }

    get visibleAmountTypeFields() {
        const visibleAmountTypeIds = this.amountTypes
            .filter((at) => {
                return at.visible;
            })
            .map((at) => {
                return at.Id;
            });

        return this.amountTypeFields.filter((field) => {
            return visibleAmountTypeIds.includes(field.id);
        });
    }

    // --------------------------------------------------

    renderedCallback() {
        if (this.infoEditMode) {
            let textArea = this.template.querySelector('lightning-textarea');

            if (textArea) {
                textArea.focus();
            }
        }
    }

    configureDataTypes(data, dataTypeValues) {
        if (!data) {
            return;
        }

        this._wsDataTypeOptionsArray = [];

        data.forEach((type) => {
            let selectedVal = '';

            let selectedDataTypeValue = dataTypeValues.find((item) => {
                return item.dataTypeId === type.Id;
            });

            if (selectedDataTypeValue != null) {
                selectedVal = selectedDataTypeValue.value;
            }

            let dataType = {
                id: type.Id,
                label: type.pqcrush__Label__c,
                color: type.pqcrush__Color__c,
                value: selectedVal,
                options: []
            };

            // None
            dataType.options.push(DEFAULT_OPTION);

            let values = type.pqcrush__Picklist_Values__c.replaceAll('\r', '').split('\n');

            values.forEach((val) => {
                dataType.options.push({
                    label: val,
                    value: val
                });
            });
            this._wsDataTypeOptionsArray.push(dataType);
        });

        this.hasDataTypes = this._wsDataTypeOptionsArray && this._wsDataTypeOptionsArray.length > 0;
    }

    // --------------------------------------------------

    setupHeaderOptions() {
        // Add each amount type as a select option
        const options = this.amountTypes
            .filter((ad) => {
                return ad.visible;

                // Return this.visibleAmountTypes.includes(ad.displayField.id);
            })
            .map((ad) => {
                // Const { displayName, id } = ad.displayField;
                const option = {
                    label: ad.Name,
                    value: ad.Id
                };

                return option;
            });

        const allOptions = [DEFAULT_OPTION, ...options];

        this.displayFieldOptions = allOptions;
    }

    handleCreateRecord(event) {
        const editRecordEvent = new CustomEvent('createrecord', {
            detail: event.detail
        });

        this.dispatchEvent(editRecordEvent);
    }

    handleEditRecord(event) {
        const editRecordEvent = new CustomEvent('editrecord', {
            detail: event.detail
        });

        this.dispatchEvent(editRecordEvent);
    }

    // --------------------------------------------------

    handleNotesClick() {
        // Return previous value to textarea
        let textArea = this.template.querySelector('lightning-textarea');

        if (textArea) {
            textArea.value = this.infoText;
        }

        // Triggers display of editable textarea, with save/cancel buttons
        this.infoEditMode = true;
    }

    handleClearNotes() {
        let textArea = this.template.querySelector('lightning-textarea');

        textArea.value = '';
    }

    handleSaveNotes() {
        const textArea = this.template.querySelector('lightning-textarea');

        const updatedDataObj = { ...this.infoObject, value: textArea.value };

        const updateInfoEvent = new CustomEvent('updateinfo', {
            detail: {
                tileId: this.tileObject.id,
                infoField: updatedDataObj
            }
        });

        this.dispatchEvent(updateInfoEvent);

        this.infoObject = { ...this.infoObject, value: textArea.value };
        this.infoEditMode = false;
    }

    handleCancelEditNotes() {
        // Return previous value to textarea
        var textArea = this.template.querySelector('lightning-textarea');

        if (textArea) {
            textArea.value = this.infoText;
        }

        this.infoEditMode = false;
    }

    handleDeleteTile() {
        const deleteTileEvent = new CustomEvent('tiledeleted', {
            detail: { tileId: this.tileObject.id }
        });

        this.dispatchEvent(deleteTileEvent);
    }

    primaryDisplayFieldChanged(event) {
        this.selectedOption = event.detail.value;
        const updatedPrimaryDisplayField = event.detail.value;
        const tileId = this.tileObject.id;
        const detail = { tileId, updatedPrimaryDisplayField };
        const updateFreeformTileEvent = new CustomEvent('freeformdatachanged', {
            detail: detail
        });

        this.dispatchEvent(updateFreeformTileEvent);
    }

    handleUpdateFreeformTile(event) {
        const { dataId, displayFieldId, updatedValue } = event.detail;
        const tileId = this.tileObject.id;
        const detail = { dataId, displayFieldId, tileId, updatedValue };
        const updateFreeformTileEvent = new CustomEvent('freeformdatachanged', {
            detail: detail
        });

        this.dispatchEvent(updateFreeformTileEvent);
    }

    // --------------------------------------------------

    handleHighlightChange(event) {
        this.highlightValue = event.detail.value;
        const highlightId = event.detail.value === 'none' ? null : event.detail.value;
        const tileId = this._tileObject.id;
        const updateHighlightEvent = new CustomEvent('updatehighlight', {
            detail: {
                tileId,
                highlightId
            }
        });

        this.dispatchEvent(updateHighlightEvent);
    }

    handleDataChange(event) {
        const value = event.detail.value === 'none' ? null : event.detail.value;
        const dataTypeId = event.currentTarget.dataset.id;
        const dataTypeLabel = event.currentTarget.dataset.label;
        const color = event.currentTarget.dataset.color;
        const cellId = this._tileObject.id;

        // Setting the options to what was set by the user to keep the data in sync, otherwise, the selected value is kept for the next time the combobox appears
        let activeDataType = this._wsDataTypeOptionsArray.find((dataType) => dataType.id === dataTypeId);

        activeDataType.value = value;

        const updateDataTypeEvent = new CustomEvent('updatedatatypevalue', {
            detail: {
                tileId: cellId,
                dataTypeId,
                dataTypeLabel,
                color,
                value
            }
        });

        this.dispatchEvent(updateDataTypeEvent);
    }
}