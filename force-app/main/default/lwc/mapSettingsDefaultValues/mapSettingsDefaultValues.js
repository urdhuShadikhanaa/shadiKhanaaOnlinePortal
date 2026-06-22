import { LightningElement, api } from 'lwc';

import getRMOrgSettingForType from '@salesforce/apex/RMOrgSettingService.getRMOrgSettingForType';
import setDefaultChartSetting from '@salesforce/apex/RMOrgSettingService.setDefaultChartSetting';
import getPickListValues from '@salesforce/apex/RMOrgSettingService.getPickListValues';

import Auto_Layout from '@salesforce/label/c.Auto_Layout';
import Badge_Global_Scope from '@salesforce/label/c.Badge_Global_Scope';
import Card_Style from '@salesforce/label/c.Card_Style';
import Default_Settings from '@salesforce/label/c.Default_Settings';
import Display_Style from '@salesforce/label/c.Display_Style';
import Enable_Drag_Select from '@salesforce/label/c.Enable_Drag_Select';
import Group_Global_Scope from '@salesforce/label/c.Group_Global_Scope';
import Influence_Support_Global_Scope from '@salesforce/label/c.Influence_Support_Global_Scope';
import Opacity_Range_Error_Message from '@salesforce/label/c.Opacity_Range_Error_Message';
import Relationship_Line_Global_Scope from '@salesforce/label/c.Relationship_Line_Global_Scope';
import Relationship_Line_Opacity from '@salesforce/label/c.Relationship_Line_Opacity';
import Reports_To_Line_Opacity from '@salesforce/label/c.Reports_To_Line_Opacity';
import Prolifiq_Extended_Tools_URL from '@salesforce/label/c.Prolifiq_Extended_Tools_URL';
import Show_Empty_Fields from '@salesforce/label/c.Show_Empty_Fields';
import Show_Overview from '@salesforce/label/c.Show_Overview';
import Show_Parents from '@salesforce/label/c.Show_Parents';
import Reports_To_Global_Scope from '@salesforce/label/c.Reports_To_Global_Scope';

export default class MapSettingsDefaultValues extends LightningElement {
    loading = false;

    @api type = '';

    orgSettings;

    cardStyleOptions;

    displayStyleOptions;

    cardStyle;

    displayStyle;

    relationshipLineOpacity;

    reportsToLineOpacity;

    prolifiqExtendedToolsURL;

    labels = {
        Auto_Layout,
        Badge_Global_Scope,
        Card_Style,
        Default_Settings,
        Display_Style,
        Enable_Drag_Select,
        Group_Global_Scope,
        Influence_Support_Global_Scope,
        Opacity_Range_Error_Message,
        Relationship_Line_Global_Scope,
        Relationship_Line_Opacity,
        Reports_To_Line_Opacity,
        Prolifiq_Extended_Tools_URL,
        Reports_To_Global_Scope,
        Show_Empty_Fields,
        Show_Overview,
        Show_Parents
    };

    async connectedCallback() {
        this.displayStyleOptions = [];
        this.loading = true;
        await getPickListValues({ fieldName: 'pqcrush__Display_Style__c' }).then((result) => {
            result?.forEach((item) => {
                this.displayStyleOptions.push({
                    label: item.name,
                    value: item.value
                });
            });
        });
        this.cardStyleOptions = [];
        await getPickListValues({ fieldName: 'pqcrush__Card_Style__c' }).then((result) => {
            result?.forEach((item) => {
                this.cardStyleOptions.push({
                    label: item.name,
                    value: item.value
                });
            });
        });
        await getRMOrgSettingForType({ type: this.type }).then((result) => {
            this.cardStyle = result?.pqcrush__Card_Style__c;
            this.displayStyle = result?.pqcrush__Display_Style__c;
            this.relationshipLineOpacity = result?.pqcrush__Relationship_Line_Opacity__c;
            this.reportsToLineOpacity = result?.pqcrush__Reports_To_Line_Opacity__c;
            this.prolifiqExtendedToolsURL = result?.pqcrush__Prolifiq_Extended_Tools_URL__c;

            this.orgSettings = JSON.parse(JSON.stringify(result));
        });
        this.loading = false;
    }

    onAutoLayoutChange(event) {
        let checked = event?.srcElement?.checked;

        if (this.orgSettings) {
            this.orgSettings.pqcrush__Auto_Layout__c = checked;
            this.handleOrgChanged(this.orgSettings);
        }
    }

    onEnableDragSelect(event) {
        let checked = event.srcElement.checked;

        if (this.orgSettings) {
            this.orgSettings.pqcrush__Enable_Drag_Select__c = checked;
            this.handleOrgChanged(this.orgSettings);
        }
    }

