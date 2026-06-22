@IsTest
private class ShadikhanaBookingPricingTest {

    @IsTest
    static void testMultiDayPricing() {
        Date startDate = Date.today().addDays(10);
        Date endDate = startDate.addDays(2);

        ShadikhanaBookingPricing.PriceEstimate estimate =
            ShadikhanaBookingPricing.calculatePrice(startDate, endDate, null, null);

        System.assertEquals(3, estimate.numberOfDays);
        System.assertEquals(8000, estimate.dailyRate);
        System.assertEquals(24000, estimate.estimatedAmount);
    }

    @IsTest
    static void testSameDayHalfDayPricing() {
        Date bookingDate = Date.today().addDays(10);

        ShadikhanaBookingPricing.PriceEstimate estimate =
            ShadikhanaBookingPricing.calculatePrice(bookingDate, bookingDate, '09:00', '12:00');

        System.assertEquals(1, estimate.numberOfDays);
        System.assertEquals(0.5, estimate.timeMultiplier);
        System.assertEquals(4000, estimate.estimatedAmount);
    }

    @IsTest
    static void testSameDayPartialDayPricing() {
        Date bookingDate = Date.today().addDays(10);

        ShadikhanaBookingPricing.PriceEstimate estimate =
            ShadikhanaBookingPricing.calculatePrice(bookingDate, bookingDate, '09:00', '16:00');

        System.assertEquals(0.75, estimate.timeMultiplier);
        System.assertEquals(6000, estimate.estimatedAmount);
    }

    @IsTest
    static void testSameDayFullDayWhenMoreThanEightHours() {
        Date bookingDate = Date.today().addDays(10);

        ShadikhanaBookingPricing.PriceEstimate estimate =
            ShadikhanaBookingPricing.calculatePrice(bookingDate, bookingDate, '08:00', '17:00');

        System.assertEquals(1, estimate.timeMultiplier);
        System.assertEquals(8000, estimate.estimatedAmount);
    }

    @IsTest
    static void testMultiDayTimedPricingFullDaysWhenOverEightHours() {
        Date startDate = Date.today().addDays(10);
        Date endDate = startDate.addDays(1);

        ShadikhanaBookingPricing.PriceEstimate estimate =
            ShadikhanaBookingPricing.calculatePrice(startDate, endDate, '09:00', '17:00');

        System.assertEquals(2, estimate.numberOfDays);
        System.assertEquals(16000, estimate.estimatedAmount);
    }

    @IsTest
    static void testMultiDayReducedRatesWhenEightOrFewerHours() {
        Date startDate = Date.today().addDays(10);
        Date endDate = startDate.addDays(1);

        ShadikhanaBookingPricing.PriceEstimate estimate =
            ShadikhanaBookingPricing.calculatePrice(startDate, endDate, '20:00', '06:00');

        System.assertEquals(10000, estimate.estimatedAmount);
    }

    @IsTest
    static void testDateSpecificRateOverride() {
        Date bookingDate = Date.today().addDays(12);
        ShadikhanaBookingPricing.saveDateRateOverride(formatIsoDate(bookingDate), 10000);

        ShadikhanaBookingPricing.PriceEstimate estimate =
            ShadikhanaBookingPricing.calculatePrice(bookingDate, bookingDate, null, null);

        System.assertEquals(10000, estimate.estimatedAmount);
        System.assertEquals(10000, estimate.dailyRate);

        ShadikhanaBookingPricing.deleteDateRateOverride(formatIsoDate(bookingDate));
        ShadikhanaBookingPricing.PriceEstimate defaultEstimate =
            ShadikhanaBookingPricing.calculatePrice(bookingDate, bookingDate, null, null);
        System.assertEquals(8000, defaultEstimate.estimatedAmount);
    }

    @IsTest
    static void testGetDailyRatesForMonthUsesDefaultAndOverride() {
        Date monthDate = Date.today().addDays(15);
        ShadikhanaBookingPricing.saveDateRateOverride(formatIsoDate(monthDate), 9500);

        Map<String, Decimal> monthRates = ShadikhanaBookingPricing.getDailyRatesForMonth(
            monthDate.year(),
            monthDate.month()
        );

        System.assertEquals(9500, monthRates.get(formatIsoDate(monthDate)));
        System.assertEquals(8000, monthRates.get(formatIsoDate(monthDate.addDays(1))));
    }

    @IsTest
    static void testSaveDefaultDailyRate() {
        ShadikhanaBookingPricing.saveDefaultDailyRate(9000);
        System.assertEquals(9000, ShadikhanaBookingPricing.getDefaultDailyRate());
    }

