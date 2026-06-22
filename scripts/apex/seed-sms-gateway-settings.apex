Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
if (settings == null) {
    settings = new Shadikhana_Settings__c();
}
settings.SMS_Provider__c = 'Android Gateway';
settings.SMS_Gateway_Api_Key__c = 'sk-shadikhana-gateway-change-me';
settings.SMS_Enabled__c = true;
settings.Notifications_Enabled__c = true;
upsert settings;
System.debug('SMS Gateway settings saved. Update SMS_Gateway_Api_Key__c to a strong secret.');
