Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
if (settings == null || settings.Id == null) {
    settings = new Shadikhana_Settings__c();
    settings.SetupOwnerId = UserInfo.getOrganizationId();
}
settings.Portal_Admin_Username__c = 'onlinereservations@shabbirtech.com';
settings.Portal_Admin_Password__c = '#Spen@202456';
settings.Portal_Login_Notes__c =
    'Use the administrator username and password below to sign in and open the Administration section.';
upsert settings;
System.debug('Portal login settings saved: ' + settings.Id);
