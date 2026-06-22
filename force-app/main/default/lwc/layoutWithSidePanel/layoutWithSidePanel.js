import { LightningElement, api } from 'lwc';

const CONTAINER_CLASS = 'sp-container';
const PANEL_OPEN_CLASS = 'sp-panel-open';
const SLIDE_IN_CLASS = 'sp-slide-in';

export default class LayoutWithSidePanel extends LightningElement {
    @api panelPosition = 'right';

    @api docked = false;

    @api
    set opened(value) {
        // Make sure value results to true or false
        const boolFromValue = value != null && `${value}` !== 'false';

        if (boolFromValue !== this.privateOpened) {
            this.privateOpened = boolFromValue;
            this.toggleSidePanel();
        }
    }

    get opened() {
        return this.privateOpened;
    }

    privateOpened = false;

    @api openSidePanel() {
        const container = this.template.querySelector(`.${CONTAINER_CLASS}`);

        if (container) {
            if (container.classList.contains(PANEL_OPEN_CLASS)) {
                return;
            }
            container.className = CONTAINER_CLASS;
            container.classList.add(SLIDE_IN_CLASS);
            // eslint-disable-next-line @lwc/lwc/no-async-operation
            setTimeout(function () {
                container.classList.add(PANEL_OPEN_CLASS);
            }, 25);
        }
    }

    @api closeSidePanel() {
        const container = this.template.querySelector(`.${CONTAINER_CLASS}`);

        if (container) {
            container.classList.remove(PANEL_OPEN_CLASS);
        }
    }

    get getContainerClass() {
        let css = `${CONTAINER_CLASS} `;

        if (this.docked || this.opened) {
            css += `${PANEL_OPEN_CLASS} ${SLIDE_IN_CLASS}`;
        }

        return css;
    }

    get getPanelClass() {
        let css = `sp-panel ${SLIDE_IN_CLASS} `;

        if (this.panelPosition === 'left') {
            css += 'sp-panel-left';
        }

        return css;
    }

    toggleSidePanel() {
        if (this.opened) {
            this.openSidePanel();
        } else {
            this.closeSidePanel();
        }
    }
}