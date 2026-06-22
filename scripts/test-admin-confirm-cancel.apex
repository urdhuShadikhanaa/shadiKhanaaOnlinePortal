Shadikhana_Booking__c booking = [
    SELECT Id, Name, Status__c
    FROM Shadikhana_Booking__c
    WHERE Event_Name__c = 'Live Site Functionality Test'
    ORDER BY CreatedDate DESC
    LIMIT 1
];

ShadikhanaBookingController.BookingRecord confirmed =
    ShadikhanaBookingController.updateBookingStatus(booking.Id, 'Confirmed');
System.debug('CONFIRMED=' + confirmed.status);

ShadikhanaBookingController.BookingRecord cancelled =
    ShadikhanaBookingController.updateBookingStatus(booking.Id, 'Cancelled');
System.debug('CANCELLED=' + cancelled.status);
