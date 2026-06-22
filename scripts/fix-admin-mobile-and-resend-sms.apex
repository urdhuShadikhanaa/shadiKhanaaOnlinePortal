// Fix admin SMS mobile and resend notification for latest test booking
Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
if (settings == null || settings.Id == null) {
    settings = new Shadikhana_Settings__c();
    settings.SetupOwnerId = UserInfo.getOrganizationId();
}

String previousMobile = settings.Admin_Mobile_Number__c;
settings.Admin_Mobile_Number__c = '6364054881';
settings.SMS_Enabled__c = true;
upsert settings;

System.debug('PREVIOUS_ADMIN_MOBILE=' + previousMobile);
System.debug('UPDATED_ADMIN_MOBILE=' + settings.Admin_Mobile_Number__c);

Shadikhana_Booking__c booking = [
    SELECT Id, Name
    FROM Shadikhana_Booking__c
    WHERE Id = 'a01dM00003tAIMjQAO'
    LIMIT 1
];

System.debug('RESEND_SMS_FOR=' + booking.Name);

List<String> adminNumbers = new List<String>{ '6364054881' };
new ShadikhanaBookingSmsService.AdminBookingSmsQueueable(booking.Id, adminNumbers).execute(null);
System.debug('SMS_RESEND_EXECUTED=true');
