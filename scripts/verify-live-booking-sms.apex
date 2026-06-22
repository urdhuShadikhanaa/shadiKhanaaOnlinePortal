Shadikhana_Booking__c booking = [
    SELECT Id, Name
    FROM Shadikhana_Booking__c
    WHERE Id = 'a01dM00003tAIMjQAO'
    LIMIT 1
];

Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
List<String> adminNumbers = new List<String>();
if (settings != null && String.isNotBlank(settings.Admin_Mobile_Number__c)) {
    for (String part : settings.Admin_Mobile_Number__c.split('[;,]')) {
        if (String.isNotBlank(part)) {
            adminNumbers.add(part.trim());
        }
    }
}
if (adminNumbers.isEmpty()) {
    adminNumbers.add('6364054881');
}

System.debug('VERIFY_BOOKING_NUMBER=' + booking.Name);
System.debug('SMS_ADMIN_NUMBERS=' + adminNumbers);

new ShadikhanaBookingSmsService.AdminBookingSmsQueueable(booking.Id, adminNumbers).execute(null);
System.debug('SMS_QUEUEABLE_EXECUTED=true');
