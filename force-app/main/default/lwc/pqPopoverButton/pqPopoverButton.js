import { LightningElement, api } from 'lwc';

export default class PqPopoverButton extends LightningElement {
    showPopover = false;

    @api title = '';

    @api iconName = 'utility:filterList';

    @api variant = 'border-filled';

    @api
    toggle(event) {
        // Prevent click event from bubbling up to window click handler and closing popover
        event.stopPropagation();

        if (this.showPopover) {
            this.closePopover();
        } else {
            this.openPopover();
        }
    }

    openPopover() {
        this.showPopover = true;
        window.addEventListener('click', this.handleOutsideClick);
        const evt = new CustomEvent('openpopover', {});

        this.dispatchEvent(evt);
    }

    closePopover() {
        this.showPopover = false;
        window.removeEventListener('click', this.handleOutsideClick);
    }

    handleInsideClick(event) {
        // Prevent click event from bubbling up to window click handler and closing popover
        event.stopPropagation();
    }

    handleOutsideClick = () => {
        // Close popover on any click outside of popover body
        this.closePopover();
    };
}