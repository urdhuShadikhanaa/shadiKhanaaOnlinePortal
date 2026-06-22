public class ShadikhanaBookingNotificationService {

    private static final String DEFAULT_NTFY_SERVER = 'https://ntfy.sh';

    public static void notifyAdminNewBooking(Id bookingId) {
        if (bookingId == null) {
            return;
        }
        System.enqueueJob(new BookingNotificationQueueable(bookingId));
    }

    public class BookingNotificationQueueable implements Queueable, Database.AllowsCallouts {
        private Id bookingId;

        public BookingNotificationQueueable(Id bookingId) {
            this.bookingId = bookingId; 
        }

        public void execute(QueueableContext context) {
            Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
            if (settings == null) {
                return;
            }
            if (settings.Notifications_Enabled__c != true && settings.SMS_Enabled__c != true) {
                return;
            }
            if (String.isBlank(settings.Ntfy_Topic__c)) {
                return;
            }

            Shadikhana_Booking__c booking = [
                SELECT Id, Name, Booking_Date__c, End_Date__c, Event_Name__c, Contact_Name__c,
                       Contact_Phone__c, Status__c
                FROM Shadikhana_Booking__c
                WHERE Id = :bookingId
                LIMIT 1
            ];

            sendNtfyNotification(
                settings.Ntfy_Server_URL__c,
                settings.Ntfy_Topic__c,
                settings.Ntfy_Access_Token__c,
                'New Shadikhana Booking Request',
                buildMessage(booking)
            );
        }
    }

    private static String buildMessage(Shadikhana_Booking__c booking) {
        String endDateLabel = booking.End_Date__c == null ||
            booking.End_Date__c == booking.Booking_Date__c
            ? String.valueOf(booking.Booking_Date__c)
            : booking.Booking_Date__c + ' to ' + booking.End_Date__c;

        return 'Booking ' + booking.Name +
            ' | Event: ' + booking.Event_Name__c +
            ' | Dates: ' + endDateLabel +
            ' | Contact: ' + booking.Contact_Name__c +
            ' | Phone: ' + String.valueOf(booking.Contact_Phone__c) +
            ' | Status: Pending approval';
    }

    @TestVisible
    private static void sendNtfyNotification(
        String serverUrl,
        String topic,
        String accessToken,
        String title,
        String message
    ) {
        if (String.isBlank(topic) || String.isBlank(message)) {
            return;
        }

        String baseUrl = normalizeServerUrl(serverUrl);
        String endpoint =
            baseUrl +
            '/' +
            EncodingUtil.urlEncode(topic.trim(), 'UTF-8');

        HttpRequest request = new HttpRequest();
        request.setEndpoint(endpoint);
        request.setMethod('POST');
        request.setHeader('Content-Type', 'text/plain; charset=utf-8');
        request.setHeader('Title', truncateHeader(title));
        request.setHeader('Priority', 'high');
        request.setHeader('Tags', 'calendar,bell');
        if (String.isNotBlank(accessToken)) {
            request.setHeader('Authorization', 'Bearer ' + accessToken.trim());
        }
        request.setBody(message);

        Http http = new Http();
        HttpResponse response = http.send(request);
        if (response.getStatusCode() < 200 || response.getStatusCode() >= 300) {
            System.debug(
                LoggingLevel.ERROR,
                'ntfy notification failed: ' + response.getStatusCode() + ' ' + response.getBody()
            );
        }
    }

    private static String normalizeServerUrl(String serverUrl) {
        String value = String.isBlank(serverUrl) ? DEFAULT_NTFY_SERVER : serverUrl.trim();
        while (value.endsWith('/')) {
            value = value.substring(0, value.length() - 1);
        }
        return value;
    }

    private static String truncateHeader(String value) {
        if (String.isBlank(value)) {
            return 'Urdu Shadikhana Alert';
        }
        return value.length() > 250 ? value.substring(0, 250) : value;
    }
}
