@IsTest
private class ShadikhanaSmsOutboundCleanupTest {

    @IsTest
    static void testBatchExportsAndDeletesPreviousMonthOnly() {
        Datetime previousMonth = Datetime.now().addMonths(-1);
        Datetime currentMonth = Datetime.now();

        insert new List<Sms_Outbound__c>{
            new Sms_Outbound__c(
                To_Number__c = '9876543210',
                Message_Body__c = 'Old SMS',
                Status__c = 'Sent',
                Sent_At__c = previousMonth
            ),
            new Sms_Outbound__c(
                To_Number__c = '9876543211',
                Message_Body__c = 'Current SMS',
                Status__c = 'Pending'
            )
        };

        List<Sms_Outbound__c> rows = [SELECT Id FROM Sms_Outbound__c ORDER BY CreatedDate];
        Test.setCreatedDate(rows[0].Id, previousMonth);
        Test.setCreatedDate(rows[1].Id, currentMonth);

        Date prevStart = Date.today().toStartOfMonth().addMonths(-1);
        Date prevEnd = Date.today().toStartOfMonth().addDays(-1);

        Test.startTest();
        Database.executeBatch(new ShadikhanaSmsOutboundCleanupBatch(prevStart, prevEnd), 200);
        Test.stopTest();

        System.assertEquals(
            0,
            [SELECT COUNT() FROM Sms_Outbound__c WHERE Id = :rows[0].Id],
            'Previous month SMS should be deleted.'
        );
        System.assertEquals(
            1,
            [SELECT COUNT() FROM Sms_Outbound__c WHERE Id = :rows[1].Id],
            'Current month SMS should remain.'
        );
    }

    @IsTest
    static void testBatchWithTodayRangeDeletesOnlyToday() {
        Datetime today = Datetime.now();
        Datetime yesterday = Datetime.now().addDays(-1);

        insert new List<Sms_Outbound__c>{
            new Sms_Outbound__c(
                To_Number__c = '9876543212',
                Message_Body__c = 'Today SMS',
                Status__c = 'Sent',
                Sent_At__c = today
            ),
            new Sms_Outbound__c(
                To_Number__c = '9876543213',
                Message_Body__c = 'Yesterday SMS',
                Status__c = 'Pending'
            )
        };

        List<Sms_Outbound__c> rows = [SELECT Id FROM Sms_Outbound__c ORDER BY CreatedDate];
        Test.setCreatedDate(rows[0].Id, today);
        Test.setCreatedDate(rows[1].Id, yesterday);

        Date todayDate = Date.today();

        Test.startTest();
        Database.executeBatch(new ShadikhanaSmsOutboundCleanupBatch(todayDate, todayDate), 200);
        Test.stopTest();

        System.assertEquals(
            0,
            [SELECT COUNT() FROM Sms_Outbound__c WHERE Id = :rows[0].Id],
            'Today SMS should be deleted after test run.'
        );
        System.assertEquals(
            1,
            [SELECT COUNT() FROM Sms_Outbound__c WHERE Id = :rows[1].Id],
            'Yesterday SMS should remain.'
        );
    }

    @IsTest
    static void testSchedulerCreatesMonthlyJob() {
        Test.startTest();
        String jobId = ShadikhanaSmsOutboundCleanupScheduler.scheduleMonthly();
        Test.stopTest();

        System.assertNotEquals(null, jobId);
        System.assertEquals(
            1,
            [
                SELECT COUNT()
                FROM CronTrigger
                WHERE CronJobDetail.Name = :ShadikhanaSmsOutboundCleanupScheduler.JOB_NAME
            ]
        );
    }

    @IsTest
    static void testSchedulerExecutesBatch() {
        Test.startTest();
        new ShadikhanaSmsOutboundCleanupScheduler().execute(null);
        Test.stopTest();

        System.assertEquals(
            1,
            [
                SELECT COUNT()
                FROM AsyncApexJob
                WHERE JobType = 'BatchApex' AND Status IN ('Queued', 'Processing', 'Completed')
            ]
        );
    }

    @IsTest
    static void testCsvHelpers() {
        Sms_Outbound__c row = new Sms_Outbound__c(
            To_Number__c = '9876543210',
            Message_Body__c = 'Hello, "world"',
            Status__c = 'Sent',
            Error_Message__c = 'None'
        );

        String header = ShadikhanaSmsOutboundCleanupBatch.buildCsvHeader();
        String csvRow = ShadikhanaSmsOutboundCleanupBatch.buildCsvRow(row);

        System.assert(header.contains('SMS Number'));
        System.assert(header.contains('Booking Date'));
        System.assert(!header.contains('Record Id'));
        System.assert(!header.contains('Created By'));
        System.assert(csvRow.contains('Hello, ""world""'));
        System.assertEquals('""', ShadikhanaSmsOutboundCleanupBatch.csvEscape(null));
    }

    @IsTest
    static void testEmailContentHelpers() {
        ShadikhanaSmsOutboundCleanupBatch batch =
            new ShadikhanaSmsOutboundCleanupBatch(Date.today(), Date.today());

        Test.startTest();
        batch.deletedCount = 3;
        batch.sentCount = 2;
        batch.pendingCount = 1;
        batch.failedCount = 0;

        String subject = batch.buildEmailSubject();
        String plainBody = batch.buildPlainTextBody();
        String htmlBody = batch.buildHtmlBody();
        String fileName = batch.buildAttachmentFileName();
        Test.stopTest();

        System.assert(subject.contains('Monthly SMS Report'));
        System.assert(subject.contains('3 messages'));
        System.assert(plainBody.contains('Sent: 2'));
        System.assert(plainBody.contains('Pending: 1'));
        System.assert(htmlBody.contains('Delivery summary'));
        System.assert(fileName.startsWith('urdu-shadikhana-sms-'));
        System.assert(
            fileName.endsWith(
                ShadikhanaSmsOutboundCleanupBatch.formatMonthYearSlug(Date.today()) + '.csv'
            )
        );
    }
}
