import { LightningElement, api } from 'lwc';
import { getMapIdForPlanIdPromise } from 'c/oppManDataDispatcher';
import Error_No_RM from '@salesforce/label/c.Opp_Plan_No_RM_Found';

export default class RelationshipMapForOppPlan extends LightningElement {
    @api recordId = null;
    mapId = null;
    isLoading = false;
    errorMessage = null;

    get showMap() {
        return this.mapId && !this.errorMessage;
    }

    connectedCallback() {
        this.isLoading = true;
        this.errorMessage = null;
        getMapIdForPlanIdPromise(this.recordId)
            .then((result) => {
                if (result) {
                    this.mapId = result;
                } else {
                    this.errorMessage = Error_No_RM;
                }
                this.isLoading = false;
            })
            .catch((error) => {
                this.errorMessage = error.body.message;
                this.isLoading = false;
            });
    }

    @api
    handleApplicationEvent(eventName, eventValue) {
        const rm = this.template.querySelector('c-relationship-map');
        if (rm) {
            rm.handleApplicationEvent(eventName, eventValue);
        }
    }

    passthroughEvent(event) {
        const passedEvent = new CustomEvent(event.type, {
            detail: event.detail
        });
        // Dispatches the event.
        this.dispatchEvent(passedEvent);
    }
}