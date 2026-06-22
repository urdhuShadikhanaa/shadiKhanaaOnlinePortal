@IsTest
private class ShadikhanaSmsGatewayServiceTest {

    @IsTest
    static void enqueueAndFetchPendingMessages() {
        Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
        if (settings == null) {
            settings = new Shadikhana_Settings__c();
        }
        settings.SMS_Gateway_Api_Key__c = 'unit-test-api-key';
        settings.SMS_Provider__c = ShadikhanaSmsGatewayService.PROVIDER_ANDROID;
        upsert settings;

        Test.startTest();
        ShadikhanaSmsGatewayService.enqueueMessage('+919999999999', 'Test booking SMS', null);
        Test.stopTest();

        List<ShadikhanaSmsGatewayService.SmsOutboundMessage> pending =
            ShadikhanaSmsGatewayService.getPendingMessages();
        System.assertEquals(1, pending.size(), 'Expected one pending SMS');
        System.assertEquals('+919999999999', pending[0].toNumber);
    }

    @IsTest
    static void acknowledgeMessageUpdatesStatus() {
        Sms_Outbound__c row = new Sms_Outbound__c(
            To_Number__c = '+919888888888',
            Message_Body__c = 'Ack test',
            Status__c = ShadikhanaSmsGatewayService.STATUS_PENDING
        );
        insert row;

        Test.startTest();
        ShadikhanaSmsGatewayService.acknowledgeMessage(
            row.Id,
            ShadikhanaSmsGatewayService.STATUS_SENT,
            null
        );
        Test.stopTest();

        row = [
            SELECT Status__c, Sent_At__c, Error_Message__c
            FROM Sms_Outbound__c
            WHERE Id = :row.Id
        ];
        System.assertEquals(ShadikhanaSmsGatewayService.STATUS_SENT, row.Status__c);
        System.assertNotEquals(null, row.Sent_At__c);
    }

    @IsTest
    static void assertApiKeyRejectsInvalidValue() {
        Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
        if (settings == null) {
            settings = new Shadikhana_Settings__c();
        }
        settings.SMS_Gateway_Api_Key__c = 'expected-key';
        upsert settings;

        Boolean rejected = false;
        try {
            ShadikhanaSmsGatewayService.assertApiKey('wrong-key');
        } catch (Exception error) {
            rejected = true;
        }
        System.assertEquals(true, rejected, 'Invalid API key should be rejected');
    }
}
