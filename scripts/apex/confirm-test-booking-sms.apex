// Confirm latest test booking so requester (9966634403) gets SMS.
Shadikhana_Booking__c booking = [
    SELECT Id, Contact_Phone__c, Status__c
    FROM Shadikhana_Booking__c
    WHERE Contact_Phone__c = '9966634403'
    ORDER BY CreatedDate DESC
    LIMIT 1
];
System.debug('Booking: ' + booking.Id + ' status=' + booking.Status__c);

ShadikhanaBookingController.BookingRecord confirmed =
    ShadikhanaBookingController.updateBookingStatus(booking.Id, 'Confirmed');
System.debug('Updated status: ' + confirmed.status);
