public without sharing class ShadikhanaSmsGatewayService {

    public static final String PROVIDER_TWILIO = 'Twilio';
    public static final String PROVIDER_ANDROID = 'Android Gateway';
    public static final String STATUS_PENDING = 'Pending';
    public static final String STATUS_SENT = 'Sent';
    public static final String STATUS_FAILED = 'Failed';
    private static final Integer PENDING_LIMIT = 20;

    public static Boolean usesAndroidGateway(Shadikhana_Settings__c settings) {
        if (settings == null || String.isBlank(settings.SMS_Provider__c)) {
            return false;
        }
        return PROVIDER_ANDROID.equalsIgnoreCase(settings.SMS_Provider__c.trim());
    }

    public static void enqueueMessage(String toNumber, String messageBody, Id bookingId) {
        if (String.isBlank(toNumber) || String.isBlank(messageBody)) {
            return;
        }

        insert new Sms_Outbound__c(
            To_Number__c = toNumber.trim(),
            Message_Body__c = messageBody,
            Status__c = STATUS_PENDING,
            Booking__c = bookingId
        );
    }

    public static List<SmsOutboundMessage> getPendingMessages() {
        List<SmsOutboundMessage> messages = new List<SmsOutboundMessage>();
        for (Sms_Outbound__c row : [
            SELECT Id, To_Number__c, Message_Body__c
            FROM Sms_Outbound__c
            WHERE Status__c = :STATUS_PENDING
            ORDER BY CreatedDate ASC
            LIMIT :PENDING_LIMIT
        ]) {
            messages.add(new SmsOutboundMessage(row.Id, row.To_Number__c, row.Message_Body__c));
        }
        return messages;
    }

    public static void acknowledgeMessage(Id messageId, String status, String errorMessage) {
        if (messageId == null || String.isBlank(status)) {
            throw new ShadikhanaSmsGatewayException('Message id and status are required.');
        }

        String normalizedStatus = status.trim();
        if (normalizedStatus != STATUS_SENT && normalizedStatus != STATUS_FAILED) {
            throw new ShadikhanaSmsGatewayException('Status must be Sent or Failed.');
        }

        Sms_Outbound__c updateRow = new Sms_Outbound__c(
            Id = messageId,
            Status__c = normalizedStatus,
            Error_Message__c = String.isBlank(errorMessage) ? null : errorMessage.left(255)
        );
        if (normalizedStatus == STATUS_SENT) {
            updateRow.Sent_At__c = System.now();
        }
        update updateRow;
    }

    public static void assertApiKey(String providedApiKey) {
        Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
        String expected = settings == null ? null : settings.SMS_Gateway_Api_Key__c;
        if (String.isBlank(expected)) {
            throw new ShadikhanaSmsGatewayException(
                'SMS Gateway API key is not configured in Shadikhana Settings.'
            );
        }
        if (String.isBlank(providedApiKey) || providedApiKey.trim() != expected.trim()) {
            throw new ShadikhanaSmsGatewayException('Invalid SMS Gateway API key.');
        }
    }

    public class SmsOutboundMessage {
        public String id;
        public String toNumber;
        public String body;

        public SmsOutboundMessage(Id recordId, String toNumber, String body) {
            this.id = String.valueOf(recordId);
            this.toNumber = toNumber;
            this.body = body;
        }
    }

    public class PendingResponse {
        public List<SmsOutboundMessage> messages;

        public PendingResponse(List<SmsOutboundMessage> messages) {
            this.messages = messages == null ? new List<SmsOutboundMessage>() : messages;
        }
    }

    public class AckRequest {
        public String id;
        public String status;
        public String errorMessage;
    }
}