    @IsTest
    static void testBulkDateRateOverrides() {
        Date firstDate = Date.today().addDays(18);
        Date secondDate = firstDate.addDays(2);
        List<String> isoDates = new List<String>{
            formatIsoDate(firstDate),
            formatIsoDate(secondDate)
        };

        List<ShadikhanaBookingPricing.DateRateEntry> saved =
            ShadikhanaBookingPricing.saveDateRateOverrides(isoDates, 11000);
        System.assertEquals(2, saved.size());

        Map<String, Decimal> monthRates = ShadikhanaBookingPricing.getDailyRatesForMonth(
            firstDate.year(),
            firstDate.month()
        );
        System.assertEquals(11000, monthRates.get(formatIsoDate(firstDate)));
        System.assertEquals(11000, monthRates.get(formatIsoDate(secondDate)));

        ShadikhanaBookingPricing.deleteDateRateOverrides(isoDates);
        monthRates = ShadikhanaBookingPricing.getDailyRatesForMonth(
            firstDate.year(),
            firstDate.month()
        );
        System.assertEquals(8000, monthRates.get(formatIsoDate(firstDate)));
    }

    @IsTest
    static void testDeleteDateRateBlockedByActiveBooking() {
        Date bookingDate = Date.today().addDays(14);
        Id userId = UserInfo.getUserId();

        ShadikhanaBookingPricing.saveDateRateOverride(formatIsoDate(bookingDate), 9500);

        insert new Shadikhana_Booking__c(
            Booking_Date__c = bookingDate,
            Event_Name__c = 'Blocked Pricing Delete',
            Contact_Name__c = 'Blocked User',
            Contact_Phone__c = '9876543210',
            Status__c = 'Pending',
            Booked_By__c = userId
        );

        Boolean caught = false;
        try {
            ShadikhanaBookingPricing.deleteDateRateOverride(formatIsoDate(bookingDate));
        } catch (AuraHandledException ex) {
            caught = true;
        }

        System.assertEquals(true, caught);
    }

    @IsTest
    static void testSaveDateRateBlockedByActiveBooking() {
        Date bookingDate = Date.today().addDays(16);
        Id userId = UserInfo.getUserId();

        insert new Shadikhana_Booking__c(
            Booking_Date__c = bookingDate,
            Event_Name__c = 'Blocked Pricing Save',
            Contact_Name__c = 'Blocked User',
            Contact_Phone__c = '9876543210',
            Status__c = 'Confirmed',
            Booked_By__c = userId
        );

        Boolean caught = false;
        try {
            ShadikhanaBookingPricing.saveDateRateOverride(formatIsoDate(bookingDate), 9500);
        } catch (AuraHandledException ex) {
            caught = true;
        }

        System.assertEquals(true, caught);
    }

    @IsTest
    static void testInvalidDateRateOverrideValidation() {
        Boolean caught = false;
        try {
            ShadikhanaBookingPricing.saveDateRateOverride('invalid-date', 5000);
        } catch (AuraHandledException ex) {
            caught = true;
        }
        System.assertEquals(true, caught);
    }

    @IsTest
    static void testNormalizeTimeString() {
        System.assertEquals('06:15', ShadikhanaBookingPricing.normalizeTimeString('06:15:00.000'));
        System.assertEquals('09:00', ShadikhanaBookingPricing.normalizeTimeString('9:00:00'));
        System.assertEquals(null, ShadikhanaBookingPricing.normalizeTimeString(null));
        System.assertEquals(true, ShadikhanaBookingPricing.endsByVenueTurnoverTime('09:00'));
        System.assertEquals(true, ShadikhanaBookingPricing.endsByVenueTurnoverTime('08:30'));
        System.assertEquals(false, ShadikhanaBookingPricing.endsByVenueTurnoverTime('10:00'));
    }

    @IsTest
    static void testInvalidSameDayTimeRange() {
        Date bookingDate = Date.today().addDays(10);
        Boolean caught = false;

        try {
            ShadikhanaBookingPricing.calculatePrice(bookingDate, bookingDate, '18:00', '10:00');
        } catch (AuraHandledException ex) {
            caught = true;
        }

        System.assertEquals(true, caught);
    }

    @IsTest
    static void testServiceChargesIncludedInEstimate() {
        Date bookingDate = Date.today().addDays(10);

        ShadikhanaBookingPricing.PriceEstimate estimate =
            ShadikhanaBookingPricing.calculatePriceWithServices(
                bookingDate,
                bookingDate,
                null,
                null,
                200,
                ShadikhanaBookingPricing.ARRANGEMENT_HALL,
                ShadikhanaBookingPricing.ARRANGEMENT_HALL
            );

        System.assertEquals(8000, estimate.hallRentalAmount);
        System.assertEquals(25000, estimate.decorationCharge);
        System.assertEquals(90000, estimate.cateringCharge);
        System.assertEquals(123000, estimate.estimatedAmount);
    }

    @IsTest
    static void testHallBookingConfigDefaults() {
        ShadikhanaBookingPricing.HallBookingConfig config =
            ShadikhanaBookingPricing.getHallBookingConfig();

        System.assertEquals(500, config.seatingCapacity);
        System.assertEquals(350, config.comfortableGuests);
        System.assertEquals(25000, config.decorationCharge);
        System.assertEquals(450, config.cateringChargePerGuest);
    }

    private static String formatIsoDate(Date value) {
        return value.year() + '-' +
            String.valueOf(value.month()).leftPad(2, '0') + '-' +
            String.valueOf(value.day()).leftPad(2, '0');
    }
}
