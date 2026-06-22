Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
if (settings == null || settings.Id == null) {
    settings = new Shadikhana_Settings__c();
    settings.SetupOwnerId = UserInfo.getOrganizationId();
}
settings.Admin_Email__c = 'urdhushadikhanaa@gmail.com';
settings.Email_Enabled__c = true;
upsert settings;
System.debug('Shadikhana email settings saved: ' + settings.Id);
