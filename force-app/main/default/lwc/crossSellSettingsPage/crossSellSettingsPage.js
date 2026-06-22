import { LightningElement } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import getOrgSettings from '@salesforce/apex/StrategySettingsController.getOrgSettings';
import updateCrossSellCreateObjectSettings from '@salesforce/apex/StrategySettingsController.updateCrossSellCreateObjectSettings';

import Ability_To_Create_New_Records from '@salesforce/label/c.Ability_To_Create_New_Records';
import Cross_Sell_Settings from '@salesforce/label/c.Cross_Sell_Settings';
import Disabled from '@salesforce/label/c.Disabled';
import Enabled from '@salesforce/label/c.Enabled';

export default class CrossSellSettingsPage extends LightningElement {
    loading = false;

    loaded = false;

    canCreateObjectsInCrossSell = false;
    crossSellObjectFilterString = '';

    labels = {
        Ability_To_Create_New_Records,
        Disabled,
        Enabled,
        title: Cross_Sell_Settings
    };

    async connectedCallback() {
        this.loading = true;
        this.loaded = false;
        await getOrgSettings()
            .then((result) => {
                this.canCreateObjectsInCrossSell = result?.canCreateObjectsInCrossSell;
                this.crossSellObjectFilterString = result?.crossSellObjectFilterString;
            })
            .catch((error) => {
                this.showNotification('Error', error.message, 'error');
            });
        this.loading = false;
        this.loaded = true;
    }

    handleOnNewObjectCreation(event) {
        let checked = event?.srcElement?.checked;

        this.loading = true;
        updateCrossSellCreateObjectSettings({ canCreateObjectsInCrossSell: checked })
            .then(() => {
                this.canCreateObjectsInCrossSell = checked;
                this.loading = false;
            })
            .catch((error) => {
                this.showNotification('Error', error.message, 'error');
            });
    }

    showNotification(title, message, variant) {
        const evt = new ShowToastEvent({ title, message, variant });

        this.dispatchEvent(evt);
    }
}