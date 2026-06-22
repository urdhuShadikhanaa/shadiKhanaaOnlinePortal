@IsTest
private class ShadikhanaCancelledBookingCleanupTest {

    @IsTest
    static void testBatchDeletesPreviousMonthCancelledOnly() {
        Date previousMonthStart = Date.today().toStartOfMonth().addMonths(-1);
        Date previousMonthEnd = Date.today().toStartOfMonth().addDays(-1);

        Shadikhana_Booking__c previousMonthCancelled = new Shadikhana_Booking__c(
            Booking_Date__c = previousMonthStart.addDays(2),
            Event_Name__c = 'Old Cancelled Event',
            Contact_Name__c = 'Old User',
            Contact_Phone__c = '9876543210',
            Status__c = 'Cancelled'
        );
        Shadikhana_Booking__c currentMonthCancelled = new Shadikhana_Booking__c(
            Booking_Date__c = Date.today(),
            Event_Name__c = 'Current Cancelled Event',
            Contact_Name__c = 'Current User',
            Contact_Phone__c = '9876543211',
            Status__c = 'Cancelled'
        );
        Shadikhana_Booking__c previousMonthConfirmed = new Shadikhana_Booking__c(
            Booking_Date__c = previousMonthStart.addDays(4),
            Event_Name__c = 'Old Confirmed Event',
            Contact_Name__c = 'Confirmed User',
            Contact_Phone__c = '9876543212',
            Status__c = 'Confirmed'
        );
        insert new List<Shadikhana_Booking__c>{
            previousMonthCancelled,
            currentMonthCancelled,
            previousMonthConfirmed
        };

        Test.startTest();
        Database.executeBatch(
            new ShadikhanaCancelledBookingCleanupBatch(previousMonthStart, previousMonthEnd),
            200
        );
        Test.stopTest();

        System.assertEquals(
            0,
            [SELECT COUNT() FROM Shadikhana_Booking__c WHERE Id = :previousMonthCancelled.Id],
            'Previous month cancelled booking should be deleted.'
        );
        System.assertEquals(
            1,
            [SELECT COUNT() FROM Shadikhana_Booking__c WHERE Id = :currentMonthCancelled.Id],
            'Current month cancelled booking should remain.'
        );
        System.assertEquals(
            1,
            [SELECT COUNT() FROM Shadikhana_Booking__c WHERE Id = :previousMonthConfirmed.Id],
            'Previous month confirmed booking should remain.'
        );
    }

    @IsTest
    static void testSchedulerCreatesMonthlyJob() {
        Test.startTest();
        String jobId = ShadikhanaCancelledCleanupScheduler.scheduleMonthly();
        Test.stopTest();

        System.assertNotEquals(null, jobId);
        System.assertEquals(
            1,
            [
                SELECT COUNT()
                FROM CronTrigger
                WHERE CronJobDetail.Name = :ShadikhanaCancelledCleanupScheduler.JOB_NAME
            ]
        );
    }

    @IsTest
    static void testSchedulerExecutesBatch() {
        Test.startTest();
        new ShadikhanaCancelledCleanupScheduler().execute(null);
        Test.stopTest();

        System.assertEquals(
            1,
            [SELECT COUNT() FROM AsyncApexJob WHERE JobType = 'BatchApex' AND Status IN ('Queued', 'Processing', 'Completed')]
        );
    }
}
