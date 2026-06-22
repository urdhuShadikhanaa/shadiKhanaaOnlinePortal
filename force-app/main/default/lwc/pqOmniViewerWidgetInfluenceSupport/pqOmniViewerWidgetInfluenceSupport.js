import { LightningElement, api } from 'lwc';
import { isLightColor } from 'c/utils';
import LABEL_INFLUENCE from '@salesforce/label/c.Influence';
import LABEL_SUPPORT from '@salesforce/label/c.Support';
import OmniViewer_Influence_Support_Not_Set from '@salesforce/label/c.OmniViewer_Influence_Support_Not_Set';

export default class pqOmniViewerWidgetInfluenceSupport extends LightningElement {
    _influenceValue;

    _supportValue;

    labels = {
        influence: LABEL_INFLUENCE,
        support: LABEL_SUPPORT,
        notset: OmniViewer_Influence_Support_Not_Set
    };

    // ----------------------------------------------------

    @api title;

    @api subtitle;

    @api isGlobal;

    @api isHighlighted;

    @api influenceLabel;

    @api supportLabel;

    @api influenceOverrideValue;

    @api supportOverrideValue;

    _supportColor;

    supportColorStyle;

    supportLabelStyle;

    @api
    get supportColor() {
        return this._supportColor;
    }

    set supportColor(val) {
        this._supportColor = val;
        const lightBackground = isLightColor(this.supportColor);

        this.supportLabelStyle = lightBackground ? 'color: #000;' : 'color: #FFF;';
        this.supportColorStyle = 'background-color: ' + this.supportColor + '; ' + this.supportLabelStyle;
    }

    @api
    get supportValue() {
        return this._supportValue ? this._supportValue : this.labels.notset;
    }

    set supportValue(val) {
        this._supportValue = val?.toUpperCase();
    }

    @api
    get influenceValue() {
        return this._influenceValue ? this._influenceValue : this.labels.notset;
    }

    set influenceValue(val) {
        this._influenceValue = val?.toUpperCase();
    }

    // ----------------------------------------------------

    get highlightClass() {
        if (this.isHighlighted === 'true') {
            return 'container highlighted';
        }

        return 'container';
    }

    get hasTitle() {
        return this.title !== undefined;
    }

    get hasSubTitle() {
        return this.subTitle !== undefined;
    }
}