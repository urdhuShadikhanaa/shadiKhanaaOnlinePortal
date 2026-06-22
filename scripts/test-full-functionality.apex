Date bookingDate = Date.today().addDays(30);
String startStr = bookingDate.year() + '-' +
    String.valueOf(bookingDate.month()).leftPad(2, '0') + '-' +
    String.valueOf(bookingDate.day()).leftPad(2, '0');

Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
System.debug('EMAIL_ENABLED=' + settings.Email_Enabled__c);
System.debug('ADMIN_EMAIL=' + settings.Admin_Email__c);

ShadikhanaBookingController.BookingRecord created =
    ShadikhanaBookingController.createBooking(
        startStr,
        startStr,
        'Email Functionality Test',
        'Test User',
        '9876543210',
        'site.test@example.com',
        'Testing email after fix',
        '10:00',
        '21:00',
        'Hall booking test'
    );

System.debug('BOOKING_ID=' + created.id);
System.debug('BOOKING_STATUS=' + created.status);

// Wait for queueable to process (run synchronously via re-invoke after short delay not possible in anon apex)
// Queueable will run async - check job queued
System.debug('QUEUEABLE_JOBS=' + Limits.getQueueableJobs());

ShadikhanaBookingController.BookingRecord confirmed =
    ShadikhanaBookingController.updateBookingStatus(created.id, 'Confirmed');
System.debug('CONFIRM_STATUS=' + confirmed.status);

ShadikhanaBookingController.BookingRecord cancelled =
    ShadikhanaBookingController.updateBookingStatus(created.id, 'Cancelled');
System.debug('CANCEL_STATUS=' + cancelled.status);

List<AsyncApexJob> jobs = [
    SELECT Id, Status, JobType, ApexClass.Name, ExtendedStatus, NumberOfErrors
    FROM AsyncApexJob
    WHERE ApexClass.Name = 'ShadikhanaBookingEmailService'
    ORDER BY CreatedDate DESC
    LIMIT 5
];
for (AsyncApexJob job : jobs) {
    System.debug('EMAIL_JOB=' + job.Status + ' errors=' + job.NumberOfErrors + ' class=' + job.ApexClass.Name);
}
