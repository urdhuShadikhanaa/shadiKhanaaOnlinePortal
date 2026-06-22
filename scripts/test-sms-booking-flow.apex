Date bookingDate = Date.today().addDays(35);
String month = String.valueOf(bookingDate.month()).leftPad(2, '0');
String day = String.valueOf(bookingDate.day()).leftPad(2, '0');
String dateStr = bookingDate.year() + '-' + month + '-' + day;

Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
if (settings == null || settings.Id == null) {
    settings = new Shadikhana_Settings__c();
    settings.SetupOwnerId = UserInfo.getOrganizationId();
}
settings.Admin_Mobile_Number__c = '6364054881';
settings.SMS_Enabled__c = true;
settings.Notifications_Enabled__c = true;
upsert settings;

ShadikhanaBookingController.BookingRecord created = ShadikhanaBookingController.createBooking(
    dateStr,
    dateStr,
    'SMS Integration Test Event',
    'Test Requester',
    '9849939703',
    'test.requester@example.com',
    'Automated SMS flow test'
);
System.debug('Created booking: ' + created.id + ' ' + created.bookingNumber + ' status=' + created.status);

ShadikhanaBookingController.BookingRecord confirmed =
    ShadikhanaBookingController.updateBookingStatus(created.id, 'Confirmed');
System.debug('Confirmed booking: ' + confirmed.id + ' status=' + confirmed.status + ' phone=' + confirmed.contactPhone);

List<Shadikhana_Booking__c> verify = [
    SELECT Id, Name, Contact_Phone__c, Status__c, Event_Name__c
    FROM Shadikhana_Booking__c
    WHERE Id = :created.id
    LIMIT 1
];
System.debug('Verified record phone=' + verify[0].Contact_Phone__c + ' status=' + verify[0].Status__c);
