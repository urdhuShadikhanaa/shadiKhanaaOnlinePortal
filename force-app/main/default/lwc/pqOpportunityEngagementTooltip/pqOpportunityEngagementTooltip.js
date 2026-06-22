import { LightningElement, api } from 'lwc';

export default class pqModalTooltip extends LightningElement {
    @api entry;
    @api user;
    @api contact;
    @api collection;

    showTooltip = false;

    get subject() {
        switch (this.collection) {
            case 'users':
                return this.entry.text;

            case 'activities':
                return this.entry.rollup;

            case 'contacts':
                return this.entry.text;

            case 'matrix':
                return this.contact;

            default:
                return '';
        }
    }

    get subjectConnector() {
        switch (this.collection) {
            case 'matrix':
                return ' & ';
            default:
                return '';
        }
    }

    get subject2() {
        switch (this.collection) {
            case 'matrix':
                return this.user;
            default:
                return '';
        }
    }

    get showUsers() {
        return this.collection !== 'users';
    }

    get showActivities() {
        return true;
    }

    get showContacts() {
        return this.collection !== 'contacts';
    }

    @api show() {
        this.showTooltip = !this.showTooltip;
    }

    hide() {
        this.showTooltip = false;
    }

    handleEditClicked(event) {
        const targetId = event.currentTarget.dataset.id;
        if (targetId !== undefined) {
            window.open('/' + targetId, '_blank');
        }
    }

    async connectedCallback() {
        document.addEventListener('keyup', (e) => {
            if (e.key === 'Escape') {
                this.hide();
            }
        });
    }
}