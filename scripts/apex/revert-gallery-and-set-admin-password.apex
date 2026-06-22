Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
if (settings == null || settings.Id == null) {
    settings = new Shadikhana_Settings__c();
    settings.SetupOwnerId = UserInfo.getOrganizationId();
}

settings.Portal_Gallery_Exterior_Id__c = null;
settings.Portal_Gallery_Interior_Id__c = null;
settings.Portal_Gallery_Dining_Id__c = null;
settings.Portal_Admin_Password__c = '#Spen@2023456';

upsert settings;

System.debug('GALLERY_REVERTED=true');
System.debug('ADMIN_PASSWORD_HINT_SET=true');
System.debug('SETTINGS_ID=' + settings.Id);
