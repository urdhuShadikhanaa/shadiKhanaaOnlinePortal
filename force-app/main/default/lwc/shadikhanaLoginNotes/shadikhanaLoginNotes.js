import { LightningElement, wire } from 'lwc';
import getPortalLoginNotes from '@salesforce/apex/ShadikhanaBookingController.getPortalLoginNotes';

const ADMIN_LOGIN_NOTES_KEY = 'shadikhanaShowAdminLoginNotes';

export default class ShadikhanaLoginNotes extends LightningElement {
    heading = 'Administrator login notes';
    message = '';
    adminUsername = '';
    adminPassword = '';
    isLoaded = false;
    showAdminNotes = false;

    connectedCallback() {
        this.showAdminNotes = this.readAdminNotesFlag();
    }

    readAdminNotesFlag() {
        try {
            return window.sessionStorage.getItem(ADMIN_LOGIN_NOTES_KEY) === 'true';
        } catch (error) {
            return false;
        }
    }

    @wire(getPortalLoginNotes)
    wiredLoginNotes({ data, error }) {
        if (data) {
            this.heading = data.heading || this.heading;
            this.message = data.message || '';
            this.adminUsername = data.adminUsername || '';
            this.adminPassword = data.adminPassword || '';
            this.isLoaded = true;
            return;
        }

        if (error) {
            this.message = 'Sign in with your portal administrator credentials.';
            this.isLoaded = true;
        }
    }

    get shouldRenderNotes() {
        return this.isLoaded && this.showAdminNotes;
    }

    get hasCredentials() {
        return Boolean(this.adminUsername);
    }

    get showPasswordHint() {
        return Boolean(this.adminPassword);
    }
}
