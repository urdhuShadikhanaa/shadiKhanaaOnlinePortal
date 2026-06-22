// Schedule monthly SMS cleanup on the 1st of each month at midnight.
String jobId = ShadikhanaSmsOutboundCleanupScheduler.scheduleMonthly();
System.debug('Scheduled SMS cleanup job: ' + jobId);
