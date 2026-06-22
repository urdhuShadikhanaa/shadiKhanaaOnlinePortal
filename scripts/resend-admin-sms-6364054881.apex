Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
System.debug('CURRENT_ADMIN_MOBILE=' + (settings == null ? null : settings.Admin_Mobile_Number__c));

Shadikhana_Booking__c booking = [
    SELECT Id, Name
    FROM Shadikhana_Booking__c
    WHERE Id = 'a01dM00003tAIMjQAO'
    LIMIT 1
];

List<String> adminNumbers = new List<String>{ '6364054881' };
System.debug('RESEND_SMS_FOR=' + booking.Name + ' to=' + adminNumbers);
new ShadikhanaBookingSmsService.AdminBookingSmsQueueable(booking.Id, adminNumbers).execute(null);
System.debug('SMS_RESEND_EXECUTED=true');
