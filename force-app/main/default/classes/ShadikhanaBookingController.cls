public with sharing class ShadikhanaBookingController {

    public class BookingRecord {
        @AuraEnabled public Id id;
        @AuraEnabled public String bookingNumber;
        @AuraEnabled public Date bookingDate;
        @AuraEnabled public Date endDate;
        @AuraEnabled public String dateRangeLabel;
        @AuraEnabled public String eventName;
        @AuraEnabled public String contactName;
        @AuraEnabled public String contactPhone;
        @AuraEnabled public String contactEmail;
        @AuraEnabled public String notes;
        @AuraEnabled public String eventDetails;
        @AuraEnabled public String startTime;
        @AuraEnabled public String endTime;
        @AuraEnabled public String timeRangeLabel;
        @AuraEnabled public Decimal dailyRate;
        @AuraEnabled public Integer numberOfDays;
        @AuraEnabled public Decimal estimatedAmount;
        @AuraEnabled public Decimal finalAmount;
        @AuraEnabled public String status;
        @AuraEnabled public String bookedByName;
        @AuraEnabled public Id bookedById;
        @AuraEnabled public String eventType;
        @AuraEnabled public Integer expectedGuestCount;
        @AuraEnabled public String decorationArrangement;
        @AuraEnabled public String cateringArrangement;
        @AuraEnabled public Decimal hallRentalAmount;
        @AuraEnabled public Decimal decorationCharge;
        @AuraEnabled public Decimal cateringCharge;
    }

    public class UserInfoWrapper {
        @AuraEnabled public Id userId;
        @AuraEnabled public String name;
        @AuraEnabled public String email;
        @AuraEnabled public String username;
        @AuraEnabled public Boolean isSystemAdmin;
        @AuraEnabled public Boolean isGuest;
        @AuraEnabled public String portalLoginPassword;
    }

    public class BannerRecord {
        @AuraEnabled public Id id;
        @AuraEnabled public String bannerNumber;
        @AuraEnabled public String title;
        @AuraEnabled public String message;
        @AuraEnabled public Boolean isActive;
        @AuraEnabled public String bannerStyle;
        @AuraEnabled public Integer sortOrder;
        @AuraEnabled public String cssClass;
    }

    public class PortalSettingsWrapper {
        @AuraEnabled public String adminMobileNumber;
        @AuraEnabled public String twilioFromNumber;
        @AuraEnabled public String twilioAccountSid;
        @AuraEnabled public Boolean twilioAuthTokenConfigured;
        @AuraEnabled public Boolean smsEnabled;
        @AuraEnabled public Decimal defaultDailyRate;
        @AuraEnabled public String portalAdminUsername;
        @AuraEnabled public String portalAdminPassword;
        @AuraEnabled public String portalLoginNotes;
        @AuraEnabled public String adminEmail;
        @AuraEnabled public Boolean emailEnabled;
        @AuraEnabled public String footerAdditionalPhone;
        @AuraEnabled public String portalSiteUrl;
        @AuraEnabled public String portalLoginUrl;
        @AuraEnabled public Integer hallSeatingCapacity;
        @AuraEnabled public Integer hallComfortableGuests;
        @AuraEnabled public Decimal hallDecorationCharge;
        @AuraEnabled public Decimal hallCateringChargePerGuest;
    }

    public class PortalLoginNotesWrapper {
        @AuraEnabled public String heading;
        @AuraEnabled public String message;
        @AuraEnabled public String adminUsername;
        @AuraEnabled public String adminPassword;
    }

    public class PortalFooterWrapper {
        @AuraEnabled public String contactNumber;
        @AuraEnabled public String additionalContactNumber;
        @AuraEnabled public String escalationEmail;
    }

    public class MonthlyReportEventRow {
        @AuraEnabled public Id bookingId;
        @AuraEnabled public String bookingNumber;
        @AuraEnabled public String fromDate;
        @AuraEnabled public String toDate;
        @AuraEnabled public String eventName;
        @AuraEnabled public String contactName;
        @AuraEnabled public String contactPhone;
        @AuraEnabled public String status;
        @AuraEnabled public String timeLabel;
        @AuraEnabled public Integer numberOfDays;
        @AuraEnabled public Decimal estimatedAmount;
        @AuraEnabled public Decimal finalAmount;
        @AuraEnabled public String dateRangeLabel;
    }

    public class MonthlyReportDayRow {
        @AuraEnabled public String isoDate;
        @AuraEnabled public String dayName;
        @AuraEnabled public String displayDate;
        @AuraEnabled public Integer dayNumber;
        @AuraEnabled public Integer eventCount;
        @AuraEnabled public Boolean hasEvents;
        @AuraEnabled public List<MonthlyReportEventRow> events;
    }

    public class MonthlyReportSummary {
        @AuraEnabled public String monthLabel;
        @AuraEnabled public String rangeLabel;
        @AuraEnabled public String rangeStartDate;
        @AuraEnabled public String rangeEndDate;
        @AuraEnabled public Integer year;
        @AuraEnabled public Integer month;
        @AuraEnabled public Integer totalBookings;
        @AuraEnabled public Integer confirmedCount;
        @AuraEnabled public Integer pendingCount;
        @AuraEnabled public Integer cancelledCount;
        @AuraEnabled public Decimal totalEstimatedAmount;
        @AuraEnabled public Decimal totalFinalAmount;
        @AuraEnabled public List<MonthlyReportDayRow> dayRows;
        @AuraEnabled public List<MonthlyReportEventRow> bookingRows;
    }

    @AuraEnabled(cacheable=true)
    public static UserInfoWrapper getCurrentUserInfo() {
        User currentUser = [
            SELECT Id, Name, Email, Username, UserType, Profile.Name
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];

        UserInfoWrapper info = new UserInfoWrapper();
        info.userId = currentUser.Id;
        info.name = currentUser.Name;
        info.email = currentUser.Email;
        info.username = currentUser.Username;
        info.isSystemAdmin = currentUser.Profile.Name == 'System Administrator';
        info.isGuest = currentUser.UserType == 'Guest';
        info.portalLoginPassword = info.isSystemAdmin
            ? resolvePortalAdminPassword(Shadikhana_Settings__c.getOrgDefaults())
            : null;
        return info;
    }

    @AuraEnabled(cacheable=true)
    public static List<BookingRecord> getBookings(Integer year, Integer month) {
        if (year == null || month == null) {
            return new List<BookingRecord>();
        }

        Date monthStart = Date.newInstance(year, month, 1);
        Date monthEnd = monthStart.addMonths(1).addDays(-1);
        return toBookingRecords(ShadikhanaBookingPublicAccess.queryCalendarBookingsOverlappingRange(monthStart, monthEnd));
    }

    @AuraEnabled(cacheable=true)
    public static List<String> getBookedDateStrings(Integer year, Integer month) {
        List<BookingRecord> bookings = getBookings(year, month);
        Set<String> bookedDates = new Set<String>();

        for (BookingRecord booking : bookings) {
            bookedDates.addAll(expandDateRange(booking.bookingDate, booking.endDate));
        }

        List<String> results = new List<String>(bookedDates);
        results.sort();
        return results;
    }

    @AuraEnabled(cacheable=true)
    public static List<BookingRecord> getMyBookings() {
        List<Shadikhana_Booking__c> records = [
            SELECT Id, Name, Booking_Date__c, End_Date__c, Event_Name__c, Contact_Name__c,
                   Contact_Phone__c, Contact_Email__c, Notes__c, Status__c, Booked_By__c,
                   Start_Time__c, End_Time__c, Event_Details__c, Daily_Rate__c, Number_of_Days__c,
                   Estimated_Amount__c, Final_Amount__c, Event_Type__c, Expected_Guest_Count__c,
                   Decoration_Arrangement__c, Catering_Arrangement__c, Hall_Rental_Amount__c,
                   Decoration_Charge__c, Catering_Charge__c
            FROM Shadikhana_Booking__c
            WHERE Booked_By__c = :UserInfo.getUserId()
            ORDER BY Booking_Date__c DESC
            LIMIT 200
        ];
        return toBookingRecords(records);
    }

    @AuraEnabled(cacheable=true)
    public static List<BookingRecord> getBookingData() {
        assertSystemAdministrator();
        Date rangeStart = Date.today().addMonths(-3);
        Date rangeEnd = Date.today().addMonths(12);
        return toBookingRecords(
            ShadikhanaBookingPublicAccess.queryCalendarBookingsOverlappingRange(rangeStart, rangeEnd)
        );
    }

    @AuraEnabled
    public static List<BookingRecord> getAdminBookings() {
        assertSystemAdministrator();
        List<Shadikhana_Booking__c> records = [
            SELECT Id, Name, Booking_Date__c, End_Date__c, Event_Name__c, Contact_Name__c,
                   Contact_Phone__c, Contact_Email__c, Notes__c, Status__c, Booked_By__c,
                   Start_Time__c, End_Time__c, Event_Details__c, Daily_Rate__c, Number_of_Days__c,
                   Estimated_Amount__c, Final_Amount__c, Event_Type__c, Expected_Guest_Count__c,
                   Decoration_Arrangement__c, Catering_Arrangement__c, Hall_Rental_Amount__c,
                   Decoration_Charge__c, Catering_Charge__c
            FROM Shadikhana_Booking__c
            LIMIT 500
        ];

        List<BookingRecord> results = toBookingRecords(records);
        results.sort(new BookingStatusPriorityComparator());
        return results;
    }

    @AuraEnabled(cacheable=true)
    public static Map<String, Decimal> getDailyRatesForMonth(Integer year, Integer month) {
        return ShadikhanaBookingPricing.getDailyRatesForMonth(year, month);
    }

    @AuraEnabled
    public static List<ShadikhanaBookingPricing.DateRateEntry> getAdminDateRateOverrides(
        Integer year,
        Integer month
    ) {
        assertSystemAdministrator();
        return ShadikhanaBookingPricing.getAdminDateRateOverrides(year, month);
    }

    @AuraEnabled
    public static ShadikhanaBookingPricing.DateRateEntry saveDateRateOverride(
        String isoDateStr,
        Decimal dailyRate
    ) {
        assertSystemAdministrator();
        return ShadikhanaBookingPricing.saveDateRateOverride(isoDateStr, dailyRate);
    }

    @AuraEnabled
    public static void deleteDateRateOverride(String isoDateStr) {
        assertSystemAdministrator();
        ShadikhanaBookingPricing.deleteDateRateOverride(isoDateStr);
    }

    @AuraEnabled
    public static List<ShadikhanaBookingPricing.DateRateEntry> saveDateRateOverrides(
        List<String> isoDateStrs,
        Decimal dailyRate
    ) {
        assertSystemAdministrator();
        return ShadikhanaBookingPricing.saveDateRateOverrides(isoDateStrs, dailyRate);
    }

    @AuraEnabled
    public static void deleteDateRateOverrides(List<String> isoDateStrs) {
        assertSystemAdministrator();
        ShadikhanaBookingPricing.deleteDateRateOverrides(isoDateStrs);
    }

    @AuraEnabled
    public static Decimal saveDefaultDailyRate(Decimal dailyRate) {
        assertSystemAdministrator();
        ShadikhanaBookingPricing.saveDefaultDailyRate(dailyRate);
        return ShadikhanaBookingPricing.getDefaultDailyRate();
    }

    @AuraEnabled(cacheable=true)
    public static Decimal getDailyRate() {
        return ShadikhanaBookingPricing.getDefaultDailyRate();
    }

    @AuraEnabled(cacheable=true)
    public static ShadikhanaBookingPricing.HallBookingConfig getHallBookingConfig() {
        return ShadikhanaBookingPricing.getHallBookingConfig();
    }

    @AuraEnabled(cacheable=true)
    public static ShadikhanaBookingPricing.PriceEstimate calculateBookingPrice(
        String startDateStr,
        String endDateStr,
        String startTime,
        String endTime,
        Integer expectedGuestCount,
        String decorationArrangement,
        String cateringArrangement
    ) {
        DateRange requestedRange = buildDateRange(startDateStr, endDateStr);
        if (requestedRange == null) {
            return null;
        }
        return ShadikhanaBookingPricing.calculatePriceWithServices(
            requestedRange.startDate,
            requestedRange.endDate,
            startTime,
            endTime,
            expectedGuestCount,
            decorationArrangement,
            cateringArrangement
        );
    }

    @AuraEnabled
    public static Boolean isDateRangeAvailable(String startDateStr, String endDateStr) {
        DateRange requestedRange = buildDateRange(startDateStr, endDateStr);
        if (requestedRange == null) {
            return false;
        }
        return !hasOverlappingActiveBooking(requestedRange.startDate, requestedRange.endDate, null);
    }

    @AuraEnabled
    public static BookingRecord createBooking(
        String bookingDateStr,
        String endDateStr,
        String eventName,
        String contactName,
        String contactPhone,
        String contactEmail,
        String notes,
        String eventStartTime,
        String eventEndTime,
        String eventDetails,
        String eventType,
        Integer expectedGuestCount,
        String decorationArrangement,
        String cateringArrangement
    ) {
        DateRange requestedRange = buildDateRange(bookingDateStr, endDateStr);
        if (requestedRange == null) {
            throw new AuraHandledException('Please select valid start and end dates.');
        }
        if (requestedRange.startDate < Date.today()) {
            throw new AuraHandledException('Booking start date cannot be in the past.');
        }
        if (String.isBlank(eventType)) {
            throw new AuraHandledException('Event type is required.');
        }
        if (expectedGuestCount == null || expectedGuestCount <= 0) {
            throw new AuraHandledException('Expected guest count is required.');
        }
        if (String.isBlank(decorationArrangement)) {
            throw new AuraHandledException('Decoration arrangement is required.');
        }
        if (String.isBlank(cateringArrangement)) {
            throw new AuraHandledException('Catering arrangement is required.');
        }
        if ('Other'.equalsIgnoreCase(eventType.trim()) && String.isBlank(eventName)) {
            throw new AuraHandledException('Please enter an event name for other event types.');
        }

        ShadikhanaBookingPricing.HallBookingConfig hallConfig = ShadikhanaBookingPricing.getHallBookingConfig();
        if (expectedGuestCount > hallConfig.seatingCapacity) {
            throw new AuraHandledException(
                'Expected guest count cannot exceed the hall seating capacity of ' +
                hallConfig.seatingCapacity +
                '.'
            );
        }

        String resolvedEventName = resolveEventName(eventType, eventName);
        if (String.isBlank(resolvedEventName) || String.isBlank(contactName)) {
            throw new AuraHandledException('Event name and contact name are required.');
        }
        if (String.isBlank(contactPhone) || String.isBlank(contactPhone.trim())) {
            throw new AuraHandledException('Contact phone is required.');
        }
        if (hasOverlappingActiveBooking(requestedRange.startDate, requestedRange.endDate, null)) {
            throw new AuraHandledException(
                'These dates already have a booking request or confirmed reservation. Please choose another date range.'
            );
        }

        ShadikhanaBookingPricing.validateEventDateTimeRange(
            requestedRange.startDate,
            requestedRange.endDate,
            eventStartTime,
            eventEndTime
        );

        String normalizedStartTime = ShadikhanaBookingPricing.normalizeTimeString(eventStartTime);
        String normalizedEndTime = ShadikhanaBookingPricing.normalizeTimeString(eventEndTime);

        ShadikhanaBookingPricing.PriceEstimate pricing = ShadikhanaBookingPricing.calculatePriceWithServices(
            requestedRange.startDate,
            requestedRange.endDate,
            normalizedStartTime,
            normalizedEndTime,
            expectedGuestCount,
            decorationArrangement,
            cateringArrangement
        );

        Shadikhana_Booking__c booking = new Shadikhana_Booking__c(
            Booking_Date__c = requestedRange.startDate,
            End_Date__c = requestedRange.endDate,
            Event_Name__c = resolvedEventName,
            Event_Type__c = eventType.trim(),
            Expected_Guest_Count__c = expectedGuestCount,
            Decoration_Arrangement__c = decorationArrangement.trim(),
            Catering_Arrangement__c = cateringArrangement.trim(),
            Contact_Name__c = contactName.trim(),
            Contact_Phone__c = contactPhone.trim(),
            Contact_Email__c = contactEmail,
            Notes__c = notes,
            Start_Time__c = normalizedStartTime,
            End_Time__c = normalizedEndTime,
            Event_Details__c = String.isBlank(eventDetails) ? null : eventDetails.trim(),
            Daily_Rate__c = pricing.dailyRate,
            Number_of_Days__c = pricing.numberOfDays,
            Hall_Rental_Amount__c = pricing.hallRentalAmount,
            Decoration_Charge__c = pricing.decorationCharge,
            Catering_Charge__c = pricing.cateringCharge,
            Estimated_Amount__c = pricing.estimatedAmount,
            Final_Amount__c = pricing.estimatedAmount,
            Status__c = 'Pending',
            Booked_By__c = UserInfo.getUserId()
        );

        try {
            insert booking;
        } catch (DmlException ex) {
            throw new AuraHandledException('Unable to create booking: ' + ex.getDmlMessage(0));
        }

        BookingRecord result = toWrapper(booking);
        result.bookedByName = UserInfo.getName();
        ShadikhanaBookingEmailService.notifyBookingRequestSubmitted(booking.Id);
        ShadikhanaBookingSmsService.notifyAdminNewBooking(booking.Id);
        ShadikhanaBookingSmsService.notifyRequesterBookingSubmitted(booking.Id);
        return result;
    }

    @AuraEnabled(cacheable=true)
    public static PortalSettingsWrapper getPortalSettings() {
        assertSystemAdministrator();
        Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();

        PortalSettingsWrapper wrapper = new PortalSettingsWrapper();
        if (settings != null) {
            wrapper.adminMobileNumber = String.isBlank(settings.Admin_Mobile_Number__c)
                ? '6364054881'
                : settings.Admin_Mobile_Number__c;
            wrapper.twilioFromNumber = settings.Twilio_From_Number__c;
            wrapper.twilioAccountSid = settings.Twilio_Account_SID__c;
            wrapper.twilioAuthTokenConfigured = String.isNotBlank(settings.Twilio_Auth_Token__c);
            wrapper.smsEnabled = settings.SMS_Enabled__c == true ||
                settings.Notifications_Enabled__c == true;
            wrapper.defaultDailyRate = settings.Default_Daily_Rate__c != null
                ? settings.Default_Daily_Rate__c
                : ShadikhanaBookingPricing.DEFAULT_DAILY_RATE;
            wrapper.portalAdminUsername = resolvePortalAdminUsername(settings);
            wrapper.portalAdminPassword = resolvePortalAdminPassword(settings);
            wrapper.portalLoginNotes = settings.Portal_Login_Notes__c;
            wrapper.adminEmail = resolveAdminEmail(settings);
            wrapper.emailEnabled = settings.Email_Enabled__c != false;
            wrapper.footerAdditionalPhone = resolveFooterAdditionalPhone(settings);
            wrapper.portalSiteUrl = resolvePortalSiteUrl(settings);
            wrapper.portalLoginUrl = resolvePortalLoginUrl(settings);
            applyHallSettings(wrapper, settings);
        } else {
            wrapper.adminMobileNumber = '6364054881';
            wrapper.twilioAuthTokenConfigured = false;
            wrapper.smsEnabled = true;
            wrapper.defaultDailyRate = ShadikhanaBookingPricing.DEFAULT_DAILY_RATE;
            wrapper.portalAdminUsername = resolvePortalAdminUsername(null);
            wrapper.portalAdminPassword = resolvePortalAdminPassword(null);
            wrapper.portalLoginNotes = null;
            wrapper.adminEmail = resolveAdminEmail(null);
            wrapper.emailEnabled = true;
            wrapper.footerAdditionalPhone = resolveFooterAdditionalPhone(null);
            wrapper.portalSiteUrl = resolvePortalSiteUrl(null);
            wrapper.portalLoginUrl = resolvePortalLoginUrl(null);
            applyHallSettings(wrapper, null);
        }
        return wrapper;
    }

    private static void applyHallSettings(PortalSettingsWrapper wrapper, Shadikhana_Settings__c settings) {
        ShadikhanaBookingPricing.HallBookingConfig hallConfig = ShadikhanaBookingPricing.getHallBookingConfig();
        wrapper.hallSeatingCapacity = hallConfig.seatingCapacity;
        wrapper.hallComfortableGuests = hallConfig.comfortableGuests;
        wrapper.hallDecorationCharge = hallConfig.decorationCharge;
        wrapper.hallCateringChargePerGuest = hallConfig.cateringChargePerGuest;
    }

    @TestVisible
    private static String resolveEventName(String eventType, String eventName) {
        if (String.isNotBlank(eventName)) {
            return eventName.trim();
        }
        return String.isBlank(eventType) ? null : eventType.trim();
    }

    @AuraEnabled(cacheable=true)
    public static PortalLoginNotesWrapper getPortalLoginNotes() {
        Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
        PortalLoginNotesWrapper wrapper = new PortalLoginNotesWrapper();
        wrapper.heading = 'Administrator login for Urdu Shadikhana';
        wrapper.message = settings != null && String.isNotBlank(settings.Portal_Login_Notes__c)
            ? settings.Portal_Login_Notes__c.trim()
            : 'Use the administrator username and password below to sign in and open the Administration section.';
        wrapper.adminUsername = resolvePortalAdminUsername(settings);
        wrapper.adminPassword = resolvePortalAdminPassword(settings);
        return wrapper;
    }

    private static String resolvePortalAdminUsername(Shadikhana_Settings__c settings) {
        if (settings != null && String.isNotBlank(settings.Portal_Admin_Username__c)) {
            return settings.Portal_Admin_Username__c.trim();
        }
        return '';
    }

    private static String resolvePortalAdminPassword(Shadikhana_Settings__c settings) {
        if (settings != null && String.isNotBlank(settings.Portal_Admin_Password__c)) {
            return settings.Portal_Admin_Password__c;
        }
        return '';
    }

    @AuraEnabled(cacheable=true)
    public static PortalFooterWrapper getPortalFooterInfo() {
        Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();

        PortalFooterWrapper wrapper = new PortalFooterWrapper();
        wrapper.contactNumber = settings != null && String.isNotBlank(settings.Admin_Mobile_Number__c)
            ? settings.Admin_Mobile_Number__c.trim()
            : '6364054881';
        wrapper.additionalContactNumber = resolveFooterAdditionalPhone(settings);
        wrapper.escalationEmail = resolveAdminEmail(settings);
        return wrapper;
    }

    @AuraEnabled
    public static PortalSettingsWrapper savePortalSettings(
        String adminMobileNumber,
        String twilioFromNumber,
        String twilioAccountSid,
        String twilioAuthToken,
        Boolean smsEnabled,
        String portalAdminUsername,
        String portalAdminPassword,
        String portalLoginNotes,
        String adminEmail,
        Boolean emailEnabled,
        String footerAdditionalPhone,
        String portalSiteUrl,
        String portalLoginUrl,
        Decimal defaultDailyRate,
        Integer hallSeatingCapacity,
        Integer hallComfortableGuests,
        Decimal hallDecorationCharge,
        Decimal hallCateringChargePerGuest
    ) {
        assertSystemAdministrator();

        Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
        if (settings == null || settings.Id == null) {
            settings = new Shadikhana_Settings__c();
            settings.SetupOwnerId = UserInfo.getOrganizationId();
        }

        settings.Admin_Mobile_Number__c = String.isBlank(adminMobileNumber)
            ? '6364054881'
            : adminMobileNumber.trim();
        settings.Twilio_From_Number__c = String.isBlank(twilioFromNumber) ? null : twilioFromNumber.trim();
        settings.Twilio_Account_SID__c = String.isBlank(twilioAccountSid) ? null : twilioAccountSid.trim();
        if (String.isNotBlank(twilioAuthToken)) {
            settings.Twilio_Auth_Token__c = twilioAuthToken.trim();
        }
        settings.SMS_Enabled__c = smsEnabled == null ? true : smsEnabled;
        settings.Notifications_Enabled__c = settings.SMS_Enabled__c;
        settings.Portal_Admin_Username__c = String.isBlank(portalAdminUsername)
            ? resolvePortalAdminUsername(null)
            : portalAdminUsername.trim();
        if (String.isNotBlank(portalAdminPassword)) {
            settings.Portal_Admin_Password__c = portalAdminPassword.trim();
        }
        settings.Portal_Login_Notes__c = String.isBlank(portalLoginNotes) ? null : portalLoginNotes.trim();
        settings.Admin_Email__c = String.isBlank(adminEmail)
            ? resolveAdminEmail(null)
            : adminEmail.trim();
        settings.Email_Enabled__c = emailEnabled == null ? true : emailEnabled;
        settings.Footer_Additional_Phone__c = String.isBlank(footerAdditionalPhone)
            ? resolveFooterAdditionalPhone(null)
            : footerAdditionalPhone.trim();
        settings.Portal_Site_URL__c = String.isBlank(portalSiteUrl)
            ? resolvePortalSiteUrl(null)
            : portalSiteUrl.trim();
        settings.Portal_Login_URL__c = String.isBlank(portalLoginUrl)
            ? resolvePortalLoginUrl(null)
            : portalLoginUrl.trim();
        if (defaultDailyRate != null && defaultDailyRate > 0) {
            settings.Default_Daily_Rate__c = defaultDailyRate;
        }
        if (hallSeatingCapacity != null && hallSeatingCapacity > 0) {
            settings.Hall_Seating_Capacity__c = hallSeatingCapacity;
        }
        if (hallComfortableGuests != null && hallComfortableGuests > 0) {
            settings.Hall_Comfortable_Guests__c = hallComfortableGuests;
        }
        if (hallDecorationCharge != null && hallDecorationCharge >= 0) {
            settings.Hall_Decoration_Charge__c = hallDecorationCharge;
        }
        if (hallCateringChargePerGuest != null && hallCateringChargePerGuest >= 0) {
            settings.Hall_Catering_Charge_Per_Guest__c = hallCateringChargePerGuest;
        }
        upsert settings;

        return getPortalSettings();
    }

    private static String resolveFooterAdditionalPhone(Shadikhana_Settings__c settings) {
        if (settings != null && String.isNotBlank(settings.Footer_Additional_Phone__c)) {
            return settings.Footer_Additional_Phone__c.trim();
        }
        return '9652741400';
    }

    private static String resolvePortalSiteUrl(Shadikhana_Settings__c settings) {
        if (settings != null && String.isNotBlank(settings.Portal_Site_URL__c)) {
            return settings.Portal_Site_URL__c.trim();
        }
        return 'https://shabbirtech4-dev-ed.develop.my.site.com/urdushadikhana';
    }

    private static String resolvePortalLoginUrl(Shadikhana_Settings__c settings) {
        if (settings != null && String.isNotBlank(settings.Portal_Login_URL__c)) {
            return settings.Portal_Login_URL__c.trim();
        }
        return 'https://shabbirtech4-dev-ed.develop.my.site.com/urdushadikhana/login';
    }

    private static String resolveAdminEmail(Shadikhana_Settings__c settings) {
        if (settings != null && String.isNotBlank(settings.Admin_Email__c)) {
            return settings.Admin_Email__c.trim();
        }
        return 'urdhushadikhanaa@gmail.com';
    }

    @AuraEnabled(cacheable=true)
    public static List<BannerRecord> getActiveBanners() {
        return toBannerRecords(ShadikhanaBookingPublicAccess.queryActiveBanners());
    }

    @AuraEnabled(cacheable=true)
    public static List<BannerRecord> getAdminBanners() {
        assertSystemAdministrator();
        List<Portal_Banner__c> records = [
            SELECT Id, Name, Title__c, Message__c, Is_Active__c, Banner_Style__c, Sort_Order__c
            FROM Portal_Banner__c
            ORDER BY Sort_Order__c ASC NULLS LAST, CreatedDate ASC
            LIMIT 100
        ];
        return toBannerRecords(records);
    }

    @AuraEnabled
    public static BannerRecord saveBanner(
        Id bannerId,
        String title,
        String message,
        Boolean isActive,
        String bannerStyle,
        Integer sortOrder
    ) {
        assertSystemAdministrator();

        if (String.isBlank(message)) {
            throw new AuraHandledException('Banner message is required.');
        }

        String normalizedStyle = normalizeBannerStyle(bannerStyle);
        Portal_Banner__c banner;

        if (bannerId == null) {
            banner = new Portal_Banner__c();
        } else {
            banner = [
                SELECT Id, Name, Title__c, Message__c, Is_Active__c, Banner_Style__c, Sort_Order__c
                FROM Portal_Banner__c
                WHERE Id = :bannerId
                LIMIT 1
            ];
        }

        banner.Title__c = String.isBlank(title) ? null : title.trim();
        banner.Message__c = message.trim();
        banner.Is_Active__c = isActive == null ? true : isActive;
        banner.Banner_Style__c = normalizedStyle;
        banner.Sort_Order__c = sortOrder == null ? 0 : sortOrder;

        try {
            upsert banner;
        } catch (DmlException ex) {
            throw new AuraHandledException('Unable to save banner: ' + ex.getDmlMessage(0));
        }

        banner = [
            SELECT Id, Name, Title__c, Message__c, Is_Active__c, Banner_Style__c, Sort_Order__c
            FROM Portal_Banner__c
            WHERE Id = :banner.Id
            LIMIT 1
        ];
        return toBannerRecord(banner);
    }

    @AuraEnabled
    public static void deleteBanner(Id bannerId) {
        assertSystemAdministrator();

        if (bannerId == null) {
            throw new AuraHandledException('Banner is required.');
        }

        Portal_Banner__c banner = [
            SELECT Id
            FROM Portal_Banner__c
            WHERE Id = :bannerId
            LIMIT 1
        ];

        try {
            delete banner;
        } catch (DmlException ex) {
            throw new AuraHandledException('Unable to delete banner: ' + ex.getDmlMessage(0));
        }
    }

    @AuraEnabled
    public static BookingRecord updateBookingStatus(Id bookingId, String status) {
        assertSystemAdministrator();

        if (bookingId == null || String.isBlank(status)) {
            throw new AuraHandledException('Booking and status are required.');
        }
        if (!new Set<String>{ 'Pending', 'Confirmed', 'Cancelled' }.contains(status)) {
            throw new AuraHandledException('Invalid booking status.');
        }

        Shadikhana_Booking__c booking = [
            SELECT Id, Name, Booking_Date__c, End_Date__c, Event_Name__c, Contact_Name__c,
                   Contact_Phone__c, Contact_Email__c, Notes__c, Status__c, Booked_By__c,
                   Start_Time__c, End_Time__c, Event_Details__c, Daily_Rate__c, Number_of_Days__c,
                   Estimated_Amount__c, Final_Amount__c, Event_Type__c, Expected_Guest_Count__c,
                   Decoration_Arrangement__c, Catering_Arrangement__c, Hall_Rental_Amount__c,
                   Decoration_Charge__c, Catering_Charge__c
            FROM Shadikhana_Booking__c
            WHERE Id = :bookingId
            LIMIT 1
        ];

        if (booking.Status__c == 'Confirmed') {
            throw new AuraHandledException(
                'Confirmed bookings cannot be changed or cancelled.'
            );
        }

        if (status == 'Confirmed') {
            Date confirmedStart = booking.Booking_Date__c;
            Date confirmedEnd = booking.End_Date__c != null ? booking.End_Date__c : confirmedStart;
            if (hasOverlappingConfirmedBooking(confirmedStart, confirmedEnd, booking.Id)) {
                throw new AuraHandledException(
                    'Cannot confirm this request because the dates overlap another confirmed booking.'
                );
            }
        }

        if (status == 'Cancelled') {
            booking.Final_Amount__c = 0;
        }

        booking.Status__c = status;
        update booking;

        if (status == 'Confirmed' || status == 'Cancelled') {
            ShadikhanaBookingEmailService.notifyBookingStatusChanged(booking.Id, status);
        }
        if (status == 'Confirmed') {
            ShadikhanaBookingSmsService.notifyRequesterBookingConfirmed(booking.Id);
        }
        if (status == 'Cancelled') {
            ShadikhanaBookingSmsService.notifyRequesterBookingCancelled(booking.Id);
        }

        List<BookingRecord> records = toBookingRecords(new List<Shadikhana_Booking__c>{ booking });
        return records[0];
    }

    @AuraEnabled
    public static BookingRecord updateBookingPrice(Id bookingId, Decimal finalAmount) {
        assertSystemAdministrator();

        if (bookingId == null) {
            throw new AuraHandledException('Booking is required.');
        }
        if (finalAmount == null || finalAmount < 0) {
            throw new AuraHandledException('Final amount must be zero or greater.');
        }

        Shadikhana_Booking__c booking = [
            SELECT Id, Name, Booking_Date__c, End_Date__c, Event_Name__c, Contact_Name__c,
                   Contact_Phone__c, Contact_Email__c, Notes__c, Status__c, Booked_By__c,
                   Start_Time__c, End_Time__c, Event_Details__c, Daily_Rate__c, Number_of_Days__c,
                   Estimated_Amount__c, Final_Amount__c, Event_Type__c, Expected_Guest_Count__c,
                   Decoration_Arrangement__c, Catering_Arrangement__c, Hall_Rental_Amount__c,
                   Decoration_Charge__c, Catering_Charge__c
            FROM Shadikhana_Booking__c
            WHERE Id = :bookingId
            LIMIT 1
        ];

        if (booking.Status__c == 'Cancelled') {
            throw new AuraHandledException('Final amount cannot be changed for cancelled bookings.');
        }
        if (booking.Status__c == 'Confirmed') {
            throw new AuraHandledException('Final amount cannot be changed for confirmed bookings.');
        }

        booking.Final_Amount__c = finalAmount.setScale(2);
        update booking;

        List<BookingRecord> records = toBookingRecords(new List<Shadikhana_Booking__c>{ booking });
        return records[0];
    }

    @AuraEnabled(cacheable=true)
    public static MonthlyReportSummary getMonthlyAdminReport(Integer year, Integer month) {
        if (year == null || month == null || month < 1 || month > 12) {
            throw new AuraHandledException('Please select a valid report month.');
        }

        Date monthStart = Date.newInstance(year, month, 1);
        Date monthEnd = monthStart.addMonths(1).addDays(-1);
        return getAdminBookingReport(formatDate(monthStart), formatDate(monthEnd));
    }

    @AuraEnabled(cacheable=true)
    public static MonthlyReportSummary getAdminBookingReport(String startDateStr, String endDateStr) {
        assertSystemAdministrator();

        DateRange requestedRange = buildDateRange(startDateStr, endDateStr);
        if (requestedRange == null) {
            throw new AuraHandledException('Please select valid start and end dates.');
        }

        validateReportDateRange(requestedRange.startDate, requestedRange.endDate);
        return buildAdminBookingReport(requestedRange.startDate, requestedRange.endDate);
    }

    private static void validateReportDateRange(Date rangeStart, Date rangeEnd) {
        if (rangeEnd < rangeStart) {
            throw new AuraHandledException('Report end date cannot be before start date.');
        }
        if (rangeStart.addMonths(6) < rangeEnd) {
            throw new AuraHandledException('Report range cannot exceed 6 months.');
        }
    }

    private static MonthlyReportSummary buildAdminBookingReport(Date rangeStart, Date rangeEnd) {
        List<Shadikhana_Booking__c> bookings = [
            SELECT Id, Name, Booking_Date__c, End_Date__c, Event_Name__c, Contact_Name__c,
                   Contact_Phone__c, Contact_Email__c, Notes__c, Status__c, Booked_By__c,
                   Start_Time__c, End_Time__c, Event_Details__c, Daily_Rate__c, Number_of_Days__c,
                   Estimated_Amount__c, Final_Amount__c, Event_Type__c, Expected_Guest_Count__c,
                   Decoration_Arrangement__c, Catering_Arrangement__c, Hall_Rental_Amount__c,
                   Decoration_Charge__c, Catering_Charge__c
            FROM Shadikhana_Booking__c
            WHERE Booking_Date__c <= :rangeEnd
              AND (
                  End_Date__c >= :rangeStart
                  OR (End_Date__c = NULL AND Booking_Date__c >= :rangeStart)
              )
            ORDER BY Booking_Date__c ASC, Name ASC
        ];

        MonthlyReportSummary summary = new MonthlyReportSummary();
        summary.year = rangeStart.year();
        summary.month = rangeStart.month();
        summary.rangeStartDate = formatDate(rangeStart);
        summary.rangeEndDate = formatDate(rangeEnd);
        summary.rangeLabel = summary.rangeStartDate + ' to ' + summary.rangeEndDate;
        summary.monthLabel = summary.rangeLabel;
        summary.totalBookings = bookings.size();
        summary.confirmedCount = 0;
        summary.pendingCount = 0;
        summary.cancelledCount = 0;
        summary.totalEstimatedAmount = 0;
        summary.totalFinalAmount = 0;

        for (Shadikhana_Booking__c booking : bookings) {
            if (booking.Status__c == 'Confirmed') {
                summary.confirmedCount++;
            } else if (booking.Status__c == 'Pending') {
                summary.pendingCount++;
            } else if (booking.Status__c == 'Cancelled') {
                summary.cancelledCount++;
            }

            if (booking.Estimated_Amount__c != null) {
                summary.totalEstimatedAmount += booking.Estimated_Amount__c;
            }
            if (booking.Final_Amount__c != null) {
                summary.totalFinalAmount += booking.Final_Amount__c;
            } else if (booking.Estimated_Amount__c != null) {
                summary.totalFinalAmount += booking.Estimated_Amount__c;
            }
        }

        summary.totalEstimatedAmount = summary.totalEstimatedAmount.setScale(2);
        summary.totalFinalAmount = summary.totalFinalAmount.setScale(2);
        summary.bookingRows = buildReportBookingRows(bookings);
        summary.dayRows = buildReportDayRows(rangeStart, rangeEnd, bookings);
        return summary;
    }

    private class BookingStatusPriorityComparator implements System.Comparator<BookingRecord> {
        public Integer compare(BookingRecord first, BookingRecord second) {
            Integer firstOrder = getStatusPriority(first.status);
            Integer secondOrder = getStatusPriority(second.status);
            if (firstOrder != secondOrder) {
                return firstOrder - secondOrder;
            }

            if (first.bookingDate == null && second.bookingDate == null) {
                return 0;
            }
            if (first.bookingDate == null) {
                return 1;
            }
            if (second.bookingDate == null) {
                return -1;
            }
            if (first.bookingDate == second.bookingDate) {
                return 0;
            }
            return first.bookingDate < second.bookingDate ? -1 : 1;
        }
    }

    private static Integer getStatusPriority(String status) {
        if (status == 'Pending') {
            return 0;
        }
        if (status == 'Confirmed') {
            return 1;
        }
        if (status == 'Cancelled') {
            return 2;
        }
        return 3;
    }

    private class DateRange {
        public Date startDate;
        public Date endDate;
    }

    private static DateRange buildDateRange(String startDateStr, String endDateStr) {
        Date startDate = parseDate(startDateStr);
        if (startDate == null) {
            return null;
        }

        Date endDate = String.isBlank(endDateStr) ? startDate : parseDate(endDateStr);
        if (endDate == null) {
            return null;
        }
        if (endDate < startDate) {
            throw new AuraHandledException('End date cannot be before start date.');
        }

        DateRange range = new DateRange();
        range.startDate = startDate;
        range.endDate = endDate;
        return range;
    }

    private static Boolean hasOverlappingConfirmedBooking(Date startDate, Date endDate, Id excludeBookingId) {
        return ShadikhanaBookingPublicAccess.countOverlappingConfirmedBookings(startDate, endDate, excludeBookingId) > 0;
    }

    private static Boolean hasOverlappingActiveBooking(Date startDate, Date endDate, Id excludeBookingId) {
        List<Shadikhana_Booking__c> overlappingBookings = [
            SELECT Id, Status__c, Booking_Date__c, End_Date__c, End_Time__c
            FROM Shadikhana_Booking__c
            WHERE Status__c IN ('Pending', 'Confirmed')
              AND Booking_Date__c <= :endDate
              AND (
                  End_Date__c >= :startDate
                  OR (End_Date__c = NULL AND Booking_Date__c >= :startDate)
              )
        ];

        for (Shadikhana_Booking__c booking : overlappingBookings) {
            if (excludeBookingId != null && booking.Id == excludeBookingId) {
                continue;
            }
            if (booking.Status__c == 'Pending') {
                return true;
            }
            if (confirmedBookingBlocksRange(booking, startDate, endDate)) {
                return true;
            }
        }

        return false;
    }

    private static Boolean confirmedBookingBlocksRange(
        Shadikhana_Booking__c booking,
        Date rangeStart,
        Date rangeEnd
    ) {
        Date bookingStart = booking.Booking_Date__c;
        Date bookingEnd = booking.End_Date__c != null ? booking.End_Date__c : bookingStart;
        Date overlapStart = rangeStart > bookingStart ? rangeStart : bookingStart;
        Date overlapEnd = rangeEnd < bookingEnd ? rangeEnd : bookingEnd;

        if (overlapStart > overlapEnd) {
            return false;
        }

        Date currentDay = overlapStart;
        while (currentDay <= overlapEnd) {
            if (!confirmedDayAllowsOverlap(booking, currentDay, rangeStart, rangeEnd)) {
                return true;
            }
            currentDay = currentDay.addDays(1);
        }

        return false;
    }

    private static Boolean confirmedDayAllowsOverlap(
        Shadikhana_Booking__c booking,
        Date day,
        Date rangeStart,
        Date rangeEnd
    ) {
        Date bookingEnd = booking.End_Date__c != null ? booking.End_Date__c : booking.Booking_Date__c;
        if (
            day == rangeEnd &&
            day == bookingEnd &&
            ShadikhanaBookingPricing.endsByVenueTurnoverTime(booking.End_Time__c)
        ) {
            return true;
        }

        return false;
    }

    private static List<Shadikhana_Booking__c> queryBookingsOverlappingRange(Date rangeStart, Date rangeEnd) {
        return ShadikhanaBookingPublicAccess.queryConfirmedBookingsOverlappingRange(rangeStart, rangeEnd);
    }

    private static List<BookingRecord> toBookingRecords(List<Shadikhana_Booking__c> records) {
        Map<Id, String> bookedByNames = getBookedByNames(records);
        List<BookingRecord> results = new List<BookingRecord>();

        for (Shadikhana_Booking__c record : records) {
            BookingRecord wrapper = toWrapper(record);
            wrapper.bookedByName = bookedByNames.get(record.Booked_By__c);
            results.add(wrapper);
        }
        return results;
    }

    private static BookingRecord toWrapper(Shadikhana_Booking__c record) {
        Date effectiveEndDate = record.End_Date__c != null ? record.End_Date__c : record.Booking_Date__c;

        BookingRecord wrapper = new BookingRecord();
        wrapper.id = record.Id;
        wrapper.bookingNumber = record.Name;
        wrapper.bookingDate = record.Booking_Date__c;
        wrapper.endDate = effectiveEndDate;
        wrapper.dateRangeLabel = buildDateRangeLabel(record.Booking_Date__c, effectiveEndDate);
        wrapper.eventName = record.Event_Name__c;
        wrapper.contactName = record.Contact_Name__c;
        wrapper.contactPhone = record.Contact_Phone__c;
        wrapper.contactEmail = record.Contact_Email__c;
        wrapper.notes = record.Notes__c;
        wrapper.eventDetails = record.Event_Details__c;
        wrapper.startTime = record.Start_Time__c;
        wrapper.endTime = record.End_Time__c;
        wrapper.timeRangeLabel = buildTimeRangeLabel(record.Start_Time__c, record.End_Time__c);
        wrapper.dailyRate = record.Daily_Rate__c;
        wrapper.numberOfDays = record.Number_of_Days__c == null
            ? null
            : Integer.valueOf(String.valueOf(record.Number_of_Days__c));
        wrapper.estimatedAmount = record.Estimated_Amount__c;
        wrapper.finalAmount = record.Final_Amount__c;
        wrapper.eventType = record.Event_Type__c;
        wrapper.expectedGuestCount = record.Expected_Guest_Count__c == null
            ? null
            : Integer.valueOf(String.valueOf(record.Expected_Guest_Count__c));
        wrapper.decorationArrangement = record.Decoration_Arrangement__c;
        wrapper.cateringArrangement = record.Catering_Arrangement__c;
        wrapper.hallRentalAmount = record.Hall_Rental_Amount__c;
        wrapper.decorationCharge = record.Decoration_Charge__c;
        wrapper.cateringCharge = record.Catering_Charge__c;
        wrapper.status = record.Status__c;
        wrapper.bookedById = record.Booked_By__c;
        wrapper.bookedByName = null;
        return wrapper;
    }

    private static String buildTimeRangeLabel(String startTime, String endTime) {
        if (String.isBlank(startTime) && String.isBlank(endTime)) {
            return null;
        }

        String startLabel = formatTimeAmPm(startTime);
        String endLabel = formatTimeAmPm(endTime);

        if (String.isBlank(startLabel) && String.isBlank(endLabel)) {
            return null;
        }
        if (String.isBlank(startLabel)) {
            return 'Until ' + endLabel;
        }
        if (String.isBlank(endLabel)) {
            return 'From ' + startLabel;
        }
        return startLabel + ' to ' + endLabel;
    }

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

    private static List<MonthlyReportEventRow> buildReportBookingRows(List<Shadikhana_Booking__c> bookings) {
        List<MonthlyReportEventRow> bookingRows = new List<MonthlyReportEventRow>();

        for (Shadikhana_Booking__c booking : bookings) {
            bookingRows.add(buildReportBookingRow(booking));
        }

        return bookingRows;
    }

    private static MonthlyReportEventRow buildReportBookingRow(Shadikhana_Booking__c booking) {
        Date bookingStart = booking.Booking_Date__c;
        Date bookingEnd = booking.End_Date__c != null ? booking.End_Date__c : bookingStart;

        MonthlyReportEventRow eventRow = new MonthlyReportEventRow();
        eventRow.bookingId = booking.Id;
        eventRow.bookingNumber = booking.Name;
        eventRow.fromDate = formatDate(bookingStart);
        eventRow.toDate = formatDate(bookingEnd);
        eventRow.eventName = booking.Event_Name__c;
        eventRow.contactName = booking.Contact_Name__c;
        eventRow.contactPhone = booking.Contact_Phone__c;
        eventRow.status = booking.Status__c;
        eventRow.timeLabel = buildTimeRangeLabel(booking.Start_Time__c, booking.End_Time__c);
        eventRow.numberOfDays = booking.Number_of_Days__c != null
            ? Integer.valueOf(booking.Number_of_Days__c)
            : null;
        eventRow.estimatedAmount = booking.Estimated_Amount__c;
        eventRow.finalAmount = booking.Final_Amount__c != null
            ? booking.Final_Amount__c
            : booking.Estimated_Amount__c;
        eventRow.dateRangeLabel = buildDateRangeLabel(bookingStart, bookingEnd);
        return eventRow;
    }

    private static List<MonthlyReportDayRow> buildReportDayRows(
        Date rangeStart,
        Date rangeEnd,
        List<Shadikhana_Booking__c> bookings
    ) {
        Map<String, List<MonthlyReportEventRow>> eventsByDate = new Map<String, List<MonthlyReportEventRow>>();
        List<MonthlyReportDayRow> dayRows = new List<MonthlyReportDayRow>();

        for (Shadikhana_Booking__c booking : bookings) {
            Date bookingStart = booking.Booking_Date__c;
            Date bookingEnd = booking.End_Date__c != null ? booking.End_Date__c : bookingStart;

            for (String isoDate : expandDateRange(bookingStart, bookingEnd)) {
                Date reportDay = parseDate(isoDate);
                if (reportDay == null || reportDay < rangeStart || reportDay > rangeEnd) {
                    continue;
                }

                if (!eventsByDate.containsKey(isoDate)) {
                    eventsByDate.put(isoDate, new List<MonthlyReportEventRow>());
                }

                MonthlyReportEventRow eventRow = buildReportBookingRow(booking);
                eventRow.timeLabel = buildDayTimeLabel(booking, reportDay);
                eventsByDate.get(isoDate).add(eventRow);
            }
        }

        Date currentDay = rangeStart;
        while (currentDay <= rangeEnd) {
            String isoDate = formatDate(currentDay);
            List<MonthlyReportEventRow> dayEvents = eventsByDate.containsKey(isoDate)
                ? eventsByDate.get(isoDate)
                : new List<MonthlyReportEventRow>();

            if (!dayEvents.isEmpty()) {
                Datetime dayDateTime = Datetime.newInstance(
                    currentDay.year(),
                    currentDay.month(),
                    currentDay.day()
                );

                MonthlyReportDayRow dayRow = new MonthlyReportDayRow();
                dayRow.isoDate = isoDate;
                dayRow.dayNumber = currentDay.day();
                dayRow.dayName = dayDateTime.format('EEEE');
                dayRow.displayDate = dayDateTime.format('dd MMM yyyy');
                dayRow.events = dayEvents;
                dayRow.eventCount = dayEvents.size();
                dayRow.hasEvents = true;
                dayRows.add(dayRow);
            }

            currentDay = currentDay.addDays(1);
        }

        return dayRows;
    }

    private static String buildDayTimeLabel(Shadikhana_Booking__c booking, Date reportDay) {
        Date bookingStart = booking.Booking_Date__c;
        Date bookingEnd = booking.End_Date__c != null ? booking.End_Date__c : bookingStart;

        if (reportDay == bookingStart && reportDay == bookingEnd) {
            String timeRange = buildTimeRangeLabel(booking.Start_Time__c, booking.End_Time__c);
            return String.isBlank(timeRange) ? 'All day' : timeRange;
        }
        if (reportDay == bookingStart) {
            return String.isBlank(booking.Start_Time__c)
                ? 'From start date'
                : 'From ' + booking.Start_Time__c;
        }
        if (reportDay == bookingEnd) {
            return String.isBlank(booking.End_Time__c)
                ? 'Until end date'
                : 'Until ' + booking.End_Time__c;
        }
        return 'Full day';
    }

    private static String buildDateRangeLabel(Date startDate, Date endDate) {
        if (startDate == null) {
            return null;
        }
        if (endDate == null || endDate == startDate) {
            return formatDate(startDate);
        }
        return formatDate(startDate) + ' to ' + formatDate(endDate);
    }

    private static List<String> expandDateRange(Date startDate, Date endDate) {
        List<String> dates = new List<String>();
        if (startDate == null) {
            return dates;
        }

        Date effectiveEndDate = endDate != null ? endDate : startDate;
        Date currentDate = startDate;
        while (currentDate <= effectiveEndDate) {
            dates.add(formatDate(currentDate));
            currentDate = currentDate.addDays(1);
        }
        return dates;
    }

    private static Map<Id, String> getBookedByNames(List<Shadikhana_Booking__c> records) {
        Set<Id> userIds = new Set<Id>();
        for (Shadikhana_Booking__c record : records) {
            if (record.Booked_By__c != null) {
                userIds.add(record.Booked_By__c);
            }
        }

        Map<Id, String> namesById = new Map<Id, String>();
        if (userIds.isEmpty()) {
            return namesById;
        }

        for (User userRecord : [SELECT Id, Name FROM User WHERE Id IN :userIds]) {
            namesById.put(userRecord.Id, userRecord.Name);
        }
        return namesById;
    }

    private static void assertSystemAdministrator() {
        if (!getCurrentUserInfo().isSystemAdmin) {
            throw new AuraHandledException('Only System Administrators can access this section.');
        }
    }

    private static List<BannerRecord> toBannerRecords(List<Portal_Banner__c> records) {
        List<BannerRecord> results = new List<BannerRecord>();
        for (Portal_Banner__c record : records) {
            results.add(toBannerRecord(record));
        }
        return results;
    }

    private static List<Portal_Banner__c> filterBannersWithMessage(List<Portal_Banner__c> records) {
        List<Portal_Banner__c> filtered = new List<Portal_Banner__c>();
        for (Portal_Banner__c record : records) {
            if (String.isNotBlank(record.Message__c)) {
                filtered.add(record);
            }
        }
        return filtered;
    }

    private static BannerRecord toBannerRecord(Portal_Banner__c record) {
        String style = normalizeBannerStyle(record.Banner_Style__c);

        BannerRecord wrapper = new BannerRecord();
        wrapper.id = record.Id;
        wrapper.bannerNumber = record.Name;
        wrapper.title = record.Title__c;
        wrapper.message = record.Message__c;
        wrapper.isActive = record.Is_Active__c;
        wrapper.bannerStyle = style;
        wrapper.sortOrder = record.Sort_Order__c == null ? 0 : Integer.valueOf(record.Sort_Order__c);
        wrapper.cssClass = 'portal-banner portal-banner_' + style.toLowerCase();
        return wrapper;
    }

    private static String normalizeBannerStyle(String bannerStyle) {
        Set<String> allowedStyles = new Set<String>{ 'Info', 'Warning', 'Success', 'Alert' };
        if (String.isBlank(bannerStyle) || !allowedStyles.contains(bannerStyle)) {
            return 'Info';
        }
        return bannerStyle;
    }

    private static Date parseDate(String dateStr) {
        if (String.isBlank(dateStr)) {
            return null;
        }
        try {
            List<String> parts = dateStr.split('-');
            if (parts.size() != 3) {
                return null;
            }
            return Date.newInstance(
                Integer.valueOf(parts[0]),
                Integer.valueOf(parts[1]),
                Integer.valueOf(parts[2])
            );
        } catch (Exception ex) {
            return null;
        }
    }

    private static String formatDate(Date value) {
        if (value == null) {
            return null;
        }
        String month = String.valueOf(value.month()).leftPad(2, '0');
        String day = String.valueOf(value.day()).leftPad(2, '0');
        return value.year() + '-' + month + '-' + day;
    }

    @AuraEnabled(cacheable=true)
    public static ShadikhanaPortalBrandingService.PortalBrandingConfig getPortalBrandingConfig() {
        return ShadikhanaPortalBrandingService.getPortalBrandingConfig();
    }

    @AuraEnabled
    public static ShadikhanaPortalBrandingService.PortalBrandingConfig savePortalBrandingConfig(
        String secretKey,
        String venueName,
        String footerPhone,
        String footerAdditionalPhone,
        String footerEmail,
        String headerAddressLine,
        String fullAddress,
        Integer hallSeatingCapacity,
        Integer hallComfortableGuests
    ) {
        assertSystemAdministrator();

        ShadikhanaPortalBrandingService.BrandingSaveRequest request =
            new ShadikhanaPortalBrandingService.BrandingSaveRequest();
        request.venueName = venueName;
        request.footerPhone = footerPhone;
        request.footerAdditionalPhone = footerAdditionalPhone;
        request.footerEmail = footerEmail;
        request.headerAddressLine = headerAddressLine;
        request.fullAddress = fullAddress;
        request.seatingCapacity = hallSeatingCapacity;
        request.comfortableGuests = hallComfortableGuests;
        return ShadikhanaPortalBrandingService.savePortalBrandingConfig(secretKey, request);
    }

    @AuraEnabled
    public static ShadikhanaPortalBrandingService.GalleryImageConfig uploadPortalGalleryImage(
        String secretKey,
        String resourceName,
        String base64Data,
        String contentType
    ) {
        assertSystemAdministrator();
        return ShadikhanaPortalBrandingService.uploadPortalGalleryImage(
            secretKey,
            resourceName,
            base64Data,
            contentType
        );
    }
}
