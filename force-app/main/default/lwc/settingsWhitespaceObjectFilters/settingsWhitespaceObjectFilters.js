import { LightningElement, api } from 'lwc';
import Enter_Names from '@salesforce/label/c.Enter_Object_Names_Newline';
import Objects_For_Templates from '@salesforce/label/c.Objects_For_CS_Templates';
import updateObjectFilterSetting from '@salesforce/apex/StrategySettingsController.updateWSFilterStringSetting';

export default class SettingsWhitespaceObjectFilters extends LightningElement {
    @api objectFilterString = '';
    errorMessage = null;
    loading = false;

    label = {
        title: Objects_For_Templates,
        label: Enter_Names
    };

    handleObjectFilterChange(event) {
        let updatedString = event.detail.value;
        let last = updatedString[updatedString.length - 1];
        if (last === '\n') {
            this.saveObjectFilterString(updatedString);
        }
    }

    handleObjectFilterBlur() {
        let textArea = this.template.querySelector('lightning-textarea');
        if (textArea) {
            let updatedString = textArea.value;
            this.saveObjectFilterString(updatedString);
        }
    }

    saveObjectFilterString(updatedString) {
        this.errorMessage = null;
        updateObjectFilterSetting({ filterString: updatedString }).catch((error) => {
            this.errorMessage = error.body.message;
        });
    }
}