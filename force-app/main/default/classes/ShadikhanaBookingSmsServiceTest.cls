@IsTest
private class ShadikhanaBookingSmsServiceTest {

    private class TwilioMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest request) {
            HttpResponse response = new HttpResponse();
            response.setStatusCode(201);
            response.setBody('{"sid":"SM123"}');
            return response;
        }
    }

    private class TwilioFailureMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest request) {
            HttpResponse response = new HttpResponse();
            response.setStatusCode(400);
            response.setBody('{"message":"failed"}');
            return response;
        }
    }

    private class RecordingTwilioMock implements HttpCalloutMock {
        private List<HttpRequest> capturedRequests;

        public RecordingTwilioMock(List<HttpRequest> capturedRequests) {
            this.capturedRequests = capturedRequests;
        }

        public HTTPResponse respond(HTTPRequest request) {
            capturedRequests.add(request);
            HttpResponse response = new HttpResponse();
            response.setStatusCode(201);
            response.setBody('{"sid":"SM123"}');
            return response;
        }
    }

    private static String extractTwilioRecipient(String body) {
        for (String part : body.split('&')) {
            List<String> pair = part.split('=', 2);
            if (pair.size() == 2 && pair[0] == 'To') {
                return EncodingUtil.urlDecode(pair[1], 'UTF-8');
            }
        }
        return null;
    }

    @IsTest
    static void testNotifyAdminNewBookingSendsIndividualSmsToBothNumbers() {
        upsertSmsSettings(true, '6364054881', '9652741400');

        List<HttpRequest> capturedRequests = new List<HttpRequest>();
        Test.setMock(HttpCalloutMock.class, new RecordingTwilioMock(capturedRequests));

        Test.startTest();
        ShadikhanaBookingController.createBooking(
            formatDate(Date.today().addDays(14)),
            formatDate(Date.today().addDays(14)),
            'Dual SMS Event',
            'Dual SMS Contact',
            '9876543210',
            null,
            null,
            null,
            null,
            null,
            'Wedding',
            100,
            'Self',
            'Self'
        );
        Test.stopTest();

        System.assertEquals(3, capturedRequests.size(), 'Expected admin and requester SMS on booking create');
        Set<String> recipients = new Set<String>();
        for (HttpRequest request : capturedRequests) {
            recipients.add(extractTwilioRecipient(request.getBody()));
        }
        System.assert(recipients.contains('+916364054881'));
        System.assert(recipients.contains('+919652741400'));
        System.assert(recipients.contains('+919876543210'));
    }

    @IsTest
    static void testResolveAdminMobileNumbersIncludesBothDefaults() {
        List<String> numbers = ShadikhanaBookingSmsService.resolveAdminMobileNumbers(null);
        System.assertEquals(2, numbers.size());
    }

    @IsTest
    static void testResolveAdminMobileNumbersSplitsCommaSeparatedPrimaryField() {
        Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
        if (settings == null || settings.Id == null) {
            settings = new Shadikhana_Settings__c();
            settings.SetupOwnerId = UserInfo.getOrganizationId();
        }
        settings.Admin_Mobile_Number__c = '9876543210, 6364054881';
        settings.Footer_Additional_Phone__c = '6364054881';
        settings.SMS_Provider__c = ShadikhanaSmsGatewayService.PROVIDER_TWILIO;
        upsert settings;
        settings = Shadikhana_Settings__c.getOrgDefaults();

        List<String> numbers = ShadikhanaBookingSmsService.resolveAdminMobileNumbers(settings);
        System.assertEquals(2, numbers.size(), 'Expected two unique admin numbers from comma-separated field');
    }

    @IsTest
    static void testBuildAdminBookingActionLinkIncludesBookingId() {
        Shadikhana_Settings__c settings = new Shadikhana_Settings__c(
            SetupOwnerId = UserInfo.getOrganizationId(),
            Portal_Site_URL__c = 'https://example.com/portal'
        );
        upsert settings;

        String link = ShadikhanaBookingEmailService.buildAdminBookingActionLink(
            UserInfo.getUserId(),
            settings
        );
        System.assert(link.contains('bookingId='));
        System.assert(link.contains('tab=admin'));
        System.assert(link.startsWith('https://example.com/portal/s/?'));
    }

    @IsTest
    static void testNotifyAdminNewBookingWithoutSettings() {
        Date bookingDate = Date.today().addDays(12);
        ShadikhanaBookingController.BookingRecord booking =
            ShadikhanaBookingController.createBooking(
                formatDate(bookingDate),
                formatDate(bookingDate),
                'Admin SMS Event',
                'Admin SMS Contact',
                '9876543210',
                null,
                null,
                null,
                null,
                null,
                'Wedding',
                100,
                'Self',
                'Self'
            );

        Test.startTest();
        ShadikhanaBookingSmsService.notifyAdminNewBooking(booking.id);
        Test.stopTest();

        System.assertNotEquals(null, booking.id);
    }

    @IsTest
    static void testNotifyRequesterBookingConfirmedWithMock() {
        upsertSmsSettings(true);

        Date bookingDate = Date.today().addDays(18);
        ShadikhanaBookingController.BookingRecord booking =
            ShadikhanaBookingController.createBooking(
                formatDate(bookingDate),
                formatDate(bookingDate),
                'Confirmed Event',
                'Requester Name',
                '6364054881',
                null,
                null,
                null,
                null,
                null,
                'Wedding',
                100,
                'Self',
                'Self'
            );

        Test.setMock(HttpCalloutMock.class, new TwilioMock());

        Test.startTest();
        ShadikhanaBookingController.BookingRecord confirmed =
            ShadikhanaBookingController.updateBookingStatus(booking.id, 'Confirmed');
        Test.stopTest();

        System.assertEquals('Confirmed', confirmed.status);
    }

    @IsTest
    static void testSendSmsMessageWithMock() {
        upsertSmsSettings(true);
        Test.setMock(HttpCalloutMock.class, new TwilioMock());

        Test.startTest();
        ShadikhanaBookingSmsService.sendSmsMessage(
            '6364054881',
            'Test SMS body',
            Shadikhana_Settings__c.getOrgDefaults()
        );
        Test.stopTest();

        System.assert(true);
    }

    @IsTest
    static void testSendSmsMessageSkipsWhenDisabledOrMissingPhone() {
        upsertSmsSettings(false);

        Test.startTest();
        ShadikhanaBookingSmsService.sendSmsMessage(
            '6364054881',
            'Should not send',
            Shadikhana_Settings__c.getOrgDefaults()
        );
        ShadikhanaBookingSmsService.sendSmsMessage(
            null,
            'Missing phone',
            Shadikhana_Settings__c.getOrgDefaults()
        );
        Test.stopTest();

        System.assert(true);
    }

    @IsTest
    static void testFormatTimeAmPm() {
        System.assertEquals('10:00 AM', ShadikhanaBookingSmsService.formatTimeAmPm('10:00'));
        System.assertEquals('9:00 PM', ShadikhanaBookingSmsService.formatTimeAmPm('21:00'));
        System.assertEquals('12:00 PM', ShadikhanaBookingSmsService.formatTimeAmPm('12:00'));
        System.assertEquals('12:00 AM', ShadikhanaBookingSmsService.formatTimeAmPm('00:00'));
        System.assertEquals(null, ShadikhanaBookingSmsService.formatTimeAmPm(''));
    }

    @IsTest
    static void testBuildTimingLabel() {
        Shadikhana_Booking__c booking = new Shadikhana_Booking__c(
            Start_Time__c = '10:00',
            End_Time__c = '21:00'
        );

        System.assertEquals('10:00 AM to 9:00 PM', ShadikhanaBookingSmsService.buildTimingLabel(booking));
    }

    @IsTest
    static void testFormatPhoneForDisplay() {
        System.assertEquals('+916364054881', ShadikhanaBookingSmsService.formatPhoneForDisplay('6364054881'));
        System.assertEquals('+919876543210', ShadikhanaBookingSmsService.formatPhoneForDisplay('+91 98765 43210'));
    }

    @IsTest
    static void testNormalizePhoneNumber() {
        System.assertEquals('+916364054881', ShadikhanaBookingSmsService.normalizePhoneNumber('6364054881'));
        System.assertEquals('+919849939703', ShadikhanaBookingSmsService.normalizePhoneNumber('9849939703'));
        System.assertEquals('+919876543210', ShadikhanaBookingSmsService.normalizePhoneNumber('+91 98765 43210'));
        System.assertEquals('+919876543210', ShadikhanaBookingSmsService.normalizePhoneNumber('919876543210'));
        System.assertEquals(null, ShadikhanaBookingSmsService.normalizePhoneNumber(''));
    }

    @IsTest
    static void testSendSmsMessageFailureIsHandled() {
        upsertSmsSettings(true);
        Test.setMock(HttpCalloutMock.class, new TwilioFailureMock());

        Test.startTest();
        ShadikhanaBookingSmsService.sendSmsMessage(
            '6364054881',
            'Failure path',
            Shadikhana_Settings__c.getOrgDefaults()
        );
        Test.stopTest();

        System.assert(true);
    }

    @IsTest
    static void testSendSmsMessageUsesAndroidGatewayQueue() {
        Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
        if (settings == null) {
            settings = new Shadikhana_Settings__c(SetupOwnerId = UserInfo.getOrganizationId());
        }
        settings.SMS_Enabled__c = true;
        settings.Notifications_Enabled__c = true;
        settings.SMS_Provider__c = ShadikhanaSmsGatewayService.PROVIDER_ANDROID;
        upsert settings;

        Test.startTest();
        ShadikhanaBookingSmsService.sendSmsMessage(
            '6364054881',
            'Android gateway queue test',
            Shadikhana_Settings__c.getOrgDefaults()
        );
        Test.stopTest();

        List<Sms_Outbound__c> queued = [
            SELECT To_Number__c, Status__c
            FROM Sms_Outbound__c
            WHERE To_Number__c != null
            ORDER BY CreatedDate DESC
            LIMIT 1
        ];
        System.assertEquals(1, queued.size(), 'Expected one queued SMS for Android gateway');
        System.assertEquals('Pending', queued[0].Status__c);
    }

    @IsTest
    static void testNotifyAdminNewBookingUsesAndroidGatewayQueue() {
        Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
        if (settings == null) {
            settings = new Shadikhana_Settings__c(SetupOwnerId = UserInfo.getOrganizationId());
        }
        settings.SMS_Enabled__c = true;
        settings.Notifications_Enabled__c = true;
        settings.SMS_Provider__c = ShadikhanaSmsGatewayService.PROVIDER_ANDROID;
        settings.Admin_Mobile_Number__c = '6364054881';
        upsert settings;

        ShadikhanaBookingController.BookingRecord booking = ShadikhanaBookingController.createBooking(
            formatDate(Date.today().addDays(10)),
            formatDate(Date.today().addDays(10)),
            'Gateway Event',
            'Gateway Contact',
            '6364054881',
            null,
            null,
            null,
            null,
            null,
            'Wedding',
            100,
            'Self',
            'Self'
        );

        Integer beforeCount = [SELECT COUNT() FROM Sms_Outbound__c];

        Test.startTest();
        ShadikhanaBookingSmsService.notifyAdminNewBooking(booking.id);
        Test.stopTest();

        Integer afterCount = [SELECT COUNT() FROM Sms_Outbound__c];
        System.assert(afterCount > beforeCount, 'Expected queued admin SMS for Android gateway');
    }

    @IsTest
    static void testNotifyRequesterBookingSubmittedUsesAndroidGatewayQueue() {
        Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
        if (settings == null) {
            settings = new Shadikhana_Settings__c(SetupOwnerId = UserInfo.getOrganizationId());
        }
        settings.SMS_Enabled__c = true;
        settings.Notifications_Enabled__c = true;
        settings.SMS_Provider__c = ShadikhanaSmsGatewayService.PROVIDER_ANDROID;
        upsert settings;

        Shadikhana_Booking__c booking = new Shadikhana_Booking__c(
            Booking_Date__c = Date.today().addDays(9),
            End_Date__c = Date.today().addDays(9),
            Event_Name__c = 'Submitted Event',
            Event_Type__c = 'Wedding',
            Expected_Guest_Count__c = 100,
            Decoration_Arrangement__c = 'Self',
            Catering_Arrangement__c = 'Self',
            Contact_Name__c = 'Submitted Requester',
            Contact_Phone__c = '9966634403',
            Start_Time__c = '10:00',
            End_Time__c = '18:00',
            Daily_Rate__c = 7000,
            Number_of_Days__c = 1,
            Hall_Rental_Amount__c = 7000,
            Estimated_Amount__c = 7000,
            Final_Amount__c = 7000,
            Status__c = 'Pending'
        );
        insert booking;

        Integer beforeCount = [SELECT COUNT() FROM Sms_Outbound__c];

        Test.startTest();
        ShadikhanaBookingSmsService.notifyRequesterBookingSubmitted(booking.Id);
        Test.stopTest();

        Integer afterCount = [SELECT COUNT() FROM Sms_Outbound__c];
        System.assertEquals(beforeCount + 1, afterCount, 'Expected queued requester SMS for Android gateway');
    }

    @IsTest
    static void testNotifyRequesterBookingConfirmedUsesAndroidGatewayQueue() {
        Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
        if (settings == null) {
            settings = new Shadikhana_Settings__c(SetupOwnerId = UserInfo.getOrganizationId());
        }
        settings.SMS_Enabled__c = true;
        settings.Notifications_Enabled__c = true;
        settings.SMS_Provider__c = ShadikhanaSmsGatewayService.PROVIDER_ANDROID;
        upsert settings;

        ShadikhanaBookingController.BookingRecord booking =
            ShadikhanaBookingController.createBooking(
                formatDate(Date.today().addDays(11)),
                formatDate(Date.today().addDays(11)),
                'Requester Gateway Event',
                'Requester Gateway',
                '6364054881',
                null,
                null,
                null,
                null,
                null,
                'Wedding',
                100,
                'Self',
                'Self'
            );

        Integer beforeCount = [SELECT COUNT() FROM Sms_Outbound__c];

        Test.startTest();
        ShadikhanaBookingSmsService.notifyRequesterBookingConfirmed(booking.id);
        Test.stopTest();

        Integer afterCount = [SELECT COUNT() FROM Sms_Outbound__c];
        System.assert(afterCount > beforeCount, 'Expected queued requester SMS for Android gateway');
    }

    @IsTest
    static void testNotifyRequesterBookingCancelledUsesAndroidGatewayQueue() {
        Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
        if (settings == null) {
            settings = new Shadikhana_Settings__c(SetupOwnerId = UserInfo.getOrganizationId());
        }
        settings.SMS_Enabled__c = true;
        settings.Notifications_Enabled__c = true;
        settings.SMS_Provider__c = ShadikhanaSmsGatewayService.PROVIDER_ANDROID;
        upsert settings;

        ShadikhanaBookingController.BookingRecord booking =
            ShadikhanaBookingController.createBooking(
                formatDate(Date.today().addDays(12)),
                formatDate(Date.today().addDays(12)),
                'Cancel Gateway Event',
                'Cancel Gateway',
                '6364054881',
                null,
                null,
                null,
                null,
                null,
                'Wedding',
                100,
                'Self',
                'Self'
            );

        Integer beforeCount = [SELECT COUNT() FROM Sms_Outbound__c];

        Test.startTest();
        ShadikhanaBookingSmsService.notifyRequesterBookingCancelled(booking.id);
        Test.stopTest();

        Integer afterCount = [SELECT COUNT() FROM Sms_Outbound__c];
        System.assert(afterCount > beforeCount, 'Expected queued cancel SMS for Android gateway');
    }

    @IsTest
    static void testUpdateBookingStatusCancelledQueuesRequesterSms() {
        upsertSmsSettings(true);
        Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
        settings.SMS_Provider__c = ShadikhanaSmsGatewayService.PROVIDER_ANDROID;
        upsert settings;

        ShadikhanaBookingController.BookingRecord booking =
            ShadikhanaBookingController.createBooking(
                formatDate(Date.today().addDays(13)),
                formatDate(Date.today().addDays(13)),
                'Cancel Status Event',
                'Cancel Status',
                '6364054881',
                null,
                null,
                null,
                null,
                null,
                'Wedding',
                100,
                'Self',
                'Self'
            );

        Integer beforeCount = [SELECT COUNT() FROM Sms_Outbound__c];

        Test.startTest();
        ShadikhanaBookingController.BookingRecord cancelled =
            ShadikhanaBookingController.updateBookingStatus(booking.id, 'Cancelled');
        Test.stopTest();

        System.assertEquals('Cancelled', cancelled.status);
        Integer afterCount = [SELECT COUNT() FROM Sms_Outbound__c];
        System.assert(afterCount > beforeCount, 'Expected queued cancel SMS when status updated');
    }

    private static void upsertSmsSettings(Boolean enabled) {
        upsertSmsSettings(enabled, '6364054881', null);
    }

    private static void upsertSmsSettings(Boolean enabled, String primaryMobile, String secondaryMobile) {
        Shadikhana_Settings__c settings = new Shadikhana_Settings__c(
            SetupOwnerId = UserInfo.getOrganizationId(),
            Admin_Mobile_Number__c = primaryMobile,
            Footer_Additional_Phone__c = secondaryMobile,
            Twilio_Account_SID__c = 'AC00000000000000000000000000000000',
            Twilio_From_Number__c = '+15555550100',
            Twilio_Auth_Token__c = 'test_auth_token',
            SMS_Enabled__c = enabled,
            Notifications_Enabled__c = enabled,
            SMS_Provider__c = ShadikhanaSmsGatewayService.PROVIDER_TWILIO
        );
        upsert settings;
    }

    private static String formatDate(Date value) {
        String month = String.valueOf(value.month()).leftPad(2, '0');
        String day = String.valueOf(value.day()).leftPad(2, '0');
        return value.year() + '-' + month + '-' + day;
    }
}
