import getCrushFeatureAccess from '@salesforce/apex/FeatureFlagController.hasCrushAccess';
import getRMFeatureAccess from '@salesforce/apex/FeatureFlagController.hasRelationshipMapAccess';
import getOppPlanFeatureAccess from '@salesforce/apex/FeatureFlagController.hasOpportunityPlanAccess';
import getLicenseAccess from '@salesforce/apex/FeatureFlagController.isLicensed';

var _hasCrush = null;
var _hasRelMap = null;
var _hasOppPlan = null;
var _isLicensed = null;

export function crushAccess() {
    return _hasCrush;
}

export function oppPlanAccess() {
    return _hasOppPlan;
}

export function relationshipMapAccess() {
    return _hasRelMap;
}

export function isLicensed() {
    return _isLicensed;
}

export async function initializeValues() {
    if (_hasCrush != null && _hasRelMap != null && _isLicensed != null) {
        return;
    }
    _hasCrush = await getCrushFeatureAccess();
    _hasRelMap = await getRMFeatureAccess();
    _hasOppPlan = await getOppPlanFeatureAccess();
    _isLicensed = await getLicenseAccess();
}