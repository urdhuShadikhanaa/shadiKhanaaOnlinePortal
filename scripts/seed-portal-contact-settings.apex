Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
if (settings == null || settings.Id == null) {
    settings = new Shadikhana_Settings__c();
    settings.SetupOwnerId = UserInfo.getOrganizationId();
}
settings.Footer_Additional_Phone__c = '9652741400';
settings.Admin_Email__c = 'urdhushadikhanaa@gmail.com';
settings.Portal_Site_URL__c = 'https://shabbirtech4-dev-ed.develop.my.site.com/urdushadikhana';
settings.Portal_Login_URL__c = 'https://shabbirtech4-dev-ed.develop.my.site.com/urdushadikhana/login';
upsert settings;
System.debug('Portal footer and SMS settings saved: ' + settings.Id);
