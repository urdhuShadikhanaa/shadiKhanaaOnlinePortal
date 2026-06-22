@IsTest
private class ShadikhanaSmsGatewayRestTest {

    @IsTest
    static void getPendingReturnsQueuedMessages() {
        Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
        if (settings == null) {
            settings = new Shadikhana_Settings__c();
        }
        settings.SMS_Gateway_Api_Key__c = 'rest-test-key';
        upsert settings;

        ShadikhanaSmsGatewayService.enqueueMessage('+919777777777', 'REST pending test', null);

        RestRequest request = new RestRequest();
        request.requestUri = '/services/apexrest/shadikhana/sms/v1/pending';
        request.httpMethod = 'GET';
        request.addHeader('X-Api-Key', 'rest-test-key');
        RestContext.request = request;
        RestContext.response = new RestResponse();

        Test.startTest();
        ShadikhanaSmsGatewayRest.getPending();
        Test.stopTest();

        System.assertEquals(200, RestContext.response.statusCode);
        String body = RestContext.response.responseBody.toString();
        System.assert(body.contains('messages'), 'Expected messages array in response');
    }

    @IsTest
    static void acknowledgeUpdatesQueuedMessage() {
        Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
        if (settings == null) {
            settings = new Shadikhana_Settings__c();
        }
        settings.SMS_Gateway_Api_Key__c = 'rest-test-key';
        upsert settings;

        Sms_Outbound__c row = new Sms_Outbound__c(
            To_Number__c = '+919666666666',
            Message_Body__c = 'REST ack test',
            Status__c = ShadikhanaSmsGatewayService.STATUS_PENDING
        );
        insert row;

        RestRequest request = new RestRequest();
        request.requestUri = '/services/apexrest/shadikhana/sms/v1/ack';
        request.httpMethod = 'POST';
        request.addHeader('X-Api-Key', 'rest-test-key');
        request.requestBody = Blob.valueOf(
            '{"id":"' + row.Id + '","status":"Sent"}'
        );
        RestContext.request = request;
        RestContext.response = new RestResponse();

        Test.startTest();
        ShadikhanaSmsGatewayRest.acknowledge();
        Test.stopTest();

        System.assertEquals(200, RestContext.response.statusCode);
        row = [SELECT Status__c, Sent_At__c FROM Sms_Outbound__c WHERE Id = :row.Id];
        System.assertEquals(ShadikhanaSmsGatewayService.STATUS_SENT, row.Status__c);
        System.assertNotEquals(null, row.Sent_At__c);
    }

    @IsTest
    static void invalidApiKeyReturnsError() {
        Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
        if (settings == null) {
            settings = new Shadikhana_Settings__c();
        }
        settings.SMS_Gateway_Api_Key__c = 'rest-test-key';
        upsert settings;

        RestRequest request = new RestRequest();
        request.requestUri = '/services/apexrest/shadikhana/sms/v1/pending';
        request.httpMethod = 'GET';
        request.addHeader('X-Api-Key', 'wrong-key');
        RestContext.request = request;
        RestContext.response = new RestResponse();

        Test.startTest();
        ShadikhanaSmsGatewayRest.getPending();
        Test.stopTest();

        System.assertEquals(401, RestContext.response.statusCode);
    }
}
