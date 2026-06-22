import { LightningElement, track, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import communityBasePath from '@salesforce/community/basePath';
import getCurrentUserInfo from '@salesforce/apex/ShadikhanaBookingController.getCurrentUserInfo';
import getBookings from '@salesforce/apex/ShadikhanaBookingController.getBookings';
import getBookingData from '@salesforce/apex/ShadikhanaBookingController.getBookingData';
import getAdminBookings from '@salesforce/apex/ShadikhanaBookingController.getAdminBookings';
import getAdminBookingReport from '@salesforce/apex/ShadikhanaBookingController.getAdminBookingReport';
import createBooking from '@salesforce/apex/ShadikhanaBookingController.createBooking';
import getDailyRate from '@salesforce/apex/ShadikhanaBookingController.getDailyRate';
import getDailyRatesForMonth from '@salesforce/apex/ShadikhanaBookingController.getDailyRatesForMonth';
import getAdminDateRateOverrides from '@salesforce/apex/ShadikhanaBookingController.getAdminDateRateOverrides';
import saveDateRateOverride from '@salesforce/apex/ShadikhanaBookingController.saveDateRateOverride';
import saveDateRateOverrides from '@salesforce/apex/ShadikhanaBookingController.saveDateRateOverrides';
import deleteDateRateOverride from '@salesforce/apex/ShadikhanaBookingController.deleteDateRateOverride';
import deleteDateRateOverrides from '@salesforce/apex/ShadikhanaBookingController.deleteDateRateOverrides';
import saveDefaultDailyRate from '@salesforce/apex/ShadikhanaBookingController.saveDefaultDailyRate';
import calculateBookingPrice from '@salesforce/apex/ShadikhanaBookingController.calculateBookingPrice';
import getHallBookingConfig from '@salesforce/apex/ShadikhanaBookingController.getHallBookingConfig';
import updateBookingPrice from '@salesforce/apex/ShadikhanaBookingController.updateBookingPrice';
import isDateRangeAvailable from '@salesforce/apex/ShadikhanaBookingController.isDateRangeAvailable';
import updateBookingStatus from '@salesforce/apex/ShadikhanaBookingController.updateBookingStatus';
import getPortalSettings from '@salesforce/apex/ShadikhanaBookingController.getPortalSettings';
import getPortalFooterInfo from '@salesforce/apex/ShadikhanaBookingController.getPortalFooterInfo';
import savePortalSettings from '@salesforce/apex/ShadikhanaBookingController.savePortalSettings';
import getPortalBrandingConfig from '@salesforce/apex/ShadikhanaBookingController.getPortalBrandingConfig';
import savePortalBrandingConfig from '@salesforce/apex/ShadikhanaBookingController.savePortalBrandingConfig';
import uploadPortalGalleryImage from '@salesforce/apex/ShadikhanaBookingController.uploadPortalGalleryImage';
import hallInteriorImage from '@salesforce/resourceUrl/ShadikhanaHallInterior';
import hallExteriorImage from '@salesforce/resourceUrl/ShadikhanaHallExterior';
import diningAreaImage from '@salesforce/resourceUrl/ShadikhanaDiningArea';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];
const STATUS_OPTIONS = [
    { label: 'Pending', value: 'Pending' },
    { label: 'Confirmed', value: 'Confirmed' },
    { label: 'Cancelled', value: 'Cancelled' }
];
const VENUE_TURNOVER_MINUTES = 9 * 60;
const REPORT_MODE_OPTIONS = [
    { label: 'Monthly', value: 'month' },
    { label: 'Custom Range (up to 6 months)', value: 'custom' }
];
const PRICING_MODE_OPTIONS = [
    { label: 'Default rate for all dates', value: 'default' },
    { label: 'Custom rate for selected dates', value: 'custom' }
];
const EVENT_TYPE_OPTIONS = [
    { label: 'Wedding', value: 'Wedding' },
    { label: 'Birthday Party', value: 'Birthday Party' },
    { label: 'Engagement', value: 'Engagement' },
    { label: 'Corporate Event', value: 'Corporate Event' },
    { label: 'Other', value: 'Other' }
];
const SERVICE_ARRANGEMENT_OPTIONS = [
    { label: 'I will arrange myself', value: 'Self' },
    { label: 'Hall management will provide', value: 'Hall Management' }
];
const ARRANGEMENT_SELF = 'Self';
const ARRANGEMENT_HALL = 'Hall Management';
const DEFAULT_HALL_SEATING_CAPACITY = 500;
const DEFAULT_HALL_COMFORTABLE_GUESTS = 350;
const DEFAULT_HALL_DECORATION_CHARGE = 25000;
const DEFAULT_HALL_CATERING_CHARGE_PER_GUEST = 450;
const ADMIN_BOOKING_PAGE_SIZE = 5;
const BOOKING_DATA_PAGE_SIZES = [5, 10, 15, 20, 25, 30, 35, 40, 50];
const TIME_HOUR_OPTIONS = Array.from({ length: 12 }, (_, index) => {
    const hour = String(index + 1);
    return { label: hour, value: hour };
});
const TIME_MINUTE_OPTIONS = ['00', '15', '30', '45'].map((minute) => ({
    label: minute,
    value: minute
}));
const TIME_PERIOD_OPTIONS = [
    { label: 'AM', value: 'AM' },
    { label: 'PM', value: 'PM' }
];
const DEFAULT_COUNTRY_CODE = '+91';
const BRANDING_SECRET_STORAGE_KEY = 'shadikhanaBrandingUnlocked';
const BOOKING_DEEP_LINK_STORAGE_KEY = 'shadikhanaPendingBookingId';
const ADMIN_SECTION_NAV = [
    { id: 'bookings', label: 'Booking Queue', iconName: 'utility:queue' },
    { id: 'reports', label: 'Booking Report', iconName: 'utility:chart' },
    { id: 'pricing', label: 'Pricing', iconName: 'utility:currency' },
    { id: 'branding', label: 'Site Branding', iconName: 'utility:photo' },
    { id: 'sms', label: 'SMS Notifications', iconName: 'utility:sms' },
    { id: 'email', label: 'Email Notifications', iconName: 'utility:email' },
    { id: 'portalLogin', label: 'Portal Login Notes', iconName: 'utility:key' }
];
const EVENT_CELEBRATION_PROFILES = [
    {
        id: 'birthday',
        keywords: ['birthday', 'bday', 'birth day', 'birth-day'],
        emoji: '🎂',
        badgeLabel: 'Birthday',
        tagline: 'A day filled with joy',
        decoEmoji: '🎈',
        title: (ctx) => `Happy Birthday, ${ctx.firstName}!`,
        message: (ctx) =>
            `${ctx.contactName}, your birthday celebration is live at Urdu Shadikhana today. Wishing you joy, laughter, and beautiful memories on ${ctx.eventName}.`
    },
    {
        id: 'marriage',
        keywords: [
            'marriage',
            'mariage',
            'wedding',
            'shaadi',
            'shadi',
            'nikah',
            'reception',
            'walima',
            'engagement'
        ],
        emoji: '💍',
        badgeLabel: 'Wedding',
        tagline: 'Love & new beginnings',
        decoEmoji: '💐',
        title: (ctx) => `Congratulations, ${ctx.firstName}!`,
        message: (ctx) =>
            `Warm wishes on your ${ctx.eventName}. May your journey together be filled with love, harmony, and lifelong happiness at Urdu Shadikhana.`
    },
    {
        id: 'halfSaree',
        keywords: ['half saree', 'half-saree', 'halfsaree', 'langa voni', 'langa-voni', 'ritu kala'],
        emoji: '🌸',
        badgeLabel: 'Half Saree',
        tagline: 'Grace & tradition',
        decoEmoji: '🪷',
        title: (ctx) => `Blessings on Your Half Saree Ceremony!`,
        message: (ctx) =>
            `Congratulations ${ctx.contactName}! Wishing you grace, prosperity, and unforgettable moments during ${ctx.eventName} at our venue.`
    },
    {
        id: 'election',
        keywords: ['election', 'campaign', 'rally', 'political', 'voting', 'manifesto'],
        emoji: '🗳️',
        badgeLabel: 'Campaign',
        tagline: 'Strength & vision',
        decoEmoji: '⭐',
        title: (ctx) => `Best Wishes for Your Campaign!`,
        message: (ctx) =>
            `${ctx.contactName}, we wish you a powerful and successful ${ctx.eventName}. May your gathering inspire confidence, unity, and progress.`
    },
    {
        id: 'meeting',
        keywords: ['meeting', 'conference', 'seminar', 'workshop', 'summit', 'gathering', 'convention'],
        emoji: '🤝',
        badgeLabel: 'Meeting',
        tagline: 'Productive gathering',
        decoEmoji: '📋',
        title: (ctx) => `Wishing You a Successful Meeting!`,
        message: (ctx) =>
            `${ctx.contactName}, thank you for hosting ${ctx.eventName} at Urdu Shadikhana. Wishing you productive discussions and meaningful outcomes.`
    },
    {
        id: 'other',
        keywords: [],
        emoji: '✨',
        badgeLabel: 'Celebration',
        tagline: 'A special day',
        decoEmoji: '🎊',
        title: (ctx) => `Warm Wishes for Your Celebration!`,
        message: (ctx) =>
            `${ctx.contactName}, thank you for choosing Urdu Shadikhana for ${ctx.eventName}. Wishing you a memorable and joyful event today.`
    }
];

export default class ShadikhanaBookingPortal extends NavigationMixin(LightningElement) {
    @track calendarDays = [];
    @track adminPricingCalendarDays = [];
    @track bookings = [];
    @track bookingDataRecords = [];
    @track adminBookings = [];
    @track selectedBooking = null;

    activeTab = 'home';
    activeAdminSection = 'bookings';
    bookingWizardStep = 1;
    bookingWizardConsentAccepted = false;
    showAvailabilityCalendarPanel = false;
    currentYear;
    currentMonth;
    monthLabel = '';
    isSubmitting = false;
    isDateSelectionLoading = false;
    isPriceLoading = false;
    isAdminLoading = false;
    isSettingsSaving = false;
    isPriceSaving = false;
    isReportLoading = false;
    isBrandingSaving = false;
    brandingSecretInput = '';
    brandingUnlocked = false;
    galleryImageCacheKeys = {
        ShadikhanaHallExterior: 'default',
        ShadikhanaHallInterior: 'default',
        ShadikhanaDiningArea: 'default'
    };

    userName = '';
    userEmail = '';
    isSystemAdmin = false;
    isGuestUser = false;
    currentTimeDisplay = '';
    browserTimeZone = '';
    clockInterval;

    eventName = '';
    contactName = '';
    contactPhone = '';
    contactPhoneDigits = '';
    contactEmail = '';
    notes = '';
    eventStartTime = '10:00';
    eventEndTime = '21:00';
    startTimeHour = '10';
    startTimeMinute = '00';
    startTimePeriod = 'AM';
    endTimeHour = '9';
    endTimeMinute = '00';
    endTimePeriod = 'PM';
    eventDetails = '';
    eventType = '';
    expectedGuestCount = '';
    decorationArrangement = ARRANGEMENT_SELF;
    cateringArrangement = ARRANGEMENT_SELF;
    hallSeatingCapacity = DEFAULT_HALL_SEATING_CAPACITY;
    hallComfortableGuests = DEFAULT_HALL_COMFORTABLE_GUESTS;
    hallDecorationCharge = DEFAULT_HALL_DECORATION_CHARGE;
    hallCateringChargePerGuest = DEFAULT_HALL_CATERING_CHARGE_PER_GUEST;
    adminHallSeatingCapacity = DEFAULT_HALL_SEATING_CAPACITY;
    adminHallComfortableGuests = DEFAULT_HALL_COMFORTABLE_GUESTS;
    adminHallDecorationCharge = DEFAULT_HALL_DECORATION_CHARGE;
    adminHallCateringChargePerGuest = DEFAULT_HALL_CATERING_CHARGE_PER_GUEST;
    selectedDate = '';
    selectedEndDate = '';
    fromDateText = '';
    toDateText = '';
    isDesktopLayout = true;
    dailyRate = 8000;
    dailyRateLabel = '₹8,000/day';
    priceEstimate = null;

    adminMobileNumber = '6364054881';
    footerContactNumber = '6364054881';
    footerAdditionalContactNumber = '9652741400';
    footerEscalationEmail = 'urdhushadikhanaa@gmail.com';
    footerAdditionalPhone = '9652741400';
    portalSiteUrl = 'https://shabbirtech4-dev-ed.develop.my.site.com/urdushadikhana';
    portalLoginUrl = 'https://shabbirtech4-dev-ed.develop.my.site.com/urdushadikhana/login';
    adminDefaultDailyRate = 8000;
    pricingMode = 'default';
    pricingCustomRate = '';
    @track selectedPricingDates = [];
    pricingOverrideDate = '';
    pricingOverrideRate = '';
    @track adminDateRateOverrides = [];
    @track dateRateMap = {};
    @track marqueeMonthRateMap = {};
    isPricingSaving = false;
    twilioFromNumber = '';
    twilioAccountSid = '';
    twilioAuthToken = '';
    twilioAuthTokenConfigured = false;
    smsEnabled = true;
    adminEmail = 'urdhushadikhanaa@gmail.com';
    emailEnabled = true;
    portalAdminUsername = 'onlinereservations@shabbirtech.com';
    portalAdminPassword = '';
    portalLoginNotes = '';

    reportMonthValue = '';
    reportStartDate = '';
    reportEndDate = '';
    reportMode = 'month';
    monthlyReport = null;
    bookingDataPageSize = 10;
    bookingDataPageNumber = 1;
    adminBookingPageNumber = 1;
    pendingAdminBookingId = null;

    wiredBookingsResult;
    wiredMonthlyDailyRatesResult;
    wiredDailyRateResult;
    wiredPortalBrandingResult;
    wiredHallBookingConfigResult;
    wiredFooterInfoResult;
    bookedDateSet = new Set();
    calendarDateStatusMap = {};
    selectedImageIndex = 0;
    _desktopMediaQuery;
    _desktopMediaQueryHandler;
    _dateValidationSequence = 0;
    _priceCalculationSequence = 0;

    statusOptions = STATUS_OPTIONS;
    reportModeOptions = REPORT_MODE_OPTIONS;
    pricingModeOptions = PRICING_MODE_OPTIONS;
    timeHourOptions = TIME_HOUR_OPTIONS;
    timeMinuteOptions = TIME_MINUTE_OPTIONS;
    timePeriodOptions = TIME_PERIOD_OPTIONS;

    venueImages = [
        {
            id: 'exterior',
            resourceName: 'ShadikhanaHallExterior',
            url: hallExteriorImage,
            label: 'Shadikhana Exterior',
            caption: 'Front view of Urdu Shadikhana'
        },
        {
            id: 'interior',
            resourceName: 'ShadikhanaHallInterior',
            url: hallInteriorImage,
            label: 'Main Hall',
            caption: 'Spacious main hall for ceremonies and gatherings'
        },
        {
            id: 'dining',
            resourceName: 'ShadikhanaDiningArea',
            url: diningAreaImage,
            label: 'Dining Area',
            caption: 'Dining and event seating arrangement'
        }
    ];

    venueLocationName = 'Urdu Shadikhana';
    brandingFullAddress = 'Door No: 3/276, Aravapalli, Nandalur, Andhra Pradesh, India';
    brandingHeaderAddressLine =
        'Door No 3/276, Aravapalli, Nandalur, YSR Kadapa, Andhra Pradesh, India';
    venueLatitude = 14.273378321937964;
    venueLongitude = 79.10432914519221;

    addressLines = [
        { id: 'door', label: 'Door No', value: '3/276' },
        { id: 'village', label: 'Village', value: 'Aravapalli' },
        { id: 'town', label: 'Town', value: 'Nandalur' },
        { id: 'district', label: 'District', value: 'YSR Kadapa' },
        { id: 'state', label: 'State', value: 'Andhra Pradesh, India' }
    ];

    perDayInclusions = [
        {
            id: 'hall',
            labelEn: 'Main hall access for ceremonies and gatherings',
            labelTe: 'సమావేశాలు, వేడుకల కోసం ప్రధాన హాల్ అందుబాటు'
        },
        {
            id: 'dining',
            labelEn: 'Dining area with table and chair setup',
            labelTe: 'టేబుల్, కుర్చీల అమరికతో భోజన శాల'
        },
        {
            id: 'utilities',
            labelEn: 'Electricity, lighting, and water supply',
            labelTe: 'విద్యుత్, లైటింగ్ మరియు నీటి సరఫరా'
        },
        {
            id: 'parking',
            labelEn: 'Parking space for guests and vendors',
            labelTe: 'అతిథులు మరియు సరఫరాదారులకు వాహనాల నిల్వ స్థలం'
        },
        {
            id: 'support',
            labelEn: 'On-site support during booked event hours',
            labelTe: 'బుక్ చేసిన ఈవెంట్ సమయంలో స్థలంలో సహాయం'
        }
    ];

