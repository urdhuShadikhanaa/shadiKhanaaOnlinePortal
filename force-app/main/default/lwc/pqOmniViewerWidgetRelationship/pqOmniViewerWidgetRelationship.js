import { LightningElement, api } from 'lwc';

import Using_Global_Relationships from '@salesforce/label/c.Using_Global_Relationships';
import Open_In_New_Window from '@salesforce/label/c.Open_In_New_Window';

export default class PqOmniViewerWidgetRelationship extends LightningElement {
    @api relationshipData;

    @api loaded = false;

    @api isHighlighted = false;

    labels = {
        Open_In_New_Window,
        Using_Global_Relationships
    };

    get areLinksClickable() {
        // If highlighted (on current map), then links should not be clickable
        // If not highlighted, then not clickable if global
        if (this.isHighlighted) {
            return false;
        }
        if (this.relationshipData.isGlobalRelationship) {
            return false;
        }

        return true;
    }

    handleNavigateToClicked(event) {
        const rmId = event.currentTarget.dataset.rmid;
        const apId = event.currentTarget.dataset.apid;

        if (rmId) {
            window.open('/' + rmId, '_blank');
        } else if (apId) {
            window.open('/' + apId, '_blank');
        }
    }

    get highlightClass() {
        if (this.isHighlighted === 'true') {
            return 'container highlighted';
        }

        return 'hierarchy-container';
    }
}