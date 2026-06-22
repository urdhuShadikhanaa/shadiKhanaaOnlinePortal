Date startDate = Date.today().addDays(20);
Date endDate = startDate.addDays(1);
String startStr = startDate.year() + '-' +
    String.valueOf(startDate.month()).leftPad(2, '0') + '-' +
    String.valueOf(startDate.day()).leftPad(2, '0');
String endStr = endDate.year() + '-' +
    String.valueOf(endDate.month()).leftPad(2, '0') + '-' +
    String.valueOf(endDate.day()).leftPad(2, '0');

ShadikhanaBookingController.BookingRecord created = ShadikhanaBookingController.createBooking(
    startStr,
    endStr,
    'Test Wedding Reception',
    'Test User',
    '9876543210',
    'test.booking@example.com',
    'Sample test booking created from script.',
    '10:00',
    '21:00',
    'Approx 150 guests. Main hall and dining setup for demo purposes.'
);

System.debug('TEST_BOOKING_NUMBER=' + created.bookingNumber);
System.debug('TEST_BOOKING_ID=' + created.id);
System.debug('TEST_BOOKING_STATUS=' + created.status);
System.debug('TEST_BOOKING_DATES=' + created.dateRangeLabel);