    get footerIncludedTitleTe() {
        return '\u0C2A\u0C4D\u0C30\u0C24\u0C3F \u0C30\u0C4B\u0C1C\u0C41 \u0C1A\u0C47\u0C30\u0C4D\u0C1A\u0C2C\u0C21\u0C3F\u0C28\u0C35\u0C3F';
    }

    get portalHeaderBackdropStyle() {
        return `background-image: url(${hallExteriorImage});`;
    }

    get portalThemeLayerStyle() {
        return `background-image: url(${hallInteriorImage});`;
    }

    get mapsUrl() {
        return (
            'https://www.google.com/maps/search/?api=1&query=' +
            this.venueLatitude +
            '%2C' +
            this.venueLongitude
        );
    }

    @wire(getHallBookingConfig)
    wiredHallBookingConfig(result) {
        this.wiredHallBookingConfigResult = result;
        const { data } = result;
        if (data) {
            this.applyHallBookingConfig(data);
        }
    }

    connectedCallback() {
        const today = new Date();
        this.currentYear = today.getFullYear();
        this.currentMonth = today.getMonth() + 1;
        this.updateMonthLabel();
        this.buildCalendar();
        this.browserTimeZone = this.resolveBrowserTimeZone();
        this.updateCurrentTime();
        this.initReportMonth();
        this.restoreBrandingUnlockState();
        this.clockInterval = setInterval(() => {
            this.updateCurrentTime();
        }, 1000);
        this.initDesktopLayoutListener();
        this.captureBookingDeepLinkFromUrl();
    }

    captureBookingDeepLinkFromUrl() {
        if (typeof window === 'undefined') {
            return;
        }

        const params = new URLSearchParams(window.location.search);
        const bookingId = params.get('bookingId');
        const tab = params.get('tab');

        if (bookingId) {
            this.pendingAdminBookingId = bookingId;
            try {
                window.sessionStorage.setItem(BOOKING_DEEP_LINK_STORAGE_KEY, bookingId);
            } catch (error) {
                // Ignore storage failures in restricted browsers.
            }
        }

        if (tab === 'admin') {
            try {
                window.sessionStorage.setItem('shadikhanaPendingTab', 'admin');
            } catch (error) {
                // Ignore storage failures in restricted browsers.
            }
        }
    }

    initDesktopLayoutListener() {
        if (typeof window === 'undefined' || !window.matchMedia) {
            this.isDesktopLayout = true;
            return;
        }

        this._desktopMediaQuery = window.matchMedia('(min-width: 48rem)');
        this.isDesktopLayout = this._desktopMediaQuery.matches;
        this._desktopMediaQueryHandler = (event) => {
            this.isDesktopLayout = event.matches;
        };
        this._desktopMediaQuery.addEventListener('change', this._desktopMediaQueryHandler);
    }

