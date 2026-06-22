import { LightningElement } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import getOrgSettings from '@salesforce/apex/StrategySettingsController.getOrgSettings';
import updateUseDefaultAPScoringSettings from '@salesforce/apex/StrategySettingsController.updateUseDefaultAPScoringSettings';
import updateUsePercentageAPScoringSettings from '@salesforce/apex/StrategySettingsController.updateUsePercentageAPScoringSettings';
import updateAllowAddTaskFromObjectiveComponent from '@salesforce/apex/StrategySettingsController.updateAllowAddTaskFromObjectiveComponent';
import updateAllowTasksBasedObjStageFromObjectiveComponent from '@salesforce/apex/StrategySettingsController.updateAllowTasksBasedObjStageFromObjectiveComponent';
import updateUseSystemTaskModalFromObjectiveComponent from '@salesforce/apex/StrategySettingsController.updateUseSystemTaskModalFromObjectiveComponent';
import updateDisableObjectiveComponentSortButton from '@salesforce/apex/StrategySettingsController.updateDisableObjectiveComponentSortButton';

import getObjectiveSettings from '@salesforce/apex/ObjectiveController.getSettings';
import updateObjectiveSettings from '@salesforce/apex/ObjectiveController.updateSettings';
import getScoreSettings from '@salesforce/apex/HealthScoreController.getColorSettings';
import updateScoreSettings from '@salesforce/apex/HealthScoreController.updateColorSettings';

import { formatLabel } from 'c/stringUtils';
import Settings_Label from '@salesforce/label/c.Settings_Label';
import Account_Plan_Score from '@salesforce/label/c.Account_Plan_Score';
import All_Add_Task_From_Objective_Component from '@salesforce/label/c.All_Add_Task_From_Objective_Component';
import Enable_Objective_Stage_Based_On_Tasks from '@salesforce/label/c.Enable_Objective_Stage_Based_On_Tasks';
import Use_System_Modal_Task_From_Objective_Component from '@salesforce/label/c.Use_System_Modal_Task_From_Objective_Component';
import Disable_Objective_Component_Sort_Button from '@salesforce/label/c.Disable_Objective_Component_Sort_Button';
import Low_Color from '@salesforce/label/c.Low_Color';
import Mid_Color from '@salesforce/label/c.Mid_Color';
import High_Color from '@salesforce/label/c.High_Color';
import Low_Mid_Bound from '@salesforce/label/c.Low_Mid_Bound';
import Mid_High_Bound from '@salesforce/label/c.Mid_High_Bound';
import Use_Default_AP_Scoring from '@salesforce/label/c.Use_Default_AP_Scoring';
import Use_Percentage_AP_Scoring from '@salesforce/label/c.Use_Percentage_AP_Scoring';
import Disabled from '@salesforce/label/c.Disabled';
import Enabled from '@salesforce/label/c.Enabled';

export default class SettingsGeneralPage extends LightningElement {
    loading = false;

    loaded = false;

    useDefaultAPScoring = false;

    usePercentageAPScoring = false;

    allowAddTask = false;

    allowTasksBasedObjStage = false;

    useSFTaskModal = false;

    disableSortButton = false;

    objectiveSettings;

    scoreSettings;

    labels = {
        All_Add_Task_From_Objective_Component,
        Enable_Objective_Stage_Based_On_Tasks,
        Use_System_Modal_Task_From_Objective_Component,
        Disable_Objective_Component_Sort_Button,
        Low_Color,
        Mid_Color,
        High_Color,
        Low_Mid_Bound,
        Mid_High_Bound,
        Score_Title: formatLabel(Settings_Label, [Account_Plan_Score]),
        Use_Default_AP_Scoring,
        Use_Percentage_AP_Scoring,
        Disabled,
        Enabled
    };

    async connectedCallback() {
        this.loading = true;
        this.loaded = false;
        await getObjectiveSettings().then((result) => {
            this.objectiveSettings = JSON.parse(JSON.stringify(result));
        });
        await getScoreSettings().then((result) => {
            this.scoreSettings = JSON.parse(JSON.stringify(result));
        });
        await getOrgSettings()
            .then((result) => {
                this.useDefaultAPScoring = result?.useDefaultAPScoring;
                this.usePercentageAPScoring = result?.usePercentageAPScoring;
                this.allowAddTask = result?.allowAddTaskFromObjectiveComponent;
                this.allowTasksBasedObjStage = result?.allowTasksBasedObjStageFromObjectiveComponent;
                this.useSFTaskModal = result?.useSystemTaskModalFromObjectiveComponent;
                this.disableSortButton = result?.disableObjectComponentSortButton;
            })
            .catch((error) => {
                let errormsg = error.message ? error.message : error.body?.message;

                this.showNotification('Error', errormsg, 'error');
            });
        this.loading = false;
        this.loaded = true;
    }

    handleAllowAddTaskToggled(event) {
        let checked = event?.srcElement?.checked;

        this.loading = true;
        updateAllowAddTaskFromObjectiveComponent({ allowAddTask: checked })
            .then(() => {
                this.allowAddTask = checked;
                this.loading = false;
            })
            .catch((error) => {
                let errormsg = error.message ? error.message : error.body?.message;

                this.showNotification('Error', errormsg, 'error');
            });
    }

