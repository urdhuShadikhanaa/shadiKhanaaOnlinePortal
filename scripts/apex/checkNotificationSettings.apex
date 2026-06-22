Shadikhana_Settings__c s = Shadikhana_Settings__c.getOrgDefaults();
if (s == null) {
    System.debug('SETTINGS: No org defaults found');
} else {
    System.debug('SETTINGS: SMS_Enabled=' + s.SMS_Enabled__c);
    System.debug('SETTINGS: Email_Enabled=' + s.Email_Enabled__c);
    System.debug('SETTINGS: Notifications_Enabled=' + s.Notifications_Enabled__c);
    System.debug('SETTINGS: Admin_Email=' + s.Admin_Email__c);
    System.debug('SETTINGS: Admin_Mobile=' + s.Admin_Mobile_Number__c);
    System.debug('SETTINGS: Footer_Additional_Phone=' + s.Footer_Additional_Phone__c);
    System.debug('SETTINGS: Twilio_From=' + s.Twilio_From_Number__c);
    System.debug('SETTINGS: Twilio_SID=' + (String.isNotBlank(s.Twilio_Account_SID__c) ? 'configured' : 'missing'));
    System.debug('SETTINGS: Twilio_Token=' + (String.isNotBlank(s.Twilio_Auth_Token__c) ? 'configured' : 'missing'));
    System.debug('SETTINGS: Ntfy_Topic=' + s.Ntfy_Topic__c);
    System.debug('SETTINGS: Hall_Seating=' + s.Hall_Seating_Capacity__c);
    System.debug('SETTINGS: Hall_Comfortable=' + s.Hall_Comfortable_Guests__c);
    System.debug('SETTINGS: Default_Rate=' + s.Default_Daily_Rate__c);
}
