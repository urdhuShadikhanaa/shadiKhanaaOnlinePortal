import { LightningElement, api } from 'lwc';

import getRMOrgSettingForType from '@salesforce/apex/RMOrgSettingService.getRMOrgSettingForType';
import setAdvancedOrgSetting from '@salesforce/apex/RMOrgSettingService.setAdvancedOrgSetting';

import Advanced_Settings from '@salesforce/label/c.Advanced_Settings';
import Prolifiq_Extended_Tools_URL from '@salesforce/label/c.Prolifiq_Extended_Tools_URL';

export default class MapSettingsDefaultValues extends LightningElement {
    loading = false;

    @api settingType = '';

    orgSettings;

    prolifiqExtendedToolsURL;

    labels = {
        Advanced_Settings,
        Prolifiq_Extended_Tools_URL
    };

    async connectedCallback() {
        this.displayStyleOptions = [];
        this.loading = true;

        await getRMOrgSettingForType({ type: this.settingType }).then((result) => {
            this.prolifiqExtendedToolsURL = result?.pqcrush__Prolifiq_Extended_Tools_URL__c;
            this.orgSettings = JSON.parse(JSON.stringify(result));
        });

        this.loading = false;
    }

    onProlifiqExtendedToolsURL(event) {
        let input = this.template.querySelector("[data-id='extendedURL']");

        if (input.validity.valid) {
            let val = event.srcElement.value;

            if (this.orgSettings && this.orgSettings.pqcrush__Prolifiq_Extended_Tools_URL__c !== val) {
                this.orgSettings.pqcrush__Prolifiq_Extended_Tools_URL__c = val;

                setAdvancedOrgSetting({ settings: this.orgSettings }).then(() => {
                    const evt = new CustomEvent('settingschange', {});

                    this.dispatchEvent(evt);
                });
            }
        }
    }
}