Date bookingDate = Date.today().addDays(40);
String month = String.valueOf(bookingDate.month()).leftPad(2, '0');
String day = String.valueOf(bookingDate.day()).leftPad(2, '0');
String dateStr = bookingDate.year() + '-' + month + '-' + day;

ShadikhanaBookingController.BookingRecord created = ShadikhanaBookingController.createBooking(
    dateStr,
    dateStr,
    'Twilio Live SMS Test',
    'Test Requester',
    '9849939703',
    null,
    'Live Twilio configuration test'
);
System.debug('Created booking: ' + created.id + ' ' + created.bookingNumber);

ShadikhanaBookingController.BookingRecord confirmed =
    ShadikhanaBookingController.updateBookingStatus(created.id, 'Confirmed');
System.debug('Confirmed booking: ' + confirmed.id + ' status=' + confirmed.status);
