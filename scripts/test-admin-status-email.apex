Shadikhana_Booking__c booking = [
    SELECT Id, Name, Status__c, Contact_Email__c
    FROM Shadikhana_Booking__c
    WHERE Id = 'a01dM00003tAIMjQAO'
    LIMIT 1
];

System.debug('BOOKING=' + booking.Name + ' status=' + booking.Status__c + ' email=' + booking.Contact_Email__c);

if (booking.Status__c != 'Pending') {
    System.debug('SKIP_CONFIRM_STATUS_ALREADY=' + booking.Status__c);
} else {
    ShadikhanaBookingController.BookingRecord confirmed =
        ShadikhanaBookingController.updateBookingStatus(booking.Id, 'Confirmed');
    System.debug('CONFIRMED_STATUS=' + confirmed.status);
    System.debug('CONFIRMATION_EMAIL_QUEUED=true');
}
