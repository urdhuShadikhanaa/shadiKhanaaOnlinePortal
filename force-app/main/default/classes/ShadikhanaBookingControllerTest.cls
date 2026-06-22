@IsTest
private class ShadikhanaBookingControllerTest {

    @IsTest
    static void testGetCurrentUserInfo() {
        Test.startTest();
        ShadikhanaBookingController.UserInfoWrapper info =
            ShadikhanaBookingController.getCurrentUserInfo();
        Test.stopTest();

        System.assertEquals(UserInfo.getUserId(), info.userId);
        System.assertNotEquals(null, info.name);
        System.assertNotEquals(null, info.isSystemAdmin);
        System.assertEquals(false, info.isGuest);
        if (info.isSystemAdmin) {
            System.assertNotEquals(null, info.portalLoginPassword);
        }
    }

    @IsTest
    static void testCreateAndRetrieveBooking() {
        Date bookingDate = Date.today().addDays(10);
        Date endDate = bookingDate.addDays(2);
        String startStr = formatDate(bookingDate);
        String endStr = formatDate(endDate);

        Test.startTest();
        ShadikhanaBookingController.BookingRecord created =
            ShadikhanaBookingController.createBooking(
                startStr,
                endStr,
                'Nikah Ceremony',
                'Ahmed Khan',
                '555-0100',
                'ahmed@example.com',
                'Evening event',
                null,
                null,
                null,
                'Wedding',
                100,
                'Self',
                'Self'
            );

        List<ShadikhanaBookingController.BookingRecord> bookings =
            ShadikhanaBookingController.getBookings(bookingDate.year(), bookingDate.month());

        List<String> bookedDates =
            ShadikhanaBookingController.getBookedDateStrings(bookingDate.year(), bookingDate.month());

        Boolean available = ShadikhanaBookingController.isDateRangeAvailable(startStr, endStr);
        List<ShadikhanaBookingController.BookingRecord> myBookings =
            ShadikhanaBookingController.getMyBookings();
        List<ShadikhanaBookingController.BookingRecord> bookingData =
            ShadikhanaBookingController.getBookingData();
        Test.stopTest();

        System.assertNotEquals(null, created.id);
        System.assertEquals('Pending', created.status);
        System.assertEquals(endDate, created.endDate);
        System.assertEquals(1, bookings.size(), 'Pending requests should appear on the calendar.');
        System.assertEquals(true, bookedDates.contains(startStr));
        System.assertEquals(false, available);
        System.assertEquals(1, myBookings.size());
        System.assertEquals(1, bookingData.size());
    }

