public without sharing class ShadikhanaBookingEmailService {



    private static final String DEFAULT_ADMIN_EMAIL = 'urdhushadikhanaa@gmail.com';

    private static final String DEFAULT_PORTAL_SITE_URL =
        'https://shabbirtech4-dev-ed.develop.my.site.com/urdushadikhana';

    private static final String SENDER_DISPLAY_NAME = 'Urdu Shadikhana';

    private static final String ARRANGEMENT_HALL = 'Hall Management';



    public static void notifyBookingRequestSubmitted(Id bookingId) {
        if (bookingId == null) {
            return;
        }

        System.enqueueJob(new BookingRequestEmailQueueable(bookingId));
    }

    public static void sendBookingRequestEmailsNow(Id bookingId) {
        if (bookingId == null) {
            return;
        }

        new BookingRequestEmailQueueable(bookingId).execute(null);
    }

    public static void notifyBookingStatusChanged(Id bookingId, String status) {
        sendBookingStatusEmailNow(bookingId, status);
    }

    public static void sendBookingStatusEmailNow(Id bookingId, String status) {
        if (bookingId == null || String.isBlank(status)) {
            return;
        }

        if (status == 'Confirmed') {
            new BookingConfirmedEmailQueueable(bookingId).execute(null);
        } else if (status == 'Cancelled') {
            new BookingCancelledEmailQueueable(bookingId).execute(null);
        }
    }



    public class BookingRequestEmailQueueable implements Queueable {

        private Id bookingId;



        public BookingRequestEmailQueueable(Id bookingId) {

            this.bookingId = bookingId;

        }



        public void execute(QueueableContext context) {

            Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();

            if (!isEmailEnabled(settings)) {

                return;

            }



            Shadikhana_Booking__c booking = queryBooking(bookingId);

            String requesterEmail = resolveRequesterEmail(booking);

            if (String.isNotBlank(requesterEmail)) {
                sendMessages(
                    new List<Messaging.SingleEmailMessage>{
                        buildMessage(
                            requesterEmail,
                            'Urdu Shadikhana - Booking Request Received (' + booking.Name + ')',
                            buildUserRequestAckPlainBody(booking),
                            buildUserRequestAckHtmlBody(booking),
                            resolveAdminEmail(settings),
                            booking.Id
                        )
                    }
                );
            }

            String adminEmail = resolveAdminEmail(settings);

            if (String.isNotBlank(adminEmail)) {
                sendMessages(
                    new List<Messaging.SingleEmailMessage>{
                        buildMessage(
                            adminEmail,
                            'New Booking Request ' + booking.Name + ' - Action Required',
                            buildAdminNewBookingPlainBody(booking, settings),
                            buildAdminNewBookingHtmlBody(booking, settings),
                            requesterEmail,
                            booking.Id
                        )
                    }
                );
            }

        }
    }



    public class BookingConfirmedEmailQueueable implements Queueable {

        private Id bookingId;



        public BookingConfirmedEmailQueueable(Id bookingId) {

            this.bookingId = bookingId;

        }



        public void execute(QueueableContext context) {

            Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();

            if (!isEmailEnabled(settings)) {

                return;

            }



            Shadikhana_Booking__c booking = queryBooking(bookingId);

            String requesterEmail = resolveRequesterEmail(booking);

            if (String.isBlank(requesterEmail)) {

                return;

            }



            sendMessages(

                new List<Messaging.SingleEmailMessage>{

                    buildMessage(

                        requesterEmail,

                        'Urdu Shadikhana - Booking Confirmed (' + booking.Name + ')',

                        buildUserConfirmedPlainBody(booking),

                        buildUserConfirmedHtmlBody(booking),

                        resolveAdminEmail(settings),

                        booking.Id

                    )

                }

            );

        }

    }



    public class BookingCancelledEmailQueueable implements Queueable {

        private Id bookingId;



        public BookingCancelledEmailQueueable(Id bookingId) {

            this.bookingId = bookingId;

        }



        public void execute(QueueableContext context) {

            Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();

            if (!isEmailEnabled(settings)) {

                return;

            }



            Shadikhana_Booking__c booking = queryBooking(bookingId);

            String requesterEmail = resolveRequesterEmail(booking);

            if (String.isBlank(requesterEmail)) {

                return;

            }



            sendMessages(

                new List<Messaging.SingleEmailMessage>{

                    buildMessage(

                        requesterEmail,

                        'Urdu Shadikhana - Booking Cancelled (' + booking.Name + ')',

                        buildUserCancelledPlainBody(booking),

                        buildUserCancelledHtmlBody(booking),

                        resolveAdminEmail(settings),

                        booking.Id

                    )

                }

            );

        }

    }



    private static Shadikhana_Booking__c queryBooking(Id bookingId) {

        return [

            SELECT Id, Name, Booking_Date__c, End_Date__c, Event_Name__c, Event_Type__c,

                   Expected_Guest_Count__c, Decoration_Arrangement__c, Catering_Arrangement__c,

                   Contact_Name__c, Contact_Phone__c, Contact_Email__c, Notes__c, Status__c, Booked_By__c,

                   Start_Time__c, End_Time__c, Event_Details__c, Daily_Rate__c, Number_of_Days__c,

                   Estimated_Amount__c, Final_Amount__c, Hall_Rental_Amount__c, Decoration_Charge__c,

                   Catering_Charge__c

            FROM Shadikhana_Booking__c

            WHERE Id = :bookingId

            LIMIT 1

        ];

    }



    @TestVisible

    private static String resolveRequesterEmail(Shadikhana_Booking__c booking) {

        if (booking == null) {

            return null;

        }

        if (String.isNotBlank(booking.Contact_Email__c)) {

            return booking.Contact_Email__c.trim();

        }

        if (booking.Booked_By__c == null) {

            return null;

        }



        List<User> users = [

            SELECT Email

            FROM User

            WHERE Id = :booking.Booked_By__c

            LIMIT 1

        ];

        if (users.isEmpty() || String.isBlank(users[0].Email)) {

            return null;

        }

        return users[0].Email.trim();

    }



    @TestVisible

    private static String resolveAdminEmail(Shadikhana_Settings__c settings) {

        if (settings != null && String.isNotBlank(settings.Admin_Email__c)) {

            return settings.Admin_Email__c.trim();

        }

        return DEFAULT_ADMIN_EMAIL;

    }



    @TestVisible

    private static Boolean isEmailEnabled(Shadikhana_Settings__c settings) {

        return settings == null || settings.Email_Enabled__c != false;

    }



    @TestVisible

    private static Messaging.SingleEmailMessage buildMessage(

        String toAddress,

        String subject,

        String plainBody,

        String htmlBody,

        String replyToAddress,

        Id whatId

    ) {

        Messaging.SingleEmailMessage message = new Messaging.SingleEmailMessage();

        message.setToAddresses(new List<String>{ toAddress });

        message.setSubject(subject);

        message.setPlainTextBody(plainBody);

        message.setHtmlBody(htmlBody);

        message.setSaveAsActivity(false);

        message.setUseSignature(false);

        if (String.isNotBlank(replyToAddress)) {

            message.setReplyTo(replyToAddress);

        }



        Id orgWideEmailId = resolveOrgWideEmailId();

        if (orgWideEmailId != null && !Test.isRunningTest()) {

            message.setOrgWideEmailAddressId(orgWideEmailId);

        } else {

            message.setSenderDisplayName(SENDER_DISPLAY_NAME);

        }



        return message;

    }



    @TestVisible

    private static void sendMessages(List<Messaging.SingleEmailMessage> messages) {

        if (messages == null || messages.isEmpty()) {

            return;

        }



        List<Messaging.SendEmailResult> results = Messaging.sendEmail(messages, false);

        for (Integer index = 0; index < results.size(); index++) {
            if (results[index].isSuccess()) {
                continue;
            }

            String recipient = messages[index].getToAddresses() != null &&
                !messages[index].getToAddresses().isEmpty()
                ? String.join(messages[index].getToAddresses(), ',')
                : 'unknown';

            for (Messaging.SendEmailError error : results[index].getErrors()) {
                System.debug(
                    LoggingLevel.ERROR,
                    'Booking email failed for ' + recipient + ': ' +
                    error.getStatusCode() + ' - ' + error.getMessage()
                );
            }
        }

    }



    private static Id resolveOrgWideEmailId() {

        Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();

        String preferredAddress = resolveAdminEmail(settings);



        List<OrgWideEmailAddress> preferred = [

            SELECT Id

            FROM OrgWideEmailAddress

            WHERE IsVerified = true AND Address = :preferredAddress

            LIMIT 1

        ];

        if (!preferred.isEmpty()) {

            return preferred[0].Id;

        }



        List<OrgWideEmailAddress> addresses = [

            SELECT Id

            FROM OrgWideEmailAddress

            WHERE IsVerified = true

            ORDER BY Address ASC

            LIMIT 1

        ];

        return addresses.isEmpty() ? null : addresses[0].Id;

    }



    @TestVisible

    private static String buildUserRequestAckPlainBody(Shadikhana_Booking__c booking) {

        return 'Thank you for choosing the Urdu Shadikhana Booking site. ' +

            'We have sent your request to the manager. ' +

            'We will confirm the manager\'s response as soon as possible.\n\n' +

            buildBookingDetailsBlock(booking);

    }



    @TestVisible
    public static String buildAdminBookingActionLink(Id bookingId, Shadikhana_Settings__c settings) {
        if (bookingId == null) {
            return resolvePortalSiteUrl(settings) + '/s/?tab=admin';
        }

        String baseUrl = resolvePortalSiteUrl(settings).replaceAll('/+$', '');
        if (!baseUrl.endsWith('/s')) {
            baseUrl += '/s';
        }
        return baseUrl +
            '/?bookingId=' +
            EncodingUtil.urlEncode(String.valueOf(bookingId), 'UTF-8') +
            '&tab=admin';
    }

    private static String resolvePortalSiteUrl(Shadikhana_Settings__c settings) {
        if (settings != null && String.isNotBlank(settings.Portal_Site_URL__c)) {
            return settings.Portal_Site_URL__c.trim();
        }
        return DEFAULT_PORTAL_SITE_URL;
    }

    @TestVisible
    private static String buildAdminNewBookingPlainBody(
        Shadikhana_Booking__c booking,
        Shadikhana_Settings__c settings
    ) {
        String actionLink = buildAdminBookingActionLink(booking.Id, settings);

        return 'A new booking request was submitted on the Urdu Shadikhana portal and needs your review.\n\n' +
            buildBookingDetailsBlock(booking) +
            '\n\nReview, confirm, or cancel this request:\n' +
            actionLink;
    }



    @TestVisible

    private static String buildUserConfirmedPlainBody(Shadikhana_Booking__c booking) {

        return 'Dear ' + booking.Contact_Name__c + ',\n\n' +

            'Your Urdu Shadikhana booking request has been confirmed by the manager.\n\n' +

            buildBookingDetailsBlock(booking) +

            '\nThank you for choosing Urdu Shadikhana.';

    }



    @TestVisible

    private static String buildUserCancelledPlainBody(Shadikhana_Booking__c booking) {

        return 'Dear ' + booking.Contact_Name__c + ',\n\n' +

            'Your Urdu Shadikhana booking request has been cancelled by the manager.\n\n' +

            buildBookingDetailsBlock(booking) +

            '\nIf you have questions, reply to this email or contact the venue team.';

    }



    @TestVisible

    private static String buildUserRequestAckHtmlBody(Shadikhana_Booking__c booking) {

        return buildHtmlEmail(

            booking,

            'Booking request received',

            'Thank you for choosing the Urdu Shadikhana Booking site. We have sent your request to the manager. We will confirm the manager\'s response as soon as possible.'

        );

    }



    @TestVisible
    private static String buildAdminNewBookingHtmlBody(
        Shadikhana_Booking__c booking,
        Shadikhana_Settings__c settings
    ) {
        return buildHtmlEmail(
            booking,
            'New booking request - action required',
            'A new booking request was submitted on the Urdu Shadikhana portal and needs your review. Open the booking in Administration to confirm or cancel this request.',
            buildAdminBookingActionLink(booking.Id, settings)
        );
    }



    @TestVisible

    private static String buildUserConfirmedHtmlBody(Shadikhana_Booking__c booking) {

        return buildHtmlEmail(

            booking,

            'Booking confirmed',

            'Dear ' + escapeHtml(booking.Contact_Name__c) + ', your Urdu Shadikhana booking request has been confirmed by the manager. Thank you for choosing Urdu Shadikhana.'

        );

    }



    @TestVisible

    private static String buildUserCancelledHtmlBody(Shadikhana_Booking__c booking) {

        return buildHtmlEmail(

            booking,

            'Booking cancelled',

            'Dear ' + escapeHtml(booking.Contact_Name__c) + ', your Urdu Shadikhana booking request has been cancelled by the manager. If you have questions, reply to this email or contact the venue team.'

        );

    }



    @TestVisible
    private static String buildHtmlEmail(Shadikhana_Booking__c booking, String headline, String intro) {
        return buildHtmlEmail(booking, headline, intro, null);
    }

    @TestVisible
    private static String buildHtmlEmail(
        Shadikhana_Booking__c booking,
        String headline,
        String intro,
        String actionLink
    ) {

        BookingSummary summary = buildBookingSummary(booking);

        String priceBox = buildPriceBoxHtml(summary);
        String actionSection = String.isBlank(actionLink)
            ? ''
            : '<div style="margin-top:14px;padding:12px 14px;background:#f4fbf6;border:1px solid #c8e6d0;border-radius:8px;">' +
                '<div style="color:#0f5132;font-size:12px;font-weight:700;margin-bottom:8px;">Review this booking</div>' +
                '<a href="' + escapeHtml(actionLink) + '" style="display:inline-block;background:#0f5132;color:#ffffff;text-decoration:none;padding:10px 14px;border-radius:6px;font-size:13px;font-weight:700;">Open booking to confirm or cancel</a>' +
                '<div style="color:#667085;font-size:11px;line-height:1.5;margin-top:8px;word-break:break-all;">' +
                escapeHtml(actionLink) +
                '</div></div>';



        return '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:16px;background:#f4f7f5;font-family:Segoe UI,Arial,sans-serif;color:#16324f;">' +

            '<div style="max-width:640px;margin:0 auto;">' +

            '<div style="background:#0f5132;color:#ffffff;padding:12px 16px;border-radius:8px 8px 0 0;">' +

            '<div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Urdu Shadikhana</div>' +

            '<div style="font-size:18px;font-weight:700;margin-top:4px;">' + escapeHtml(headline) + '</div>' +

            '<div style="font-size:12px;margin-top:6px;line-height:1.5;opacity:0.95;">Request ' + escapeHtml(booking.Name) + '</div>' +

            '</div>' +

            '<div style="background:#ffffff;padding:14px 16px;border:1px solid #d5e3da;border-top:none;font-size:13px;line-height:1.5;">' +

            escapeHtml(intro) +

            '</div>' +

            '<div style="background:#ffffff;border:1px solid #d5e3da;border-top:none;border-radius:0 0 8px 8px;overflow:hidden;">' +

            '<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">' +

            '<tr>' +

            '<td valign="top" width="50%" style="padding:10px 12px;border-right:1px solid #e8efea;">' +

            buildSectionTag('Date &amp; timing') +

            buildLineRow('Period', summary.periodLabel) +

            buildLineRow('From', summary.fromLabel) +

            buildLineRow('To', summary.toLabel) +

            buildSectionTag('Event') +

            buildLineRow('Type', summary.eventTypeLabel) +

            buildLineRow('Details', summary.eventDetailsLabel) +

            buildLineRow('Guests', summary.guestCountLabel) +

            buildLineRow('Decorations', summary.decorationLabel) +

            buildLineRow('Catering', summary.cateringLabel) +

            '</td>' +

            '<td valign="top" width="50%" style="padding:10px 12px;background:linear-gradient(180deg,#f8fbf9 0%,#ffffff 100%);">' +

            buildSectionTag('Contact') +

            buildLineRow('Name', summary.contactNameLabel) +

            buildLineRow('Mobile', summary.contactPhoneLabel) +

            buildLineRow('Email', summary.contactEmailLabel) +

            buildLineRow('Notes', summary.notesLabel) +

            priceBox +

            '</td>' +

            '</tr>' +

            '</table>' +

            actionSection +

            '</div>' +

            '</div>' +

            '</body></html>';

    }



    private static String buildSectionTag(String label) {

        return '<div style="color:#0f5132;font-size:10px;font-weight:800;letter-spacing:0.05em;text-transform:uppercase;margin:8px 0 4px;">' +

            label +

            '</div>';

    }



    private static String buildLineRow(String label, String value) {

        return '<div style="display:flex;justify-content:space-between;gap:8px;margin:0 0 4px;line-height:1.3;">' +

            '<span style="color:#667085;font-size:11px;white-space:nowrap;">' + escapeHtml(label) + '</span>' +

            '<span style="color:#16324f;font-size:12px;font-weight:600;text-align:right;word-break:break-word;">' +

            escapeHtml(value) +

            '</span></div>';

    }



    private static String buildPriceBoxHtml(BookingSummary summary) {

        String breakdown = '<div style="display:flex;justify-content:space-between;gap:8px;margin:0 0 3px;">' +

            '<span style="color:#667085;font-size:11px;">Hall rental</span>' +

            '<span style="color:#16324f;font-size:11px;font-weight:600;">' + escapeHtml(summary.hallRentalLabel) + '</span></div>';



        if (summary.showDecorationCharge) {

            breakdown += '<div style="display:flex;justify-content:space-between;gap:8px;margin:0 0 3px;">' +

                '<span style="color:#667085;font-size:11px;">Decoration</span>' +

                '<span style="color:#16324f;font-size:11px;font-weight:600;">' + escapeHtml(summary.decorationChargeLabel) + '</span></div>';

        }

        if (summary.showCateringCharge) {

            breakdown += '<div style="display:flex;justify-content:space-between;gap:8px;margin:0 0 3px;">' +

                '<span style="color:#667085;font-size:11px;">Catering</span>' +

                '<span style="color:#16324f;font-size:11px;font-weight:600;">' + escapeHtml(summary.cateringChargeLabel) + '</span></div>';

        }

        if (String.isNotBlank(summary.selfArrangedLabel)) {

            breakdown += '<div style="color:#667085;font-size:10px;font-style:italic;margin-top:4px;line-height:1.4;">' +

                escapeHtml(summary.selfArrangedLabel) +

                '</div>';

        }



        String timingNote = String.isNotBlank(summary.pricingNote)

            ? '<div style="color:#667085;font-size:10px;line-height:1.4;margin-top:6px;">' + escapeHtml(summary.pricingNote) + '</div>'

            : '';



        return '<div style="background:linear-gradient(180deg,#f4fbf6 0%,#ffffff 100%);border:1px solid #c8e6d0;border-radius:8px;margin-top:8px;padding:10px 12px;">' +

            '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;">' +

            '<span style="color:#0f5132;font-size:10px;font-weight:800;letter-spacing:0.05em;text-transform:uppercase;">Estimated total</span>' +

            '<span style="color:#0f5132;font-size:18px;font-weight:800;">' + escapeHtml(summary.totalLabel) + '</span></div>' +

            (String.isNotBlank(summary.priceSummaryLabel)

                ? '<div style="color:#667085;font-size:10px;text-align:right;margin-top:2px;">' + escapeHtml(summary.priceSummaryLabel) + '</div>'

                : '') +

            '<div style="margin-top:6px;padding-top:6px;border-top:1px solid #e8efea;">' + breakdown + timingNote + '</div>' +

            '</div>';

    }



    private class BookingSummary {

        public String periodLabel;

        public String fromLabel;

        public String toLabel;

        public String eventTypeLabel;

        public String eventDetailsLabel;

        public String guestCountLabel;

        public String decorationLabel;

        public String cateringLabel;

        public String contactNameLabel;

        public String contactPhoneLabel;

        public String contactEmailLabel;

        public String notesLabel;

        public String totalLabel;

        public String priceSummaryLabel;

        public String hallRentalLabel;

        public String decorationChargeLabel;

        public String cateringChargeLabel;

        public String selfArrangedLabel;

        public String pricingNote;

        public Boolean showDecorationCharge;

        public Boolean showCateringCharge;

    }



    @TestVisible

    private static BookingSummary buildBookingSummary(Shadikhana_Booking__c booking) {

        BookingSummary summary = new BookingSummary();

        Date endDate = booking.End_Date__c != null ? booking.End_Date__c : booking.Booking_Date__c;



        summary.periodLabel = formatDateRangeLabel(booking.Booking_Date__c, endDate);

        summary.fromLabel = formatDateTimeLabel(booking.Booking_Date__c, booking.Start_Time__c);

        summary.toLabel = formatDateTimeLabel(endDate, booking.End_Time__c);

        summary.eventTypeLabel = resolveEventTypeLabel(booking);

        summary.eventDetailsLabel = String.isNotBlank(booking.Event_Details__c) ? booking.Event_Details__c : 'Not provided';

        summary.guestCountLabel = booking.Expected_Guest_Count__c != null

            ? String.valueOf(booking.Expected_Guest_Count__c.intValue())

            : 'Not provided';

        summary.decorationLabel = resolveArrangementLabel(booking.Decoration_Arrangement__c);

        summary.cateringLabel = resolveArrangementLabel(booking.Catering_Arrangement__c);

        summary.contactNameLabel = String.isNotBlank(booking.Contact_Name__c) ? booking.Contact_Name__c : 'Not provided';

        summary.contactPhoneLabel = String.isNotBlank(formatPhoneForDisplay(booking.Contact_Phone__c))

            ? formatPhoneForDisplay(booking.Contact_Phone__c)

            : 'Not provided';

        summary.contactEmailLabel = String.isNotBlank(booking.Contact_Email__c) ? booking.Contact_Email__c : 'Not provided';

        summary.notesLabel = String.isNotBlank(booking.Notes__c) ? booking.Notes__c : 'None';



        Decimal totalAmount = booking.Final_Amount__c != null ? booking.Final_Amount__c : booking.Estimated_Amount__c;

        summary.totalLabel = formatInr(totalAmount);

        summary.hallRentalLabel = formatInr(

            booking.Hall_Rental_Amount__c != null ? booking.Hall_Rental_Amount__c : totalAmount

        );

        summary.showDecorationCharge = booking.Decoration_Arrangement__c == ARRANGEMENT_HALL;

        summary.showCateringCharge = booking.Catering_Arrangement__c == ARRANGEMENT_HALL;

        summary.decorationChargeLabel = summary.showDecorationCharge

            ? formatInr(booking.Decoration_Charge__c)

            : 'Not included';

        summary.cateringChargeLabel = summary.showCateringCharge

            ? formatInr(booking.Catering_Charge__c)

            : 'Not included';

        summary.selfArrangedLabel = buildSelfArrangedLabel(booking);

        summary.priceSummaryLabel = buildPriceSummaryLabel(booking, totalAmount);

        summary.pricingNote = buildPricingNote(booking, totalAmount);

        return summary;

    }



    @TestVisible

    private static String buildBookingDetailsBlock(Shadikhana_Booking__c booking) {

        BookingSummary summary = buildBookingSummary(booking);

        List<String> lines = new List<String>{

            'Request Number: ' + booking.Name,

            'Status: ' + booking.Status__c,

            'Period: ' + summary.periodLabel,

            'From: ' + summary.fromLabel,

            'To: ' + summary.toLabel,

            'Event Type: ' + summary.eventTypeLabel,

            'Event Details: ' + summary.eventDetailsLabel,

            'Guests: ' + summary.guestCountLabel,

            'Decorations: ' + summary.decorationLabel,

            'Catering: ' + summary.cateringLabel,

            'Contact Name: ' + summary.contactNameLabel,

            'Contact Phone: ' + summary.contactPhoneLabel,

            'Contact Email: ' + summary.contactEmailLabel,

            'Notes: ' + summary.notesLabel,

            'Estimated Total: ' + summary.totalLabel,

            'Hall Rental: ' + summary.hallRentalLabel

        };



        if (summary.showDecorationCharge) {

            lines.add('Decoration: ' + summary.decorationChargeLabel);

        }

        if (summary.showCateringCharge) {

            lines.add('Catering: ' + summary.cateringChargeLabel);

        }

        if (String.isNotBlank(summary.selfArrangedLabel)) {

            lines.add(summary.selfArrangedLabel);

        }

        if (String.isNotBlank(summary.pricingNote)) {

            lines.add(summary.pricingNote);

        }



        return String.join(lines, '\n');

    }



    @TestVisible

    private static String resolveEventTypeLabel(Shadikhana_Booking__c booking) {

        if (String.isNotBlank(booking.Event_Type__c) &&

            !'Other'.equalsIgnoreCase(booking.Event_Type__c.trim())) {

            return booking.Event_Type__c.trim();

        }

        return String.isNotBlank(booking.Event_Name__c) ? booking.Event_Name__c : 'Not provided';

    }



    @TestVisible

    private static String resolveArrangementLabel(String arrangement) {

        return arrangement == ARRANGEMENT_HALL ? 'Hall provides' : 'Self arranged';

    }



    @TestVisible

    private static String buildSelfArrangedLabel(Shadikhana_Booking__c booking) {

        List<String> selfArranged = new List<String>();

        if (booking.Decoration_Arrangement__c != ARRANGEMENT_HALL) {

            selfArranged.add('decorations');

        }

        if (booking.Catering_Arrangement__c != ARRANGEMENT_HALL) {

            selfArranged.add('catering');

        }

        if (selfArranged.isEmpty()) {

            return null;

        }

        if (selfArranged.size() == 2) {

            return 'Decorations & catering arranged by you (no charge)';

        }

        return selfArranged[0] == 'decorations'

            ? 'Decorations arranged by you (no charge)'

            : 'Catering arranged by you (no charge)';

    }



    @TestVisible

    private static String buildPriceSummaryLabel(Shadikhana_Booking__c booking, Decimal totalAmount) {

        List<String> parts = new List<String>();

        if (booking.Number_of_Days__c != null && booking.Number_of_Days__c > 0) {

            parts.add(String.valueOf(booking.Number_of_Days__c.intValue()) + ' day(s)');

        }

        if (booking.Daily_Rate__c != null && booking.Daily_Rate__c > 0) {

            parts.add(formatInr(booking.Daily_Rate__c) + '/day avg');

        }

        return String.join(parts, ' · ');

    }



    @TestVisible

    private static String buildPricingNote(Shadikhana_Booking__c booking, Decimal totalAmount) {

        if (booking.Number_of_Days__c == null || totalAmount == null) {

            return null;

        }



        Date endDate = booking.End_Date__c != null ? booking.End_Date__c : booking.Booking_Date__c;

        if (booking.Booking_Date__c != endDate) {

            return 'Each occupied day is priced separately using its date rate: full day rate when hours exceed 8, otherwise reduced rate. Total estimated ' +

                totalAmount.setScale(0) +

                ' INR for ' +

                String.valueOf(booking.Number_of_Days__c.intValue()) +

                ' day(s).';

        }

        return null;

    }



    @TestVisible

    private static String formatDateRangeLabel(Date startDate, Date endDate) {

        if (startDate == null) {

            return 'Not set';

        }

        if (endDate == null || endDate == startDate) {

            return formatDateDdMmYyyy(startDate);

        }

        return formatDateDdMmYyyy(startDate) + ' to ' + formatDateDdMmYyyy(endDate);

    }



    @TestVisible

    private static String formatDateTimeLabel(Date dateValue, String timeValue) {

        if (dateValue == null) {

            return 'Not set';

        }

        String timeLabel = formatTimeAmPm(timeValue);

        if (String.isBlank(timeLabel)) {

            return formatDateDdMmYyyy(dateValue);

        }

        return formatDateDdMmYyyy(dateValue) + ' • ' + timeLabel;

    }



    @TestVisible

    private static String formatDateDdMmYyyy(Date dateValue) {

        if (dateValue == null) {

            return '';

        }

        return String.valueOf(dateValue.day()).leftPad(2, '0') + '/' +

            String.valueOf(dateValue.month()).leftPad(2, '0') + '/' +

            String.valueOf(dateValue.year());

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

        if (String.isBlank(phoneNumber)) {

            return '';

        }



        String digits = phoneNumber.replaceAll('[^0-9+]', '');

        if (String.isBlank(digits)) {

            return phoneNumber;

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



    @TestVisible

    private static String formatInr(Decimal amount) {

        if (amount == null) {

            return '—';

        }

        return '₹' + amount.setScale(0).format();

    }



    @TestVisible

    private static String escapeHtml(String value) {

        if (String.isBlank(value)) {

            return '';

        }

        return value.replace('&', '&amp;')

            .replace('<', '&lt;')

            .replace('>', '&gt;')

            .replace('"', '&quot;');

    }

}

