import { LightningElement, api } from 'lwc';
import Field_Selection from '@salesforce/label/c.Field_Selection';
import Add from '@salesforce/label/c.Add';
import Remove from '@salesforce/label/c.Remove';

export default class MapSettingsDisplayFields extends LightningElement {
    _fields;

    @api
    get fields() {
        return this._fields;
    }

    set fields(value) {
        this._fields = JSON.parse(JSON.stringify(value));
    }

    @api loading = false;

    label = {
        Field_Selection,
        Add,
        Remove
    };

    onFieldToggled(event) {
        // Checking the box doesn't seem to update the data, so doing it manually
        // Passing full updated field data in the event so that the upper level can also have the updated data
        let isChecked = event.srcElement.checked;
        let objectName = event.srcElement.getAttribute('data-object-name');
        let fieldName = event.srcElement.getAttribute('data-field-name');
        let relatedFieldName = event.srcElement.getAttribute('data-related-name');
        let fieldToUpdate = this.fields
            .find((object) => object.objectName === objectName)
            .fields.find((field) => field.name === fieldName);

        fieldToUpdate.isOrgChartField = isChecked;
        const evt = new CustomEvent('fieldtoggled', {
            detail: {
                checked: isChecked,
                objectName: objectName,
                fieldName: fieldName,
                fieldLabel: event.srcElement.label,
                relatedFieldName: relatedFieldName,
                updatedFields: this.fields
            }
        });

        this.dispatchEvent(evt);
    }
}