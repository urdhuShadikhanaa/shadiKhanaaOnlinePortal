Date bookingDate = Date.today().addDays(45);
String month = String.valueOf(bookingDate.month()).leftPad(2, '0');
String day = String.valueOf(bookingDate.day()).leftPad(2, '0');
String dateStr = bookingDate.year() + '-' + month + '-' + day;

ShadikhanaBookingController.BookingRecord created = ShadikhanaBookingController.createBooking(
    dateStr,
    dateStr,
    'Second SMS Test Booking',
    'Test Requester',
    '9849939703',
    null,
    'Repeat Twilio SMS test'
);
System.debug('Created booking: ' + created.bookingNumber + ' id=' + created.id + ' status=' + created.status);

ShadikhanaBookingController.BookingRecord confirmed =
    ShadikhanaBookingController.updateBookingStatus(created.id, 'Confirmed');
System.debug('Confirmed booking: ' + confirmed.bookingNumber + ' status=' + confirmed.status + ' phone=' + confirmed.contactPhone);