    handleDisableSortToggled(event) {
        let checked = event?.srcElement?.checked;

        this.loading = true;
        updateDisableObjectiveComponentSortButton({ disableSortButton: checked })
            .then(() => {
                this.disableSortButton = checked;
                this.loading = false;
            })
            .catch((error) => {
                let errormsg = error.message ? error.message : error.body?.message;

                this.showNotification('Error', errormsg, 'error');
            });
    }

    handleAllowTasksBasedObjStageToggled(event) {
        let checked = event?.srcElement?.checked;

        this.loading = true;
        updateAllowTasksBasedObjStageFromObjectiveComponent({ allowTasksBasedObjStage: checked })
            .then(() => {
                this.allowTasksBasedObjStage = checked;
                this.loading = false;
            })
            .catch((error) => {
                let errormsg = error.message ? error.message : error.body?.message;

                this.showNotification('Error', errormsg, 'error');
            });
    }

    handleUseSFTaskModalToggled(event) {
        let checked = event?.srcElement?.checked;

        this.loading = true;
        updateUseSystemTaskModalFromObjectiveComponent({ useSystemModal: checked })
            .then(() => {
                this.useSFTaskModal = checked;
                this.loading = false;
            })
            .catch((error) => {
                let errormsg = error.message ? error.message : error.body?.message;

                this.showNotification('Error', errormsg, 'error');
            });
    }

    handleDefaultScoringToggled(event) {
        let checked = event?.srcElement?.checked;

        if (checked) {
            this.usePercentageAPScoring = false;
        } else {
            this.usePercentageAPScoring = true;
        }

        this.loading = true;
        updateUseDefaultAPScoringSettings({ useDefaultAPScoring: checked })
            .then(() => {
                this.useDefaultAPScoring = checked;
                this.loading = false;
            })
            .catch((error) => {
                let errormsg = error.message ? error.message : error.body?.message;

                this.showNotification('Error', errormsg, 'error');
            });
    }
    handlePercentageScoringToggled(event) {
        let checked = event?.srcElement?.checked;

        if (checked) {
            this.useDefaultAPScoring = false;
        } else {
            this.useDefaultAPScoring = true;
        }

        this.loading = true;
        updateUsePercentageAPScoringSettings({ usePercentageAPScoring: checked })
            .then(() => {
                this.usePercentageAPScoring = checked;
                this.loading = false;
            })
            .catch((error) => {
                let errormsg = error.message ? error.message : error.body?.message;

                this.showNotification('Error', errormsg, 'error');
            });
    }

    handleScoreSettingsChanged(event) {
        const { name, value } = event.target;

        this.scoreSettings[name] = value;
        this.updateScoreSettings();
    }

    handleObjectiveLowColorChanged(event) {
        this.objectiveSettings.objective.lowColor = event.currentTarget.value;
        this.updateObjectiveSettings();
    }

    handleObjectiveMiddleColorChanged(event) {
        this.objectiveSettings.objective.midColor = event.currentTarget.value;
        this.updateObjectiveSettings();
    }

    handleObjectiveHighColorChanged(event) {
        this.objectiveSettings.objective.highColor = event.currentTarget.value;
        this.updateObjectiveSettings();
    }

    handleObjectiveLowMiddleBreakChanged(event) {
        this.objectiveSettings.objective.lowMidBoundary = event.currentTarget.value;
        this.updateObjectiveSettings();
    }

    handleObjectiveMiddleHighBreakChanged(event) {
        this.objectiveSettings.objective.midHighBoundary = event.currentTarget.value;
        this.updateObjectiveSettings();
    }

    handleTaskLowColorChanged(event) {
        this.objectiveSettings.task.lowColor = event.currentTarget.value;
        this.updateObjectiveSettings();
    }

    handleTaskMiddleColorChanged(event) {
        this.objectiveSettings.task.midColor = event.currentTarget.value;
        this.updateObjectiveSettings();
    }

    handleTaskHighColorChanged(event) {
        this.objectiveSettings.task.highColor = event.currentTarget.value;
        this.updateObjectiveSettings();
    }

    handleTaskLowMiddleBreakChanged(event) {
        this.objectiveSettings.task.lowMidBoundary = event.currentTarget.value;
        this.updateObjectiveSettings();
    }

    handleTaskMiddleHighBreakChanged(event) {
        this.objectiveSettings.task.midHighBoundary = event.currentTarget.value;
        this.updateObjectiveSettings();
    }

    updateObjectiveSettings() {
        updateObjectiveSettings({ settingString: JSON.stringify(this.objectiveSettings) })
            .then(() => {
                this.showNotification('Updated', 'Settings Updated!', 'success');
            })
            .catch((error) => {
                let errormsg = error.message ? error.message : error.body?.message;

                this.showNotification('Error', errormsg, 'error');
            });
    }

    updateScoreSettings() {
        updateScoreSettings({ colorSettings: this.scoreSettings })
            .then(() => {
                this.showNotification('Updated', 'Settings Updated!', 'success');
            })
            .catch((error) => {
                let errormsg = error.message ? error.message : error.body?.message;

                this.showNotification('Error', errormsg, 'error');
            });
    }

    showNotification(title, message, variant) {
        const evt = new ShowToastEvent({ title, message, variant });

        this.dispatchEvent(evt);
    }
}