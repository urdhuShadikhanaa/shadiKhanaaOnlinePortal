public class ShadikhanaSmsOutboundCleanupScheduler implements Schedulable {

    public static final String JOB_NAME = 'Shadikhana SMS Outbound Cleanup';
    private static final String CRON_EXPRESSION = '0 0 0 1 * ?';

    public void execute(SchedulableContext context) {
        Database.executeBatch(new ShadikhanaSmsOutboundCleanupBatch(), 200);
    }

    public static String scheduleMonthly() {
        abortExistingJobs();
        return System.schedule(JOB_NAME, CRON_EXPRESSION, new ShadikhanaSmsOutboundCleanupScheduler());
    }

    public static void abortExistingJobs() {
        for (CronTrigger scheduledJob : [
            SELECT Id
            FROM CronTrigger
            WHERE CronJobDetail.Name = :JOB_NAME
        ]) {
            System.abortJob(scheduledJob.Id);
        }
    }
}
