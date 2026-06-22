import { LightningElement, api } from 'lwc';
import { variants } from 'c/progressRingVariants';

const iconNames = {
    [variants.warning]: 'warning',
    [variants.error]: 'error',
    [variants.complete]: 'check'
};

const classes = {
    [variants.warning]: 'slds-progress-ring_warning',
    [variants.error]: 'slds-progress-ring_expired',
    [variants.complete]: 'slds-progress-ring_complete'
};

export default class ProgressRing extends LightningElement {
    @api value = 0;

    _variant;

    hasVariant = false;

    iconName;

    altText;

    @api defaultContent;

    @api
    set variant(value) {
        this.hasVariant = value === variants.warning || value === variants.error || value === variants.complete;
        this._variant = value;
        if (this.hasVariant) {
            this.iconName = 'utility:' + iconNames[value];
            this.altText = variants[value];
        }
    }

    get variant() {
        return this._variant;
    }

    get updateProgressBar() {
        let dValue =
            'M 1 0 A 1 1 0 ' +
            Math.round(this.value / 100) +
            ' 1 ' +
            Math.cos((2 * Math.PI * this.value) / 100) +
            ' ' +
            Math.sin((2 * Math.PI * this.value) / 100) +
            ' L 0 0';

        return dValue;
    }

    get progressRingClass() {
        let css = 'slds-progress-ring ';

        if (this.hasVariant) {
            css += classes[this.variant];
        }

        return css;
    }
}