import { LightningElement, api } from 'lwc';
import { templateAreas } from 'c/whiteSpaceTemplateBuilderUtils';
import { variants } from 'c/progressRingVariants';

import getPicklistValues from '@salesforce/apex/WhiteSpaceTemplateController.getPicklistValues';

import WsTemplateBuilderService from 'c/wsTemplateBuilderService';

import LABEL_OPTIONAL from '@salesforce/label/c.Optional';

const headerSamples = [1, 2, 3];
const cellSamples = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export default class BuilderArea extends LightningElement {
    @api type;

    @api isValid = false;

    @api title;

    @api showProgress = false;

    @api required = false;

    previews = [];

    _configuration;

    @api
    get configuration() {
        return this._configuration;
    }

    set configuration(config) {
        this._configuration = config;
        this.setPreviews();
    }

    async setPreviews() {
        let previews = [];

        if (this.isHeaderType) {
            if (this.isValid) {
                if (this.configuration.type === 'picklistvalues') {
                    const picklistValues = await getPicklistValues({
                        objectName: this.configuration.targetObject,
                        fieldName: this.configuration.targetValueField
                    });

                    headerSamples.forEach((number, index) => {
                        const value = picklistValues[index] ? picklistValues[index].label : '';
                        const preview = {
                            id: number,
                            value: value
                        };

                        previews.push(preview);
                    });
                } else {
                    const label = WsTemplateBuilderService.getObjectLabel(this.configuration.targetObject);

                    headerSamples.forEach((number) => {
                        const preview = {
                            id: number,
                            value: `${label} ${number}`
                        };

                        previews.push(preview);
                    });
                }
            }
        } else {
            let displayObjects = [];
            const amountTypeFields =
                this.configuration.amountTypeFields?.map((item) => {
                    const displayValue = WsTemplateBuilderService.getObjectLabelPlural(item.mapping.targetObject);

                    return {
                        id: item.displayFieldId,
                        value: `${item.name}: ${displayValue}`
                    };
                }) ?? [];

            const basicFields =
                this.configuration.basicFields?.map((item) => {
                    const displayValue = WsTemplateBuilderService.getObjectLabelPlural(item.mapping.targetObject);

                    return {
                        id: item.id,
                        value: displayValue
                    };
                }) ?? [];

            displayObjects = [...amountTypeFields, ...basicFields];

            cellSamples.forEach((number) => {
                const preview = {
                    id: number,
                    displayObjects: displayObjects
                };

                previews.push(preview);
            });
        }
        this.previews = [...previews];
    }

    get titleDisplay() {
        return this.required ? this.title : `${this.title} (${LABEL_OPTIONAL})`;
    }

    get isEmpty() {
        return WsTemplateBuilderService.isConfigurationEmpty(this.type, this.configuration);
    }

    get getStep() {
        let value;

        switch (this.type) {
            case templateAreas.column:
                value = '1';
                break;
            case templateAreas.row:
                value = '2';
                break;
            case templateAreas.cell:
                value = '3';
                break;
            default:
                value = '';
        }

        return value;
    }

    get getPreviewClass() {
        let css = 'preview-container ';

        if (!this.type) {
            return css;
        }
        css += this.type;

        return css;
    }

    get isHeaderType() {
        return this.type === templateAreas.column || this.type === templateAreas.row;
    }

    get isCellType() {
        return this.type === templateAreas.cell;
    }

    get getProgressValue() {
        if (this.isEmpty) {
            return 0;
        }

        return 100;
    }

    get getProgressVariant() {
        if (this.isEmpty) {
            return null;
        }
        if (!this.isValid) {
            return variants.error;
        }

        return 'complete';
    }
}