// Abort Shadikhana scheduled jobs so Apex classes can be redeployed.
List<CronTrigger> cronJobs = [
    SELECT Id, CronJobDetail.Name, State
    FROM CronTrigger
    WHERE CronJobDetail.Name LIKE '%Shadikhana%'
       OR CronJobDetail.Name LIKE '%Cancelled%'
];

Integer aborted = 0;
for (CronTrigger job : cronJobs) {
    try {
        System.abortJob(job.Id);
        aborted++;
        System.debug('ABORTED_CRON=' + job.CronJobDetail.Name);
    } catch (Exception ex) {
        System.debug('ABORT_FAILED=' + job.CronJobDetail.Name + ' ' + ex.getMessage());
    }
}

System.debug('ABORTED_CRON_COUNT=' + aborted);
