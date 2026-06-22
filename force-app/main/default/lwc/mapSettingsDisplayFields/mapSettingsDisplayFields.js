import { LightningElement, api } from 'lwc';
import Display_Fields from '@salesforce/label/c.Display_Fields';
import Visible from '@salesforce/label/c.Visible';
import Hidden from '@salesforce/label/c.Hidden';
import Main from '@salesforce/label/c.Main';
import Secondary from '@salesforce/label/c.Secondary';

export default class MapSettingsDisplayFields extends LightningElement {
    _memberFields;

    @api loading = false;

    label = {
        Display_Fields,
        Visible,
        Hidden,
        Main,
        Secondary
    };

    @api
    get memberFields() {
        return this._memberFields;
    }

    set memberFields(value) {
        this._memberFields = JSON.parse(JSON.stringify(value));
        if (this._memberFields && this._memberFields.length > 0) {
            this._memberFields.forEach((memberField) => {
                memberField.disabled = !memberField.isEditable;
            });
        }
    }

    onVisibilityChange(event) {
        this.createEvent(
            event.srcElement.checked,
            null,
            event.srcElement.getAttribute('data-object-name'),
            event.srcElement.getAttribute('data-field-name')
        );
    }

    onPositionChange(event) {
        this.createEvent(
            null,
            event.srcElement.checked,
            event.srcElement.getAttribute('data-object-name'),
            event.srcElement.getAttribute('data-field-name')
        );
    }

    createEvent(checked, mainChecked, objectName, fieldName) {
        const evt = new CustomEvent('displayfieldchange', {
            detail: {
                checked,
                mainChecked,
                objectName,
                fieldName
            }
        });

        this.dispatchEvent(evt);
    }
}