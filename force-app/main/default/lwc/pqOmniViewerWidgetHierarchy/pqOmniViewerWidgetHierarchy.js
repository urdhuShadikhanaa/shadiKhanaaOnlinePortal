import { LightningElement, api } from 'lwc';
import Open_In_New_Window from '@salesforce/label/c.Open_In_New_Window';

export default class PqOmniViewerWidgetHierarchy extends LightningElement {
    @api hierarchyData;

    @api loaded = false;

    labels = {
        Open_In_New_Window
    };

    handleNavigateToClicked(event) {
        const rmId = event.currentTarget.dataset.rmid;
        const apId = event.currentTarget.dataset.apid;

        if (rmId) {
            window.open('/' + rmId, '_blank');
        } else if (apId) {
            window.open('/' + apId, '_blank');
        }
    }
}