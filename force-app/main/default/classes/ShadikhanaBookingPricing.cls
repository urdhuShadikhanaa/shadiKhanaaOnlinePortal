public without sharing class ShadikhanaBookingPricing {

    public static final Decimal DEFAULT_DAILY_RATE = 8000;
    public static final Integer DEFAULT_HALL_SEATING_CAPACITY = 500;
    public static final Integer DEFAULT_HALL_COMFORTABLE_GUESTS = 350;
    public static final Decimal DEFAULT_HALL_DECORATION_CHARGE = 25000;
    public static final Decimal DEFAULT_HALL_CATERING_CHARGE_PER_GUEST = 450;
    public static final String ARRANGEMENT_SELF = 'Self';
    public static final String ARRANGEMENT_HALL = 'Hall Management';
    private static final Integer MINUTES_PER_DAY = 24 * 60;

    public class PriceEstimate {
        @AuraEnabled public Integer numberOfDays;
        @AuraEnabled public Decimal dailyRate;
        @AuraEnabled public Decimal estimatedAmount;
        @AuraEnabled public String pricingNote;
        @AuraEnabled public Decimal timeMultiplier;
        @AuraEnabled public Decimal hallRentalAmount;
        @AuraEnabled public Decimal decorationCharge;
        @AuraEnabled public Decimal cateringCharge;
    }

    public class HallBookingConfig {
        @AuraEnabled public Integer seatingCapacity;
        @AuraEnabled public Integer comfortableGuests;
        @AuraEnabled public Decimal decorationCharge;
        @AuraEnabled public Decimal cateringChargePerGuest;
    }

    public class DateRateEntry {
        @AuraEnabled public String isoDate;
        @AuraEnabled public Decimal dailyRate;
        @AuraEnabled public Boolean isOverride;
    }

    public static Decimal getDefaultDailyRate() {
        Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
        if (settings != null && settings.Default_Daily_Rate__c != null && settings.Default_Daily_Rate__c > 0) {
            return settings.Default_Daily_Rate__c;
        }
        return DEFAULT_DAILY_RATE;
    }

    public static Decimal getEffectiveDailyRate(Date rateDate) {
        if (rateDate == null) {
            return getDefaultDailyRate();
        }

        Map<Date, Decimal> overrides = queryDateRateOverrides(rateDate, rateDate);
        if (overrides.containsKey(rateDate)) {
            return overrides.get(rateDate);
        }
        return getDefaultDailyRate();
    }

    public static Map<String, Decimal> getDailyRatesForMonth(Integer year, Integer month) {
        if (year == null || month == null || month < 1 || month > 12) {
            return new Map<String, Decimal>();
        }

        Date monthStart = Date.newInstance(year, month, 1);
        Date monthEnd = monthStart.addMonths(1).addDays(-1);
        Map<Date, Decimal> overrides = queryDateRateOverrides(monthStart, monthEnd);
        Decimal defaultRate = getDefaultDailyRate();
        Map<String, Decimal> result = new Map<String, Decimal>();

        Date currentDay = monthStart;
        while (currentDay <= monthEnd) {
            result.put(formatIsoDate(currentDay), overrides.containsKey(currentDay)
                ? overrides.get(currentDay)
                : defaultRate);
            currentDay = currentDay.addDays(1);
        }
        return result;
    }

    public static List<DateRateEntry> getAdminDateRateOverrides(Integer year, Integer month) {
        if (year == null || month == null || month < 1 || month > 12) {
            return new List<DateRateEntry>();
        }

        Date monthStart = Date.newInstance(year, month, 1);
        Date monthEnd = monthStart.addMonths(1).addDays(-1);
        List<Shadikhana_Daily_Rate__c> records = [
            SELECT Id, Rate_Date__c, Daily_Rate__c
            FROM Shadikhana_Daily_Rate__c
            WHERE Is_Active__c = true
              AND Rate_Date__c >= :monthStart
              AND Rate_Date__c <= :monthEnd
            ORDER BY Rate_Date__c ASC
        ];

        List<DateRateEntry> entries = new List<DateRateEntry>();
        for (Shadikhana_Daily_Rate__c record : records) {
            DateRateEntry entry = new DateRateEntry();
            entry.isoDate = formatIsoDate(record.Rate_Date__c);
            entry.dailyRate = record.Daily_Rate__c;
            entry.isOverride = true;
            entries.add(entry);
        }
        return entries;
    }

    public static void saveDefaultDailyRate(Decimal dailyRate) {
        if (dailyRate == null || dailyRate <= 0) {
            throw new AuraHandledException('Default daily rate must be greater than zero.');
        }

        Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
        if (settings == null || settings.Id == null) {
            settings = new Shadikhana_Settings__c();
            settings.SetupOwnerId = UserInfo.getOrganizationId();
        }
        settings.Default_Daily_Rate__c = dailyRate;
        upsert settings;
    }

    public static DateRateEntry saveDateRateOverride(String isoDateStr, Decimal dailyRate) {
        Date rateDate = parseIsoDate(isoDateStr);
        if (rateDate == null) {
            throw new AuraHandledException('A valid date is required.');
        }
        if (dailyRate == null || dailyRate <= 0) {
            throw new AuraHandledException('Daily rate must be greater than zero.');
        }

        validateDateRatesCanBeChanged(new Set<Date>{ rateDate });

        List<Shadikhana_Daily_Rate__c> existing = [
            SELECT Id, Rate_Date__c, Daily_Rate__c, Is_Active__c
            FROM Shadikhana_Daily_Rate__c
            WHERE Rate_Date__c = :rateDate
            LIMIT 1
        ];

        Shadikhana_Daily_Rate__c record = existing.isEmpty()
            ? new Shadikhana_Daily_Rate__c(Rate_Date__c = rateDate)
            : existing[0];
        record.Daily_Rate__c = dailyRate;
        record.Is_Active__c = true;
        upsert record;

        DateRateEntry entry = new DateRateEntry();
        entry.isoDate = formatIsoDate(rateDate);
        entry.dailyRate = dailyRate;
        entry.isOverride = true;
        return entry;
    }

    public static void deleteDateRateOverride(String isoDateStr) {
        deleteDateRateOverrides(new List<String>{ isoDateStr });
    }

    public static List<DateRateEntry> saveDateRateOverrides(List<String> isoDateStrs, Decimal dailyRate) {
        if (isoDateStrs == null || isoDateStrs.isEmpty()) {
            throw new AuraHandledException('Select at least one date.');
        }
        if (dailyRate == null || dailyRate <= 0) {
            throw new AuraHandledException('Daily rate must be greater than zero.');
        }

        Set<Date> rateDates = new Set<Date>();
        for (String isoDateStr : isoDateStrs) {
            Date rateDate = parseIsoDate(isoDateStr);
            if (rateDate == null) {
                throw new AuraHandledException('A valid date is required.');
            }
            rateDates.add(rateDate);
        }

        validateDateRatesCanBeChanged(rateDates);

        Map<Date, Shadikhana_Daily_Rate__c> existingByDate = new Map<Date, Shadikhana_Daily_Rate__c>();
        for (Shadikhana_Daily_Rate__c record : [
            SELECT Id, Rate_Date__c, Daily_Rate__c, Is_Active__c
            FROM Shadikhana_Daily_Rate__c
            WHERE Rate_Date__c IN :rateDates
        ]) {
            existingByDate.put(record.Rate_Date__c, record);
        }

        List<Shadikhana_Daily_Rate__c> recordsToSave = new List<Shadikhana_Daily_Rate__c>();
        for (Date rateDate : rateDates) {
            Shadikhana_Daily_Rate__c record = existingByDate.containsKey(rateDate)
                ? existingByDate.get(rateDate)
                : new Shadikhana_Daily_Rate__c(Rate_Date__c = rateDate);
            record.Daily_Rate__c = dailyRate;
            record.Is_Active__c = true;
            recordsToSave.add(record);
        }
        upsert recordsToSave;

        List<DateRateEntry> entries = new List<DateRateEntry>();
        for (Date rateDate : rateDates) {
            DateRateEntry entry = new DateRateEntry();
            entry.isoDate = formatIsoDate(rateDate);
            entry.dailyRate = dailyRate;
            entry.isOverride = true;
            entries.add(entry);
        }
        return entries;
    }

    public static void deleteDateRateOverrides(List<String> isoDateStrs) {
        if (isoDateStrs == null || isoDateStrs.isEmpty()) {
            throw new AuraHandledException('Select at least one date.');
        }

        Set<Date> rateDates = new Set<Date>();
        for (String isoDateStr : isoDateStrs) {
            Date rateDate = parseIsoDate(isoDateStr);
            if (rateDate == null) {
                throw new AuraHandledException('A valid date is required.');
            }
            rateDates.add(rateDate);
        }

        validateDateRatesCanBeRemoved(rateDates);

        List<Shadikhana_Daily_Rate__c> existing = [
            SELECT Id
            FROM Shadikhana_Daily_Rate__c
            WHERE Rate_Date__c IN :rateDates
        ];
        if (!existing.isEmpty()) {
            delete existing;
        }
    }

    public static void validateDateRatesCanBeRemoved(Set<Date> rateDates) {
        Set<Date> blockedDates = findBlockedDatesForActiveBookings(rateDates);
        if (blockedDates.isEmpty()) {
            return;
        }

        throw new AuraHandledException(
            'Cannot remove custom pricing because pending or confirmed bookings exist on: ' +
            formatBlockedDateLabels(blockedDates) +
            '. Cancel or move those bookings first. Existing booking prices will not be changed.'
        );
    }

    public static void validateDateRatesCanBeChanged(Set<Date> rateDates) {
        Set<Date> blockedDates = findBlockedDatesForActiveBookings(rateDates);
        if (blockedDates.isEmpty()) {
            return;
        }

        throw new AuraHandledException(
            'Cannot change pricing because pending or confirmed bookings exist on: ' +
            formatBlockedDateLabels(blockedDates) +
            '. Existing booking prices will not be changed.'
        );
    }

    @TestVisible
    private static Set<Date> findBlockedDatesForActiveBookings(Set<Date> rateDates) {
        Set<Date> blockedDates = new Set<Date>();
        if (rateDates == null || rateDates.isEmpty()) {
            return blockedDates;
        }

        Date today = Date.today();
        Set<Date> futureDatesToCheck = new Set<Date>();
        for (Date rateDate : rateDates) {
            if (rateDate != null && rateDate >= today) {
                futureDatesToCheck.add(rateDate);
            }
        }

        if (futureDatesToCheck.isEmpty()) {
            return blockedDates;
        }

        Date minDate = today;
        Date maxDate = today;
        for (Date rateDate : futureDatesToCheck) {
            if (rateDate > maxDate) {
                maxDate = rateDate;
            }
        }

        List<Shadikhana_Booking__c> activeBookings = [
            SELECT Id, Name, Booking_Date__c, End_Date__c, Status__c
            FROM Shadikhana_Booking__c
            WHERE Status__c IN ('Pending', 'Confirmed')
              AND Booking_Date__c <= :maxDate
              AND (
                  End_Date__c >= :minDate
                  OR (End_Date__c = NULL AND Booking_Date__c >= :minDate)
              )
        ];

        for (Shadikhana_Booking__c booking : activeBookings) {
            Date bookingStart = booking.Booking_Date__c;
            Date bookingEnd = booking.End_Date__c != null ? booking.End_Date__c : bookingStart;
            for (Date rateDate : futureDatesToCheck) {
                if (rateDate >= bookingStart && rateDate <= bookingEnd) {
                    blockedDates.add(rateDate);
                }
            }
        }

        return blockedDates;
    }

    @TestVisible
    private static String formatBlockedDateLabels(Set<Date> blockedDates) {
        List<String> blockedLabels = new List<String>();
        List<Date> sortedDates = new List<Date>(blockedDates);
        sortedDates.sort();
        for (Date blockedDate : sortedDates) {
            blockedLabels.add(formatIsoDate(blockedDate));
        }
        return String.join(blockedLabels, ', ');
    }

    public static PriceEstimate calculatePrice(
        Date startDate,
        Date endDate,
        String startTime,
        String endTime
    ) {
        Date effectiveEndDate = endDate != null ? endDate : startDate;

        PriceEstimate estimate = new PriceEstimate();
        estimate.numberOfDays = countDays(startDate, effectiveEndDate);
        estimate.dailyRate = getEffectiveDailyRate(startDate);

        if (String.isBlank(startTime) || String.isBlank(endTime)) {
            estimate.timeMultiplier = 1;
            estimate.estimatedAmount = calculateFlatAmountForRange(startDate, effectiveEndDate);
            estimate.pricingNote = buildPricingNote(
                estimate.numberOfDays,
                estimate.dailyRate,
                startDate,
                effectiveEndDate,
                null,
                null,
                estimate.timeMultiplier,
                estimate.estimatedAmount
            );
            return estimate;
        }

        Integer startMinutes = parseTimeToMinutes(normalizeTimeString(startTime));
        Integer endMinutes = parseTimeToMinutes(normalizeTimeString(endTime));
        if (startMinutes == null || endMinutes == null) {
            estimate.timeMultiplier = 1;
            estimate.estimatedAmount = calculateFlatAmountForRange(startDate, effectiveEndDate);
            estimate.pricingNote = buildPricingNote(
                estimate.numberOfDays,
                estimate.dailyRate,
                startDate,
                effectiveEndDate,
                normalizeTimeString(startTime),
                normalizeTimeString(endTime),
                estimate.timeMultiplier,
                estimate.estimatedAmount
            );
            return estimate;
        }

        validateEventDateTimeRange(startDate, effectiveEndDate, startMinutes, endMinutes);

        String normalizedStartTime = normalizeTimeString(startTime);
        String normalizedEndTime = normalizeTimeString(endTime);

        estimate.estimatedAmount = calculateTimedAmountByOccupiedDays(
            startDate,
            startMinutes,
            effectiveEndDate,
            endMinutes
        );

        if (startDate == effectiveEndDate) {
            Decimal occupiedHours = getOccupiedHoursOnDate(
                startDate,
                startDate,
                startMinutes,
                effectiveEndDate,
                endMinutes
            );
            estimate.timeMultiplier = resolveDayChargeMultiplier(occupiedHours);
        } else {
            estimate.timeMultiplier = null;
        }

        estimate.pricingNote = buildPricingNote(
            estimate.numberOfDays,
            estimate.dailyRate,
            startDate,
            effectiveEndDate,
            normalizedStartTime,
            normalizedEndTime,
            estimate.timeMultiplier,
            estimate.estimatedAmount
        );
        return estimate;
    }

    public static PriceEstimate calculatePriceWithServices(
        Date startDate,
        Date endDate,
        String startTime,
        String endTime,
        Integer expectedGuestCount,
        String decorationArrangement,
        String cateringArrangement
    ) {
        PriceEstimate baseEstimate = calculatePrice(startDate, endDate, startTime, endTime);
        return applyServiceCharges(
            baseEstimate,
            expectedGuestCount,
            decorationArrangement,
            cateringArrangement
        );
    }

    public static HallBookingConfig getHallBookingConfig() {
        Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
        HallBookingConfig config = new HallBookingConfig();
        config.seatingCapacity = resolveSeatingCapacity(settings);
        config.comfortableGuests = resolveComfortableGuests(settings);
        config.decorationCharge = resolveDecorationCharge(settings);
        config.cateringChargePerGuest = resolveCateringChargePerGuest(settings);
        return config;
    }

    public static Decimal calculateDecorationCharge(String decorationArrangement) {
        if (!isHallArrangement(decorationArrangement)) {
            return 0;
        }
        return resolveDecorationCharge(Shadikhana_Settings__c.getOrgDefaults());
    }

    public static Decimal calculateCateringCharge(String cateringArrangement, Integer expectedGuestCount) {
        if (!isHallArrangement(cateringArrangement)) {
            return 0;
        }

        Integer guestCount = expectedGuestCount != null && expectedGuestCount > 0
            ? expectedGuestCount
            : 0;
        if (guestCount == 0) {
            return 0;
        }

        return (resolveCateringChargePerGuest(Shadikhana_Settings__c.getOrgDefaults()) * guestCount)
            .setScale(2);
    }

    @TestVisible
    private static PriceEstimate applyServiceCharges(
        PriceEstimate estimate,
        Integer expectedGuestCount,
        String decorationArrangement,
        String cateringArrangement
    ) {
        if (estimate == null) {
            return null;
        }

        estimate.hallRentalAmount = estimate.estimatedAmount == null ? 0 : estimate.estimatedAmount;
        estimate.decorationCharge = calculateDecorationCharge(decorationArrangement);
        estimate.cateringCharge = calculateCateringCharge(cateringArrangement, expectedGuestCount);
        estimate.estimatedAmount = (
            estimate.hallRentalAmount +
            estimate.decorationCharge +
            estimate.cateringCharge
        ).setScale(2);
        estimate.pricingNote = appendServicePricingNote(
            estimate.pricingNote,
            estimate.decorationCharge,
            estimate.cateringCharge,
            expectedGuestCount,
            decorationArrangement,
            cateringArrangement
        );
        return estimate;
    }

    @TestVisible
    private static String appendServicePricingNote(
        String baseNote,
        Decimal decorationCharge,
        Decimal cateringCharge,
        Integer expectedGuestCount,
        String decorationArrangement,
        String cateringArrangement
    ) {
        List<String> notes = new List<String>();
        if (String.isNotBlank(baseNote)) {
            notes.add(baseNote.trim());
        }

        if (isHallArrangement(decorationArrangement) && decorationCharge != null && decorationCharge > 0) {
            notes.add('Includes hall decoration service.');
        }

        if (isHallArrangement(cateringArrangement) && cateringCharge != null && cateringCharge > 0) {
            Integer guestCount = expectedGuestCount != null ? expectedGuestCount : 0;
            notes.add('Includes hall catering for ' + guestCount + ' guest' + (guestCount == 1 ? '' : 's') + '.');
        }

        return notes.isEmpty() ? null : String.join(notes, ' ');
    }

    @TestVisible
    private static Boolean isHallArrangement(String arrangement) {
        return String.isNotBlank(arrangement) &&
            ARRANGEMENT_HALL.equalsIgnoreCase(arrangement.trim());
    }

    @TestVisible
    private static Integer resolveSeatingCapacity(Shadikhana_Settings__c settings) {
        if (settings != null &&
            settings.Hall_Seating_Capacity__c != null &&
            settings.Hall_Seating_Capacity__c > 0) {
            return Integer.valueOf(String.valueOf(settings.Hall_Seating_Capacity__c));
        }
        return DEFAULT_HALL_SEATING_CAPACITY;
    }

    @TestVisible
    private static Integer resolveComfortableGuests(Shadikhana_Settings__c settings) {
        if (settings != null &&
            settings.Hall_Comfortable_Guests__c != null &&
            settings.Hall_Comfortable_Guests__c > 0) {
            return Integer.valueOf(String.valueOf(settings.Hall_Comfortable_Guests__c));
        }
        return DEFAULT_HALL_COMFORTABLE_GUESTS;
    }

    @TestVisible
    private static Decimal resolveDecorationCharge(Shadikhana_Settings__c settings) {
        if (settings != null &&
            settings.Hall_Decoration_Charge__c != null &&
            settings.Hall_Decoration_Charge__c >= 0) {
            return settings.Hall_Decoration_Charge__c.setScale(2);
        }
        return DEFAULT_HALL_DECORATION_CHARGE;
    }

    @TestVisible
    private static Decimal resolveCateringChargePerGuest(Shadikhana_Settings__c settings) {
        if (settings != null &&
            settings.Hall_Catering_Charge_Per_Guest__c != null &&
            settings.Hall_Catering_Charge_Per_Guest__c >= 0) {
            return settings.Hall_Catering_Charge_Per_Guest__c.setScale(2);
        }
        return DEFAULT_HALL_CATERING_CHARGE_PER_GUEST;
    }

    @TestVisible
    private static Decimal calculateFlatAmountForRange(Date startDate, Date endDate) {
        Decimal totalAmount = 0;
        Date currentDay = startDate;
        while (currentDay <= endDate) {
            totalAmount += getEffectiveDailyRate(currentDay);
            currentDay = currentDay.addDays(1);
        }
        return totalAmount.setScale(2);
    }

    public static void validateEventDateTimeRange(
        Date startDate,
        Date endDate,
        String startTime,
        String endTime
    ) {
        if (startDate == null || endDate == null || String.isBlank(startTime) || String.isBlank(endTime)) {
            return;
        }

        Integer startMinutes = parseTimeToMinutes(normalizeTimeString(startTime));
        Integer endMinutes = parseTimeToMinutes(normalizeTimeString(endTime));
        if (startMinutes == null || endMinutes == null) {
            return;
        }

        validateEventDateTimeRange(startDate, endDate, startMinutes, endMinutes);
    }

    public static String normalizeTimeString(String timeValue) {
        if (String.isBlank(timeValue)) {
            return null;
        }

        Integer totalMinutes = parseTimeToMinutes(timeValue.trim());
        if (totalMinutes == null) {
            return null;
        }

        Integer hours = totalMinutes / 60;
        Integer minutes = Math.mod(totalMinutes, 60);
        return String.valueOf(hours).leftPad(2, '0') + ':' + String.valueOf(minutes).leftPad(2, '0');
    }

    public static Integer countDays(Date startDate, Date endDate) {
        if (startDate == null) {
            return 0;
        }
        Date effectiveEndDate = endDate != null ? endDate : startDate;
        return startDate.daysBetween(effectiveEndDate) + 1;
    }

    public static Boolean endsByVenueTurnoverTime(String endTime) {
        String normalized = normalizeTimeString(endTime);
        if (String.isBlank(normalized)) {
            return false;
        }

        Integer minutes = parseTimeToMinutes(normalized);
        return minutes != null && minutes <= (9 * 60);
    }

    @TestVisible
    private static Map<Date, Decimal> queryDateRateOverrides(Date startDate, Date endDate) {
        Map<Date, Decimal> result = new Map<Date, Decimal>();
        if (startDate == null || endDate == null) {
            return result;
        }

        for (Shadikhana_Daily_Rate__c record : [
            SELECT Rate_Date__c, Daily_Rate__c
            FROM Shadikhana_Daily_Rate__c
            WHERE Is_Active__c = true
              AND Rate_Date__c >= :startDate
              AND Rate_Date__c <= :endDate
        ]) {
            result.put(record.Rate_Date__c, record.Daily_Rate__c);
        }
        return result;
    }

    @TestVisible
    private static Date parseIsoDate(String isoDateStr) {
        if (String.isBlank(isoDateStr)) {
            return null;
        }
        try {
            List<String> parts = isoDateStr.trim().split('-');
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

    @TestVisible
    private static String formatIsoDate(Date value) {
        if (value == null) {
            return '';
        }
        return String.valueOf(value.year()) + '-' +
            String.valueOf(value.month()).leftPad(2, '0') + '-' +
            String.valueOf(value.day()).leftPad(2, '0');
    }

    @TestVisible
    private static void validateEventDateTimeRange(
        Date startDate,
        Date endDate,
        Integer startMinutes,
        Integer endMinutes
    ) {
        if (startDate == endDate && endMinutes <= startMinutes) {
            throw new AuraHandledException(
                'Event end time on the end date must be after the start time on the start date.'
            );
        }
    }

    @TestVisible
    private static Decimal calculateTimedAmountByOccupiedDays(
        Date startDate,
        Integer startMinutes,
        Date endDate,
        Integer endMinutes
    ) {
        Decimal totalAmount = 0;
        Date currentDay = startDate;

        while (currentDay <= endDate) {
            Decimal occupiedHours = getOccupiedHoursOnDate(
                currentDay,
                startDate,
                startMinutes,
                endDate,
                endMinutes
            );
            totalAmount += getEffectiveDailyRate(currentDay) * resolveDayChargeMultiplier(occupiedHours);
            currentDay = currentDay.addDays(1);
        }

        return totalAmount.setScale(2);
    }

    @TestVisible
    private static Decimal getOccupiedHoursOnDate(
        Date currentDay,
        Date startDate,
        Integer startMinutes,
        Date endDate,
        Integer endMinutes
    ) {
        if (currentDay < startDate || currentDay > endDate) {
            return 0;
        }

        if (startDate == endDate) {
            return calculateDurationHours(startMinutes, endMinutes);
        }

        if (currentDay == startDate) {
            return Decimal.valueOf(MINUTES_PER_DAY - startMinutes) / Decimal.valueOf(60);
        }

        if (currentDay == endDate) {
            return Decimal.valueOf(endMinutes) / Decimal.valueOf(60);
        }

        return 24;
    }

    @TestVisible
    private static Decimal resolveDayChargeMultiplier(Decimal occupiedHours) {
        if (occupiedHours == null || occupiedHours <= 0) {
            return 1;
        }
        if (occupiedHours <= 4) {
            return 0.5;
        }
        if (occupiedHours <= 8) {
            return 0.75;
        }
        return 1;
    }

    @TestVisible
    private static Decimal calculateDurationHours(Integer startMinutes, Integer endMinutes) {
        if (startMinutes == null || endMinutes == null || endMinutes <= startMinutes) {
            return null;
        }
        return Decimal.valueOf(endMinutes - startMinutes) / Decimal.valueOf(60);
    }

    private static Integer parseTimeToMinutes(String value) {
        if (String.isBlank(value) || !value.contains(':')) {
            return null;
        }
        List<String> parts = value.split(':');
        if (parts.size() < 2) {
            return null;
        }
        try {
            Integer hours = Integer.valueOf(parts[0]);
            Integer minutes = Integer.valueOf(parts[1]);
            if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
                return null;
            }
            return (hours * 60) + minutes;
        } catch (Exception ex) {
            return null;
        }
    }

    private static String buildPricingNote(
        Integer numberOfDays,
        Decimal dailyRate,
        Date startDate,
        Date endDate,
        String startTime,
        String endTime,
        Decimal timeMultiplier,
        Decimal estimatedAmount
    ) {
        String rateLabel = 'INR ' + dailyRate.setScale(0);

        if (String.isBlank(startTime) || String.isBlank(endTime)) {
            if (startDate != null && endDate != null && startDate != endDate) {
                return 'Each selected day uses its standard or date-specific rate. Total estimated ' +
                    estimatedAmount.setScale(0) + ' INR for ' + numberOfDays + ' day(s).';
            }
            return numberOfDays + ' day(s) x ' + rateLabel + ' (date-specific rates apply when set).';
        }

        if (startDate == endDate) {
            if (timeMultiplier == 0.5) {
                return 'Same-day event from ' + startTime + ' to ' + endTime + ' (up to 4 occupied hours).';
            }
            if (timeMultiplier == 0.75) {
                return 'Same-day event from ' + startTime + ' to ' + endTime + ' (up to 8 occupied hours).';
            }
            return 'Same-day event from ' + startTime + ' to ' + endTime + ' (more than 8 occupied hours).';
        }

        return 'Each occupied day is priced separately using its date rate: full day rate when hours exceed 8, otherwise reduced rate. Total estimated ' +
            estimatedAmount.setScale(0) + ' INR for ' + numberOfDays + ' day(s).';
    }
}
