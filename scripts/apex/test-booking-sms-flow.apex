// End-to-end booking SMS flow test (Android Gateway queue).
// Run: sf apex run --target-org urdhu --file scripts/apex/test-booking-sms-flow.apex
// Then wait ~15s and run query-recent-sms-outbound.apex (queueables run async).

Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
System.debug('SMS Provider: ' + settings.SMS_Provider__c);
System.debug('SMS Enabled: ' + settings.SMS_Enabled__c);
System.debug('Admin Mobile: ' + settings.Admin_Mobile_Number__c);

Integer baseline = [SELECT COUNT() FROM Sms_Outbound__c WHERE Status__c = 'Pending'];

Date bookingDate = Date.today().addDays(30);
String dateStr = bookingDate.year() + '-' +
    String.valueOf(bookingDate.month()).leftPad(2, '0') + '-' +
    String.valueOf(bookingDate.day()).leftPad(2, '0');

ShadikhanaBookingController.BookingRecord booking = ShadikhanaBookingController.createBooking(
    dateStr,
    dateStr,
    'SMS Flow Test Event',
    'SMS Flow Contact',
    '6364054881',
    null,
    null,
    null,
    null,
    null,
    'Wedding',
    50,
    'Self',
    'Self'
);
System.debug('Created booking: ' + booking.id + ' ' + booking.bookingNumber);

ShadikhanaBookingController.BookingRecord confirmed =
    ShadikhanaBookingController.updateBookingStatus(booking.id, 'Confirmed');
System.debug('Confirmed booking: ' + confirmed.status);

ShadikhanaBookingController.BookingRecord booking2 = ShadikhanaBookingController.createBooking(
    dateStr,
    dateStr,
    'SMS Cancel Test Event',
    'SMS Cancel Contact',
    '6364054881',
    null,
    null,
    null,
    null,
    null,
    'Wedding',
    50,
    'Self',
    'Self'
);

ShadikhanaBookingController.BookingRecord cancelled =
    ShadikhanaBookingController.updateBookingStatus(booking2.id, 'Cancelled');
System.debug('Cancelled booking: ' + cancelled.status);

Integer pendingNow = [SELECT COUNT() FROM Sms_Outbound__c WHERE Status__c = 'Pending'];
System.debug('Pending SMS count (baseline ' + baseline + ', now ' + pendingNow + ')');
System.debug('Queueables enqueued. Re-run query-recent-sms-outbound.apex after ~15 seconds.');