    onIsGroupGlobalScope(event) {
        let checked = event.srcElement.checked;

        if (this.orgSettings) {
            this.orgSettings.pqcrush__Is_Group_Global_Scope__c = checked;
            this.handleOrgChanged(this.orgSettings);
        }
    }

    onIsRelationshipLineGlobalScope(event) {
        let checked = event.srcElement.checked;

        if (this.orgSettings) {
            this.orgSettings.pqcrush__Is_Relationship_Line_Global_Scope__c = checked;
            this.handleOrgChanged(this.orgSettings);
        }
    }

    onIsBadgeGlobalScope(event) {
        let checked = event.srcElement.checked;

        if (this.orgSettings) {
            this.orgSettings.pqcrush__Is_Badge_Global_Scope__c = checked;
            this.handleOrgChanged(this.orgSettings);
        }
    }

    onIsReportsToGlobalScope(event) {
        let checked = event.srcElement.checked;

        if (this.orgSettings) {
            this.orgSettings.pqcrush__Is_Reports_To_Global_Scope__c = checked;
            this.handleOrgChanged(this.orgSettings);
        }
    }

    onShowEmptyFields(event) {
        let checked = event.srcElement.checked;

        if (this.orgSettings) {
            this.orgSettings.pqcrush__Show_Empty_Fields__c = checked;
            this.handleOrgChanged(this.orgSettings);
        }
    }

    onShowOverview(event) {
        let checked = event.srcElement.checked;

        if (this.orgSettings) {
            this.orgSettings.pqcrush__Show_Overview__c = checked;
            this.handleOrgChanged(this.orgSettings);
        }
    }

    onShowParents(event) {
        let checked = event.srcElement.checked;

        if (this.orgSettings) {
            this.orgSettings.pqcrush__Show_Parents__c = checked;
            this.handleOrgChanged(this.orgSettings);
        }
    }

    onRelationshipLineOpacity(event) {
        let val = event.srcElement.value;

        if (this.orgSettings && this.orgSettings.pqcrush__Relationship_Line_Opacity__c !== val) {
            this.orgSettings.pqcrush__Relationship_Line_Opacity__c = val;
            this.handleOrgChanged(this.orgSettings);
        }
    }

    onReportsToLineOpacity(event) {
        let val = event.srcElement.value;

        if (this.orgSettings && this.orgSettings.pqcrush__Reports_To_Line_Opacity__c !== val) {
            this.orgSettings.pqcrush__Reports_To_Line_Opacity__c = val;
            this.handleOrgChanged(this.orgSettings);
        }
    }

    onProlifiqExtendedToolsURL(event) {
        let input = this.template.querySelector("[data-id='extendedURL']");

        if (input.validity.valid) {
            let val = event.srcElement.value;

            if (this.orgSettings && this.orgSettings.pqcrush__Prolifiq_Extended_Tools_URL__c !== val) {
                this.orgSettings.pqcrush__Prolifiq_Extended_Tools_URL__c = val;
                this.handleOrgChanged(this.orgSettings);
            }
        }
    }

    onCardStyle(event) {
        let cardStyle = event.srcElement.value;

        if (this.orgSettings) {
            this.orgSettings.pqcrush__Card_Style__c = cardStyle;
            this.handleOrgChanged(this.orgSettings);
        }
    }

    onDisplayStyle(event) {
        let displayStyle = event.srcElement.value;

        if (this.orgSettings) {
            this.orgSettings.pqcrush__Display_Style__c = displayStyle;
            this.handleOrgChanged(this.orgSettings);
        }
    }

    onIsInfluenceSupportGlobalScope(event) {
        let checked = event.srcElement.checked;

        if (this.orgSettings) {
            this.orgSettings.pqcrush__Is_Influence_Support_Global_Scope__c = checked;
            this.handleOrgChanged(this.orgSettings);
        }
    }

    handleOrgChanged(orgSettings) {
        let input1 = this.template.querySelector("[data-id='relLineOpacity']");
        let input2 = this.template.querySelector("[data-id='repToOpacity']");

        if (input1.validity.valid && input2.validity.valid) {
            setDefaultChartSetting({ settings: orgSettings }).then(() => {
                const evt = new CustomEvent('settingschange', {});

                this.dispatchEvent(evt);
            });
        }
    }

    handleAdvancedSettingsChanged(orgSettings) {
        let input1 = this.template.querySelector("[data-id='extendedURL']");

        if (input1.validity.valid) {
            setDefaultChartSetting({ settings: orgSettings }).then(() => {
                const evt = new CustomEvent('settingschange', {});

                this.dispatchEvent(evt);
            });
        }
    }
}