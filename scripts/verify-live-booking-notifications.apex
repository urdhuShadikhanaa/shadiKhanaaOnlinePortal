// Live booking + notification verification for shabbirali.sfdc@gmail.com
String requesterEmail = 'shabbirali.sfdc@gmail.com';

Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
System.debug('SETTINGS_EMAIL_ENABLED=' + (settings == null ? null : settings.Email_Enabled__c));
System.debug('SETTINGS_ADMIN_EMAIL=' + (settings == null ? null : settings.Admin_Email__c));
System.debug('SETTINGS_SMS_ENABLED=' + (settings == null ? null : settings.SMS_Enabled__c));
System.debug('SETTINGS_NOTIFICATIONS_ENABLED=' + (settings == null ? null : settings.Notifications_Enabled__c));
System.debug('SETTINGS_ADMIN_MOBILE=' + (settings == null ? null : settings.Admin_Mobile_Number__c));
System.debug('SETTINGS_TWILIO_FROM=' + (settings == null ? null : settings.Twilio_From_Number__c));
System.debug('SETTINGS_TWILIO_SID_SET=' + (settings != null && String.isNotBlank(settings.Twilio_Account_SID__c)));
System.debug('SETTINGS_TWILIO_TOKEN_SET=' + (settings != null && String.isNotBlank(settings.Twilio_Auth_Token__c)));

List<OrgWideEmailAddress> owea = [
    SELECT Id, Address, IsVerified, DisplayName
    FROM OrgWideEmailAddress
    WHERE IsVerified = true
    LIMIT 5
];
System.debug('ORG_WIDE_EMAIL_COUNT=' + owea.size());
for (OrgWideEmailAddress a : owea) {
    System.debug('ORG_WIDE_EMAIL=' + a.Address + ' verified=' + a.IsVerified);
}

// Pick first available date in the next 90 days
Date bookingDate = null;
for (Integer offset = 14; offset <= 90; offset++) {
    Date candidate = Date.today().addDays(offset);
    String iso = candidate.year() + '-' +
        String.valueOf(candidate.month()).leftPad(2, '0') + '-' +
        String.valueOf(candidate.day()).leftPad(2, '0');
    if (ShadikhanaBookingController.isDateRangeAvailable(iso, iso)) {
        bookingDate = candidate;
        break;
    }
}

if (bookingDate == null) {
    throw new AuraHandledException('No available date found in the next 90 days.');
}

String dateStr = bookingDate.year() + '-' +
    String.valueOf(bookingDate.month()).leftPad(2, '0') + '-' +
    String.valueOf(bookingDate.day()).leftPad(2, '0');

System.debug('BOOKING_DATE=' + dateStr);

ShadikhanaBookingController.BookingRecord created = ShadikhanaBookingController.createBooking(
    dateStr,
    dateStr,
    null,
    'Shabbir Ali',
    '9849939703',
    requesterEmail,
    'Live notification verification booking created from Apex script.',
    '10:00',
    '21:00',
    'Automated end-to-end notification test.',
    'Wedding',
    150,
    'Self',
    'Self'
);

System.debug('BOOKING_ID=' + created.id);
System.debug('BOOKING_NUMBER=' + created.bookingNumber);
System.debug('BOOKING_STATUS=' + created.status);
System.debug('BOOKING_REQUESTER_EMAIL=' + requesterEmail);

// Run email queueable synchronously to capture send results in this log
new ShadikhanaBookingEmailService.BookingRequestEmailQueueable(created.id).execute(null);
System.debug('EMAIL_QUEUEABLE_EXECUTED=true');

// Run SMS queueable synchronously
List<String> adminNumbers = new List<String>();
if (settings != null && String.isNotBlank(settings.Admin_Mobile_Number__c)) {
    for (String part : settings.Admin_Mobile_Number__c.split('[;,]')) {
        if (String.isNotBlank(part)) {
            adminNumbers.add(part.trim());
        }
    }
}
if (adminNumbers.isEmpty()) {
    adminNumbers.add('6364054881');
}
new ShadikhanaBookingSmsService.AdminBookingSmsQueueable(created.id, adminNumbers).execute(null);
System.debug('SMS_QUEUEABLE_EXECUTED=true');

List<AsyncApexJob> jobs = [
    SELECT Id, Status, JobType, ApexClass.Name, ExtendedStatus, NumberOfErrors, CreatedDate
    FROM AsyncApexJob
    WHERE CreatedDate = TODAY
      AND ApexClass.Name IN (
          'ShadikhanaBookingEmailService',
          'ShadikhanaBookingSmsService',
          'ShadikhanaBookingNotificationService'
      )
    ORDER BY CreatedDate DESC
    LIMIT 10
];
for (AsyncApexJob job : jobs) {
    System.debug(
        'ASYNC_JOB class=' + job.ApexClass.Name +
        ' status=' + job.Status +
        ' errors=' + job.NumberOfErrors +
        ' detail=' + job.ExtendedStatus
    );
}

System.debug('VERIFICATION_COMPLETE booking=' + created.bookingNumber + ' requester=' + requesterEmail);
