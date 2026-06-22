// Comprehensive smoke test for portal backend functionality.
Integer passCount = 0;
Integer failCount = 0;

void assertTrue(Boolean condition, String label) {
    if (condition) {
        passCount++;
        System.debug('PASS: ' + label);
    } else {
        failCount++;
        System.debug('FAIL: ' + label);
    }
}

// 1) Branding config load + address parsing
ShadikhanaPortalBrandingService.PortalBrandingConfig branding =
    ShadikhanaPortalBrandingService.getPortalBrandingConfig();
assertTrue(String.isNotBlank(branding.venueName), 'Branding venue name loads');
assertTrue(branding.galleryImages != null && branding.galleryImages.size() == 3, 'Gallery slots load');
assertTrue(branding.addressLines != null && branding.addressLines.size() >= 1, 'Address lines load');

// 2) Branding partial save
ShadikhanaPortalBrandingService.BrandingSaveRequest partial =
    new ShadikhanaPortalBrandingService.BrandingSaveRequest();
partial.headerAddressLine = 'Door No 3/279, Aravapalli, Nandalur, YSR Kadapa, Andhra Pradesh, India';
ShadikhanaPortalBrandingService.PortalBrandingConfig savedBranding =
    ShadikhanaPortalBrandingService.savePortalBrandingConfig(
        ShadikhanaPortalBrandingService.BRANDING_SECRET_KEY,
        partial
    );
assertTrue(savedBranding.fullAddress == partial.headerAddressLine, 'Header address syncs to full address');
assertTrue(
    savedBranding.addressLines != null && savedBranding.addressLines[0].value == '3/279',
    'Address lines parse door number from header'
);

// 3) Pricing default + custom rate
Decimal defaultRate = ShadikhanaBookingPricing.getDefaultDailyRate();
assertTrue(defaultRate != null && defaultRate > 0, 'Default daily rate loads');

Date rateDate = Date.today().addDays(45);
String rateDateStr = rateDate.year() + '-' +
    String.valueOf(rateDate.month()).leftPad(2, '0') + '-' +
    String.valueOf(rateDate.day()).leftPad(2, '0');

ShadikhanaBookingPricing.DateRateEntry customRate =
    ShadikhanaBookingPricing.saveDateRateOverride(rateDateStr, defaultRate + 500);
assertTrue(customRate.dailyRate == defaultRate + 500, 'Custom date rate saves');

Map<String, Decimal> monthRates = ShadikhanaBookingPricing.getDailyRatesForMonth(
    rateDate.year(),
    rateDate.month()
);
assertTrue(monthRates.containsKey(rateDateStr), 'Custom rate appears in month map');

// 4) Booking create + pricing estimate
Date bookingDate = Date.today().addDays(50);
String bookingStart = bookingDate.year() + '-' +
    String.valueOf(bookingDate.month()).leftPad(2, '0') + '-' +
    String.valueOf(bookingDate.day()).leftPad(2, '0');

ShadikhanaBookingController.BookingRecord booking =
    ShadikhanaBookingController.createBooking(
        bookingStart,
        bookingStart,
        'All Functionality Smoke Test',
        'Smoke Test User',
        '9876543210',
        'smoke.test@example.com',
        'Automated smoke test',
        '10:00',
        '18:00',
        'Hall booking'
    );
assertTrue(booking.id != null, 'Booking creates successfully');
assertTrue(booking.status == 'Pending', 'New booking is Pending');

ShadikhanaBookingPricing.PriceEstimate estimate =
    ShadikhanaBookingPricing.calculatePrice(
        bookingDate,
        bookingDate,
        '10:00',
        '18:00'
    );
assertTrue(estimate != null && estimate.estimatedAmount > 0, 'Price estimate calculates');

// 5) Admin confirm + cancel
ShadikhanaBookingController.BookingRecord confirmed =
    ShadikhanaBookingController.updateBookingStatus(booking.id, 'Confirmed');
assertTrue(confirmed.status == 'Confirmed', 'Admin can confirm booking');

ShadikhanaBookingController.BookingRecord cancelled =
    ShadikhanaBookingController.updateBookingStatus(booking.id, 'Cancelled');
assertTrue(cancelled.status == 'Cancelled', 'Admin can cancel booking');

// 6) Footer + portal settings
ShadikhanaBookingController.PortalFooterWrapper footer =
    ShadikhanaBookingController.getPortalFooterInfo();
assertTrue(String.isNotBlank(footer.contactNumber), 'Footer phone loads');
assertTrue(String.isNotBlank(footer.escalationEmail), 'Footer email loads');

ShadikhanaBookingController.PortalSettingsWrapper settings =
    ShadikhanaBookingController.getPortalSettings();
assertTrue(settings != null, 'Portal settings load');

// 7) Email queue on submit (async)
ShadikhanaBookingEmailService.notifyBookingRequestSubmitted(booking.id);
assertTrue(Limits.getQueueableJobs() >= 1, 'Email notification queues on submit');

// Cleanup custom rate if no blocking bookings
try {
    ShadikhanaBookingPricing.deleteDateRateOverride(rateDateStr);
    assertTrue(true, 'Custom rate cleanup');
} catch (Exception ex) {
    System.debug('SKIP cleanup custom rate: ' + ex.getMessage());
}

System.debug('=== SMOKE TEST SUMMARY ===');
System.debug('PASSED=' + passCount);
System.debug('FAILED=' + failCount);
System.debug('RESULT=' + (failCount == 0 ? 'ALL PASS' : 'FAILURES DETECTED'));
