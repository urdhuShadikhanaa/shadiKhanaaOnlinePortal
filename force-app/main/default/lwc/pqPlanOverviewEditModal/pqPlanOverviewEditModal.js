import { LightningElement, api } from 'lwc';

// LABELS
import Background_Color from '@salesforce/label/c.Background_Color';
import Cancel from '@salesforce/label/c.Cancel';
import Enter_Overview_Information from '@salesforce/label/c.Enter_Overview_Information';
import Plan_Overview from '@salesforce/label/c.Plan_Overview';
import Save from '@salesforce/label/c.Save';
import Title from '@salesforce/label/c.Title';

export default class PqPlanOverviewEditModal extends LightningElement {
    error;

    planOverviewId;

    title;

    description;

    backgroundColor;

    labels = {
        Background_Color,
        Cancel,
        Enter_Overview_Information,
        Plan_Overview,
        Save,
        Title
    };

    @api
    open(planOverview) {
        this.planOverviewId = planOverview?.id;
        this.title = planOverview?.title;
        this.description = planOverview?.description;
        this.backgroundColor = planOverview ? planOverview?.backgroundColor : '#cccccc';
        const modal = this.template.querySelector('c-modal');

        modal.show();
    }

    handleCancel() {
        this.closeModal();
    }

    closeModal() {
        this.clearValues();
        const modal = this.template.querySelector('c-modal');

        modal.hide();
    }

    handleSave() {
        const colorPicker = this.template.querySelector('.color-picker');
        const titleInput = this.template.querySelector('.title-input');
        const overviewInput = this.template.querySelector('.overview-input');

        const evt = new CustomEvent('save', {
            detail: {
                id: this.planOverviewId,
                color: colorPicker.value,
                title: titleInput.value,
                description: overviewInput.value
            }
        });

        this.dispatchEvent(evt);
        this.closeModal();
    }

    clearValues() {
        this.title = '';
        this.description = '';
        this.backgroundColor = '';
    }
}