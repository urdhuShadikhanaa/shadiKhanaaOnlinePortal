Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
List<String> adminNumbers = new List<String>();
if (settings != null && String.isNotBlank(settings.Admin_Mobile_Number__c)) {
    for (String part : settings.Admin_Mobile_Number__c.split('[;,]')) {
        if (String.isNotBlank(part)) {
            adminNumbers.add(part.trim());
        }
    }
}
System.debug('ADMIN_NUMBERS_FOR_SMS=' + adminNumbers);

Shadikhana_Booking__c booking = [
    SELECT Id, Name
    FROM Shadikhana_Booking__c
    WHERE Id = 'a01dM00003tAIMjQAO'
    LIMIT 1
];

System.debug('RESEND_SMS_FOR=' + booking.Name);
new ShadikhanaBookingSmsService.AdminBookingSmsQueueable(booking.Id, adminNumbers).execute(null);
System.debug('SMS_RESEND_COMPLETE count=' + adminNumbers.size());
