// Post-deploy seed for a new Urdu Shadikhana org (run once after metadata deploy)
Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
if (settings == null || settings.Id == null) {
    settings = new Shadikhana_Settings__c();
    settings.SetupOwnerId = UserInfo.getOrganizationId();
}

settings.Admin_Mobile_Number__c = '6364054881, 9849939703';
settings.Admin_Email__c = 'urdhushadikhanaa@gmail.com';
settings.SMS_Enabled__c = true;
settings.Notifications_Enabled__c = true;
settings.Email_Enabled__c = true;
settings.Default_Daily_Rate__c = 8000;

Map<String, Schema.SObjectField> settingsFields =
    Schema.SObjectType.Shadikhana_Settings__c.fields.getMap();
if (settingsFields.containsKey('Footer_Additional_Phone__c')) {
    settings.put('Footer_Additional_Phone__c', '9652741400');
}

User adminUser = [
    SELECT Username
    FROM User
    WHERE Id = :UserInfo.getUserId()
    LIMIT 1
];
List<Network> networks = [
    SELECT UrlPathPrefix
    FROM Network
    WHERE UrlPathPrefix != null
    ORDER BY CreatedDate DESC
    LIMIT 1
];
settings.Portal_Admin_Username__c = adminUser.Username;
settings.Portal_Login_Notes__c =
    'Sign in with the administrator username below and your Salesforce org password (the same password you use for Setup).';
if (!networks.isEmpty() && String.isNotBlank(networks[0].UrlPathPrefix)) {
    String orgHost = URL.getOrgDomainUrl().getHost().replace('.my.salesforce.com', '.my.site.com');
    String siteBase = 'https://' + orgHost + '/' + networks[0].UrlPathPrefix;
    settings.Portal_Site_URL__c = siteBase;
    settings.Portal_Login_URL__c = siteBase + '/login';
}

upsert settings;
System.debug('POST_DEPLOY_SETTINGS_ID=' + settings.Id);

PermissionSet guestPermSet = [
    SELECT Id
    FROM PermissionSet
    WHERE Name = 'Shadikhana_Guest_Portal'
    LIMIT 1
];

List<User> guestUsers = [
    SELECT Id, Username
    FROM User
    WHERE UserType = 'Guest' AND IsActive = true
    LIMIT 10
];

Set<Id> guestUserIds = new Map<Id, User>(guestUsers).keySet();
Set<Id> alreadyAssigned = new Set<Id>();
for (PermissionSetAssignment assignment : [
    SELECT AssigneeId
    FROM PermissionSetAssignment
    WHERE PermissionSetId = :guestPermSet.Id AND AssigneeId IN :guestUserIds
]) {
    alreadyAssigned.add(assignment.AssigneeId);
}

List<PermissionSetAssignment> assignments = new List<PermissionSetAssignment>();
for (User guestUser : guestUsers) {
    if (!alreadyAssigned.contains(guestUser.Id)) {
        assignments.add(new PermissionSetAssignment(
            AssigneeId = guestUser.Id,
            PermissionSetId = guestPermSet.Id
        ));
    }
}
if (!assignments.isEmpty()) {
    insert assignments;
}
System.debug('POST_DEPLOY_GUEST_PERMSETS=' + assignments.size());

ShadikhanaCancelledCleanupScheduler.scheduleMonthly();
System.debug('POST_DEPLOY_CLEANUP_SCHEDULED=true');
