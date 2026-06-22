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

System.debug('ASYNC_JOB_COUNT=' + jobs.size());
for (AsyncApexJob job : jobs) {
    System.debug(
        'ASYNC_JOB class=' + job.ApexClass.Name +
        ' status=' + job.Status +
        ' errors=' + job.NumberOfErrors +
        ' detail=' + job.ExtendedStatus
    );
}

Shadikhana_Booking__c booking = [
    SELECT Id, Name, Contact_Email__c, Status__c, Booking_Date__c, Estimated_Amount__c
    FROM Shadikhana_Booking__c
    WHERE Id = 'a01dM00003tAIMjQAO'
    LIMIT 1
];
System.debug('BOOKING_NUMBER=' + booking.Name);
System.debug('BOOKING_STATUS=' + booking.Status__c);
System.debug('BOOKING_DATE=' + booking.Booking_Date__c);
System.debug('BOOKING_EMAIL=' + booking.Contact_Email__c);
System.debug('BOOKING_ESTIMATE=' + booking.Estimated_Amount__c);
