public class ShadikhanaCancelledCleanupScheduler implements Schedulable {

    public static final String JOB_NAME = 'Shadikhana Cancelled Booking Cleanup';
    private static final String CRON_EXPRESSION = '0 0 0 5 * ?';

    public void execute(SchedulableContext context) {
        Database.executeBatch(new ShadikhanaCancelledBookingCleanupBatch(), 200);
    }

    public static String scheduleMonthly() {
        abortExistingJobs();

        return System.schedule(JOB_NAME, CRON_EXPRESSION, new ShadikhanaCancelledCleanupScheduler());
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
