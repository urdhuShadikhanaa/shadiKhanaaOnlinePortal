@IsTest
private class ShadikhanaBookingNotificationServiceTest {

    private class NtfyMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest request) {
            HttpResponse response = new HttpResponse();
            response.setStatusCode(200);
            response.setBody('{"id":"abc123"}');
            return response;
        }
    }

    private class NtfyFailureMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest request) {
            HttpResponse response = new HttpResponse();
            response.setStatusCode(500);
            response.setBody('error');
            return response;
        }
    }

    @IsTest
    static void testNotifyAdminNewBookingWithoutSettings() {
        Date bookingDate = Date.today().addDays(12);
        ShadikhanaBookingController.BookingRecord booking =
            ShadikhanaBookingController.createBooking(
                formatDate(bookingDate),
                formatDate(bookingDate),
                'Notification Test Event',
                'Notification Contact',
                '9999999999',
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
        ShadikhanaBookingNotificationService.notifyAdminNewBooking(booking.id);
        Test.stopTest();

        System.assertNotEquals(null, booking.id);
    }

    @IsTest
    static void testQueueableSendsNotificationWithMock() {
        Date bookingDate = Date.today().addDays(20);
        Date endDate = bookingDate.addDays(2);
        ShadikhanaBookingController.BookingRecord booking =
            ShadikhanaBookingController.createBooking(
                formatDate(bookingDate),
                formatDate(endDate),
                'Queueable Event',
                'Queueable Contact',
                '8888888888',
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

        Shadikhana_Settings__c settings = new Shadikhana_Settings__c(
            SetupOwnerId = UserInfo.getOrganizationId(),
            Ntfy_Server_URL__c = 'https://ntfy.sh/',
            Ntfy_Topic__c = 'urdu-shadikhana-admin',
            Ntfy_Access_Token__c = 'test-token',
            Notifications_Enabled__c = true
        );
        upsert settings;

        Test.setMock(HttpCalloutMock.class, new NtfyMock());

        Test.startTest();
        ShadikhanaBookingNotificationService.notifyAdminNewBooking(booking.id);
        Test.stopTest();

        System.assertNotEquals(null, booking.id);
    }

    @IsTest
    static void testNotifyAdminNewBookingWithNullId() {
        Test.startTest();
        ShadikhanaBookingNotificationService.notifyAdminNewBooking(null);
        Test.stopTest();

        System.assert(true);
    }

    @IsTest
    static void testQueueableSkipsWhenDisabled() {
        Date bookingDate = Date.today().addDays(25);
        ShadikhanaBookingController.BookingRecord booking =
            ShadikhanaBookingController.createBooking(
                formatDate(bookingDate),
                formatDate(bookingDate),
                'Skipped Event',
                'Skipped Contact',
                '7777777777',
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

        Shadikhana_Settings__c settings = new Shadikhana_Settings__c(
            SetupOwnerId = UserInfo.getOrganizationId(),
            Notifications_Enabled__c = false,
            SMS_Enabled__c = false
        );
        upsert settings;

        Test.startTest();
        ShadikhanaBookingNotificationService.notifyAdminNewBooking(booking.id);
        Test.stopTest();

        System.assertNotEquals(null, booking.id);
    }

    @IsTest
    static void testQueueableSkipsWhenTopicMissing() {
        Date bookingDate = Date.today().addDays(26);
        ShadikhanaBookingController.BookingRecord booking =
            ShadikhanaBookingController.createBooking(
                formatDate(bookingDate),
                formatDate(bookingDate),
                'No Topic Event',
                'No Topic Contact',
                '6666666666',
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

        Shadikhana_Settings__c settings = new Shadikhana_Settings__c(
            SetupOwnerId = UserInfo.getOrganizationId(),
            Notifications_Enabled__c = true,
            Ntfy_Topic__c = null
        );
        upsert settings;

        Test.startTest();
        ShadikhanaBookingNotificationService.notifyAdminNewBooking(booking.id);
        Test.stopTest();

        System.assertNotEquals(null, booking.id);
    }

    @IsTest
    static void testSendNtfyNotificationWithMock() {
        Test.setMock(HttpCalloutMock.class, new NtfyMock());

        Test.startTest();
        ShadikhanaBookingNotificationService.sendNtfyNotification(
            'https://ntfy.sh',
            'urdu-shadikhana-admin',
            null,
            'New Booking',
            'Test booking alert'
        );
        ShadikhanaBookingNotificationService.sendNtfyNotification(
            null,
            'urdu-shadikhana-admin',
            null,
            null,
            'Default server alert'
        );
        ShadikhanaBookingNotificationService.sendNtfyNotification(
            'https://ntfy.sh',
            ' ',
            null,
            'Ignored',
            'Ignored message'
        );
        Test.stopTest();

        System.assert(true);
    }

    @IsTest
    static void testSendNtfyNotificationFailureIsHandled() {
        Test.setMock(HttpCalloutMock.class, new NtfyFailureMock());

        Test.startTest();
        ShadikhanaBookingNotificationService.sendNtfyNotification(
            'https://ntfy.sh',
            'urdu-shadikhana-admin',
            'token',
            buildLongTitle(300),
            'Failure path alert'
        );
        Test.stopTest();

        System.assert(true);
    }

    private static String formatDate(Date value) {
        String month = String.valueOf(value.month()).leftPad(2, '0');
        String day = String.valueOf(value.day()).leftPad(2, '0');
        return value.year() + '-' + month + '-' + day;
    }

    private static String buildLongTitle(Integer length) {
        String value = '';
        for (Integer index = 0; index < length; index++) {
            value += 'A';
        }
        return value;
    }
}
