List<Shadikhana_Booking__c> bookings = [
    SELECT Id, Name, Status__c, Contact_Email__c, Contact_Name__c, Booking_Date__c, Booked_By__c
    FROM Shadikhana_Booking__c
    WHERE Name = 'SB-0024'
    LIMIT 1
];

if (bookings.isEmpty()) {
    System.debug('SB0024_NOT_FOUND=true');
} else {
    Shadikhana_Booking__c booking = bookings[0];
    System.debug('SB0024_ID=' + booking.Id);
    System.debug('SB0024_STATUS=' + booking.Status__c);
    System.debug('SB0024_CONTACT_EMAIL=' + booking.Contact_Email__c);

    Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
    System.debug('EMAIL_ENABLED=' + (settings == null || settings.Email_Enabled__c != false));
    System.debug('ADMIN_EMAIL=' + (settings != null ? settings.Admin_Email__c : null));

    List<OrgWideEmailAddress> orgWide = [
        SELECT Id, Address, IsVerified
        FROM OrgWideEmailAddress
        WHERE IsVerified = true
    ];
    System.debug('ORG_WIDE_COUNT=' + orgWide.size());

    Integer beforeCount = Limits.getEmailInvocations();
    ShadikhanaBookingEmailService.notifyBookingRequestSubmitted(booking.Id);
    System.debug('EMAIL_QUEUE_TRIGGERED=true');
    System.debug('EMAIL_INVOCATIONS=' + Limits.getEmailInvocations());
}
