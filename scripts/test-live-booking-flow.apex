Date bookingDate = Date.today().addDays(25);
String startStr = bookingDate.year() + '-' +
    String.valueOf(bookingDate.month()).leftPad(2, '0') + '-' +
    String.valueOf(bookingDate.day()).leftPad(2, '0');

ShadikhanaBookingController.BookingRecord created =
    ShadikhanaBookingController.createBooking(
        startStr,
        startStr,
        'Live Site Functionality Test',
        'Automated Test User',
        '9876543210',
        'site.test@example.com',
        'Automated verification booking',
        '10:00',
        '21:00',
        'Hall test booking'
    );

System.debug('BOOKING_CREATED=' + created.id);
System.debug('BOOKING_NUMBER=' + created.bookingNumber);
System.debug('BOOKING_STATUS=' + created.status);

List<Shadikhana_Booking__c> pending = [
    SELECT Id, Name, Status__c, Event_Name__c, Contact_Email__c
    FROM Shadikhana_Booking__c
    WHERE Id = :created.id
    LIMIT 1
];
System.debug('DB_STATUS=' + pending[0].Status__c);

Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
System.debug('EMAIL_ENABLED=' + settings.Email_Enabled__c);
System.debug('ADMIN_EMAIL=' + settings.Admin_Email__c);
