// End-to-end test: seed today's SMS records, run cleanup batch, verify deletion.
List<Sms_Outbound__c> seeds = new List<Sms_Outbound__c>{
    new Sms_Outbound__c(
        To_Number__c = '9876543210',
        Message_Body__c = 'Test SMS 1 - booking confirmation',
        Status__c = 'Sent',
        Sent_At__c = System.now()
    ),
    new Sms_Outbound__c(
        To_Number__c = '9876543211',
        Message_Body__c = 'Test SMS 2 - admin alert with "quotes"',
        Status__c = 'Failed',
        Error_Message__c = 'SIM timeout'
    ),
    new Sms_Outbound__c(
        To_Number__c = '9876543212',
        Message_Body__c = 'Test SMS 3 - pending queue',
        Status__c = 'Pending'
    )
};
insert seeds;

Integer beforeCount = [
    SELECT COUNT()
    FROM Sms_Outbound__c
    WHERE CreatedDate = TODAY
];
System.debug('TEST_SEED_COUNT=' + beforeCount);

Date today = Date.today();
Id batchJobId = Database.executeBatch(new ShadikhanaSmsOutboundCleanupBatch(today, today), 200);
System.debug('TEST_BATCH_JOB_ID=' + batchJobId);
