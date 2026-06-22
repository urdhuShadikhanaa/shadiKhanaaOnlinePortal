public class ShadikhanaBookingSmsService {

    private static final String NAMED_CREDENTIAL = 'Twilio_SMS';
    private static final String DEFAULT_ADMIN_MOBILE = '6364054881';
    private static final String DEFAULT_SECONDARY_ADMIN_MOBILE = '9652741400';
    private static final String DEFAULT_PORTAL_SITE_URL =
        'https://shabbirtech4-dev-ed.develop.my.site.com/urdushadikhana';
    private static final String DEFAULT_PORTAL_LOGIN_URL =
        'https://shabbirtech4-dev-ed.develop.my.site.com/urdushadikhana/login';

    public static void notifyAdminNewBooking(Id bookingId) {
        if (bookingId == null) {
            return;
        }

        Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
        if (!isSmsEnabled(settings)) {
            return;
        }

        List<String> adminNumbers = resolveAdminMobileNumbers(settings);
        if (adminNumbers.isEmpty()) {
            return;
        }

        System.enqueueJob(new AdminBookingSmsQueueable(bookingId, adminNumbers));
    }

    public static void notifyRequesterBookingSubmitted(Id bookingId) {
        if (bookingId == null) {
            return;
        }

        Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
        if (!isSmsEnabled(settings)) {
            return;
        }

        System.enqueueJob(new RequesterSubmittedSmsQueueable(bookingId));
    }

    public static void notifyRequesterBookingConfirmed(Id bookingId) {
        if (bookingId == null) {
            return;
        }
        System.enqueueJob(new RequesterConfirmationSmsQueueable(bookingId));
    }

    public static void notifyRequesterBookingCancelled(Id bookingId) {
        if (bookingId == null) {
            return;
        }
        System.enqueueJob(new RequesterCancellationSmsQueueable(bookingId));
    }

    public class AdminBookingSmsQueueable implements Queueable, Database.AllowsCallouts {
        private Id bookingId;
        private List<String> adminNumbers;

        public AdminBookingSmsQueueable(Id bookingId, List<String> adminNumbers) {
            this.bookingId = bookingId;
            this.adminNumbers = adminNumbers == null ? new List<String>() : adminNumbers;
        }

        public void execute(QueueableContext context) {
            Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
            if (!isSmsEnabled(settings) || adminNumbers.isEmpty()) {
                return;
            }

            Shadikhana_Booking__c booking = queryBooking(bookingId);
            String messageBody = buildAdminNewBookingMessage(booking, settings);

            for (String adminMobile : adminNumbers) {
                sendSmsMessage(adminMobile, messageBody, settings, bookingId);
            }
        }
    }

    public class RequesterSubmittedSmsQueueable implements Queueable, Database.AllowsCallouts {
        private Id bookingId;

        public RequesterSubmittedSmsQueueable(Id bookingId) {
            this.bookingId = bookingId;
        }

        public void execute(QueueableContext context) {
            Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
            if (!isSmsEnabled(settings)) {
                return;
            }

            Shadikhana_Booking__c booking = queryBooking(bookingId);
            if (String.isBlank(booking.Contact_Phone__c)) {
                return;
            }

            sendSmsMessage(
                booking.Contact_Phone__c,
                'Dear ' + booking.Contact_Name__c +
                    ', your Urdu Shadikhana booking ' + booking.Name +
                    ' for ' + buildDateLabel(booking) +
                    ' (' + booking.Event_Name__c + ') at ' + buildTimingLabel(booking) +
                    ' was received and is pending approval. We will notify you once reviewed.',
                settings,
                bookingId
            );
        }
    }

    public class RequesterConfirmationSmsQueueable implements Queueable, Database.AllowsCallouts {
        private Id bookingId;

        public RequesterConfirmationSmsQueueable(Id bookingId) {
            this.bookingId = bookingId;
        }

        public void execute(QueueableContext context) {
            Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
            if (!isSmsEnabled(settings)) {
                return;
            }

            Shadikhana_Booking__c booking = queryBooking(bookingId);
            if (String.isBlank(booking.Contact_Phone__c)) {
                return;
            }

            sendSmsMessage(
                booking.Contact_Phone__c,
                'Dear ' + booking.Contact_Name__c +
                    ', your Urdu Shadikhana booking ' + booking.Name +
                    ' for ' + buildDateLabel(booking) +
                    ' (' + booking.Event_Name__c + ') at ' + buildTimingLabel(booking) +
                    ' has been confirmed. Thank you.',
                settings,
                bookingId
            );
        }
    }

    public class RequesterCancellationSmsQueueable implements Queueable, Database.AllowsCallouts {
        private Id bookingId;

        public RequesterCancellationSmsQueueable(Id bookingId) {
            this.bookingId = bookingId;
        }

        public void execute(QueueableContext context) {
            Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
            if (!isSmsEnabled(settings)) {
                return;
            }

            Shadikhana_Booking__c booking = queryBooking(bookingId);
            if (String.isBlank(booking.Contact_Phone__c)) {
                return;
            }

            sendSmsMessage(
                booking.Contact_Phone__c,
                'Dear ' + booking.Contact_Name__c +
                    ', your Urdu Shadikhana booking ' + booking.Name +
                    ' for ' + buildDateLabel(booking) +
                    ' (' + booking.Event_Name__c + ') has been cancelled. Contact the venue for details.',
                settings,
                bookingId
            );
        }
    }

    private static Shadikhana_Booking__c queryBooking(Id bookingId) {
        return [
            SELECT Id, Name, Booking_Date__c, End_Date__c, Event_Name__c, Contact_Name__c, Contact_Phone__c,
                   Start_Time__c, End_Time__c
            FROM Shadikhana_Booking__c
            WHERE Id = :bookingId
            LIMIT 1
        ];
    }

    private static String buildDateLabel(Shadikhana_Booking__c booking) {
        if (booking.End_Date__c == null || booking.End_Date__c == booking.Booking_Date__c) {
            return String.valueOf(booking.Booking_Date__c);
        }
        return booking.Booking_Date__c + ' to ' + booking.End_Date__c;
    }

    @TestVisible
    private static String buildTimingLabel(Shadikhana_Booking__c booking) {
        String startLabel = formatTimeAmPm(booking.Start_Time__c);
        String endLabel = formatTimeAmPm(booking.End_Time__c);

        if (String.isBlank(startLabel) && String.isBlank(endLabel)) {
            return 'Not specified';
        }
        if (String.isBlank(endLabel)) {
            return 'Start ' + startLabel;
        }
        if (String.isBlank(startLabel)) {
            return 'End ' + endLabel;
        }
        return startLabel + ' to ' + endLabel;
    }

    @TestVisible
    private static String formatTimeAmPm(String timeValue) {
        if (String.isBlank(timeValue)) {
            return null;
        }

        Matcher match = Pattern.compile('^(\\d{1,2}):(\\d{2})').matcher(timeValue.trim());
        if (!match.find()) {
            return timeValue;
        }

        Integer hour24 = Integer.valueOf(match.group(1));
        Integer minute = Integer.valueOf(match.group(2));
        if (hour24 < 0 || hour24 > 23 || minute < 0 || minute > 59) {
            return timeValue;
        }

        String period = hour24 >= 12 ? 'PM' : 'AM';
        Integer hour12 = Math.mod(hour24, 12);
        if (hour12 == 0) {
            hour12 = 12;
        }

        return hour12 + ':' + String.valueOf(minute).leftPad(2, '0') + ' ' + period;
    }

    @TestVisible
    private static String formatPhoneForDisplay(String phoneNumber) {
        String normalized = normalizePhoneNumber(phoneNumber);
        return String.isBlank(normalized) ? String.valueOf(phoneNumber) : normalized;
    }

    private static Boolean isSmsEnabled(Shadikhana_Settings__c settings) {
        return settings != null &&
            (settings.SMS_Enabled__c == true || settings.Notifications_Enabled__c == true);
    }

    private static String buildAdminNewBookingMessage(
        Shadikhana_Booking__c booking,
        Shadikhana_Settings__c settings
    ) {
        return 'New Urdu Shadikhana booking request ' + booking.Name +
            ' | Event: ' + booking.Event_Name__c +
            ' | Dates: ' + buildDateLabel(booking) +
            ' | Timing: ' + buildTimingLabel(booking) +
            ' | Contact: ' + booking.Contact_Name__c +
            ' | Phone: ' + formatPhoneForDisplay(booking.Contact_Phone__c) +
            ' | Status: Pending approval' +
            buildAdminBookingActionLink(booking, settings);
    }

    @TestVisible
    private static String buildAdminBookingActionLink(
        Shadikhana_Booking__c booking,
        Shadikhana_Settings__c settings
    ) {
        return ' | Review: ' + ShadikhanaBookingEmailService.buildAdminBookingActionLink(booking.Id, settings);
    }

    @TestVisible
    private static List<String> resolveAdminMobileNumbers(Shadikhana_Settings__c settings) {
        Set<String> uniqueNumbers = new Set<String>();
        List<String> numbers = new List<String>();

        addAdminMobileNumbersFromField(uniqueNumbers, numbers, resolvePrimaryAdminMobile(settings));
        addAdminMobileNumber(uniqueNumbers, numbers, resolveSecondaryAdminMobile(settings));
        return numbers;
    }

    // Supports comma- or semicolon-separated values in Admin_Mobile_Number__c.
    private static void addAdminMobileNumbersFromField(
        Set<String> uniqueNumbers,
        List<String> numbers,
        String rawFieldValue
    ) {
        if (String.isBlank(rawFieldValue)) {
            return;
        }

        for (String part : rawFieldValue.split('[;,]')) {
            addAdminMobileNumber(uniqueNumbers, numbers, part.trim());
        }
    }

    private static void addAdminMobileNumber(
        Set<String> uniqueNumbers,
        List<String> numbers,
        String phoneNumber
    ) {
        String normalized = normalizePhoneNumber(phoneNumber);
        if (String.isBlank(normalized) || uniqueNumbers.contains(normalized)) {
            return;
        }
        uniqueNumbers.add(normalized);
        numbers.add(normalized);
    }

    private static String resolvePrimaryAdminMobile(Shadikhana_Settings__c settings) {
        if (settings != null && String.isNotBlank(settings.Admin_Mobile_Number__c)) {
            return settings.Admin_Mobile_Number__c;
        }
        return DEFAULT_ADMIN_MOBILE;
    }

    private static String resolveSecondaryAdminMobile(Shadikhana_Settings__c settings) {
        if (settings != null && String.isNotBlank(settings.Footer_Additional_Phone__c)) {
            return settings.Footer_Additional_Phone__c;
        }
        return DEFAULT_SECONDARY_ADMIN_MOBILE;
    }

    @TestVisible
    private static void sendSmsMessage(
        String toNumber,
        String messageBody,
        Shadikhana_Settings__c settings
    ) {
        sendSmsMessage(toNumber, messageBody, settings, null);
    }

    @TestVisible
    private static void sendSmsMessage(
        String toNumber,
        String messageBody,
        Shadikhana_Settings__c settings,
        Id bookingId
    ) {
        if (settings == null || String.isBlank(messageBody) || !isSmsEnabled(settings)) {
            return;
        }

        String normalizedTo = normalizePhoneNumber(toNumber);
        if (String.isBlank(normalizedTo)) {
            System.debug(LoggingLevel.WARN, 'SMS skipped: missing recipient.');
            return;
        }

        if (ShadikhanaSmsGatewayService.usesAndroidGateway(settings)) {
            ShadikhanaSmsGatewayService.enqueueMessage(normalizedTo, messageBody, bookingId);
            return;
        }

        String fromNumber = settings.Twilio_From_Number__c;
        String accountSid = settings.Twilio_Account_SID__c;

        if (String.isBlank(fromNumber) || String.isBlank(accountSid)) {
            System.debug(LoggingLevel.WARN, 'SMS skipped: missing from number or Twilio Account SID.');
            return;
        }

        HttpRequest request = buildTwilioRequest(accountSid, fromNumber, normalizedTo, messageBody, settings);
        if (request == null) {
            return;
        }

        Http http = new Http();
        HttpResponse response = http.send(request);
        if (response.getStatusCode() < 200 || response.getStatusCode() >= 300) {
            System.debug(
                LoggingLevel.ERROR,
                'Twilio SMS failed: ' + response.getStatusCode() + ' ' + response.getBody()
            );
        }
    }

    @TestVisible
    private static HttpRequest buildTwilioRequest(
        String accountSid,
        String fromNumber,
        String toNumber,
        String messageBody,
        Shadikhana_Settings__c settings
    ) {
        HttpRequest request = new HttpRequest();
        request.setMethod('POST');
        request.setHeader('Content-Type', 'application/x-www-form-urlencoded');
        request.setBody(
            'To=' + EncodingUtil.urlEncode(toNumber, 'UTF-8') +
            '&From=' + EncodingUtil.urlEncode(fromNumber.trim(), 'UTF-8') +
            '&Body=' + EncodingUtil.urlEncode(messageBody, 'UTF-8')
        );

        String endpoint =
            'https://api.twilio.com/2010-04-01/Accounts/' + accountSid + '/Messages.json';

        if (Test.isRunningTest()) {
            request.setEndpoint(endpoint);
            return request;
        }

        if (String.isNotBlank(settings.Twilio_Auth_Token__c)) {
            request.setEndpoint(endpoint);
            Blob authBlob = Blob.valueOf(accountSid + ':' + settings.Twilio_Auth_Token__c.trim());
            request.setHeader('Authorization', 'Basic ' + EncodingUtil.base64Encode(authBlob));
            return request;
        }

        if (hasNamedCredential()) {
            request.setEndpoint('callout:' + NAMED_CREDENTIAL + '/2010-04-01/Accounts/' + accountSid + '/Messages.json');
            return request;
        }

        System.debug(
            LoggingLevel.WARN,
            'SMS skipped: add Twilio Auth Token in Admin Section or configure Twilio_SMS Named Credential.'
        );
        return null;
    }

    @TestVisible
    private static String normalizePhoneNumber(String phoneNumber) {
        if (String.isBlank(phoneNumber)) {
            return null;
        }

        String digits = phoneNumber.replaceAll('[^0-9+]', '');
        if (String.isBlank(digits)) {
            return null;
        }
        if (digits.startsWith('+')) {
            return digits;
        }
        if (digits.length() == 10) {
            return '+91' + digits;
        }
        if (digits.length() == 12 && digits.startsWith('91')) {
            return '+' + digits;
        }
        return '+' + digits;
    }

    private static Boolean hasNamedCredential() {
        return ![
            SELECT DeveloperName
            FROM NamedCredential
            WHERE DeveloperName = :NAMED_CREDENTIAL
            LIMIT 1
        ].isEmpty();
    }
}
