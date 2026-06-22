// Step 2: Verify notifications for the most recent live test booking
Shadikhana_Booking__c booking = [
    SELECT Id, Name, Contact_Email__c, Contact_Name__c, Status__c, Event_Name__c
    FROM Shadikhana_Booking__c
    WHERE Id = 'a01dM00003tAIMjQAO'
    LIMIT 1
];

System.debug('VERIFY_BOOKING_ID=' + booking.Id);
System.debug('VERIFY_BOOKING_NUMBER=' + booking.Name);
System.debug('VERIFY_REQUESTER_EMAIL=' + booking.Contact_Email__c);

Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
System.debug('SETTINGS_ADMIN_EMAIL=' + (settings == null ? null : settings.Admin_Email__c));

// Execute email notification synchronously and log any send failures
new ShadikhanaBookingEmailService.BookingRequestEmailQueueable(booking.Id).execute(null);
System.debug('EMAIL_QUEUEABLE_EXECUTED=true');

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

new ShadikhanaBookingSmsService.AdminBookingSmsQueueable(booking.Id, adminNumbers).execute(null);
System.debug('SMS_QUEUEABLE_EXECUTED=true adminNumbers=' + adminNumbers);

List<AsyncApexJob> jobs = [
    SELECT Id, Status, JobType, ApexClass.Name, ExtendedStatus, NumberOfErrors, CreatedDate
    FROM AsyncApexJob
    WHERE CreatedDate = TODAY
      AND (
          ApexClass.Name LIKE 'ShadikhanaBookingEmail%'
          OR ApexClass.Name LIKE 'ShadikhanaBookingSms%'
      )
    ORDER BY CreatedDate DESC
    LIMIT 15
];
for (AsyncApexJob job : jobs) {
    System.debug(
        'ASYNC_JOB class=' + job.ApexClass.Name +
        ' status=' + job.Status +
        ' errors=' + job.NumberOfErrors +
        ' detail=' + job.ExtendedStatus
    );
}

System.debug('VERIFICATION_COMPLETE booking=' + booking.Name);
