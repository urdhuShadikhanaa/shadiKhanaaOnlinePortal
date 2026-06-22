import getMapIdForPlanId from '@salesforce/apex/OpportunityPlanController.getRelationshipMapIdForPlanId';

var _getMapIdForPlanIdPromiseMap = {};

export function getMapIdForPlanIdPromise(planId, forceRefresh = false) {
    if (forceRefresh || _getMapIdForPlanIdPromiseMap[planId] == null) {
        _getMapIdForPlanIdPromiseMap[planId] = getMapIdForPlanId({ oppPlanId: planId });
    }
    return _getMapIdForPlanIdPromiseMap[planId];
}