@IsTest
private class ShadikhanaBookingEmailServiceTest {

    @IsTest
    static void testNotifyBookingRequestSubmittedSendsUserAndAdminEmail() {
        upsertEmailSettings(true, 'admin@example.com');
        Shadikhana_Booking__c booking = insertTestBooking('requester@example.com', 'Pending');

        Test.startTest();
        ShadikhanaBookingEmailService.sendBookingRequestEmailsNow(booking.Id);
        Integer sentCount = Limits.getEmailInvocations();
        Test.stopTest();

        System.assertEquals(2, sentCount, 'Requester and admin emails are sent separately.');
    }

    @IsTest
    static void testNotifyBookingRequestSubmittedSkipsWhenDisabled() {
        upsertEmailSettings(false, 'admin@example.com');
        Shadikhana_Booking__c booking = insertTestBooking('requester@example.com', 'Pending');

        Test.startTest();
        ShadikhanaBookingEmailService.sendBookingRequestEmailsNow(booking.Id);
        Integer sentCount = Limits.getEmailInvocations();
        Test.stopTest();

        System.assertEquals(0, sentCount);
    }

    @IsTest
    static void testNotifyBookingRequestSubmittedSendsAdminOnlyWithoutCustomerEmail() {
        upsertEmailSettings(true, 'admin@example.com');
        Shadikhana_Booking__c booking = insertTestBooking(null, 'Pending');
        booking.Booked_By__c = null;
        update booking;

        Test.startTest();
        ShadikhanaBookingEmailService.sendBookingRequestEmailsNow(booking.Id);
        Integer sentCount = Limits.getEmailInvocations();
        Test.stopTest();

        System.assertEquals(1, sentCount);
    }

    @IsTest
    static void testNotifyBookingStatusChangedConfirmedAndCancelled() {
        upsertEmailSettings(true, 'urdhushadikhanaa@gmail.com');
        Shadikhana_Booking__c booking = insertTestBooking('status@example.com', 'Pending');

        Test.startTest();
        ShadikhanaBookingEmailService.notifyBookingStatusChanged(booking.Id, 'Confirmed');
        ShadikhanaBookingEmailService.notifyBookingStatusChanged(booking.Id, 'Cancelled');
        Integer sentCount = Limits.getEmailInvocations();
        Test.stopTest();

        System.assertEquals(2, sentCount);
    }

    @IsTest
    static void testResolveRequesterEmailUsesContactEmailFirst() {
        Shadikhana_Booking__c booking = new Shadikhana_Booking__c(
            Contact_Email__c = 'guest@example.com'
        );

        System.assertEquals(
            'guest@example.com',
            ShadikhanaBookingEmailService.resolveRequesterEmail(booking)
        );
    }

    @IsTest
    static void testBuildAdminNewBookingBodiesIncludeActionLink() {
        upsertEmailSettings(true, 'admin@example.com');
        Shadikhana_Booking__c booking = insertTestBooking('requester@example.com', 'Pending');
        booking = queryTestBooking(booking.Id);
        Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();

        String plainBody = ShadikhanaBookingEmailService.buildAdminNewBookingPlainBody(booking, settings);
        String htmlBody = ShadikhanaBookingEmailService.buildAdminNewBookingHtmlBody(booking, settings);
        String actionLink = ShadikhanaBookingEmailService.buildAdminBookingActionLink(booking.Id, settings);

        System.assert(plainBody.contains(actionLink));
        System.assert(htmlBody.contains('bookingId='));
        System.assert(htmlBody.contains('tab=admin'));
        System.assert(htmlBody.contains('Open booking to confirm or cancel'));
    }

    @IsTest
    static void testBuildUserRequestAckBodyContainsThankYouMessage() {
        Shadikhana_Booking__c booking = insertTestBooking('ack@example.com', 'Pending');
        booking = queryTestBooking(booking.Id);

        String body = ShadikhanaBookingEmailService.buildUserRequestAckPlainBody(booking);
        System.assert(body.contains('Thank you for choosing the Urdu Shadikhana Booking site'));
        System.assert(body.contains('manager'));
        System.assert(String.isNotBlank(booking.Name));
        System.assert(body.contains(booking.Name));
    }

