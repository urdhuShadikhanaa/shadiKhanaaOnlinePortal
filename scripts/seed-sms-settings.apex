Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
if (settings == null || settings.Id == null) {
    settings = new Shadikhana_Settings__c();
    settings.SetupOwnerId = UserInfo.getOrganizationId();
}
settings.Admin_Mobile_Number__c = '6364054881, 9849939703';
settings.SMS_Enabled__c = true;
settings.Notifications_Enabled__c = true;
upsert settings;
System.debug('Shadikhana settings saved: ' + settings.Id);