    resolveBrowserTimeZone() {
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local time';
        } catch (error) {
            return 'Local time';
        }
    }

    updateCurrentTime() {
        const now = new Date();
        this.currentTimeDisplay = now.toLocaleString(undefined, {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
            timeZoneName: 'short'
        });
    }

    disconnectedCallback() {
        if (this.clockInterval) {
            clearInterval(this.clockInterval);
        }

        if (this._desktopMediaQuery && this._desktopMediaQueryHandler) {
            this._desktopMediaQuery.removeEventListener('change', this._desktopMediaQueryHandler);
        }
    }

    handleLogout() {
        try {
            window.sessionStorage.removeItem('shadikhanaPendingTab');
            window.sessionStorage.removeItem('shadikhanaShowAdminLoginNotes');
        } catch (error) {
            // Ignore storage failures in restricted browsers.
        }

        const logoutUrl = this.buildCommunityLogoutUrl();
        if (logoutUrl) {
            window.location.replace(logoutUrl);
            return;
        }

        this[NavigationMixin.Navigate]({
            type: 'comm__loginPage',
            attributes: {
                actionName: 'logout'
            }
        });
    }

    buildCommunityLogoutUrl() {
        const basePath = communityBasePath || '';
        const sitePrefix = basePath.replace(/\/s$/i, '');

        if (!sitePrefix) {
            return null;
        }

        const retUrl = encodeURIComponent(basePath || `${sitePrefix}/s`);
        return `${sitePrefix}/secur/logout.jsp?retUrl=${retUrl}`;
    }

    handleHeaderLogin() {
        this.handleLogin();
    }

    handleLogin(pendingTab) {
        const basePath = communityBasePath || '';

        try {
            if (pendingTab === 'admin') {
                window.sessionStorage.setItem('shadikhanaShowAdminLoginNotes', 'true');
                window.sessionStorage.setItem('shadikhanaPendingTab', pendingTab);
            } else {
                window.sessionStorage.removeItem('shadikhanaShowAdminLoginNotes');
                window.sessionStorage.removeItem('shadikhanaPendingTab');
            }
        } catch (error) {
            // Ignore storage failures in restricted browsers.
        }

        window.location.href = `${basePath}/login`;
    }

    restorePendingTabAfterLogin() {
        let pendingTab;

        try {
            pendingTab = window.sessionStorage.getItem('shadikhanaPendingTab');
            if (pendingTab) {
                window.sessionStorage.removeItem('shadikhanaPendingTab');
            }
        } catch (error) {
            return;
        }

        if (!pendingTab || this.isGuestUser) {
            return;
        }

        try {
            window.sessionStorage.removeItem('shadikhanaShowAdminLoginNotes');
        } catch (error) {
            // Ignore storage failures in restricted browsers.
        }

        if (pendingTab === 'admin' || pendingTab === 'bookingData') {
            if (this.isSystemAdmin) {
                this.activeTab = pendingTab;
                if (pendingTab === 'admin') {
                    this.activeAdminSection = 'bookings';
                    this.loadAdminData();
                } else {
                    this.refreshBookingData();
                }
                return;
            }

            this.showToast(
                'Administrator access required',
                'Sign in with the administrator credentials shown on the login page.',
                'warning'
            );
        }

        this.focusPendingAdminBooking();
    }

    focusPendingAdminBooking() {
        let bookingId = this.pendingAdminBookingId;
        if (!bookingId) {
            try {
                bookingId = window.sessionStorage.getItem(BOOKING_DEEP_LINK_STORAGE_KEY);
            } catch (error) {
                bookingId = null;
            }
        }

        if (!bookingId || !this.adminBookings || this.adminBookings.length === 0) {
            return;
        }

        const bookingIndex = this.sortedAdminBookings.findIndex((booking) => booking.id === bookingId);
        if (bookingIndex < 0) {
            return;
        }

        this.adminBookingPageNumber =
            Math.floor(bookingIndex / ADMIN_BOOKING_PAGE_SIZE) + 1;

        this.adminBookings = this.adminBookings.map((booking) => ({
            ...booking,
            adminCardClass:
                booking.id === bookingId
                    ? `${booking.adminCardClass} admin-card_highlighted`
                    : booking.adminCardClass.replace(' admin-card_highlighted', '')
        }));

        // eslint-disable-next-line @lwc/lwc/no-async-operation
        requestAnimationFrame(() => {
            const card = this.template.querySelector(`[data-booking-focus="${bookingId}"]`);
            if (card) {
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });

        this.pendingAdminBookingId = null;
        try {
            window.sessionStorage.removeItem(BOOKING_DEEP_LINK_STORAGE_KEY);
        } catch (error) {
            // Ignore storage failures in restricted browsers.
        }
    }

    @wire(getDailyRate)
    wiredDailyRate(result) {
        this.wiredDailyRateResult = result;
        const { data } = result;
        if (data != null) {
            this.dailyRate = data;
            this.adminDefaultDailyRate = data;
            this.dailyRateLabel = `${this.formatInr(data)}/day`;
            this.buildCalendar();
            this.buildAdminPricingCalendar();
        }
    }

    @wire(getDailyRatesForMonth, { year: '$currentYear', month: '$currentMonth' })
    wiredMonthlyDailyRates(result) {
        this.wiredMonthlyDailyRatesResult = result;
        const { data } = result;
        if (data) {
            this.dateRateMap = { ...data };
            this.buildCalendar();
            this.buildAdminPricingCalendar();
        }
    }

    @wire(getDailyRatesForMonth, { year: '$marqueeRateYear', month: '$marqueeRateMonth' })
    wiredMarqueeMonthRates(result) {
        this.wiredMarqueeMonthRatesResult = result;
        const { data } = result;
        if (data) {
            this.marqueeMonthRateMap = { ...data };
        }
    }

    @wire(getCurrentUserInfo)
    wiredUser({ data }) {
        if (data) {
            this.userName = data.name;
            this.userEmail = data.email;
            this.isSystemAdmin = data.isSystemAdmin;
            this.isGuestUser = data.isGuest === true;

            if (!this.isSystemAdmin && (this.activeTab === 'bookingData' || this.activeTab === 'admin')) {
                this.activeTab = 'home';
                this.bookingDataRecords = [];
            } else if (this.isSystemAdmin) {
                this.refreshBookingData();
            }

            this.restorePendingTabAfterLogin();
        }
    }

    @wire(getPortalFooterInfo)
    wiredFooterInfo(result) {
        this.wiredFooterInfoResult = result;
        const { data } = result;
        if (data) {
            this.footerContactNumber = data.contactNumber || '6364054881';
            this.footerAdditionalContactNumber = data.additionalContactNumber || '9652741400';
            this.footerEscalationEmail = data.escalationEmail || 'urdhushadikhanaa@gmail.com';
        }
    }

    @wire(getBookings, { year: '$currentYear', month: '$currentMonth' })
    wiredBookings(result) {
        this.wiredBookingsResult = result;
        const { data, error } = result;

        if (data) {
            this.bookings = data;
            this.rebuildCalendarDateState(data);
            this.buildCalendar();
        } else if (error) {
            this.showToast('Error', this.reduceError(error), 'error');
        }
    }

    async refreshBookingData() {
        if (!this.isSystemAdmin) {
            this.bookingDataRecords = [];
            return;
        }

        try {
            const data = await getBookingData();
            this.bookingDataRecords = data || [];
            this.bookingDataPageNumber = 1;
        } catch (error) {
            this.bookingDataRecords = [];
            this.showToast('Error', this.reduceError(error), 'error');
        }
    }

    get hasBookings() {
        return this.bookings && this.bookings.length > 0;
    }

    get hasBookingData() {
        return this.sortedBookingDataRows.length > 0;
    }

    get bookingDataPageSizeOptions() {
        return BOOKING_DATA_PAGE_SIZES.map((size) => ({
            label: String(size),
            value: String(size)
        }));
    }

    get bookingDataPageSizeValue() {
        return String(this.bookingDataPageSize);
    }

    get sortedBookingDataRows() {
        const sorted = [...(this.bookingDataRecords || [])].sort((left, right) => {
            const dateCompare = (left.bookingDate || '').localeCompare(right.bookingDate || '');
            if (dateCompare !== 0) {
                return dateCompare;
            }

            return (left.bookingNumber || '').localeCompare(right.bookingNumber || '');
        });

        return sorted.map((booking) => this.decorateBookingDataRow(booking));
    }

    get totalBookingDataRows() {
        return this.sortedBookingDataRows.length;
    }

    get totalBookingDataPages() {
        if (this.totalBookingDataRows === 0) {
            return 1;
        }

        return Math.ceil(this.totalBookingDataRows / this.bookingDataPageSize);
    }

    get paginatedBookingDataRows() {
        if (this.totalBookingDataRows === 0) {
            return [];
        }

        const pageNumber = Math.min(this.bookingDataPageNumber, this.totalBookingDataPages);
        const startIndex = (pageNumber - 1) * this.bookingDataPageSize;
        return this.sortedBookingDataRows.slice(startIndex, startIndex + this.bookingDataPageSize);
    }

    get bookingDataCountLabel() {
        const count = this.totalBookingDataRows;
        return count === 1 ? '1 booking' : `${count} bookings`;
    }

    get bookingDataPageSummary() {
        if (this.totalBookingDataRows === 0) {
            return 'No bookings to display';
        }

        const pageNumber = Math.min(this.bookingDataPageNumber, this.totalBookingDataPages);
        const startIndex = (pageNumber - 1) * this.bookingDataPageSize + 1;
        const endIndex = Math.min(pageNumber * this.bookingDataPageSize, this.totalBookingDataRows);
        return `Showing ${startIndex}-${endIndex} of ${this.totalBookingDataRows}`;
    }

    get bookingDataPageLabel() {
        return `Page ${Math.min(this.bookingDataPageNumber, this.totalBookingDataPages)} of ${this.totalBookingDataPages}`;
    }

    get isBookingDataFirstPageDisabled() {
        return this.bookingDataPageNumber <= 1;
    }

    get isBookingDataLastPageDisabled() {
        return this.bookingDataPageNumber >= this.totalBookingDataPages;
    }

    handleBookingDataPageSizeChange(event) {
        this.bookingDataPageSize = Number(event.detail.value);
        this.bookingDataPageNumber = 1;
    }

    handleBookingDataPrevPage() {
        if (this.bookingDataPageNumber > 1) {
            this.bookingDataPageNumber -= 1;
        }
    }

    handleBookingDataNextPage() {
        if (this.bookingDataPageNumber < this.totalBookingDataPages) {
            this.bookingDataPageNumber += 1;
        }
    }

    get hasAdminBookings() {
        return this.adminBookings && this.adminBookings.length > 0;
    }

    get pendingAdminBookings() {
        return (this.adminBookings || []).filter((booking) => booking.status === 'Pending');
    }

    get confirmedAdminBookings() {
        return (this.adminBookings || []).filter((booking) => booking.status === 'Confirmed');
    }

    get otherAdminBookings() {
        return (this.adminBookings || []).filter(
            (booking) => booking.status !== 'Pending' && booking.status !== 'Confirmed'
        );
    }

    get sortedAdminBookings() {
        return [
            ...this.pendingAdminBookings,
            ...this.confirmedAdminBookings,
            ...this.otherAdminBookings
        ];
    }

    get totalAdminBookingPages() {
        const totalRows = this.sortedAdminBookings.length;
        return totalRows === 0 ? 1 : Math.ceil(totalRows / ADMIN_BOOKING_PAGE_SIZE);
    }

    get paginatedAdminBookings() {
        const pageNumber = Math.min(this.adminBookingPageNumber, this.totalAdminBookingPages);
        const startIndex = (pageNumber - 1) * ADMIN_BOOKING_PAGE_SIZE;
        return this.sortedAdminBookings.slice(startIndex, startIndex + ADMIN_BOOKING_PAGE_SIZE);
    }

    get paginatedPendingAdminBookings() {
        return this.paginatedAdminBookings.filter((booking) => booking.status === 'Pending');
    }

    get paginatedConfirmedAdminBookings() {
        return this.paginatedAdminBookings.filter((booking) => booking.status === 'Confirmed');
    }

    get paginatedOtherAdminBookings() {
        return this.paginatedAdminBookings.filter(
            (booking) => booking.status !== 'Pending' && booking.status !== 'Confirmed'
        );
    }

    get showAdminBookingPagination() {
        return this.sortedAdminBookings.length > ADMIN_BOOKING_PAGE_SIZE;
    }

    get adminBookingPageLabel() {
        return `Page ${Math.min(this.adminBookingPageNumber, this.totalAdminBookingPages)} of ${this.totalAdminBookingPages}`;
    }

    get adminBookingPageSummary() {
        const totalRows = this.sortedAdminBookings.length;
        if (totalRows === 0) {
            return 'Showing 0 bookings';
        }
        const pageNumber = Math.min(this.adminBookingPageNumber, this.totalAdminBookingPages);
        const startIndex = (pageNumber - 1) * ADMIN_BOOKING_PAGE_SIZE + 1;
        const endIndex = Math.min(pageNumber * ADMIN_BOOKING_PAGE_SIZE, totalRows);
        return `Showing ${startIndex}-${endIndex} of ${totalRows} bookings`;
    }

    get isAdminBookingFirstPageDisabled() {
        return this.adminBookingPageNumber <= 1;
    }

    get isAdminBookingLastPageDisabled() {
        return this.adminBookingPageNumber >= this.totalAdminBookingPages;
    }

    get hasPendingAdminBookings() {
        return this.paginatedPendingAdminBookings.length > 0;
    }

    get hasConfirmedAdminBookings() {
        return this.paginatedConfirmedAdminBookings.length > 0;
    }

    get hasOtherAdminBookings() {
        return this.paginatedOtherAdminBookings.length > 0;
    }

    handleAdminBookingPrevPage() {
        if (this.adminBookingPageNumber > 1) {
            this.adminBookingPageNumber -= 1;
        }
    }

    handleAdminBookingNextPage() {
        if (this.adminBookingPageNumber < this.totalAdminBookingPages) {
            this.adminBookingPageNumber += 1;
        }
    }

    resetAdminBookingPagination() {
        this.adminBookingPageNumber = 1;
    }

    get hasCelebrationBanners() {
        return this.celebrationBanners.length > 0;
    }

    get celebrationBanners() {
        const sourceBookings = this.getCelebrationBookingSource();
        return sourceBookings
            .filter((booking) => this.isBookingCelebrationActive(booking))
            .map((booking) => this.buildCelebrationBanner(booking))
            .sort((left, right) => left.sortKey.localeCompare(right.sortKey));
    }

    get marqueeRateYear() {
        return new Date().getFullYear();
    }

    get marqueeRateMonth() {
        return new Date().getMonth() + 1;
    }

    get showPriceDropMarquee() {
        return this.priceDropOffers.length > 0;
    }

    get priceDropOffers() {
        return this.buildPriceDropOffers();
    }

    get priceDropMarqueeText() {
        return this.buildPriceDropMarqueeText(this.priceDropOffers);
    }

    get priceDropMarqueeLead() {
        if (!this.priceDropOffers.length) {
            return '';
        }

        return `Limited-time price drop this ${MONTHS[this.marqueeRateMonth - 1]}!`;
    }

    get isHomeTab() {
        return this.activeTab === 'home';
    }

    get isBookingDataTab() {
        return this.activeTab === 'bookingData' && this.isSystemAdmin;
    }

    get isAdminTab() {
        return this.activeTab === 'admin' && this.isSystemAdmin;
    }

    get navItems() {
        const items = [this.buildNavItem('home', 'Home', 'utility:home', false)];

        if (!this.isSystemAdmin) {
            return items;
        }

        items.push(this.buildNavItem('bookingData', 'Booking Data', 'utility:table', false));

        const adminItem = this.buildNavItem('admin', 'Administration', 'utility:settings', false);
        adminItem.showSubNav = true;
        adminItem.showChevron = true;
        adminItem.chevronIcon = this.isAdminTab ? 'utility:chevrondown' : 'utility:chevronright';
        adminItem.subNavClassName = this.isAdminTab
            ? 'sidebar-subnav sidebar-subnav_open'
            : 'sidebar-subnav sidebar-subnav_closed';
        adminItem.subNavHidden = !this.isAdminTab;

        if (this.isAdminTab) {
            adminItem.className += ' sidebar-nav__item_expanded';
        }

        items.push(adminItem);
        return items;
    }

    get adminSubNavItems() {
        return ADMIN_SECTION_NAV.map((section) => this.buildAdminSubNavItem(section));
    }

    get isAdminBookingsSection() {
        return this.activeAdminSection === 'bookings';
    }

    get isAdminReportsSection() {
        return this.activeAdminSection === 'reports';
    }

    get isAdminPricingSection() {
        return this.activeAdminSection === 'pricing';
    }

    get isAdminSmsSection() {
        return this.activeAdminSection === 'sms';
    }

    get isAdminEmailSection() {
        return this.activeAdminSection === 'email';
    }

    get isAdminBrandingSection() {
        return this.activeAdminSection === 'branding';
    }

    get portalKickerLabel() {
        return this.venueLocationName || 'Urdu Shadikhana';
    }

    get isBrandingEditorVisible() {
        return this.brandingUnlocked === true;
    }

    get galleryUploadSlots() {
        return (this.venueImages || []).map((image) => ({
            ...image,
            uploadKey: image.resourceName || image.id
        }));
    }

    restoreBrandingUnlockState() {
        try {
            this.brandingUnlocked =
                window.sessionStorage.getItem(BRANDING_SECRET_STORAGE_KEY) === 'true';
        } catch (error) {
            this.brandingUnlocked = false;
        }
    }

    @wire(getPortalBrandingConfig)
    wiredPortalBranding(result) {
        this.wiredPortalBrandingResult = result;
        const { data } = result;
        if (data) {
            this.applyPortalBranding(data);
        }
    }

    applyPortalBranding(config) {
        if (!config) {
            return;
        }

        this.venueLocationName =
            config.venueName && String(config.venueName).trim()
                ? String(config.venueName).trim()
                : this.venueLocationName || 'Urdu Shadikhana';
        this.footerContactNumber = config.footerPhone || this.footerContactNumber;
        this.footerAdditionalContactNumber =
            config.footerAdditionalPhone || this.footerAdditionalContactNumber;
        this.footerEscalationEmail = config.footerEmail || this.footerEscalationEmail;
        this.brandingHeaderAddressLine = config.headerAddressLine || this.brandingHeaderAddressLine;
        this.brandingFullAddress =
            config.fullAddress ||
            config.headerAddressLine ||
            this.brandingFullAddress;
        if (config.addressLines && config.addressLines.length) {
            this.addressLines = config.addressLines;
        }
        this.applyHallCapacityFromBranding(config);
        this.rebuildVenueImages(config.galleryImages);
    }

    applyHallCapacityFromBranding(config) {
        const seatingCapacity = Number(config.seatingCapacity);
        const comfortableGuests = Number(config.comfortableGuests);

        if (Number.isFinite(seatingCapacity) && seatingCapacity > 0) {
            this.hallSeatingCapacity = seatingCapacity;
            this.adminHallSeatingCapacity = seatingCapacity;
        }

        if (Number.isFinite(comfortableGuests) && comfortableGuests > 0) {
            this.hallComfortableGuests = comfortableGuests;
            this.adminHallComfortableGuests = comfortableGuests;
        }
    }

    rebuildVenueImages(galleryImages) {
        const resourceUrlByName = {
            ShadikhanaHallExterior: hallExteriorImage,
            ShadikhanaHallInterior: hallInteriorImage,
            ShadikhanaDiningArea: diningAreaImage
        };
        const sourceImages = galleryImages && galleryImages.length ? galleryImages : [
            {
                id: 'exterior',
                resourceName: 'ShadikhanaHallExterior',
                label: 'Shadikhana Exterior',
                caption: 'Front view of Urdu Shadikhana'
            },
            {
                id: 'interior',
                resourceName: 'ShadikhanaHallInterior',
                label: 'Main Hall',
                caption: 'Spacious main hall for ceremonies and gatherings'
            },
            {
                id: 'dining',
                resourceName: 'ShadikhanaDiningArea',
                label: 'Dining Area',
                caption: 'Dining and event seating arrangement'
            }
        ];

        this.venueImages = sourceImages.map((image) => {
            const resourceName = image.resourceName;
            const cacheKey =
                image.cacheKey ||
                this.galleryImageCacheKeys[resourceName] ||
                'default';
            const uploadedUrl = image.imageUrl;
            const baseUrl = uploadedUrl || resourceUrlByName[resourceName] || hallExteriorImage;
            const separator = String(baseUrl).includes('?') ? '&' : '?';
            return {
                id: image.id,
                resourceName,
                label: image.label,
                caption: image.caption,
                url: uploadedUrl ? `${baseUrl}${separator}v=${cacheKey}` : `${baseUrl}?v=${cacheKey}`
            };
        });

        if (this.selectedImageIndex >= this.venueImages.length) {
            this.selectedImageIndex = 0;
        }
    }

    buildBrandingSaveRequest() {
        const formValues = this.readBrandingFormValues();
        return {
            venueName: formValues.venueName,
            footerPhone: formValues.footerPhone,
            footerAdditionalPhone: formValues.footerAdditionalPhone,
            footerEmail: formValues.footerEmail,
            headerAddressLine: formValues.headerAddressLine,
            fullAddress: formValues.fullAddress,
            hallSeatingCapacity: Number(formValues.hallSeatingCapacity),
            hallComfortableGuests: Number(formValues.hallComfortableGuests)
        };
    }

    readBrandingFormValues() {
        const readField = (fieldName, fallbackValue) => {
            const input = this.template.querySelector(`[data-field="${fieldName}"]`);
            if (input && input.value != null && String(input.value).trim()) {
                return String(input.value).trim();
            }
            return fallbackValue != null ? String(fallbackValue).trim() : '';
        };

        return {
            venueName: readField('venueLocationName', this.venueLocationName),
            footerPhone: readField('footerContactNumber', this.footerContactNumber),
            footerAdditionalPhone: readField(
                'footerAdditionalContactNumber',
                this.footerAdditionalContactNumber
            ),
            footerEmail: readField('footerEscalationEmail', this.footerEscalationEmail),
            headerAddressLine: readField('brandingHeaderAddressLine', this.brandingHeaderAddressLine),
            fullAddress: readField('brandingFullAddress', this.brandingFullAddress),
            hallSeatingCapacity: readField('hallSeatingCapacity', this.hallSeatingCapacity),
            hallComfortableGuests: readField('hallComfortableGuests', this.hallComfortableGuests)
        };
    }

    syncBrandingFormState(formValues) {
        this.venueLocationName = formValues.venueName || this.venueLocationName;
        this.footerContactNumber = formValues.footerPhone || this.footerContactNumber;
        this.footerAdditionalContactNumber =
            formValues.footerAdditionalPhone || this.footerAdditionalContactNumber;
        this.footerEscalationEmail = formValues.footerEmail || this.footerEscalationEmail;
        this.brandingHeaderAddressLine =
            formValues.headerAddressLine || this.brandingHeaderAddressLine;
        this.brandingFullAddress = formValues.fullAddress || this.brandingFullAddress;

        const seatingCapacity = Number(formValues.hallSeatingCapacity);
        const comfortableGuests = Number(formValues.hallComfortableGuests);
        if (Number.isFinite(seatingCapacity) && seatingCapacity > 0) {
            this.hallSeatingCapacity = seatingCapacity;
            this.adminHallSeatingCapacity = seatingCapacity;
        }
        if (Number.isFinite(comfortableGuests) && comfortableGuests > 0) {
            this.hallComfortableGuests = comfortableGuests;
            this.adminHallComfortableGuests = comfortableGuests;
        }
    }

    handleBrandingSecretInputChange(event) {
        this.brandingSecretInput = event.target.value;
    }

    handleUnlockBrandingSettings() {
        if (this.brandingSecretInput !== '@AdminSpen@202456') {
            this.showToast('Access denied', 'Invalid branding secret key.', 'error');
            return;
        }

        this.brandingUnlocked = true;
        try {
            window.sessionStorage.setItem(BRANDING_SECRET_STORAGE_KEY, 'true');
        } catch (error) {
            // Ignore storage failures in restricted browsers.
        }
        this.showToast('Branding unlocked', 'Site branding settings are now available.', 'success');
    }

    handleBrandingFieldChange(event) {
        const field = event.target.dataset.field;
        this[field] = event.target.value;
    }

    handleExitBrandingSettings() {
        this.brandingUnlocked = false;
        this.brandingSecretInput = '';
        try {
            window.sessionStorage.removeItem(BRANDING_SECRET_STORAGE_KEY);
        } catch (error) {
            // Ignore storage failures in restricted browsers.
        }
        this.activeAdminSection = 'bookings';
    }

    async handleCancelBrandingSettings() {
        if (this.wiredPortalBrandingResult) {
            await refreshApex(this.wiredPortalBrandingResult);
        }
        this.handleExitBrandingSettings();
    }

    async handleSaveBrandingSettings() {
        if (!this.brandingUnlocked) {
            this.showToast('Access denied', 'Enter the branding secret key first.', 'error');
            return;
        }

        const formValues = this.readBrandingFormValues();
        this.syncBrandingFormState(formValues);

        this.isBrandingSaving = true;
        try {
            const config = await savePortalBrandingConfig({
                secretKey: this.brandingSecretInput || '@AdminSpen@202456',
                venueName: formValues.venueName,
                footerPhone: formValues.footerPhone,
                footerAdditionalPhone: formValues.footerAdditionalPhone,
                footerEmail: formValues.footerEmail,
                headerAddressLine: formValues.headerAddressLine,
                fullAddress: formValues.fullAddress,
                hallSeatingCapacity: Number(formValues.hallSeatingCapacity),
                hallComfortableGuests: Number(formValues.hallComfortableGuests)
            });
            this.applyPortalBranding(config);
            if (this.wiredPortalBrandingResult) {
                await refreshApex(this.wiredPortalBrandingResult);
            }
            if (this.wiredFooterInfoResult) {
                await refreshApex(this.wiredFooterInfoResult);
            }
            if (this.wiredHallBookingConfigResult) {
                await refreshApex(this.wiredHallBookingConfigResult);
            }
            this.showToast('Branding saved', 'Your branding changes were saved successfully.', 'success');
        } catch (error) {
            this.showToast('Branding save failed', this.reduceError(error), 'error');
        } finally {
            this.isBrandingSaving = false;
        }
    }

    handleGalleryUploadChange(event) {
        const resourceName = event.target.dataset.resource;
        const file = event.target.files && event.target.files[0];
        if (!resourceName || !file) {
            return;
        }
        if (!this.brandingUnlocked) {
            this.showToast('Access denied', 'Enter the branding secret key first.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = async () => {
            const base64Marker = ';base64,';
            const result = String(reader.result || '');
            const contentIndex = result.indexOf(base64Marker);
            if (contentIndex < 0) {
                this.showToast('Upload failed', 'Unable to read the selected image.', 'error');
                return;
            }

            this.isBrandingSaving = true;
            try {
                const uploaded = await uploadPortalGalleryImage({
                    secretKey: this.brandingSecretInput || '@AdminSpen@202456',
                    resourceName,
                    base64Data: result.substring(contentIndex + base64Marker.length),
                    contentType: file.type
                });
                this.galleryImageCacheKeys = {
                    ...this.galleryImageCacheKeys,
                    [resourceName]: uploaded.cacheKey || String(Date.now())
                };
                const currentConfig = await getPortalBrandingConfig();
                this.applyPortalBranding(currentConfig);
                this.showToast('Photo updated', 'Gallery image refreshed on the portal.', 'success');
            } catch (error) {
                this.showToast('Upload failed', this.reduceError(error), 'error');
            } finally {
                this.isBrandingSaving = false;
                event.target.value = null;
            }
        };
        reader.readAsDataURL(file);
    }

    get isAdminPortalLoginSection() {
        return this.activeAdminSection === 'portalLogin';
    }

    buildNavItem(id, label, iconName, locked) {
        let className =
            this.activeTab === id ? 'sidebar-nav__item sidebar-nav__item_active' : 'sidebar-nav__item';

        if (locked) {
            className += ' sidebar-nav__item_locked';
        }

        return {
            id,
            label,
            iconName,
            locked,
            className,
            showSubNav: false,
            showChevron: false,
            chevronIcon: 'utility:chevronright',
            subNavClassName: 'sidebar-subnav sidebar-subnav_closed',
            subNavHidden: true
        };
    }

    buildAdminSubNavItem(section) {
        const className =
            this.activeAdminSection === section.id
                ? 'sidebar-subnav__item sidebar-subnav__item_active'
                : 'sidebar-subnav__item';

        return {
            id: section.id,
            label: section.label,
            iconName: section.iconName,
            className
        };
    }

    handleNavClick(event) {
        const tab = event.currentTarget.dataset.tab;

        if ((tab === 'admin' || tab === 'bookingData') && !this.isSystemAdmin) {
            this.showToast(
                'Access restricted',
                'Booking Data and Administration are available only to System Administrators.',
                'warning'
            );
            return;
        }

        this.activeTab = tab;

        if (tab === 'admin') {
            if (!this.activeAdminSection) {
                this.activeAdminSection = 'bookings';
            }
            this.loadAdminData();
        } else if (tab === 'bookingData') {
            this.refreshBookingData();
        }
    }

    handleAdminSubNavClick(event) {
        if (!this.isSystemAdmin) {
            return;
        }

        this.activeTab = 'admin';
        this.activeAdminSection = event.currentTarget.dataset.adminSection;
        if (this.activeAdminSection === 'pricing') {
            this.loadAdminDateRates();
            this.buildAdminPricingCalendar();
        }
    }

    async loadAdminData() {
        this.isAdminLoading = true;
        try {
            const [bookings, settings] = await Promise.all([
                getAdminBookings(),
                getPortalSettings()
            ]);
            this.adminBookings = bookings.map((booking) => this.decorateAdminBooking(booking));
            this.resetAdminBookingPagination();
            this.applyPortalSettings(settings);
            await this.handleGenerateMonthlyReport();
            this.focusPendingAdminBooking();
        } catch (error) {
            this.showToast('Admin access failed', this.reduceError(error), 'error');
        } finally {
            this.isAdminLoading = false;
        }
    }

    initReportMonth() {
        const now = new Date();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        this.reportMonthValue = `${now.getFullYear()}-${month}`;
        this.applyMonthToReportRange();
    }

    applyMonthToReportRange() {
        if (!this.reportMonthValue) {
            return;
        }

        const parts = this.reportMonthValue.split('-');
        if (parts.length !== 2) {
            return;
        }

        const year = Number(parts[0]);
        const month = Number(parts[1]);
        if (Number.isNaN(year) || Number.isNaN(month)) {
            return;
        }

        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0);
        this.reportStartDate = this.formatIsoDate(start);
        this.reportEndDate = this.formatIsoDate(end);
    }

    handleReportModeChange(event) {
        this.reportMode = event.detail.value;
        this.monthlyReport = null;

        if (this.reportMode === 'month') {
            this.applyMonthToReportRange();
        }
    }

    handleReportMonthChange(event) {
        this.reportMonthValue = event.target.value;
        this.monthlyReport = null;
        this.applyMonthToReportRange();
    }

    handleReportDateChange(event) {
        const field = event.target.dataset.field;
        this[field] = event.target.value;
        this.monthlyReport = null;
    }

    validateReportDateRange() {
        if (!this.reportStartDate || !this.reportEndDate) {
            this.showToast('Missing dates', 'Please select report start and end dates.', 'error');
            return false;
        }

        if (this.reportEndDate < this.reportStartDate) {
            this.showToast('Invalid range', 'Report end date cannot be before start date.', 'error');
            return false;
        }

        const startDate = this.parseIsoDate(this.reportStartDate);
        const endDate = this.parseIsoDate(this.reportEndDate);
        const maxEndDate = new Date(
            startDate.getFullYear(),
            startDate.getMonth() + 6,
            startDate.getDate()
        );

        if (endDate > maxEndDate) {
            this.showToast('Range too long', 'Report range cannot exceed 6 months.', 'error');
            return false;
        }

        return true;
    }

    async handleGenerateMonthlyReport() {
        if (this.reportMode === 'month') {
            if (!this.reportMonthValue) {
                this.showToast('Missing month', 'Please select a report month.', 'error');
                return;
            }
            this.applyMonthToReportRange();
        }

        if (!this.validateReportDateRange()) {
            return;
        }

        this.isReportLoading = true;
        try {
            const report = await getAdminBookingReport({
                startDateStr: this.reportStartDate,
                endDateStr: this.reportEndDate
            });
            this.monthlyReport = this.decorateMonthlyReport(report);
        } catch (error) {
            this.monthlyReport = null;
            this.showToast('Report failed', this.reduceError(error), 'error');
        } finally {
            this.isReportLoading = false;
        }
    }

    decorateMonthlyReport(report) {
        if (!report) {
            return null;
        }

        return {
            ...report,
            totalEstimatedLabel: this.formatInr(report.totalEstimatedAmount),
            totalFinalLabel: this.formatInr(report.totalFinalAmount),
            bookingRows: (report.bookingRows || []).map((bookingRow) => ({
                ...bookingRow,
                rowKey: bookingRow.bookingId,
                amountLabel: this.formatInr(
                    bookingRow.finalAmount != null ? bookingRow.finalAmount : bookingRow.estimatedAmount
                ),
                statusClass: this.buildStatusClass(bookingRow.status)
            })),
            dayRows: (report.dayRows || [])
                .filter((day) => day.hasEvents)
                .map((day) => ({
                    ...day,
                    rowClass: 'report-day-row report-day-row_active',
                    events: (day.events || []).map((eventRow) => ({
                        ...eventRow,
                        rowKey: `${day.isoDate}-${eventRow.bookingId}`,
                        amountLabel: this.formatInr(
                            eventRow.finalAmount != null ? eventRow.finalAmount : eventRow.estimatedAmount
                        ),
                        statusClass: this.buildStatusClass(eventRow.status)
                    }))
                }))
        };
    }

    buildStatusClass(status) {
        const normalized = (status || 'pending').toLowerCase();
        return `status-pill status-pill_${normalized}`;
    }

    decorateBookingDataRow(booking) {
        const fromDateDisplay = this.formatDateDdMmYyyy(booking.bookingDate);
        const toDateDisplay = this.formatDateDdMmYyyy(booking.endDate || booking.bookingDate);
        const amount =
            booking.finalAmount != null ? booking.finalAmount : booking.estimatedAmount;
        const periodLabel =
            fromDateDisplay === toDateDisplay
                ? fromDateDisplay
                : `${fromDateDisplay} – ${toDateDisplay}`;

        return {
            rowKey: booking.id,
            bookingNumber: booking.bookingNumber,
            fromDateDisplay,
            toDateDisplay,
            periodLabel,
            groupDateKey: fromDateDisplay,
            eventName: booking.eventName || '—',
            contactName: booking.contactName || '—',
            contactPhone: booking.contactPhone || '',
            status: booking.status,
            statusClass: this.buildStatusClass(booking.status),
            timeLabel: booking.timeRangeLabel || '—',
            amountLabel: amount != null ? this.formatInr(amount) : '—'
        };
    }

    handleDownloadMonthlyReport() {
        if (!this.monthlyReport) {
            this.showToast('No report', 'Generate a report first.', 'warning');
            return;
        }

        const lines = [
            [
                'Request No',
                'From Date',
                'To Date',
                'Event',
                'Contact',
                'Phone',
                'Status',
                'Timing',
                'Days',
                'Amount (INR)'
            ].join(',')
        ];

        const bookingRows = this.monthlyReport.bookingRows || [];
        if (bookingRows.length === 0) {
            this.showToast('Nothing to export', 'No booking requests in this date range.', 'warning');
            return;
        }

        bookingRows.forEach((bookingRow) => {
            lines.push(
                [
                    bookingRow.bookingNumber,
                    bookingRow.fromDate,
                    bookingRow.toDate,
                    bookingRow.eventName,
                    bookingRow.contactName,
                    bookingRow.contactPhone,
                    bookingRow.status,
                    bookingRow.timeLabel,
                    bookingRow.numberOfDays,
                    bookingRow.finalAmount != null ? bookingRow.finalAmount : bookingRow.estimatedAmount
                ]
                    .map((value) => this.escapeCsv(value))
                    .join(',')
            );
        });

        lines.push('');
        lines.push(`Report Period,${this.escapeCsv(this.monthlyReport.rangeLabel)}`);
        lines.push(`From,${this.escapeCsv(this.monthlyReport.rangeStartDate)}`);
        lines.push(`To,${this.escapeCsv(this.monthlyReport.rangeEndDate)}`);
        lines.push(`Total Bookings,${this.monthlyReport.totalBookings}`);
        lines.push(`Confirmed,${this.monthlyReport.confirmedCount}`);
        lines.push(`Pending,${this.monthlyReport.pendingCount}`);
        lines.push(`Cancelled,${this.monthlyReport.cancelledCount}`);
        lines.push(`Total Estimated (INR),${this.monthlyReport.totalEstimatedAmount || 0}`);
        lines.push(`Total Final (INR),${this.monthlyReport.totalFinalAmount || 0}`);

        const filename = `shadikhana-report-${this.monthlyReport.rangeStartDate}-to-${this.monthlyReport.rangeEndDate}.csv`;
        this.downloadCsvFile(lines.join('\r\n'), filename);
    }

    downloadCsvFile(csvContent, filename) {
        const fullContent = `\uFEFF${csvContent}`;

        try {
            const blob = new Blob([fullContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.style.display = 'none';
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.setTimeout(() => URL.revokeObjectURL(url), 250);
            return;
        } catch (error) {
            // Experience Cloud Locker may block Blob downloads; fall back to a data URI.
        }

        const encoded = encodeURIComponent(fullContent);
        const link = document.createElement('a');
        link.style.display = 'none';
        link.href = `data:text/csv;charset=utf-8,${encoded}`;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    escapeCsv(value) {
        const text = value == null ? '' : String(value);
        if (text.includes(',') || text.includes('"') || text.includes('\n')) {
            return `"${text.replace(/"/g, '""')}"`;
        }
        return text;
    }

    get hasMonthlyReport() {
        return this.monthlyReport != null;
    }

    get hasReportDayRows() {
        return (
            this.monthlyReport &&
            this.monthlyReport.bookingRows &&
            this.monthlyReport.bookingRows.length > 0
        );
    }

    get isCustomReportMode() {
        return this.reportMode === 'custom';
    }

    get isMonthReportMode() {
        return this.reportMode === 'month';
    }

    get isReportBusy() {
        return this.isReportLoading || this.isAdminLoading;
    }

    get isDownloadReportDisabled() {
        return !this.hasMonthlyReport;
    }

    applyPortalSettings(settings) {
        if (!settings) {
            return;
        }
        this.adminMobileNumber = settings.adminMobileNumber || '6364054881';
        this.twilioFromNumber = settings.twilioFromNumber || '';
        this.twilioAccountSid = settings.twilioAccountSid || '';
        this.twilioAuthToken = '';
        this.twilioAuthTokenConfigured = settings.twilioAuthTokenConfigured === true;
        this.smsEnabled = settings.smsEnabled !== false;
        this.adminEmail = settings.adminEmail || 'urdhushadikhanaa@gmail.com';
        this.emailEnabled = settings.emailEnabled !== false;
        this.footerAdditionalPhone = settings.footerAdditionalPhone || '9652741400';
        this.portalSiteUrl =
            settings.portalSiteUrl || 'https://shabbirtech4-dev-ed.develop.my.site.com/urdushadikhana';
        this.portalLoginUrl =
            settings.portalLoginUrl || 'https://shabbirtech4-dev-ed.develop.my.site.com/urdushadikhana/login';
        this.adminDefaultDailyRate = settings.defaultDailyRate || this.dailyRate || 8000;
        this.adminHallSeatingCapacity = settings.hallSeatingCapacity || DEFAULT_HALL_SEATING_CAPACITY;
        this.adminHallComfortableGuests = settings.hallComfortableGuests || DEFAULT_HALL_COMFORTABLE_GUESTS;
        this.adminHallDecorationCharge = settings.hallDecorationCharge ?? DEFAULT_HALL_DECORATION_CHARGE;
        this.adminHallCateringChargePerGuest =
            settings.hallCateringChargePerGuest ?? DEFAULT_HALL_CATERING_CHARGE_PER_GUEST;
        this.applyHallBookingConfig({
            seatingCapacity: this.adminHallSeatingCapacity,
            comfortableGuests: this.adminHallComfortableGuests,
            decorationCharge: this.adminHallDecorationCharge,
            cateringChargePerGuest: this.adminHallCateringChargePerGuest
        });
        this.portalAdminUsername = settings.portalAdminUsername || '';
        this.portalAdminPassword = settings.portalAdminPassword || '';
        this.portalLoginNotes =
            settings.portalLoginNotes ||
            'Use the administrator username and password below to sign in and open the Administration section.';
    }

    get twilioAuthTokenHelp() {
        return this.twilioAuthTokenConfigured
            ? 'Auth token is saved. Enter a new value only if you want to replace it.'
            : 'Paste your Twilio Auth Token from the Twilio Console.';
    }

    handleSettingsInputChange(event) {
        const field = event.target.dataset.field;

        if (field === 'smsEnabled') {
            this.smsEnabled = event.target.checked;
            return;
        }

        if (field === 'emailEnabled') {
            this.emailEnabled = event.target.checked;
            return;
        }

        this[field] = event.target.value;

        if (field === 'adminDefaultDailyRate') {
            this.buildAdminPricingCalendar();
            this.buildCalendar();
        }
    }

    async handleSavePortalSettings() {
        this.isSettingsSaving = true;
        try {
            const settings = await savePortalSettings({
                adminMobileNumber: this.adminMobileNumber,
                twilioFromNumber: this.twilioFromNumber,
                twilioAccountSid: this.twilioAccountSid,
                twilioAuthToken: this.twilioAuthToken,
                smsEnabled: this.smsEnabled,
                portalAdminUsername: this.portalAdminUsername,
                portalAdminPassword: this.portalAdminPassword,
                portalLoginNotes: this.portalLoginNotes,
                adminEmail: this.adminEmail,
                emailEnabled: this.emailEnabled,
                footerAdditionalPhone: this.footerAdditionalPhone,
                portalSiteUrl: this.portalSiteUrl,
                portalLoginUrl: this.portalLoginUrl,
                defaultDailyRate: this.adminDefaultDailyRate,
                hallSeatingCapacity: Number(this.adminHallSeatingCapacity),
                hallComfortableGuests: Number(this.adminHallComfortableGuests),
                hallDecorationCharge: Number(this.adminHallDecorationCharge),
                hallCateringChargePerGuest: Number(this.adminHallCateringChargePerGuest)
            });
            this.applyPortalSettings(settings);
            this.showToast('Settings saved', 'Portal notification settings were updated.', 'success');
        } catch (error) {
            this.showToast('Settings save failed', this.reduceError(error), 'error');
        } finally {
            this.isSettingsSaving = false;
        }
    }

    rebuildCalendarDateState(bookings) {
        const statusMap = {};
        const reservedDates = new Set();

        (bookings || []).forEach((booking) => {
            this.expandDateRange(booking.bookingDate, booking.endDate).forEach((dateValue) => {
                const existing = statusMap[dateValue];
                const isConfirmed = booking.status === 'Confirmed';

                if (!existing || (isConfirmed && existing.status !== 'Confirmed')) {
                    const contactName = booking.contactName || 'Unknown contact';
                    const eventName = booking.eventName || 'Reserved event';
                    statusMap[dateValue] = {
                        status: booking.status,
                        hoverTitle:
                            booking.status === 'Confirmed'
                                ? `Booked by ${contactName} for ${eventName}`
                                : `Pending request by ${contactName} for ${eventName}`,
                        booking
                    };
                }

                reservedDates.add(dateValue);
            });
        });

        this.calendarDateStatusMap = statusMap;
        this.bookedDateSet = reservedDates;
    }

    handlePrevMonth() {
        if (!this.canGoPrevMonth) {
            return;
        }

        if (this.currentMonth === 1) {
            this.currentMonth = 12;
            this.currentYear -= 1;
        } else {
            this.currentMonth -= 1;
        }
        this.updateMonthLabel();
        this.selectedBooking = null;
        if (this.isAdminPricingSection) {
            this.loadAdminDateRates();
        }
    }

    handleNextMonth() {
        if (this.currentMonth === 12) {
            this.currentMonth = 1;
            this.currentYear += 1;
        } else {
            this.currentMonth += 1;
        }
        this.updateMonthLabel();
        this.selectedBooking = null;
        if (this.isAdminPricingSection) {
            this.loadAdminDateRates();
        }
    }

    handleAdminPricingPrevMonth() {
        if (!this.canGoPrevMonth) {
            return;
        }

        if (this.currentMonth === 1) {
            this.currentMonth = 12;
            this.currentYear -= 1;
        } else {
            this.currentMonth -= 1;
        }
        this.updateMonthLabel();
        this.selectedPricingDates = [];
        this.loadAdminDateRates();
    }

    handleAdminPricingNextMonth() {
        if (this.currentMonth === 12) {
            this.currentMonth = 1;
            this.currentYear += 1;
        } else {
            this.currentMonth += 1;
        }
        this.updateMonthLabel();
        this.selectedPricingDates = [];
        this.loadAdminDateRates();
    }

    applyHallBookingConfig(config) {
        this.hallSeatingCapacity = config.seatingCapacity || DEFAULT_HALL_SEATING_CAPACITY;
        this.hallComfortableGuests = config.comfortableGuests || DEFAULT_HALL_COMFORTABLE_GUESTS;
        this.adminHallSeatingCapacity = this.hallSeatingCapacity;
        this.adminHallComfortableGuests = this.hallComfortableGuests;
        this.hallDecorationCharge = config.decorationCharge ?? DEFAULT_HALL_DECORATION_CHARGE;
        this.hallCateringChargePerGuest =
            config.cateringChargePerGuest ?? DEFAULT_HALL_CATERING_CHARGE_PER_GUEST;
    }

    parseGuestCount() {
        const value = Number(this.expectedGuestCount);
        return Number.isFinite(value) && value > 0 ? Math.floor(value) : null;
    }

    buildPriceCalculationParams() {
        return {
            startDateStr: this.selectedDate,
            endDateStr: this.selectedEndDate || this.selectedDate,
            startTime: this.eventStartTime || null,
            endTime: this.eventEndTime || null,
            expectedGuestCount: this.parseGuestCount(),
            decorationArrangement: this.decorationArrangement || ARRANGEMENT_SELF,
            cateringArrangement: this.cateringArrangement || ARRANGEMENT_SELF
        };
    }

    handleInputChange(event) {
        const field = event.target.dataset.field;
        this[field] = event.target.value;

        if (field === 'eventStartTime' || field === 'eventEndTime') {
            this[field] = this.normalizeTimeValue(event.target.value);
            this.syncTimePartsFromStoredValues();
            this.recalculatePrice();
            return;
        }

        if (
            field === 'decorationArrangement' ||
            field === 'cateringArrangement' ||
            field === 'expectedGuestCount' ||
            field === 'eventType'
        ) {
            this.recalculatePrice();
        }
    }

    handleDateTextInput(event) {
        const field = event.target.dataset.field;

        if (field === 'selectedDate') {
            this.fromDateText = event.target.value;
            return;
        }

        if (field === 'selectedEndDate') {
            this.toDateText = event.target.value;
        }
    }

    handleDateInputChange(event) {
        const field = event.target.dataset.field;
        const rawValue = field === 'selectedDate' ? this.fromDateText : this.toDateText;

        if (!rawValue || !rawValue.trim()) {
            this.syncDateInputFields();
            return;
        }

        const value = this.normalizeDateInput(rawValue);
        if (!value) {
            this.showToast('Invalid date', 'Use format DD/MM/YYYY (for example 15/06/2026).', 'error');
            this.syncDateInputFields();
            return;
        }

        if (value < this.todayIso) {
            this.showToast('Past date', 'Only today and future dates can be selected.', 'error');
            this.syncDateInputFields();
            return;
        }

        if (field === 'selectedDate') {
            if (!this.isStartDateAllowed(value)) {
                this.showToast('Date unavailable', this.getDateUnavailableMessage(value, field), 'error');
                this.syncDateInputFields();
                return;
            }

            this.selectedDate = value;
            if (!this.selectedEndDate || this.selectedEndDate < value) {
                this.selectedEndDate = value;
            } else if (!this.canSelectEndDate(value, this.selectedEndDate)) {
                this.selectedEndDate = value;
            }
        } else if (field === 'selectedEndDate') {
            if (!this.selectedDate) {
                if (!this.isStartDateAllowed(value)) {
                    this.showToast('Date unavailable', this.getDateUnavailableMessage(value, 'selectedDate'), 'error');
                    this.syncDateInputFields();
                    return;
                }
                this.selectedDate = value;
            }

            if (value < this.selectedDate) {
                this.showToast('Invalid range', 'To date must be on or after the from date.', 'error');
                this.syncDateInputFields();
                return;
            }

            if (!this.canSelectEndDate(this.selectedDate, value)) {
                this.showToast('Date unavailable', this.getDateUnavailableMessage(value, field), 'error');
                this.syncDateInputFields();
                return;
            }

            this.selectedEndDate = value;
        }

        this.syncDateInputFields();
        this.selectedBooking = null;
        this.syncCalendarToSelectedMonth();
        this.buildCalendar();
        this.validateSelectedRange();
    }

    syncDateInputFields() {
        this.fromDateText = this.formatDateDdMmYyyy(this.selectedDate);
        this.toDateText = this.formatDateDdMmYyyy(this.selectedEndDate || this.selectedDate);
    }

    formatDateDdMmYyyy(isoDate) {
        if (!isoDate) {
            return '';
        }

        const parts = isoDate.split('-');
        if (parts.length !== 3) {
            return isoDate;
        }

        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    resetDateInputValue(inputElement, field) {
        this.syncDateInputFields();

        if (!inputElement) {
            return;
        }

        inputElement.value = field === 'selectedDate' ? this.fromDateText : this.toDateText;
    }

    normalizeDateInput(rawValue) {
        const trimmed = String(rawValue || '').trim();
        if (!trimmed) {
            return null;
        }

        const dayFirstMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
        if (dayFirstMatch) {
            return this.buildIsoDate(
                Number(dayFirstMatch[3]),
                Number(dayFirstMatch[2]),
                Number(dayFirstMatch[1])
            );
        }

        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
            const [year, month, day] = trimmed.split('-').map(Number);
            return this.buildIsoDate(year, month, day);
        }

        return null;
    }

    buildIsoDate(year, month, day) {
        if (!year || month < 1 || month > 12 || day < 1 || day > 31) {
            return null;
        }

        const date = new Date(year, month - 1, day);
        if (
            date.getFullYear() !== year ||
            date.getMonth() !== month - 1 ||
            date.getDate() !== day
        ) {
            return null;
        }

        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    getDateUnavailableMessage(isoDate, field) {
        if (isoDate < this.todayIso) {
            return 'Only today and future dates can be selected.';
        }

        if (field === 'selectedDate' || !this.selectedDate) {
            const dayStatus = this.calendarDateStatusMap[isoDate];
            if (dayStatus?.status === 'Confirmed') {
                return 'This date is confirmed booked. Choose an available date on the calendar below.';
            }
            if (dayStatus?.status === 'Pending') {
                return 'This date has a pending booking request. Choose another date.';
            }
            return 'This date is not available for a new booking.';
        }

        return 'This end date is blocked by an existing booking. Check the calendar for dates available after 9 AM turnover.';
    }

    handlePhoneInputChange(event) {
        let digits = String(event.target.value || '').replace(/\D/g, '');

        if (digits.startsWith('91') && digits.length > 10) {
            digits = digits.slice(-10);
        }

        this.contactPhoneDigits = digits.slice(0, 10);
        this.contactPhone = this.contactPhoneDigits
            ? `${DEFAULT_COUNTRY_CODE}${this.contactPhoneDigits}`
            : '';
    }

    handleTimePartChange(event) {
        const scope = event.target.dataset.timeScope;
        const part = event.target.dataset.timePart;
        const value = event.detail.value;

        if (scope === 'start') {
            if (part === 'hour') {
                this.startTimeHour = value;
            } else if (part === 'minute') {
                this.startTimeMinute = value;
            } else if (part === 'period') {
                this.startTimePeriod = value;
            }
            this.eventStartTime = this.composeTime24(
                this.startTimeHour,
                this.startTimeMinute,
                this.startTimePeriod
            );
        } else if (scope === 'end') {
            if (part === 'hour') {
                this.endTimeHour = value;
            } else if (part === 'minute') {
                this.endTimeMinute = value;
            } else if (part === 'period') {
                this.endTimePeriod = value;
            }
            this.eventEndTime = this.composeTime24(
                this.endTimeHour,
                this.endTimeMinute,
                this.endTimePeriod
            );
        }

        this.recalculatePrice();
    }

    composeTime24(hour12, minute, period) {
        let hour = Number(hour12);
        if (Number.isNaN(hour) || hour < 1 || hour > 12) {
            return '';
        }

        if (period === 'PM' && hour !== 12) {
            hour += 12;
        } else if (period === 'AM' && hour === 12) {
            hour = 0;
        }

        return `${String(hour).padStart(2, '0')}:${String(minute || '00').padStart(2, '0')}`;
    }

    syncTimePartsFromStoredValues() {
        const startParts = this.parseTimeParts(this.eventStartTime);
        if (startParts) {
            this.startTimeHour = startParts.hour;
            this.startTimeMinute = startParts.minute;
            this.startTimePeriod = startParts.period;
        }

        const endParts = this.parseTimeParts(this.eventEndTime);
        if (endParts) {
            this.endTimeHour = endParts.hour;
            this.endTimeMinute = endParts.minute;
            this.endTimePeriod = endParts.period;
        }
    }

    parseTimeParts(timeValue) {
        const normalized = this.normalizeTimeValue(timeValue);
        if (!normalized) {
            return null;
        }

        const parts = normalized.split(':');
        if (parts.length < 2) {
            return null;
        }

        const hour24 = Number(parts[0]);
        const minute = String(parts[1]).padStart(2, '0');
        if (Number.isNaN(hour24)) {
            return null;
        }

        const period = hour24 >= 12 ? 'PM' : 'AM';
        let hour12 = hour24 % 12;
        if (hour12 === 0) {
            hour12 = 12;
        }

        return {
            hour: String(hour12),
            minute,
            period
        };
    }

    formatTimeAmPm(timeValue) {
        const parts = this.parseTimeParts(timeValue);
        if (!parts) {
            return '';
        }

        return `${parts.hour}:${parts.minute} ${parts.period}`;
    }

    normalizeTimeValue(value) {
        if (value == null || value === '') {
            return '';
        }

        const match = String(value).match(/^(\d{1,2}):(\d{2})/);
        if (!match) {
            return value;
        }

        return `${match[1].padStart(2, '0')}:${match[2]}`;
    }

    syncCalendarToSelectedMonth() {
        if (!this.selectedDate) {
            return;
        }

        const selected = this.parseIsoDate(this.selectedDate);
        const nextYear = selected.getFullYear();
        const nextMonth = selected.getMonth() + 1;

        if (this.currentYear !== nextYear || this.currentMonth !== nextMonth) {
            this.currentYear = nextYear;
            this.currentMonth = nextMonth;
            this.updateMonthLabel();
        }

        this.buildCalendar();
    }

    handleAdminPriceChange(event) {
        const bookingId = event.target.dataset.id;
        const value = event.target.value;

        this.adminBookings = this.adminBookings.map((booking) =>
            booking.id === bookingId ? { ...booking, adminDraftFinalAmount: value } : booking
        );
    }

    async handleSaveBookingPrice(event) {
        const bookingId = event.currentTarget.dataset.id;
        const booking = this.adminBookings.find((item) => item.id === bookingId);

        if (!booking) {
            return;
        }

        const finalAmount = Number(booking.adminDraftFinalAmount);
        if (Number.isNaN(finalAmount) || finalAmount < 0) {
            this.showToast('Invalid amount', 'Enter a valid final price of zero or greater.', 'error');
            return;
        }

        this.isPriceSaving = true;
        try {
            await updateBookingPrice({ bookingId, finalAmount });
            this.showToast('Price updated', 'Final booking amount was saved.', 'success');
            await this.loadAdminData();
            await this.refreshBookingData();
        } catch (error) {
            this.showToast('Price update failed', this.reduceError(error), 'error');
        } finally {
            this.isPriceSaving = false;
        }
    }

    decorateBooking(booking) {
        const amount = booking.finalAmount != null ? booking.finalAmount : booking.estimatedAmount;
        const contactName = booking.contactName || 'Unknown contact';
        const eventName = booking.eventName || 'Reserved event';
        const isConfirmed = booking.status === 'Confirmed';
        const isPending = booking.status === 'Pending';

        let statusMessage = '';
        if (isConfirmed) {
            statusMessage = `This date is booked by ${contactName} for ${eventName}.`;
        } else if (isPending) {
            statusMessage = `Request raised by ${contactName} for ${eventName}. Awaiting admin approval.`;
        }

        return {
            ...booking,
            amountLabel: this.formatInr(amount),
            estimatedLabel: this.formatInr(booking.estimatedAmount),
            finalLabel: this.formatInr(booking.finalAmount),
            hasPriceReduction:
                booking.finalAmount != null &&
                booking.estimatedAmount != null &&
                booking.finalAmount < booking.estimatedAmount,
            isConfirmed,
            isPending,
            statusHeadline: isConfirmed ? 'Date Confirmed' : isPending ? 'Pending Request' : booking.status,
            statusMessage,
            noticeClass: isConfirmed
                ? 'booking-notice booking-notice_confirmed'
                : isPending
                  ? 'booking-notice booking-notice_pending'
                  : 'booking-notice'
        };
    }

    decorateAdminBooking(booking) {
        const decorated = this.decorateBooking(booking);
        const isCancelled = booking.status === 'Cancelled';
        let adminCardClass = 'admin-card';

        if (decorated.isPending) {
            adminCardClass += ' admin-card_pending';
        } else if (decorated.isConfirmed) {
            adminCardClass += ' admin-card_confirmed';
        } else {
            adminCardClass += ' admin-card_other';
        }

        return {
            ...decorated,
            adminCardClass,
            isCancelled,
            showAdminStatusEditor: decorated.isPending,
            showSavePriceButton: decorated.isPending,
            adminDraftFinalAmount: isCancelled
                ? 0
                : booking.finalAmount != null
                  ? booking.finalAmount
                  : booking.estimatedAmount,
            finalLabel: isCancelled ? this.formatInr(0) : decorated.finalLabel,
            amountLabel: isCancelled ? this.formatInr(0) : decorated.amountLabel
        };
    }

    formatInr(amount) {
        if (amount == null || Number.isNaN(Number(amount))) {
            return '—';
        }

        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(Number(amount));
    }

    async recalculatePrice() {
        if (!this.selectedDate) {
            this.priceEstimate = null;
            return;
        }

        if (this.isDateSelectionLoading) {
            return;
        }

        const endDate = this.selectedEndDate || this.selectedDate;
        const sequence = ++this._priceCalculationSequence;
        this.isPriceLoading = true;

        try {
            const estimate = await calculateBookingPrice(this.buildPriceCalculationParams());

            if (sequence === this._priceCalculationSequence) {
                this.priceEstimate = estimate;
            }
        } catch (error) {
            if (sequence === this._priceCalculationSequence) {
                this.priceEstimate = null;
                this.showToast('Price calculation failed', this.reduceError(error), 'error');
            }
        } finally {
            if (sequence === this._priceCalculationSequence) {
                this.isPriceLoading = false;
            }
        }
    }

    get showBookingQuoteSpinner() {
        return this.isDateSelectionLoading || this.isPriceLoading;
    }

    get submitButtonLabel() {
        return this.isSubmitting ? 'Submitting...' : 'Submit Booking Request';
    }

    get isSubmitDisabled() {
        return (
            this.isSubmitting ||
            this.bookingWizardStep !== 4 ||
            !this.bookingWizardConsentAccepted ||
            !this.isBookingFormReady
        );
    }

    get submitButtonClass() {
        return this.isSubmitDisabled
            ? 'booking-form__submit-button booking-form__submit-button_disabled'
            : 'booking-form__submit-button';
    }

    get isBookingWizardStep1() {
        return this.bookingWizardStep === 1;
    }

    get isBookingWizardStep2() {
        return this.bookingWizardStep === 2;
    }

    get isBookingWizardStep3() {
        return this.bookingWizardStep === 3;
    }

    get isBookingWizardStep4() {
        return this.bookingWizardStep === 4;
    }

    get showBookingWizardBack() {
        return this.bookingWizardStep > 1 && !this.isSubmitting;
    }

    get showBookingWizardNext() {
        return this.bookingWizardStep < 4 && !this.isSubmitting;
    }

    get homeBookingLayoutClass() {
        return this.showAvailabilityCalendarPanel
            ? 'portal-body home-booking-layout'
            : 'portal-body home-booking-layout home-booking-layout_form-only';
    }

    get bookingWizardStepMessage() {
        switch (this.bookingWizardStep) {
            case 1:
                return 'Select your dates on the calendar, set start and end times, then click Next.';
            case 2:
                return 'Choose your event type, guest count, and decoration or catering options, then click Next.';
            case 3:
                return 'Add your name and mobile number, then click Next.';
            case 4:
                return 'Review the summary, accept consent, and submit your booking request.';
            default:
                return '';
        }
    }

    get bookingWizardStep1ChevronClass() {
        return this.buildBookingWizardStepChevronClass(1);
    }

    get bookingWizardStep2ChevronClass() {
        return this.buildBookingWizardStepChevronClass(2);
    }

    get bookingWizardStep3ChevronClass() {
        return this.buildBookingWizardStepChevronClass(3);
    }

    get bookingWizardStep4ChevronClass() {
        return this.buildBookingWizardStepChevronClass(4);
    }

    get bookingWizardProgressLabel() {
        return `Step ${this.bookingWizardStep} of 4`;
    }

    get bookingWizardStep1AriaCurrent() {
        return this.bookingWizardStep === 1 ? 'step' : null;
    }

    get bookingWizardStep2AriaCurrent() {
        return this.bookingWizardStep === 2 ? 'step' : null;
    }

    get bookingWizardStep3AriaCurrent() {
        return this.bookingWizardStep === 3 ? 'step' : null;
    }

    get bookingWizardStep4AriaCurrent() {
        return this.bookingWizardStep === 4 ? 'step' : null;
    }

    get bookingPreviewContactPhone() {
        return this.contactPhoneDigits
            ? `${DEFAULT_COUNTRY_CODE} ${this.contactPhoneDigits}`
            : '—';
    }

    get bookingPreviewEmail() {
        return this.contactEmail?.trim() || 'Not provided';
    }

    get eventTypeOptions() {
        return EVENT_TYPE_OPTIONS;
    }

    get serviceArrangementOptions() {
        return SERVICE_ARRANGEMENT_OPTIONS;
    }

    get showCustomEventName() {
        return this.eventType === 'Other';
    }

    get hallInfoSummary() {
        return `Seating capacity: ${this.hallSeatingCapacity} guests · Comfortably accommodates: ${this.hallComfortableGuests} guests`;
    }

    get hallCateringRateLabel() {
        return `${this.formatInr(this.hallCateringChargePerGuest)}/guest`;
    }

    get hallDecorationRateLabel() {
        return this.formatInr(this.hallDecorationCharge);
    }

    get eventStepDecorationChargeLabel() {
        if (this.decorationArrangement !== ARRANGEMENT_HALL) {
            return 'No charge — you will arrange decorations';
        }
        return this.hallDecorationRateLabel;
    }

    get eventStepCateringChargeLabel() {
        if (this.cateringArrangement !== ARRANGEMENT_HALL) {
            return 'No charge — you will arrange catering';
        }

        const guestCount = this.parseGuestCount();
        if (!guestCount) {
            return `Enter guest count (${this.hallCateringRateLabel})`;
        }

        return this.formatInr(this.hallCateringChargePerGuest * guestCount);
    }

    get bookingPreviewEventType() {
        if (this.eventType === 'Other') {
            return this.eventName?.trim() || 'Other';
        }
        return this.eventType || 'Not provided';
    }

    get bookingPreviewEventName() {
        if (this.eventName?.trim()) {
            return this.eventName.trim();
        }
        return this.eventType || 'Not provided';
    }

    get bookingPreviewGuestCount() {
        const guestCount = this.parseGuestCount();
        return guestCount ? String(guestCount) : 'Not provided';
    }

    get bookingPreviewDecorationLabel() {
        return this.decorationArrangement === ARRANGEMENT_HALL ? 'Hall provides' : 'Self arranged';
    }

    get bookingPreviewCateringLabel() {
        return this.cateringArrangement === ARRANGEMENT_HALL ? 'Hall provides' : 'Self arranged';
    }

    get bookingPriceHallRentalLabel() {
        if (this.priceEstimate?.hallRentalAmount != null) {
            return this.formatInr(this.priceEstimate.hallRentalAmount);
        }
        return this.hasPriceEstimate ? this.formattedEstimatedAmount : '—';
    }

    get previewHasDecorationCharge() {
        return this.decorationArrangement === ARRANGEMENT_HALL;
    }

    get previewHasCateringCharge() {
        return this.cateringArrangement === ARRANGEMENT_HALL;
    }

    get hasPreviewSelfArrangedServices() {
        return Boolean(this.bookingPreviewSelfArrangedServicesLabel);
    }

    get bookingPreviewSelfArrangedServicesLabel() {
        const selfArranged = [];
        if (this.decorationArrangement !== ARRANGEMENT_HALL) {
            selfArranged.push('decorations');
        }
        if (this.cateringArrangement !== ARRANGEMENT_HALL) {
            selfArranged.push('catering');
        }

        if (selfArranged.length === 0) {
            return null;
        }
        if (selfArranged.length === 2) {
            return 'Decorations & catering arranged by you (no charge)';
        }
        return selfArranged[0] === 'decorations'
            ? 'Decorations arranged by you (no charge)'
            : 'Catering arranged by you (no charge)';
    }

    get bookingPreviewPriceSummaryLabel() {
        if (!this.bookingPriceDaysLabel && !this.bookingPriceDailyRateLabel) {
            return '';
        }

        const parts = [];
        if (this.bookingPriceDaysLabel) {
            parts.push(this.bookingPriceDaysLabel);
        }
        if (this.bookingPriceDailyRateLabel) {
            parts.push(this.bookingPriceDailyRateLabel);
        }
        return parts.join(' · ');
    }

    get bookingPriceDecorationLabel() {
        if (this.decorationArrangement !== ARRANGEMENT_HALL) {
            return 'Not included';
        }
        if (this.priceEstimate?.decorationCharge != null) {
            return this.formatInr(this.priceEstimate.decorationCharge);
        }
        return this.hallDecorationRateLabel;
    }

    get bookingPriceCateringLabel() {
        if (this.cateringArrangement !== ARRANGEMENT_HALL) {
            return 'Not included';
        }
        if (this.priceEstimate?.cateringCharge != null) {
            return this.formatInr(this.priceEstimate.cateringCharge);
        }
        return this.eventStepCateringChargeLabel;
    }

    get showPriceBreakdown() {
        return this.hasPriceEstimate && !this.isPriceLoading;
    }

    get showPreviewNotes() {
        return this.notes?.trim() && this.notes.trim().length > 0;
    }

    get bookingPreviewPriceBreakdownLine() {
        return `Hall ${this.bookingPriceHallRentalLabel} · Decoration ${this.bookingPriceDecorationLabel} · Catering ${this.bookingPriceCateringLabel}`;
    }

    get bookingPreviewEventFromLabel() {
        if (!this.selectedDate) {
            return 'Not set';
        }

        const dateLabel = this.formatDisplayDate(this.selectedDate);
        const timeLabel = this.eventStartTime
            ? this.formatTimeAmPm(this.eventStartTime)
            : 'Not set';
        return `${dateLabel} · ${timeLabel}`;
    }

    get bookingPreviewEventToLabel() {
        if (!this.selectedDate) {
            return 'Not set';
        }

        const endDate = this.selectedEndDate || this.selectedDate;
        const dateLabel = this.formatDisplayDate(endDate);
        const timeLabel = this.eventEndTime ? this.formatTimeAmPm(this.eventEndTime) : 'Not set';
        return `${dateLabel} · ${timeLabel}`;
    }

    get bookingPreviewEventDetails() {
        return this.eventDetails?.trim() || 'Not provided';
    }

    get bookingPreviewNotes() {
        return this.notes?.trim() || 'None';
    }

    get isBookingFormReady() {
        return (
            this.validateBookingWizardStep1(false) &&
            this.validateBookingWizardStep2(false) &&
            this.validateBookingWizardStep3(false)
        );
    }

    get hasPriceEstimate() {
        return this.priceEstimate != null;
    }

    get formattedEstimatedAmount() {
        return this.priceEstimate ? this.formatInr(this.priceEstimate.estimatedAmount) : '—';
    }

    get bookingSelectionTimingLabel() {
        if (this.eventStartTime && this.eventEndTime) {
            return `${this.formatTimeAmPm(this.eventStartTime)} to ${this.formatTimeAmPm(this.eventEndTime)}`;
        }
        if (this.eventStartTime) {
            return `${this.formatTimeAmPm(this.eventStartTime)} start`;
        }
        if (this.eventEndTime) {
            return `${this.formatTimeAmPm(this.eventEndTime)} end`;
        }

        return 'Not set yet';
    }

    get bookingPriceAmountLabel() {
        if (this.isPriceLoading) {
            return 'Calculating...';
        }

        if (this.hasPriceEstimate) {
            return this.formattedEstimatedAmount;
        }

        return '—';
    }

    get bookingPriceDaysLabel() {
        if (!this.priceEstimate?.numberOfDays) {
            return '';
        }

        const days = this.priceEstimate.numberOfDays;
        return `${days} day${days === 1 ? '' : 's'}`;
    }

    get bookingPriceDailyRateLabel() {
        if (this.priceEstimate?.dailyRate != null) {
            return `${this.formatInr(this.priceEstimate.dailyRate)}/day avg`;
        }

        return `${this.formattedDailyRate}/day`;
    }

    get bookingPriceNote() {
        return this.priceEstimate?.pricingNote || '';
    }

    get showBookingPriceNote() {
        return Boolean(this.bookingPriceNote);
    }

    get bookingPriceHintLabel() {
        if (this.isPriceLoading) {
            return 'Updating quote...';
        }

        return 'Price updates when dates are confirmed';
    }

    get formattedDailyRate() {
        return this.formatInr(this.dailyRate);
    }

    get hasSelectedDateRange() {
        return Boolean(this.selectedDate);
    }

    get calendarSelectionHint() {
        if (!this.selectedDate) {
            return 'Tap a white available day to set your from date. Booked days are marked in red.';
        }

        if (!this.selectedEndDate || this.selectedEndDate === this.selectedDate) {
            return `From ${this.formatDisplayDate(this.selectedDate)} selected — now tap your to date.`;
        }

        return `Selected ${this.formatDisplayDate(this.selectedDate)} to ${this.formatDisplayDate(this.selectedEndDate)}. You can change dates anytime before submitting.`;
    }

    get selectedDateRangeLabel() {
        if (!this.selectedDate) {
            return 'No dates selected yet';
        }

        const endDate = this.selectedEndDate || this.selectedDate;
        if (endDate === this.selectedDate) {
            return this.formatDisplayDate(this.selectedDate);
        }

        return `${this.formatDisplayDate(this.selectedDate)} to ${this.formatDisplayDate(endDate)}`;
    }

    get selectedFromDateLabel() {
        return this.selectedDate ? this.formatDisplayDate(this.selectedDate) : 'Not selected';
    }

    get selectedToDateLabel() {
        if (!this.selectedDate) {
            return 'Not selected';
        }

        const endDate = this.selectedEndDate || this.selectedDate;
        return this.formatDisplayDate(endDate);
    }

    get hasSelectedTimeRange() {
        return Boolean(this.eventStartTime || this.eventEndTime);
    }

    get selectedTimeRangeLabel() {
        if (this.eventStartTime && this.eventEndTime) {
            return `Timing: ${this.formatTimeAmPm(this.eventStartTime)} to ${this.formatTimeAmPm(this.eventEndTime)}`;
        }
        if (this.eventStartTime) {
            return `Start time: ${this.formatTimeAmPm(this.eventStartTime)}`;
        }
        if (this.eventEndTime) {
            return `End time: ${this.formatTimeAmPm(this.eventEndTime)}`;
        }
        return '';
    }

    formatDisplayDate(isoDate) {
        return this.formatDateDdMmYyyy(isoDate);
    }

    async validateSelectedRange() {
        if (!this.selectedDate) {
            this.priceEstimate = null;
            this.syncDateInputFields();
            this.buildCalendar();
            return;
        }

        if (!this.isStartDateAllowed(this.selectedDate)) {
            this.selectedDate = '';
            this.selectedEndDate = '';
            this.priceEstimate = null;
            this.syncDateInputFields();
            this.buildCalendar();
            return;
        }

        const endDate = this.selectedEndDate || this.selectedDate;

        if (endDate < this.selectedDate) {
            this.selectedEndDate = this.selectedDate;
            this.syncDateInputFields();
            this.buildCalendar();
            return;
        }

        if (!this.canSelectEndDate(this.selectedDate, endDate)) {
            this.selectedEndDate = this.selectedDate;
            this.priceEstimate = null;
            this.syncDateInputFields();
            this.buildCalendar();
            return;
        }

        const sequence = ++this._dateValidationSequence;
        this._priceCalculationSequence = sequence;
        this.isDateSelectionLoading = true;
        this.syncDateInputFields();
        this.buildCalendar();

        try {
            const [available, estimate] = await Promise.all([
                isDateRangeAvailable({
                    startDateStr: this.selectedDate,
                    endDateStr: endDate
                }),
                calculateBookingPrice(this.buildPriceCalculationParams())
            ]);

            if (sequence !== this._dateValidationSequence) {
                return;
            }

            if (!available) {
                this.selectedDate = '';
                this.selectedEndDate = '';
                this.priceEstimate = null;
                this.showToast(
                    'Date unavailable',
                    'These dates are no longer available. Please choose another range.',
                    'error'
                );
            } else {
                this.priceEstimate = estimate;
            }
        } catch (error) {
            if (sequence === this._dateValidationSequence) {
                this.priceEstimate = null;
                this.showToast('Date check failed', this.reduceError(error), 'error');
            }
        } finally {
            if (sequence === this._dateValidationSequence) {
                this.isDateSelectionLoading = false;
                this.syncDateInputFields();
                this.buildCalendar();
            }
        }
    }

    handleDayClick(event) {
        const dateValue = event.currentTarget.dataset.date;
        const isReserved = event.currentTarget.dataset.reserved === 'true';
        const isPast = event.currentTarget.dataset.past === 'true';
        const isCurrentMonth = event.currentTarget.dataset.current === 'true';
        const isFormCalendar = event.currentTarget.dataset.calendar === 'form';

        if (!isCurrentMonth || isPast) {
            return;
        }

        if (isReserved) {
            if (!isFormCalendar) {
                this.showBookingDetailForDate(dateValue);
            }
            return;
        }

        if (!this.selectedDate || dateValue < this.selectedDate) {
            if (!this.isStartDateAllowed(dateValue)) {
                return;
            }

            this.selectedBooking = null;
            this.selectedDate = dateValue;
            this.selectedEndDate = dateValue;
            this.syncDateInputFields();
            this.syncCalendarToSelectedMonth();
            this.buildCalendar();
            this.validateSelectedRange();
            return;
        }

        if (!this.canSelectEndDate(this.selectedDate, dateValue)) {
            return;
        }

        this.selectedBooking = null;
        this.selectedEndDate = dateValue;
        this.syncDateInputFields();
        this.buildCalendar();
        this.validateSelectedRange();
    }

    handleCloseBookingDetail() {
        this.selectedBooking = null;
    }

    showBookingDetailForDate(dateValue) {
        const dayStatus = this.calendarDateStatusMap[dateValue];
        const matchedBooking = dayStatus
            ? dayStatus.booking
            : this.bookings.find((booking) =>
                  this.expandDateRange(booking.bookingDate, booking.endDate).includes(dateValue)
              );
        this.selectedBooking = matchedBooking ? this.decorateBooking(matchedBooking) : null;
    }

    async handleSubmit() {
        if (this.bookingWizardStep !== 4) {
            return;
        }

        if (!this.validateBookingWizardStep4()) {
            return;
        }

        if (!this.validateBookingWizardStep1()) {
            this.bookingWizardStep = 1;
            return;
        }

        if (!this.validateBookingWizardStep2()) {
            this.bookingWizardStep = 2;
            return;
        }

        const endDate = this.selectedEndDate || this.selectedDate;

        this.isSubmitting = true;
        try {
            const created = await createBooking({
                bookingDateStr: this.selectedDate,
                endDateStr: endDate,
                eventName: this.eventName,
                contactName: this.contactName,
                contactPhone: `${DEFAULT_COUNTRY_CODE}${this.contactPhoneDigits}`,
                contactEmail: this.contactEmail,
                notes: this.notes,
                eventStartTime: this.eventStartTime,
                eventEndTime: this.eventEndTime,
                eventDetails: this.eventDetails,
                eventType: this.eventType,
                expectedGuestCount: this.parseGuestCount(),
                decorationArrangement: this.decorationArrangement,
                cateringArrangement: this.cateringArrangement
            });

            const requestNumber = created && created.bookingNumber ? created.bookingNumber : 'submitted';
            this.showToast(
                'Request submitted',
                `Request ${requestNumber} is pending admin approval. Save this number for follow-up.`,
                'success'
            );

            this.resetForm();
            await refreshApex(this.wiredBookingsResult);
            await this.refreshBookingData();
            if (this.isSystemAdmin) {
                await this.loadAdminData();
            }
        } catch (error) {
            this.showToast('Booking failed', this.reduceError(error), 'error');
        } finally {
            this.isSubmitting = false;
        }
    }

    async handleAdminStatusChange(event) {
        const bookingId = event.target.dataset.id;
        const status = event.detail.value;
        const previousBooking = this.adminBookings.find((item) => item.id === bookingId);
        const previousStatus = previousBooking ? previousBooking.status : null;

        try {
            const updated = await updateBookingStatus({ bookingId, status });
            this.adminBookings = this.adminBookings.map((booking) =>
                booking.id === bookingId ? this.decorateAdminBooking(updated) : booking
            );
            this.showToast('Status updated', 'Booking status was updated successfully.', 'success');
            await refreshApex(this.wiredBookingsResult);
            await this.refreshBookingData();
        } catch (error) {
            if (previousBooking && previousStatus) {
                this.adminBookings = this.adminBookings.map((booking) =>
                    booking.id === bookingId
                        ? this.decorateAdminBooking({ ...previousBooking, status: previousStatus })
                        : booking
                );
            }
            await this.reloadAdminBookingsOnly();
            this.showToast('Update failed', this.reduceError(error), 'error');
        }
    }

    async reloadAdminBookingsOnly() {
        const bookings = await getAdminBookings();
        this.adminBookings = bookings.map((booking) => this.decorateAdminBooking(booking));
        if (this.adminBookingPageNumber > this.totalAdminBookingPages) {
            this.adminBookingPageNumber = this.totalAdminBookingPages;
        }
    }

    resetForm() {
        this.eventName = '';
        this.contactName = '';
        this.contactPhone = '';
        this.contactPhoneDigits = '';
        this.contactEmail = '';
        this.notes = '';
        this.eventStartTime = '10:00';
        this.eventEndTime = '21:00';
        this.startTimeHour = '10';
        this.startTimeMinute = '00';
        this.startTimePeriod = 'AM';
        this.endTimeHour = '9';
        this.endTimeMinute = '00';
        this.endTimePeriod = 'PM';
        this.eventDetails = '';
        this.eventType = '';
        this.expectedGuestCount = '';
        this.decorationArrangement = ARRANGEMENT_SELF;
        this.cateringArrangement = ARRANGEMENT_SELF;
        this.selectedDate = '';
        this.selectedEndDate = '';
        this.fromDateText = '';
        this.toDateText = '';
        this.priceEstimate = null;
        this.selectedBooking = null;
        this.bookingWizardStep = 1;
        this.bookingWizardConsentAccepted = false;
        this.buildCalendar();
    }

    clearBookingWizardConsent() {
        this.bookingWizardConsentAccepted = false;
    }

    buildBookingWizardStepChevronClass(stepNumber) {
        let cssClass = 'request-form-step-chevron';

        if (stepNumber === 1) {
            cssClass += ' request-form-step-chevron_first';
        }
        if (stepNumber === 4) {
            cssClass += ' request-form-step-chevron_last';
        }
        if (this.bookingWizardStep === stepNumber) {
            cssClass += ' request-form-step-chevron_active';
        } else if (this.bookingWizardStep > stepNumber) {
            cssClass += ' request-form-step-chevron_done';
        }

        return cssClass;
    }

    validateBookingWizardStep1(showToast = true) {
        const fail = (title, message) => {
            if (showToast) {
                this.showToast(title, message, 'error');
            }
            return false;
        };

        if (!this.fromDateText?.trim() || !this.selectedDate) {
            return fail('Missing date', 'Please select a from date.');
        }

        if (!this.isStartDateAllowed(this.selectedDate)) {
            return fail('Date unavailable', 'The from date is not available. Choose another date.');
        }

        if (!this.toDateText?.trim() || !this.selectedEndDate) {
            return fail('Missing date', 'Please select a to date.');
        }

        if (
            this.selectedEndDate < this.selectedDate ||
            !this.canSelectEndDate(this.selectedDate, this.selectedEndDate)
        ) {
            return fail('Invalid dates', 'Please choose available from and to dates.');
        }

        const endDate = this.selectedEndDate || this.selectedDate;
        if (
            this.eventStartTime &&
            this.eventEndTime &&
            endDate === this.selectedDate &&
            this.eventEndTime <= this.eventStartTime
        ) {
            return fail(
                'Invalid timing',
                'On a single-day booking, end time must be after start time.'
            );
        }

        return true;
    }

    validateBookingWizardStep2(showToast = true) {
        if (!this.eventType) {
            if (showToast) {
                this.showToast('Missing event type', 'Please select the type of event you are planning.', 'error');
            }
            return false;
        }

        if (this.eventType === 'Other' && !this.eventName?.trim()) {
            if (showToast) {
                this.showToast('Missing event name', 'Please enter a name for your event.', 'error');
            }
            return false;
        }

        const guestCount = this.parseGuestCount();
        if (!guestCount) {
            if (showToast) {
                this.showToast('Missing guest count', 'Please enter the expected number of guests.', 'error');
            }
            return false;
        }

        if (guestCount > this.hallSeatingCapacity) {
            if (showToast) {
                this.showToast(
                    'Guest count too high',
                    `The hall seating capacity is ${this.hallSeatingCapacity} guests.`,
                    'error'
                );
            }
            return false;
        }

        if (!this.decorationArrangement) {
            if (showToast) {
                this.showToast('Missing decoration choice', 'Please choose a decoration arrangement.', 'error');
            }
            return false;
        }

        if (!this.cateringArrangement) {
            if (showToast) {
                this.showToast('Missing catering choice', 'Please choose a catering arrangement.', 'error');
            }
            return false;
        }

        if (
            this.cateringArrangement === ARRANGEMENT_HALL &&
            guestCount > this.hallComfortableGuests &&
            showToast
        ) {
            this.showToast(
                'Large guest count',
                `For ${guestCount} guests, please confirm seating and catering arrangements with the admin team.`,
                'warning'
            );
        }

        return true;
    }

    validateBookingWizardStep3(showToast = true) {
        if (!this.contactName?.trim()) {
            if (showToast) {
                this.showToast('Missing name', 'Please enter your name.', 'error');
            }
            return false;
        }

        if (!this.contactPhoneDigits || this.contactPhoneDigits.length !== 10) {
            if (showToast) {
                this.showToast('Missing phone', 'Enter a valid 10-digit mobile number.', 'error');
            }
            return false;
        }

        return true;
    }

    validateBookingWizardStep4(showToast = true) {
        if (
            !this.validateBookingWizardStep1(showToast) ||
            !this.validateBookingWizardStep2(showToast) ||
            !this.validateBookingWizardStep3(showToast)
        ) {
            return false;
        }

        if (!this.bookingWizardConsentAccepted) {
            if (showToast) {
                this.showToast(
                    'Consent required',
                    'Please review the preview and accept the consent before submitting.',
                    'error'
                );
            }
            return false;
        }

        return true;
    }

    handleBookingConsentChange(event) {
        this.bookingWizardConsentAccepted = event.target.checked;
    }

    handleBookingWizardNext() {
        if (this.bookingWizardStep === 1 && !this.validateBookingWizardStep1()) {
            return;
        }

        if (this.bookingWizardStep === 2 && !this.validateBookingWizardStep2()) {
            return;
        }

        if (this.bookingWizardStep === 3 && !this.validateBookingWizardStep3()) {
            return;
        }

        if (this.bookingWizardStep < 4) {
            if (this.bookingWizardStep === 3) {
                this.clearBookingWizardConsent();
            }
            this.bookingWizardStep += 1;
        }
    }

    handleBookingWizardBack() {
        if (this.bookingWizardStep > 1 && !this.isSubmitting) {
            if (this.bookingWizardStep === 4) {
                this.clearBookingWizardConsent();
            }
            this.bookingWizardStep -= 1;
        }
    }

    handleBookingWizardStepClick(event) {
        const stepNumber = Number(event.currentTarget.dataset.step);

        if (!stepNumber || stepNumber >= this.bookingWizardStep || this.isSubmitting) {
            return;
        }

        if (this.bookingWizardStep === 4) {
            this.clearBookingWizardConsent();
        }

        this.bookingWizardStep = stepNumber;
    }

    updateMonthLabel() {
        this.monthLabel = `${MONTHS[this.currentMonth - 1]} ${this.currentYear}`;
    }

    buildCalendar() {
        const firstDay = new Date(this.currentYear, this.currentMonth - 1, 1);
        const startOffset = firstDay.getDay();
        const daysInMonth = new Date(this.currentYear, this.currentMonth, 0).getDate();
        const daysInPrevMonth = new Date(this.currentYear, this.currentMonth - 1, 0).getDate();
        const todayIso = this.formatIsoDate(new Date());
        const days = [];

        for (let index = 0; index < startOffset; index += 1) {
            const dayNumber = daysInPrevMonth - startOffset + index + 1;
            const date = new Date(this.currentYear, this.currentMonth - 2, dayNumber);
            days.push(this.createDayCell(date, dayNumber, false, todayIso));
        }

        for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber += 1) {
            const date = new Date(this.currentYear, this.currentMonth - 1, dayNumber);
            days.push(this.createDayCell(date, dayNumber, true, todayIso));
        }

        while (days.length % 7 !== 0) {
            const dayNumber = days.length - (startOffset + daysInMonth) + 1;
            const date = new Date(this.currentYear, this.currentMonth, dayNumber);
            days.push(this.createDayCell(date, date.getDate(), false, todayIso));
        }

        this.calendarDays = days;
    }

    createDayCell(date, dayNumber, isCurrentMonth, todayIso) {
        const isoDate = this.formatIsoDate(date);
        const dayStatus = this.calendarDateStatusMap[isoDate];
        const isReserved = this.bookedDateSet.has(isoDate);
        const isPending = dayStatus && dayStatus.status === 'Pending';
        const isConfirmed = dayStatus && dayStatus.status === 'Confirmed';
        const isPast = isoDate < todayIso;
        const hasStartSelected = Boolean(this.selectedDate);
        const isBeforeStart = Boolean(hasStartSelected && isoDate < this.selectedDate && !isPast);
        const isToday = isoDate === todayIso;
        const isInSelectedRange = this.isDateInSelectedRange(isoDate);

        let isEndDateSelectable;
        if (isReserved) {
            isEndDateSelectable = false;
        } else if (hasStartSelected && isoDate >= this.selectedDate) {
            isEndDateSelectable = this.canSelectEndDate(this.selectedDate, isoDate);
        } else {
            isEndDateSelectable = this.isStartDateAllowed(isoDate);
        }

        const isPartialConfirmedEnd =
            isConfirmed && this.hasPartialConfirmedAvailability(isoDate);
        const isConfirmedBlocked = isConfirmed && !isPartialConfirmedEnd;
        const isEndDateBlocked =
            hasStartSelected &&
            isoDate >= (this.selectedDate || isoDate) &&
            !isEndDateSelectable &&
            !isReserved;

        let cellClass = 'calendar-day';
        if (!isCurrentMonth) {
            cellClass += ' calendar-day_other-month';
        }
        if (isPending) {
            cellClass += ' calendar-day_pending';
        }
        if (isConfirmedBlocked) {
            cellClass += ' calendar-day_confirmed-blocked';
        } else if (isPartialConfirmedEnd) {
            cellClass += ' calendar-day_confirmed-partial';
        } else if (isConfirmed) {
            cellClass += ' calendar-day_confirmed';
        }
        if (isEndDateBlocked) {
            cellClass += ' calendar-day_end-blocked';
        }
        if (isPast || isBeforeStart) {
            cellClass += ' calendar-day_unavailable';
        }
        if (isPast) {
            cellClass += ' calendar-day_past';
        }
        if (isBeforeStart) {
            cellClass += ' calendar-day_before-start';
        }
        if (isToday) {
            cellClass += ' calendar-day_today';
        }
        if (isInSelectedRange && isEndDateSelectable) {
            cellClass += ' calendar-day_selected';
        }

        let isDisabled = isPast || !isCurrentMonth;
        const isClickableForDetails = isReserved && isCurrentMonth && !isPast;

        if (!isDisabled && !isClickableForDetails) {
            if (!hasStartSelected || isoDate < this.selectedDate) {
                isDisabled = !this.isStartDateAllowed(isoDate);
            } else {
                isDisabled = !this.canSelectEndDate(this.selectedDate, isoDate);
            }
        }

        const showSidebarDailyRate = isCurrentMonth && !isReserved;
        const isCustomRate = isCurrentMonth && !isReserved && this.isCustomRateDate(isoDate);

        return {
            key: isoDate,
            formKey: `form-${isoDate}`,
            label: dayNumber,
            isoDate,
            isReserved,
            isPending,
            isConfirmed,
            isConfirmedBlocked,
            isPast,
            isBeforeStart,
            isCurrentMonth,
            isEndDateSelectable,
            isEndDateBlocked,
            isPartialConfirmedEnd,
            isDisabled,
            isFormDisabled: isDisabled || isClickableForDetails,
            showSidebarDailyRate,
            isCustomRate,
            ...this.getCalendarDayRateFields(isoDate),
            cellClass: isCustomRate ? `${cellClass} calendar-day_custom-rate` : cellClass,
            hoverTitle: dayStatus ? dayStatus.hoverTitle : '',
            ariaLabel: `${isoDate}${isPending ? ' pending request' : ''}${isConfirmed ? ' confirmed booking' : ''}${isEndDateBlocked ? ' end date unavailable' : ''}${isPartialConfirmedEnd ? ' available after 9 AM' : ''}${isCustomRate ? ' custom rate' : ''}`
        };
    }

    isDateInSelectedRange(isoDate) {
        if (!this.selectedDate) {
            return false;
        }

        const endDate = this.selectedEndDate || this.selectedDate;
        return isoDate >= this.selectedDate && isoDate <= endDate;
    }

    expandDateRange(startValue, endValue) {
        const startDate = this.parseIsoDate(startValue);
        const endDate = this.parseIsoDate(endValue || startValue);
        const dates = [];
        let current = startDate;

        while (current <= endDate) {
            dates.push(this.formatIsoDate(current));
            current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1);
        }

        return dates;
    }

    parseTimeToMinutes(timeValue) {
        if (timeValue == null || timeValue === '') {
            return null;
        }

        const match = String(timeValue).trim().match(/^(\d{1,2}):(\d{2})/);
        if (!match) {
            return null;
        }

        return Number(match[1]) * 60 + Number(match[2]);
    }

    isConfirmedEndByTurnover(booking, isoDate) {
        if (!booking || booking.status !== 'Confirmed') {
            return false;
        }

        const bookingEnd = booking.endDate || booking.bookingDate;
        if (bookingEnd !== isoDate) {
            return false;
        }

        const endMinutes = this.parseTimeToMinutes(booking.endTime);
        if (endMinutes == null) {
            return false;
        }

        return endMinutes <= VENUE_TURNOVER_MINUTES;
    }

    getBookingsOnDate(isoDate) {
        return (this.bookings || []).filter((booking) =>
            this.expandDateRange(booking.bookingDate, booking.endDate).includes(isoDate)
        );
    }

    isDateBlockedForStart(isoDate) {
        return this.getBookingsOnDate(isoDate).some(
            (booking) => booking.status === 'Pending' || booking.status === 'Confirmed'
        );
    }

    isStartDateAllowed(isoDate) {
        if (!isoDate || isoDate < this.todayIso) {
            return false;
        }

        return !this.isDateBlockedForStart(isoDate);
    }

    doesBookingBlockDateInRange(booking, isoDate, startDate, endDate) {
        return booking.status === 'Pending' || booking.status === 'Confirmed';
    }

    canSelectEndDate(startDate, endDate) {
        if (!startDate || !endDate || endDate < startDate) {
            return false;
        }

        if (!this.isStartDateAllowed(startDate)) {
            return false;
        }

        const dates = this.expandDateRange(startDate, endDate);
        return dates.every((isoDate) =>
            this.getBookingsOnDate(isoDate).every(
                (booking) => !this.doesBookingBlockDateInRange(booking, isoDate, startDate, endDate)
            )
        );
    }

    hasPartialConfirmedAvailability(isoDate) {
        return this.getBookingsOnDate(isoDate).some((booking) =>
            this.isConfirmedEndByTurnover(booking, isoDate)
        );
    }

    parseIsoDate(value) {
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
            const [year, month, day] = value.split('-').map(Number);
            return new Date(year, month - 1, day);
        }

        const date = value instanceof Date ? value : new Date(value);
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }

    formatIsoDate(value) {
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return value;
        }

        const date = value instanceof Date ? value : new Date(value);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title,
                message,
                variant
            })
        );
    }

    reduceError(error) {
        if (Array.isArray(error.body)) {
            return error.body.map((item) => item.message).join(', ');
        }
        if (typeof error.body?.message === 'string') {
            return error.body.message;
        }
        if (typeof error.message === 'string') {
            return error.message;
        }
        return 'An unexpected error occurred.';
    }

    get weekdayLabels() {
        return WEEKDAYS;
    }

    get todayIso() {
        return this.formatIsoDate(new Date());
    }

    get endDateMin() {
        return this.selectedDate || this.todayIso;
    }

    get formattedStartTimeDisplay() {
        return this.formatTimeAmPm(this.eventStartTime) || 'Select time';
    }

    get formattedEndTimeDisplay() {
        return this.formatTimeAmPm(this.eventEndTime) || 'Select time';
    }

    get defaultCountryCode() {
        return DEFAULT_COUNTRY_CODE;
    }

    get canGoPrevMonth() {
        const today = new Date();
        const currentMonthStart = new Date(this.currentYear, this.currentMonth - 1, 1);
        const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return currentMonthStart > thisMonthStart;
    }

    get isPrevMonthDisabled() {
        return !this.canGoPrevMonth;
    }

    get selectedVenueImage() {
        return this.venueImages[this.selectedImageIndex];
    }

    get galleryThumbnails() {
        return this.venueImages.map((image, index) => ({
            ...image,
            thumbClass:
                index === this.selectedImageIndex
                    ? 'gallery-thumb gallery-thumb_selected'
                    : 'gallery-thumb',
            index
        }));
    }

    get mapsEmbedUrl() {
        return (
            'https://maps.google.com/maps?q=' +
            this.venueLatitude +
            ',' +
            this.venueLongitude +
            '&z=17&output=embed'
        );
    }

    get fullAddress() {
        return this.brandingHeaderAddressLine || this.brandingFullAddress;
    }

    get headerAddressLine() {
        return this.brandingHeaderAddressLine;
    }

    get mapLinkLabel() {
        return 'Open Urdu Shadikhana in Google Maps';
    }

    get footerContactPhoneHref() {
        const digits = String(this.footerContactNumber).replace(/\D/g, '');
        return digits ? `tel:+91${digits}` : '#';
    }

    get footerAdditionalContactPhoneHref() {
        const digits = String(this.footerAdditionalContactNumber).replace(/\D/g, '');
        return digits ? `tel:+91${digits}` : '#';
    }

    get hasFooterAdditionalContact() {
        return Boolean(this.footerAdditionalContactNumber);
    }

    getDailyRateLabelForDate(isoDate) {
        return `${this.formatInr(this.getEffectiveRateForDate(isoDate))}/day`;
    }

    formatInrCompact(amount) {
        if (amount == null || Number.isNaN(Number(amount))) {
            return '—';
        }

        const num = Number(amount);
        if (num >= 100000) {
            const lakhs = num / 100000;
            const formatted = Number.isInteger(lakhs) ? String(lakhs) : lakhs.toFixed(1).replace(/\.0$/, '');
            return `₹${formatted}L`;
        }

        if (num >= 1000) {
            const thousands = num / 1000;
            const formatted = Number.isInteger(thousands)
                ? String(thousands)
                : thousands.toFixed(1).replace(/\.0$/, '');
            return `₹${formatted}K`;
        }

        return this.formatInr(num);
    }

    getCalendarDayRateFields(isoDate) {
        const rate = this.getEffectiveRateForDate(isoDate);
        return {
            dailyRateAmount: this.formatInr(rate),
            dailyRateAmountCompact: this.formatInrCompact(rate),
            dailyRateLabel: this.getDailyRateLabelForDate(isoDate)
        };
    }

    getEffectiveRateForDate(isoDate) {
        if (this.isCustomRateDate(isoDate) && this.dateRateMap && this.dateRateMap[isoDate] != null) {
            return Number(this.dateRateMap[isoDate]);
        }

        const previewDefault = Number(this.adminDefaultDailyRate);
        if (!Number.isNaN(previewDefault) && previewDefault > 0) {
            return previewDefault;
        }

        if (this.dateRateMap && this.dateRateMap[isoDate] != null) {
            return Number(this.dateRateMap[isoDate]);
        }

        return this.dailyRate;
    }

    isCustomRateDate(isoDate) {
        if (this.pricingOverrideDateSet.has(isoDate)) {
            return true;
        }

        if (this.dateRateMap && this.dateRateMap[isoDate] != null) {
            return Number(this.dateRateMap[isoDate]) !== Number(this.dailyRate);
        }

        return false;
    }

    get pricingOverrideDateSet() {
        const overrideDates = new Set();
        (this.adminDateRateOverrides || []).forEach((entry) => {
            if (entry?.isoDate) {
                overrideDates.add(entry.isoDate);
            }
        });
        return overrideDates;
    }

    get isDefaultPricingMode() {
        return this.pricingMode === 'default';
    }

    get isCustomPricingMode() {
        return this.pricingMode === 'custom';
    }

    get selectedPricingDatesCount() {
        return (this.selectedPricingDates || []).length;
    }

    get selectedPricingDatesLabel() {
        const count = this.selectedPricingDatesCount;
        if (count === 0) {
            return 'No dates selected';
        }
        if (count === 1) {
            return '1 date selected';
        }
        return `${count} dates selected`;
    }

    get isApplyCustomRatesDisabled() {
        return (
            this.isPricingSaving ||
            this.selectedPricingDatesCount === 0 ||
            !this.pricingCustomRate ||
            Number(this.pricingCustomRate) <= 0
        );
    }

    get isRevertCustomRatesDisabled() {
        return this.isPricingSaving || this.selectedPricingDatesCount === 0;
    }

    buildAdminPricingCalendar() {
        const firstDay = new Date(this.currentYear, this.currentMonth - 1, 1);
        const startOffset = firstDay.getDay();
        const daysInMonth = new Date(this.currentYear, this.currentMonth, 0).getDate();
        const daysInPrevMonth = new Date(this.currentYear, this.currentMonth - 1, 0).getDate();
        const todayIso = this.formatIsoDate(new Date());
        const days = [];
        const selectedSet = new Set(this.selectedPricingDates || []);

        for (let index = 0; index < startOffset; index += 1) {
            const dayNumber = daysInPrevMonth - startOffset + index + 1;
            const date = new Date(this.currentYear, this.currentMonth - 2, dayNumber);
            days.push(this.createAdminPricingDayCell(date, dayNumber, false, todayIso, selectedSet));
        }

        for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber += 1) {
            const date = new Date(this.currentYear, this.currentMonth - 1, dayNumber);
            days.push(this.createAdminPricingDayCell(date, dayNumber, true, todayIso, selectedSet));
        }

        while (days.length % 7 !== 0) {
            const dayNumber = days.length - (startOffset + daysInMonth) + 1;
            const date = new Date(this.currentYear, this.currentMonth, dayNumber);
            days.push(this.createAdminPricingDayCell(date, date.getDate(), false, todayIso, selectedSet));
        }

        this.adminPricingCalendarDays = days;
    }

    createAdminPricingDayCell(date, dayNumber, isCurrentMonth, todayIso, selectedSet) {
        const isoDate = this.formatIsoDate(date);
        const isPast = isoDate < todayIso;
        const dayStatus = this.calendarDateStatusMap[isoDate];
        const isReserved = this.bookedDateSet.has(isoDate);
        const isPending = isCurrentMonth && dayStatus && dayStatus.status === 'Pending';
        const isConfirmed = isCurrentMonth && dayStatus && dayStatus.status === 'Confirmed';
        const isCustomRate = isCurrentMonth && !isReserved && this.isCustomRateDate(isoDate);
        const isSelected = isCurrentMonth && selectedSet.has(isoDate);
        const isDefaultMode = this.isDefaultPricingMode;
        const hasBooking = isPending || isConfirmed;

        let cellClass = 'calendar-day calendar-day_pricing';
        if (!isCurrentMonth) {
            cellClass += ' calendar-day_other-month';
        }
        if (isPast) {
            cellClass += ' calendar-day_past';
        }
        if (isPending) {
            cellClass += ' calendar-day_pending';
        } else if (isConfirmed) {
            cellClass += ' calendar-day_confirmed';
        } else if (isCustomRate) {
            cellClass += ' calendar-day_custom-rate';
        } else if (isCurrentMonth) {
            cellClass += ' calendar-day_default-rate';
        }
        if (isSelected && this.isCustomPricingMode) {
            cellClass += ' calendar-day_pricing-selected';
        }

        return {
            key: `pricing-${isoDate}`,
            label: dayNumber,
            isoDate,
            isCurrentMonth,
            isPast,
            isPending,
            isConfirmed,
            isCustomRate,
            isSelected,
            showDailyRate: isCurrentMonth && !hasBooking,
            ...this.getCalendarDayRateFields(isoDate),
            cellClass,
            isDisabled: !isCurrentMonth || isPast || isDefaultMode || hasBooking,
            ariaLabel: `${isoDate}${isPending ? ' pending booking' : ''}${isConfirmed ? ' confirmed booking' : ''}${isCustomRate ? ' custom rate' : ' default rate'}${isSelected ? ' selected' : ''}`
        };
    }

    handlePricingModeChange(event) {
        this.pricingMode = event.detail.value;
        this.selectedPricingDates = [];
        this.pricingCustomRate = '';
        this.buildAdminPricingCalendar();
    }

    handleAdminPricingDayClick(event) {
        if (!this.isCustomPricingMode) {
            return;
        }

        const isoDate = event.currentTarget.dataset.date;
        const isCurrentMonth = event.currentTarget.dataset.current === 'true';
        const isPast = event.currentTarget.dataset.past === 'true';

        if (!isoDate || !isCurrentMonth || isPast) {
            return;
        }

        const dayStatus = this.calendarDateStatusMap[isoDate];
        if (this.bookedDateSet.has(isoDate) || (dayStatus && dayStatus.status)) {
            this.showToast(
                'Date unavailable',
                'Pending and confirmed booking dates cannot be repriced.',
                'error'
            );
            return;
        }

        const selected = [...(this.selectedPricingDates || [])];
        const index = selected.indexOf(isoDate);
        if (index >= 0) {
            selected.splice(index, 1);
        } else {
            selected.push(isoDate);
        }
        selected.sort();
        this.selectedPricingDates = selected;
        this.buildAdminPricingCalendar();
    }

    handleClearPricingSelection() {
        this.selectedPricingDates = [];
        this.buildAdminPricingCalendar();
    }

    removePricingOverridesLocally(isoDates) {
        const removedSet = new Set(isoDates || []);
        if (removedSet.size === 0) {
            return;
        }

        this.adminDateRateOverrides = (this.adminDateRateOverrides || []).filter(
            (entry) => !removedSet.has(entry.isoDate)
        );

        const defaultRate = Number(this.adminDefaultDailyRate) || Number(this.dailyRate) || 8000;
        const nextMap = { ...(this.dateRateMap || {}) };
        removedSet.forEach((isoDate) => {
            if (Object.prototype.hasOwnProperty.call(nextMap, isoDate)) {
                nextMap[isoDate] = defaultRate;
            }
        });
        this.dateRateMap = nextMap;
        this.buildCalendar();
        this.buildAdminPricingCalendar();
    }

    async refreshPricingData() {
        const refreshTasks = [];
        if (this.wiredMonthlyDailyRatesResult) {
            refreshTasks.push(refreshApex(this.wiredMonthlyDailyRatesResult));
        }
        if (this.wiredMarqueeMonthRatesResult) {
            refreshTasks.push(refreshApex(this.wiredMarqueeMonthRatesResult));
        }
        if (this.wiredDailyRateResult) {
            refreshTasks.push(refreshApex(this.wiredDailyRateResult));
        }
        await Promise.all(refreshTasks);
        await this.loadAdminDateRates();
        this.buildCalendar();
        this.buildAdminPricingCalendar();
    }

    async loadAdminDateRates() {
        if (!this.isSystemAdmin || !this.currentYear || !this.currentMonth) {
            return;
        }
        try {
            const overrides = await getAdminDateRateOverrides({
                year: this.currentYear,
                month: this.currentMonth
            });
            this.adminDateRateOverrides = (overrides || []).map((entry) => ({
                ...entry,
                formattedRate: this.formatInr(entry.dailyRate)
            }));
            this.buildAdminPricingCalendar();
        } catch (error) {
            this.showToast('Pricing load failed', this.reduceError(error), 'error');
        }
    }

    async handleSaveDefaultDailyRate() {
        this.isPricingSaving = true;
        try {
            const savedRate = await saveDefaultDailyRate({
                dailyRate: Number(this.adminDefaultDailyRate)
            });
            this.dailyRate = savedRate;
            this.adminDefaultDailyRate = savedRate;
            this.dailyRateLabel = `${this.formatInr(savedRate)}/day`;
            await this.refreshPricingData();
            this.showToast('Default rate saved', 'Standard daily rate updated for open dates only.', 'success');
        } catch (error) {
            this.showToast('Default rate save failed', this.reduceError(error), 'error');
        } finally {
            this.isPricingSaving = false;
        }
    }

    async handleApplyCustomRatesToSelectedDates() {
        if (this.selectedPricingDatesCount === 0) {
            this.showToast('Select dates', 'Tap one or more dates on the calendar.', 'error');
            return;
        }

        const customRate = Number(this.pricingCustomRate);
        if (Number.isNaN(customRate) || customRate <= 0) {
            this.showToast('Invalid rate', 'Enter a custom daily rate greater than zero.', 'error');
            return;
        }

        this.isPricingSaving = true;
        try {
            await saveDateRateOverrides({
                isoDateStrs: [...this.selectedPricingDates],
                dailyRate: customRate
            });
            this.selectedPricingDates = [];
            this.pricingCustomRate = '';
            await this.refreshPricingData();
            this.showToast(
                'Custom rates saved',
                'Selected dates now use the custom daily rate instead of the default.',
                'success'
            );
        } catch (error) {
            this.showToast('Custom rate save failed', this.reduceError(error), 'error');
        } finally {
            this.isPricingSaving = false;
        }
    }

    async handleRevertSelectedDatesToDefault() {
        if (this.selectedPricingDatesCount === 0) {
            this.showToast('Select dates', 'Tap one or more custom-rate dates to revert.', 'error');
            return;
        }

        this.isPricingSaving = true;
        try {
            await deleteDateRateOverrides({
                isoDateStrs: [...this.selectedPricingDates]
            });
            const removedDates = [...this.selectedPricingDates];
            this.selectedPricingDates = [];
            this.removePricingOverridesLocally(removedDates);
            await this.refreshPricingData();
            this.showToast(
                'Custom rates removed',
                'Selected dates now use the default daily rate again.',
                'success'
            );
        } catch (error) {
            this.showToast('Revert failed', this.reduceError(error), 'error');
        } finally {
            this.isPricingSaving = false;
        }
    }

    async handleSaveDateRateOverride() {
        if (!this.pricingOverrideDate || !this.pricingOverrideRate) {
            this.showToast('Missing pricing details', 'Select a date and enter a daily rate.', 'error');
            return;
        }

        this.isPricingSaving = true;
        try {
            await saveDateRateOverride({
                isoDateStr: this.pricingOverrideDate,
                dailyRate: Number(this.pricingOverrideRate)
            });
            this.pricingOverrideDate = '';
            this.pricingOverrideRate = '';
            await this.refreshPricingData();
            this.showToast('Date rate saved', 'The selected date now uses the new daily rate.', 'success');
        } catch (error) {
            this.showToast('Date rate save failed', this.reduceError(error), 'error');
        } finally {
            this.isPricingSaving = false;
        }
    }

    async handleDeleteDateRateOverride(event) {
        const isoDate = event.currentTarget.dataset.date;
        if (!isoDate) {
            return;
        }

        this.isPricingSaving = true;
        try {
            await deleteDateRateOverride({ isoDateStr: isoDate });
            this.removePricingOverridesLocally([isoDate]);
            await this.refreshPricingData();
            this.showToast('Date rate removed', 'The selected date now uses the default daily rate.', 'success');
        } catch (error) {
            this.showToast('Date rate delete failed', this.reduceError(error), 'error');
        } finally {
            this.isPricingSaving = false;
        }
    }

    get footerEscalationMailHref() {
        return `mailto:${this.footerEscalationEmail}`;
    }

    handleSelectImage(event) {
        this.selectedImageIndex = Number(event.currentTarget.dataset.index);
    }

    handlePreviousImage() {
        this.selectedImageIndex =
            (this.selectedImageIndex - 1 + this.venueImages.length) % this.venueImages.length;
    }

    handleNextImage() {
        this.selectedImageIndex = (this.selectedImageIndex + 1) % this.venueImages.length;
    }

    getCelebrationBookingSource() {
        const bookingMap = new Map();

        [...(this.bookingDataRecords || []), ...(this.bookings || [])].forEach((booking) => {
            if (booking?.id) {
                bookingMap.set(booking.id, booking);
            }
        });

        return [...bookingMap.values()];
    }

    isBookingCelebrationActive(booking) {
        if (!booking || booking.status !== 'Confirmed') {
            return false;
        }

        const startDate = this.normalizeBookingIsoDate(booking.bookingDate);
        const endDate = this.normalizeBookingIsoDate(booking.endDate || booking.bookingDate);
        const today = this.todayIso;

        return Boolean(startDate && endDate && today >= startDate && today <= endDate);
    }

    normalizeBookingIsoDate(value) {
        if (!value) {
            return null;
        }

        if (typeof value === 'string') {
            return value.slice(0, 10);
        }

        return this.formatIsoDate(value);
    }

    resolveEventCelebrationProfile(eventName, eventDetails, notes) {
        const searchableText = [eventName, eventDetails, notes]
            .filter((value) => value && String(value).trim())
            .join(' ')
            .toLowerCase();

        const matchedProfile =
            EVENT_CELEBRATION_PROFILES.find(
                (profile) =>
                    profile.id !== 'other' &&
                    profile.keywords.some((keyword) => searchableText.includes(keyword))
            ) || EVENT_CELEBRATION_PROFILES.find((profile) => profile.id === 'other');

        return matchedProfile;
    }

    extractCelebrationFirstName(contactName) {
        const normalized = (contactName || '').trim();
        if (!normalized) {
            return 'Guest';
        }

        return normalized.split(/\s+/)[0];
    }

    buildCelebrationContext(booking) {
        const contactName = (booking.contactName || 'Guest').trim() || 'Guest';
        const eventName = (booking.eventName || 'your special event').trim() || 'your special event';
        const dateRangeLabel = this.formatDateRangeLabel(
            booking.bookingDate,
            booking.endDate || booking.bookingDate
        );

        return {
            contactName,
            firstName: this.extractCelebrationFirstName(contactName),
            eventName,
            dateRangeLabel,
            bookingNumber: booking.bookingNumber || '',
            timeRangeLabel: booking.timeRangeLabel || ''
        };
    }

    formatDateRangeLabel(startValue, endValue) {
        const startLabel = this.formatDateDdMmYyyy(startValue);
        const endLabel = this.formatDateDdMmYyyy(endValue || startValue);

        if (!startLabel) {
            return '';
        }

        return startLabel === endLabel ? startLabel : `${startLabel} – ${endLabel}`;
    }

    buildCelebrationBanner(booking) {
        const profile = this.resolveEventCelebrationProfile(
            booking.eventName,
            booking.eventDetails,
            booking.notes
        );
        const context = this.buildCelebrationContext(booking);

        return {
            key: `${booking.id}-${profile.id}`,
            sortKey: `${this.normalizeBookingIsoDate(booking.bookingDate)}-${booking.bookingNumber || booking.id}`,
            cssClass: `celebration-wish celebration-wish_${profile.id}`,
            emoji: profile.emoji,
            badgeLabel: profile.badgeLabel,
            tagline: profile.tagline,
            decoEmoji: profile.decoEmoji,
            eventLabel: context.eventName,
            title: profile.title(context),
            message: profile.message(context)
        };
    }

    buildPriceDropOffers() {
        const defaultRate = Number(this.dailyRate) || 8000;
        const today = this.todayIso;
        const rateMap = this.marqueeMonthRateMap || {};
        const offers = [];

        Object.keys(rateMap).forEach((isoDate) => {
            if (isoDate < today || !this.isIsoDateInMonth(isoDate, this.marqueeRateYear, this.marqueeRateMonth)) {
                return;
            }

            const rate = Number(rateMap[isoDate]);
            if (Number.isNaN(rate) || rate >= defaultRate) {
                return;
            }

            offers.push({
                isoDate,
                rate,
                defaultRate,
                shortDateLabel: this.formatShortMonthDateLabel(isoDate),
                rateLabel: this.formatInr(rate),
                savingsLabel: this.formatInr(defaultRate - rate),
                marqueeKey: isoDate,
                marqueeKeyCopy: `${isoDate}-copy`
            });
        });

        return offers.sort((left, right) => left.isoDate.localeCompare(right.isoDate));
    }

    buildPriceDropMarqueeText(offers) {
        if (!offers.length) {
            return '';
        }

        const monthName = MONTHS[this.marqueeRateMonth - 1];
        const offerSnippets = offers.map(
            (offer) =>
                `${offer.shortDateLabel}: ${offer.rateLabel}/day (save ${offer.savingsLabel} vs standard rate)`
        );

        return `Special price drop this ${monthName}! ${offerSnippets.join('  •  ')}  •  Book Urdu Shadikhana now before these offer dates pass!`;
    }

    isIsoDateInMonth(isoDate, year, month) {
        const parts = (isoDate || '').split('-');
        if (parts.length !== 3) {
            return false;
        }

        return Number(parts[0]) === year && Number(parts[1]) === month;
    }

    formatShortMonthDateLabel(isoDate) {
        const parts = (isoDate || '').split('-');
        if (parts.length !== 3) {
            return isoDate;
        }

        const day = Number(parts[2]);
        const monthIndex = Number(parts[1]) - 1;
        const monthLabel = MONTHS[monthIndex] ? MONTHS[monthIndex].slice(0, 3) : parts[1];
        return `${day} ${monthLabel}`;
    }
}
