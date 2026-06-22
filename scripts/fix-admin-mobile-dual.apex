Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
if (settings == null || settings.Id == null) {
    settings = new Shadikhana_Settings__c();
    settings.SetupOwnerId = UserInfo.getOrganizationId();
}

System.debug('PREVIOUS_ADMIN_MOBILE=' + settings.Admin_Mobile_Number__c);
settings.Admin_Mobile_Number__c = '6364054881, 9849939703';
settings.SMS_Enabled__c = true;
upsert settings;

List<String> resolved = new List<String>();
if (String.isNotBlank(settings.Admin_Mobile_Number__c)) {
    for (String part : settings.Admin_Mobile_Number__c.split('[;,]')) {
        if (String.isNotBlank(part)) {
            resolved.add(part.trim());
        }
    }
}
System.debug('UPDATED_ADMIN_MOBILE=' + settings.Admin_Mobile_Number__c);
System.debug('RESOLVED_ADMIN_NUMBERS=' + resolved);
System.debug('RESOLVED_COUNT=' + resolved.size());
