Shadikhana_Booking__c booking = [
    SELECT Id, Name, Contact_Email__c
    FROM Shadikhana_Booking__c
    WHERE Id = 'a01dM00003tAIMjQAO'
    LIMIT 1
];

System.debug('VERIFY_BOOKING_NUMBER=' + booking.Name);
System.debug('VERIFY_REQUESTER_EMAIL=' + booking.Contact_Email__c);

Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
System.debug('SETTINGS_ADMIN_EMAIL=' + (settings == null ? null : settings.Admin_Email__c));

new ShadikhanaBookingEmailService.BookingRequestEmailQueueable(booking.Id).execute(null);
System.debug('EMAIL_QUEUEABLE_EXECUTED=true');