    @IsTest
    static void testPendingRequestsBlockSameDates() {
        Date bookingDate = Date.today().addDays(15);
        String startStr = formatDate(bookingDate);
        String endStr = formatDate(bookingDate.addDays(2));

        ShadikhanaBookingController.createBooking(
            startStr,
            endStr,
            'First Event',
            'User One',
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

        Boolean caught = false;
        Test.startTest();
        try {
            ShadikhanaBookingController.createBooking(
                formatDate(bookingDate.addDays(1)),
                formatDate(bookingDate.addDays(3)),
                'Second Event',
                'User Two',
                '9876543211',
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
        } catch (Exception ex) {
            caught = true;
        }
        Test.stopTest();

        System.assertEquals(true, caught, 'Overlapping pending request should be rejected.');
    }

    @IsTest
    static void testConfirmedRangeBlocksNewRequest() {
        Date bookingDate = Date.today().addDays(15);
        String startStr = formatDate(bookingDate);
        String endStr = formatDate(bookingDate.addDays(2));

        ShadikhanaBookingController.BookingRecord created =
            ShadikhanaBookingController.createBooking(
                startStr,
                endStr,
                'First Event',
                'User One',
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

        ShadikhanaBookingController.updateBookingStatus(created.id, 'Confirmed');

        Boolean caught = false;
        Test.startTest();
        try {
            ShadikhanaBookingController.createBooking(
                formatDate(bookingDate.addDays(1)),
                formatDate(bookingDate.addDays(3)),
                'Second Event',
                'User Two',
                '9876543211',
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
        } catch (Exception ex) {
            caught = true;
        }
        Test.stopTest();

        System.assertEquals(true, caught, 'Confirmed overlap should be rejected.');
    }

    @IsTest
    static void testConfirmBlocksCalendarAndKeepsOverlappingPending() {
        Date bookingDate = Date.today().addDays(25);
        Date endDate = bookingDate.addDays(1);
        Id userId = UserInfo.getUserId();

        Shadikhana_Booking__c approvedRequest = new Shadikhana_Booking__c(
            Booking_Date__c = bookingDate,
            End_Date__c = endDate,
            Event_Name__c = 'Approved Event',
            Contact_Name__c = 'Approved User',
            Contact_Phone__c = '9849939703',
            Status__c = 'Pending',
            Booked_By__c = userId
        );
        Shadikhana_Booking__c overlappingPending = new Shadikhana_Booking__c(
            Booking_Date__c = bookingDate,
            End_Date__c = endDate,
            Event_Name__c = 'Pending Event',
            Contact_Name__c = 'Pending User',
            Contact_Phone__c = '9876543212',
            Status__c = 'Pending',
            Booked_By__c = userId
        );
        insert new List<Shadikhana_Booking__c>{ approvedRequest, overlappingPending };

        Test.startTest();
        ShadikhanaBookingController.updateBookingStatus(approvedRequest.Id, 'Confirmed');

        List<ShadikhanaBookingController.BookingRecord> calendarBookings =
            ShadikhanaBookingController.getBookings(bookingDate.year(), bookingDate.month());

        List<ShadikhanaBookingController.BookingRecord> adminBookings =
            ShadikhanaBookingController.getAdminBookings();
        Test.stopTest();

        System.assertEquals(2, calendarBookings.size());

        Boolean hasConfirmed = false;
        for (ShadikhanaBookingController.BookingRecord calendarBooking : calendarBookings) {
            if (calendarBooking.id == approvedRequest.Id) {
                System.assertEquals('Confirmed', calendarBooking.status);
                hasConfirmed = true;
            }
        }
        System.assertEquals(true, hasConfirmed);

        ShadikhanaBookingController.BookingRecord overlappingPendingRecord = null;
        for (ShadikhanaBookingController.BookingRecord booking : adminBookings) {
            if (booking.id == overlappingPending.Id) {
                overlappingPendingRecord = booking;
                break;
            }
        }

        System.assertNotEquals(null, overlappingPendingRecord);
        System.assertEquals('Pending', overlappingPendingRecord.status);
    }

    @IsTest
    static void testCancelConfirmedBookingIsBlocked() {
        Date bookingDate = Date.today().addDays(18);
        Id userId = UserInfo.getUserId();

        Shadikhana_Booking__c booking = new Shadikhana_Booking__c(
            Booking_Date__c = bookingDate,
            Event_Name__c = 'Cancelled Event',
            Contact_Name__c = 'Cancelled User',
            Contact_Phone__c = '9876543210',
            Status__c = 'Confirmed',
            Estimated_Amount__c = 8000,
            Final_Amount__c = 7500,
            Booked_By__c = userId
        );
        insert booking;

        Boolean blocked = false;
        Test.startTest();
        try {
            ShadikhanaBookingController.updateBookingStatus(booking.Id, 'Cancelled');
        } catch (AuraHandledException ex) {
            blocked = true;
        }
        Test.stopTest();

        System.assertEquals(true, blocked);
    }

    @IsTest
    static void testUpdateBookingStatusSendsRequesterEmailWhenContactEmailPresent() {
        Shadikhana_Settings__c settings = new Shadikhana_Settings__c(
            SetupOwnerId = UserInfo.getOrganizationId(),
            Admin_Email__c = 'admin@example.com',
            Email_Enabled__c = true
        );
        upsert settings;

        Date bookingDate = Date.today().addDays(22);
        Shadikhana_Booking__c booking = new Shadikhana_Booking__c(
            Booking_Date__c = bookingDate,
            End_Date__c = bookingDate,
            Event_Name__c = 'Status Email Event',
            Event_Type__c = 'Wedding',
            Expected_Guest_Count__c = 100,
            Decoration_Arrangement__c = 'Self',
            Catering_Arrangement__c = 'Self',
            Contact_Name__c = 'Status Email Contact',
            Contact_Phone__c = '9876543210',
            Contact_Email__c = 'requester.status@example.com',
            Estimated_Amount__c = 8000,
            Final_Amount__c = 8000,
            Status__c = 'Pending',
            Booked_By__c = UserInfo.getUserId()
        );
        insert booking;

        Test.startTest();
        ShadikhanaBookingController.updateBookingStatus(booking.Id, 'Confirmed');
        Integer sentCount = Limits.getEmailInvocations();
        Test.stopTest();

        System.assertEquals(1, sentCount, 'Requester should receive a confirmation email.');
    }

    @IsTest
    static void testUpdateBookingStatusSkipsRequesterEmailWhenContactEmailMissing() {
        Shadikhana_Settings__c settings = new Shadikhana_Settings__c(
            SetupOwnerId = UserInfo.getOrganizationId(),
            Admin_Email__c = 'admin@example.com',
            Email_Enabled__c = true
        );
        upsert settings;

        Date bookingDate = Date.today().addDays(23);
        Shadikhana_Booking__c booking = new Shadikhana_Booking__c(
            Booking_Date__c = bookingDate,
            End_Date__c = bookingDate,
            Event_Name__c = 'No Email Event',
            Event_Type__c = 'Wedding',
            Expected_Guest_Count__c = 100,
            Decoration_Arrangement__c = 'Self',
            Catering_Arrangement__c = 'Self',
            Contact_Name__c = 'No Email Contact',
            Contact_Phone__c = '9876543211',
            Estimated_Amount__c = 8000,
            Final_Amount__c = 8000,
            Status__c = 'Pending',
            Booked_By__c = null
        );
        insert booking;

        Test.startTest();
        ShadikhanaBookingController.updateBookingStatus(booking.Id, 'Cancelled');
        Integer sentCount = Limits.getEmailInvocations();
        Test.stopTest();

        System.assertEquals(0, sentCount, 'No requester email should be sent without a contact email.');
    }

    @IsTest
    static void testValidationErrors() {
        Boolean missingFields = false;
        Boolean missingPhone = false;
        Boolean pastDate = false;
        Boolean invalidEndDate = false;

        Test.startTest();
        try {
            ShadikhanaBookingController.createBooking(null, null, '', '', null, null, null, null, null, null, null, null, null, null);
        } catch (AuraHandledException ex) {
            missingFields = true;
        }

        try {
            ShadikhanaBookingController.createBooking(
                formatDate(Date.today().addDays(5)),
                formatDate(Date.today().addDays(5)),
                'Valid Event',
                'Valid User',
                null,
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
        } catch (AuraHandledException ex) {
            missingPhone = true;
        }

        try {
            ShadikhanaBookingController.createBooking(
                formatDate(Date.today().addDays(-1)),
                formatDate(Date.today().addDays(-1)),
                'Past Event',
                'Test User',
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
        } catch (AuraHandledException ex) {
            pastDate = true;
        }

        try {
            ShadikhanaBookingController.createBooking(
                formatDate(Date.today().addDays(5)),
                formatDate(Date.today().addDays(2)),
                'Invalid Range',
                'Test User',
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
        } catch (AuraHandledException ex) {
            invalidEndDate = true;
        }
        Test.stopTest();

        System.assertEquals(true, missingFields);
        System.assertEquals(true, missingPhone);
        System.assertEquals(true, pastDate);
        System.assertEquals(true, invalidEndDate);
    }

    @IsTest
    static void testAdminAccess() {
        ShadikhanaBookingController.createBooking(
            formatDate(Date.today().addDays(20)),
            formatDate(Date.today().addDays(21)),
            'Admin Test Event',
            'Admin User',
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
        List<ShadikhanaBookingController.BookingRecord> adminBookings =
            ShadikhanaBookingController.getAdminBookings();
        List<ShadikhanaBookingController.BannerRecord> adminBanners =
            ShadikhanaBookingController.getAdminBanners();
        Test.stopTest();

        System.assert(adminBookings.size() >= 1);
        System.assertNotEquals(null, adminBanners);
    }

    @IsTest
    static void testGetPortalFooterInfo() {
        Test.startTest();
        ShadikhanaBookingController.PortalFooterWrapper footer =
            ShadikhanaBookingController.getPortalFooterInfo();
        Test.stopTest();

        System.assertNotEquals(null, footer.contactNumber);
        System.assertNotEquals(null, footer.additionalContactNumber);
        System.assertNotEquals(null, footer.escalationEmail);
    }

    @IsTest
    static void testSavePortalSettingsWithFooterAndPricingFields() {
        Shadikhana_Settings__c settings = new Shadikhana_Settings__c(
            SetupOwnerId = UserInfo.getOrganizationId(),
            Admin_Mobile_Number__c = '6364054881',
            SMS_Enabled__c = true
        );
        upsert settings;

        Test.startTest();
        ShadikhanaBookingController.PortalSettingsWrapper saved =
            ShadikhanaBookingController.savePortalSettings(
                '6364054881',
                '+15555550100',
                'AC00000000000000000000000000000000',
                'token',
                true,
                'admin@example.com',
                'Secret123',
                'Login notes',
                'urdhushadikhanaa@gmail.com',
                true,
                '9652741400',
                'https://shabbirtech4-dev-ed.develop.my.site.com/urdushadikhana',
                'https://shabbirtech4-dev-ed.develop.my.site.com/urdushadikhana/login',
                9000,
                500,
                350,
                25000,
                450
            );
        ShadikhanaBookingController.PortalFooterWrapper footer =
            ShadikhanaBookingController.getPortalFooterInfo();
        Test.stopTest();

        System.assertEquals('9652741400', saved.footerAdditionalPhone);
        System.assertEquals(9000, saved.defaultDailyRate);
        System.assertEquals('9652741400', footer.additionalContactNumber);
        System.assertEquals('urdhushadikhanaa@gmail.com', footer.escalationEmail);
    }

    @IsTest
    static void testDailyRateAdminMethods() {
        Date rateDate = Date.today().addDays(22);
        String isoDate = formatDate(rateDate);
        List<String> isoDates = new List<String>{ isoDate, formatDate(rateDate.addDays(1)) };

        Test.startTest();
        Decimal savedDefault = ShadikhanaBookingController.saveDefaultDailyRate(8500);
        ShadikhanaBookingPricing.DateRateEntry savedOverride =
            ShadikhanaBookingController.saveDateRateOverride(isoDate, 12000);
        List<ShadikhanaBookingPricing.DateRateEntry> bulkSaved =
            ShadikhanaBookingController.saveDateRateOverrides(isoDates, 13000);
        Map<String, Decimal> monthRates = ShadikhanaBookingController.getDailyRatesForMonth(
            rateDate.year(),
            rateDate.month()
        );
        List<ShadikhanaBookingPricing.DateRateEntry> overrides =
            ShadikhanaBookingController.getAdminDateRateOverrides(rateDate.year(), rateDate.month());
        ShadikhanaBookingController.deleteDateRateOverrides(isoDates);
        Test.stopTest();

        System.assertEquals(8500, savedDefault);
        System.assertEquals(isoDate, savedOverride.isoDate);
        System.assertEquals(2, bulkSaved.size());
        System.assertEquals(13000, monthRates.get(isoDate));
        System.assert(overrides.size() >= 1);
    }

    @IsTest
    static void testGetPortalLoginNotes() {
        Shadikhana_Settings__c settings = new Shadikhana_Settings__c(
            SetupOwnerId = UserInfo.getOrganizationId(),
            Portal_Admin_Username__c = 'admin@example.com',
            Portal_Admin_Password__c = 'Secret123',
            Portal_Login_Notes__c = 'Use these credentials for admin access.'
        );
        upsert settings;

        Test.startTest();
        ShadikhanaBookingController.PortalLoginNotesWrapper notes =
            ShadikhanaBookingController.getPortalLoginNotes();
        Test.stopTest();

        System.assertEquals('admin@example.com', notes.adminUsername);
        System.assertEquals('Secret123', notes.adminPassword);
        System.assertEquals('Use these credentials for admin access.', notes.message);
    }

    @IsTest
    static void testAdminBookingsSortPendingFirst() {
        Date pendingDate = Date.today().addDays(40);
        Date confirmedDate = Date.today().addDays(41);
        Date cancelledDate = Date.today().addDays(42);

        insert new List<Shadikhana_Booking__c>{
            new Shadikhana_Booking__c(
                Booking_Date__c = confirmedDate,
                End_Date__c = confirmedDate,
                Event_Name__c = 'Confirmed Event',
                Contact_Name__c = 'Confirmed User',
                Contact_Phone__c = '9000000001',
                Status__c = 'Confirmed',
                Booked_By__c = UserInfo.getUserId()
            ),
            new Shadikhana_Booking__c(
                Booking_Date__c = cancelledDate,
                End_Date__c = cancelledDate,
                Event_Name__c = 'Cancelled Event',
                Contact_Name__c = 'Cancelled User',
                Contact_Phone__c = '9000000002',
                Status__c = 'Cancelled',
                Booked_By__c = UserInfo.getUserId()
            ),
            new Shadikhana_Booking__c(
                Booking_Date__c = pendingDate,
                End_Date__c = pendingDate,
                Event_Name__c = 'Pending Event',
                Contact_Name__c = 'Pending User',
                Contact_Phone__c = '9000000003',
                Status__c = 'Pending',
                Booked_By__c = UserInfo.getUserId()
            )
        };

        Test.startTest();
        List<ShadikhanaBookingController.BookingRecord> adminBookings =
            ShadikhanaBookingController.getAdminBookings();
        Test.stopTest();

        Integer pendingIndex = -1;
        Integer confirmedIndex = -1;
        Integer cancelledIndex = -1;

        for (Integer index = 0; index < adminBookings.size(); index++) {
            if (adminBookings[index].status == 'Pending') {
                pendingIndex = index;
            } else if (adminBookings[index].status == 'Confirmed') {
                confirmedIndex = index;
            } else if (adminBookings[index].status == 'Cancelled') {
                cancelledIndex = index;
            }
        }

        System.assertNotEquals(-1, pendingIndex, 'Pending booking should be returned.');
        System.assertNotEquals(-1, confirmedIndex, 'Confirmed booking should be returned.');
        System.assertNotEquals(-1, cancelledIndex, 'Cancelled booking should be returned.');
        System.assert(pendingIndex < confirmedIndex, 'Pending bookings should appear before confirmed.');
        System.assert(confirmedIndex < cancelledIndex, 'Confirmed bookings should appear before cancelled.');
    }

    @IsTest
    static void testBannerManagement() {
        Test.startTest();
        ShadikhanaBookingController.BannerRecord created =
            ShadikhanaBookingController.saveBanner(
                null,
                'Welcome',
                'Book your event at Urdu Shadikhana.',
                true,
                'Info',
                1
            );

        List<ShadikhanaBookingController.BannerRecord> activeBanners =
            ShadikhanaBookingController.getActiveBanners();

        ShadikhanaBookingController.BannerRecord updated =
            ShadikhanaBookingController.saveBanner(
                created.id,
                'Updated Welcome',
                'Updated banner message.',
                false,
                'Warning',
                2
            );

        ShadikhanaBookingController.deleteBanner(created.id);
        Test.stopTest();

        System.assertEquals('Welcome', created.title);
        System.assertEquals(1, activeBanners.size());
        System.assertEquals('Updated Welcome', updated.title);
        System.assertEquals(false, updated.isActive);
    }

    @IsTest
    static void testPricingOnCreateAndAdminUpdate() {
        Date bookingDate = Date.today().addDays(12);
        String startStr = formatDate(bookingDate);

        Test.startTest();
        ShadikhanaBookingController.BookingRecord created =
            ShadikhanaBookingController.createBooking(
                startStr,
                startStr,
                'Half Day Event',
                'Pricing User',
                '9876501234',
                null,
                null,
                '09:00',
                '12:00',
                'Morning ceremony only',
                'Wedding',
                100,
                'Self',
                'Self'
            );

        System.assertEquals(8000, created.dailyRate);
        System.assertEquals(1, created.numberOfDays);
        System.assertEquals(4000, created.estimatedAmount);
        System.assertEquals(4000, created.finalAmount);

        ShadikhanaBookingController.BookingRecord updated =
            ShadikhanaBookingController.updateBookingPrice(created.id, 3500);
        Test.stopTest();

        System.assertEquals(3500, updated.finalAmount);
        System.assertEquals(4000, updated.estimatedAmount);
    }

    @IsTest
    static void testCalculateBookingPriceEndpoint() {
        Date bookingDate = Date.today().addDays(14);
        String startStr = formatDate(bookingDate);
        String endStr = formatDate(bookingDate.addDays(1));

        Test.startTest();
        ShadikhanaBookingPricing.PriceEstimate estimate =
            ShadikhanaBookingController.calculateBookingPrice(startStr, endStr, null, null, null, null, null);
        Decimal dailyRate = ShadikhanaBookingController.getDailyRate();
        Test.stopTest();

        System.assertEquals(8000, dailyRate);
        System.assertEquals(2, estimate.numberOfDays);
        System.assertEquals(16000, estimate.estimatedAmount);
    }

    @IsTest
    static void testMonthlyAdminReport() {
        Date monthStart = Date.today().toStartOfMonth();
        Date bookingDate = monthStart.addDays(3);
        Date endDate = bookingDate.addDays(1);

        insert new Shadikhana_Booking__c(
            Booking_Date__c = bookingDate,
            End_Date__c = endDate,
            Event_Name__c = 'Monthly Report Event',
            Contact_Name__c = 'Report Contact',
            Contact_Phone__c = '9876500000',
            Status__c = 'Confirmed',
            Estimated_Amount__c = 16000,
            Final_Amount__c = 15000,
            Booked_By__c = UserInfo.getUserId()
        );

        Test.startTest();
        ShadikhanaBookingController.MonthlyReportSummary report =
            ShadikhanaBookingController.getMonthlyAdminReport(
                monthStart.year(),
                monthStart.month()
            );
        Test.stopTest();

        System.assertEquals(monthStart.year(), report.year);
        System.assertEquals(monthStart.month(), report.month);
        System.assertEquals(1, report.totalBookings);
        System.assertEquals(1, report.confirmedCount);
        System.assertNotEquals(null, report.dayRows);
        System.assertEquals(2, report.dayRows.size());

        for (ShadikhanaBookingController.MonthlyReportDayRow dayRow : report.dayRows) {
            System.assertEquals(true, dayRow.hasEvents);
            System.assert(dayRow.eventCount > 0);
        }
    }

    @IsTest
    static void testCustomAdminReport() {
        Date rangeStart = Date.today().toStartOfMonth();
        Date rangeEnd = rangeStart.addDays(10);
        Date bookingDate = rangeStart.addDays(2);

        insert new Shadikhana_Booking__c(
            Booking_Date__c = bookingDate,
            Event_Name__c = 'Custom Report Event',
            Contact_Name__c = 'Custom Contact',
            Contact_Phone__c = '9876500001',
            Status__c = 'Pending',
            Booked_By__c = UserInfo.getUserId()
        );

        Test.startTest();
        ShadikhanaBookingController.MonthlyReportSummary report =
            ShadikhanaBookingController.getAdminBookingReport(
                formatDate(rangeStart),
                formatDate(rangeEnd)
            );
        Test.stopTest();

        System.assertEquals(formatDate(rangeStart), report.rangeStartDate);
        System.assertEquals(formatDate(rangeEnd), report.rangeEndDate);
        System.assertEquals(1, report.dayRows.size());
        System.assertEquals(1, report.bookingRows.size());
        System.assertNotEquals(null, report.bookingRows[0].bookingNumber);
        System.assertEquals(formatDate(bookingDate), report.bookingRows[0].fromDate);
        System.assertEquals(formatDate(bookingDate), report.bookingRows[0].toDate);
    }

    @IsTest
    static void testAdminReportRangeValidation() {
        Date rangeStart = Date.today().toStartOfMonth();
        Date rangeEnd = rangeStart.addMonths(6).addDays(1);
        Boolean caught = false;

        Test.startTest();
        try {
            ShadikhanaBookingController.getAdminBookingReport(
                formatDate(rangeStart),
                formatDate(rangeEnd)
            );
        } catch (AuraHandledException ex) {
            caught = true;
        }
        Test.stopTest();

        System.assertEquals(true, caught);
    }

    @IsTest
    static void testGetPortalSettings() {
        Test.startTest();
        ShadikhanaBookingController.PortalSettingsWrapper settings =
            ShadikhanaBookingController.getPortalSettings();
        Test.stopTest();

        System.assertNotEquals(null, settings.adminMobileNumber);
        System.assertNotEquals(null, settings.defaultDailyRate);
        System.assertNotEquals(null, settings.footerAdditionalPhone);
        System.assertNotEquals(null, settings.portalSiteUrl);
        System.assertNotEquals(null, settings.portalLoginUrl);
        System.assertNotEquals(null, settings.adminEmail);
    }

    @IsTest
    static void testNullDateInputEdgeCases() {
        Test.startTest();
        System.assertEquals(
            0,
            ShadikhanaBookingController.getBookings(null, null).size()
        );
        System.assertEquals(
            null,
            ShadikhanaBookingController.calculateBookingPrice(null, null, null, null, null, null, null)
        );
        System.assertEquals(false, ShadikhanaBookingController.isDateRangeAvailable(null, null));
        Test.stopTest();
    }

    @IsTest
    static void testUpdateBookingStatusValidation() {
        Date bookingDate = Date.today().addDays(28);
        Shadikhana_Booking__c booking = new Shadikhana_Booking__c(
            Booking_Date__c = bookingDate,
            Event_Name__c = 'Status Validation Event',
            Contact_Name__c = 'Status User',
            Contact_Phone__c = '9876543299',
            Status__c = 'Pending',
            Booked_By__c = UserInfo.getUserId()
        );
        insert booking;

        Boolean invalidStatus = false;
        Boolean missingBooking = false;
        Boolean confirmOverlap = false;

        insert new Shadikhana_Booking__c(
            Booking_Date__c = bookingDate,
            Event_Name__c = 'Existing Confirmed',
            Contact_Name__c = 'Existing User',
            Contact_Phone__c = '9876543298',
            Status__c = 'Confirmed',
            Booked_By__c = UserInfo.getUserId()
        );

        Test.startTest();
        try {
            ShadikhanaBookingController.updateBookingStatus(booking.Id, 'Invalid');
        } catch (AuraHandledException ex) {
            invalidStatus = true;
        }

        try {
            ShadikhanaBookingController.updateBookingStatus(null, 'Confirmed');
        } catch (AuraHandledException ex) {
            missingBooking = true;
        }

        try {
            ShadikhanaBookingController.updateBookingStatus(booking.Id, 'Confirmed');
        } catch (AuraHandledException ex) {
            confirmOverlap = true;
        }
        Test.stopTest();

        System.assertEquals(true, invalidStatus);
        System.assertEquals(true, missingBooking);
        System.assertEquals(true, confirmOverlap);
    }

    @IsTest
    static void testUpdateBookingPriceValidation() {
        Date bookingDate = Date.today().addDays(30);
        Shadikhana_Booking__c booking = new Shadikhana_Booking__c(
            Booking_Date__c = bookingDate,
            Event_Name__c = 'Price Validation Event',
            Contact_Name__c = 'Price User',
            Contact_Phone__c = '9876543277',
            Status__c = 'Cancelled',
            Estimated_Amount__c = 8000,
            Final_Amount__c = 0,
            Booked_By__c = UserInfo.getUserId()
        );
        insert booking;

        Boolean missingBooking = false;
        Boolean negativeAmount = false;
        Boolean cancelledBooking = false;
        Boolean confirmedBooking = false;

        Test.startTest();
        try {
            ShadikhanaBookingController.updateBookingPrice(null, 1000);
        } catch (AuraHandledException ex) {
            missingBooking = true;
        }

        try {
            ShadikhanaBookingController.updateBookingPrice(booking.Id, -1);
        } catch (AuraHandledException ex) {
            negativeAmount = true;
        }

        try {
            ShadikhanaBookingController.updateBookingPrice(booking.Id, 5000);
        } catch (AuraHandledException ex) {
            cancelledBooking = true;
        }

        Shadikhana_Booking__c confirmedBookingRecord = new Shadikhana_Booking__c(
            Booking_Date__c = bookingDate.addDays(1),
            Event_Name__c = 'Confirmed Price Event',
            Contact_Name__c = 'Confirmed Price User',
            Contact_Phone__c = '9876543276',
            Status__c = 'Confirmed',
            Estimated_Amount__c = 8000,
            Final_Amount__c = 8000,
            Booked_By__c = UserInfo.getUserId()
        );
        insert confirmedBookingRecord;

        try {
            ShadikhanaBookingController.updateBookingPrice(confirmedBookingRecord.Id, 5000);
        } catch (AuraHandledException ex) {
            confirmedBooking = true;
        }
        Test.stopTest();

        System.assertEquals(true, missingBooking);
        System.assertEquals(true, negativeAmount);
        System.assertEquals(true, cancelledBooking);
        System.assertEquals(true, confirmedBooking);
    }

    @IsTest
    static void testMonthlyAdminReportInvalidMonth() {
        Boolean caught = false;
        Test.startTest();
        try {
            ShadikhanaBookingController.getMonthlyAdminReport(2026, 13);
        } catch (AuraHandledException ex) {
            caught = true;
        }
        Test.stopTest();
        System.assertEquals(true, caught);
    }

    @IsTest
    static void testDateRangeAllowsEndDateWhenConfirmedEventEndsAtNine() {
        Date startDate = Date.today().addDays(35);
        Date endDate = startDate.addDays(1);

        insert new Shadikhana_Booking__c(
            Booking_Date__c = endDate,
            End_Date__c = endDate,
            End_Time__c = '09:00',
            Event_Name__c = 'Morning Event',
            Contact_Name__c = 'Morning Guest',
            Contact_Phone__c = '9876500101',
            Status__c = 'Confirmed',
            Booked_By__c = UserInfo.getUserId()
        );

        Test.startTest();
        Boolean available = ShadikhanaBookingController.isDateRangeAvailable(
            formatDate(startDate),
            formatDate(endDate)
        );
        Boolean blockedMiddleDay = ShadikhanaBookingController.isDateRangeAvailable(
            formatDate(startDate),
            formatDate(endDate.addDays(1))
        );
        Test.stopTest();

        System.assertEquals(true, available, 'End date should be allowed when confirmed event ends by 9 AM.');
        System.assertEquals(false, blockedMiddleDay, 'Middle confirmed days should still block the range.');
    }

    @IsTest
    static void testGetPortalBrandingConfig() {
        Test.startTest();
        ShadikhanaPortalBrandingService.PortalBrandingConfig config =
            ShadikhanaBookingController.getPortalBrandingConfig();
        Test.stopTest();

        System.assertNotEquals(null, config);
        System.assertNotEquals(null, config.venueName);
        System.assertEquals(3, config.galleryImages.size());
    }

    @IsTest
    static void testSavePortalBrandingConfig() {
        String secretKey = ShadikhanaPortalBrandingService.BRANDING_SECRET_KEY;

        Test.startTest();
        ShadikhanaPortalBrandingService.PortalBrandingConfig saved =
            ShadikhanaBookingController.savePortalBrandingConfig(
                secretKey,
                'Controller Test Venue',
                '9999999999',
                '8888888888',
                'branding@test.example.com',
                'Controller Header Address',
                'Controller Full Address',
                550,
                375
            );

        ShadikhanaPortalBrandingService.PortalBrandingConfig partialSave =
            ShadikhanaBookingController.savePortalBrandingConfig(
                secretKey,
                null,
                null,
                null,
                null,
                'Updated Header Only',
                null,
                null,
                null
            );
        Test.stopTest();

        System.assertEquals('Controller Test Venue', saved.venueName);
        System.assertEquals('branding@test.example.com', saved.footerEmail);
        System.assertEquals(550, saved.seatingCapacity);
        System.assertEquals(375, saved.comfortableGuests);
        System.assertEquals('Controller Test Venue', partialSave.venueName);
        System.assertEquals('9999999999', partialSave.footerPhone);
        System.assertEquals('Updated Header Only', partialSave.headerAddressLine);
        System.assertEquals(550, partialSave.seatingCapacity);
        System.assertEquals(375, partialSave.comfortableGuests);
    }

    @IsTest
    static void testUploadPortalGalleryImageViaController() {
        String tinyPngBase64 =
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

        Test.startTest();
        ShadikhanaPortalBrandingService.GalleryImageConfig uploaded =
            ShadikhanaBookingController.uploadPortalGalleryImage(
                ShadikhanaPortalBrandingService.BRANDING_SECRET_KEY,
                'ShadikhanaHallExterior',
                tinyPngBase64,
                'image/png'
            );
        Test.stopTest();

        System.assertNotEquals(null, uploaded.imageUrl);
        System.assertNotEquals(null, uploaded.cacheKey);
    }

    private static String formatDate(Date value) {
        String month = String.valueOf(value.month()).leftPad(2, '0');
        String day = String.valueOf(value.day()).leftPad(2, '0');
        return value.year() + '-' + month + '-' + day;
    }
}
