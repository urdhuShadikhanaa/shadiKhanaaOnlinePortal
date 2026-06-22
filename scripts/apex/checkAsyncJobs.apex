List<AsyncApexJob> jobs = [
    SELECT Id, Status, JobType, ApexClass.Name, NumberOfErrors, ExtendedStatus, CreatedDate, CompletedDate
    FROM AsyncApexJob
    WHERE CreatedDate = TODAY
    AND ApexClass.Name IN (
        'ShadikhanaBookingSmsService',
        'ShadikhanaBookingEmailService'
    )
    ORDER BY CreatedDate DESC
    LIMIT 10
];
for (AsyncApexJob job : jobs) {
    System.debug('JOB: ' + job.ApexClass.Name + ' | ' + job.Status + ' | errors=' + job.NumberOfErrors + ' | ' + job.ExtendedStatus);
}