    @IsTest
    static void testBuildHtmlEmailContainsPreviewSections() {
        Shadikhana_Booking__c booking = insertTestBooking('preview@example.com', 'Pending');
        booking = queryTestBooking(booking.Id);

        String html = ShadikhanaBookingEmailService.buildUserRequestAckHtmlBody(booking);
        System.assert(html.contains('Date &amp; timing'));
        System.assert(html.contains('Estimated total'));
        System.assert(html.contains('Contact'));
        System.assert(html.contains('Birthday Party'));
    }

    @IsTest
    static void testBuildTimingLabelAndPhoneFormatting() {
        Shadikhana_Booking__c booking = new Shadikhana_Booking__c(
            Start_Time__c = '10:00',
            End_Time__c = '21:00',
            Contact_Phone__c = '6364054881'
        );

        System.assertEquals('10:00 AM', ShadikhanaBookingEmailService.formatTimeAmPm('10:00'));
        System.assertEquals('9:00 PM', ShadikhanaBookingEmailService.formatTimeAmPm('21:00'));
        System.assertEquals('+916364054881', ShadikhanaBookingEmailService.formatPhoneForDisplay('6364054881'));
    }

    @IsTest
    static void testResolveAdminEmailUsesDefaultWhenMissing() {
        System.assertEquals(
            'urdhushadikhanaa@gmail.com',
            ShadikhanaBookingEmailService.resolveAdminEmail(null)
        );
    }

    private static void upsertEmailSettings(Boolean enabled, String adminEmail) {
        Shadikhana_Settings__c settings = new Shadikhana_Settings__c(
            SetupOwnerId = UserInfo.getOrganizationId(),
            Admin_Email__c = adminEmail,
            Email_Enabled__c = enabled
        );
        upsert settings;
    }

    private static Shadikhana_Booking__c insertTestBooking(String contactEmail, String status) {
        Date bookingDate = Date.today().addDays(14);
        Shadikhana_Booking__c booking = new Shadikhana_Booking__c(
            Booking_Date__c = bookingDate,
            End_Date__c = bookingDate.addDays(1),
            Event_Name__c = 'Email Test Event',
            Event_Type__c = 'Birthday Party',
            Expected_Guest_Count__c = 34,
            Decoration_Arrangement__c = 'Self',
            Catering_Arrangement__c = 'Self',
            Contact_Name__c = 'Email Test Contact',
            Contact_Phone__c = '9876543210',
            Contact_Email__c = contactEmail,
            Start_Time__c = '10:00',
            End_Time__c = '21:00',
            Estimated_Amount__c = 14000,
            Final_Amount__c = 14000,
            Hall_Rental_Amount__c = 14000,
            Decoration_Charge__c = 0,
            Catering_Charge__c = 0,
            Daily_Rate__c = 7000,
            Number_of_Days__c = 2,
            Status__c = status,
            Booked_By__c = UserInfo.getUserId()
        );
        insert booking;
        return booking;
    }

    private static Shadikhana_Booking__c queryTestBooking(Id bookingId) {
        return [
            SELECT Id, Name, Booking_Date__c, End_Date__c, Event_Name__c, Event_Type__c,
                   Expected_Guest_Count__c, Decoration_Arrangement__c, Catering_Arrangement__c,
                   Contact_Name__c, Contact_Phone__c, Contact_Email__c, Notes__c, Status__c,
                   Start_Time__c, End_Time__c, Event_Details__c, Daily_Rate__c, Number_of_Days__c,
                   Estimated_Amount__c, Final_Amount__c, Hall_Rental_Amount__c, Decoration_Charge__c,
                   Catering_Charge__c
            FROM Shadikhana_Booking__c
            WHERE Id = :bookingId
            LIMIT 1
        ];
    }
}
