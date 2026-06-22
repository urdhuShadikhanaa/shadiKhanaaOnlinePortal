public without sharing class ShadikhanaSmsOutboundCleanupBatch
    implements Database.Batchable<SObject>, Database.Stateful {

    private static final String DEFAULT_ADMIN_EMAIL = 'urdhushadikhanaa@gmail.com';
    private static final String SENDER_DISPLAY_NAME = 'Urdu Shadikhana';

    private final Date rangeStart;
    private final Date rangeEnd;
    private final Datetime rangeStartDt;
    private final Datetime rangeEndDt;

    private List<String> csvLines = new List<String>();
    @TestVisible private Integer deletedCount = 0;
    @TestVisible private Integer sentCount = 0;
    @TestVisible private Integer pendingCount = 0;
    @TestVisible private Integer failedCount = 0;

    public ShadikhanaSmsOutboundCleanupBatch() {
        Date firstOfCurrentMonth = Date.today().toStartOfMonth();
        rangeEnd = firstOfCurrentMonth.addDays(-1);
        rangeStart = rangeEnd.toStartOfMonth();
        rangeStartDt = toStartOfDay(rangeStart);
        rangeEndDt = toEndOfDay(rangeEnd);
        csvLines.add(buildCsvHeader());
    }

    public ShadikhanaSmsOutboundCleanupBatch(Date startDate, Date endDate) {
        rangeStart = startDate;
        rangeEnd = endDate;
        rangeStartDt = toStartOfDay(rangeStart);
        rangeEndDt = toEndOfDay(rangeEnd);
        csvLines.add(buildCsvHeader());
    }

    public Database.QueryLocator start(Database.BatchableContext context) {
        return Database.getQueryLocator([
            SELECT Id, Name, To_Number__c, Message_Body__c, Status__c,
                   Sent_At__c, Error_Message__c, CreatedDate,
                   Booking__r.Booking_Date__c
            FROM Sms_Outbound__c
            WHERE CreatedDate >= :rangeStartDt
              AND CreatedDate <= :rangeEndDt
            ORDER BY CreatedDate ASC
        ]);
    }

    public void execute(Database.BatchableContext context, List<SObject> scope) {
        for (SObject record : scope) {
            Sms_Outbound__c row = (Sms_Outbound__c) record;
            csvLines.add(buildCsvRow(row));
            trackStatus(row.Status__c);
        }

        if (!scope.isEmpty()) {
            delete scope;
            deletedCount += scope.size();
        }
    }

    public void finish(Database.BatchableContext context) {
        if (deletedCount == 0) {
            return;
        }

        sendAdminReportEmail();
    }

    @TestVisible
    private void sendAdminReportEmail() {
        Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
        String adminEmail = resolveAdminEmail(settings);
        if (String.isBlank(adminEmail)) {
            System.debug(LoggingLevel.ERROR, 'SMS cleanup: Admin email is not configured.');
            return;
        }

        String csvBody = String.join(csvLines, '\n');
        String fileName = buildAttachmentFileName();

        Messaging.EmailFileAttachment attachment = new Messaging.EmailFileAttachment();
        attachment.setFileName(fileName);
        attachment.setBody(Blob.valueOf(csvBody));
        attachment.setContentType('text/csv');

        Messaging.SingleEmailMessage message = new Messaging.SingleEmailMessage();
        message.setToAddresses(new List<String>{ adminEmail });
        message.setSubject(buildEmailSubject());
        message.setPlainTextBody(buildPlainTextBody());
        message.setHtmlBody(buildHtmlBody());
        message.setFileAttachments(new List<Messaging.EmailFileAttachment>{ attachment });
        message.setSaveAsActivity(false);
        message.setUseSignature(false);
        message.setReplyTo(adminEmail);

        Id orgWideEmailId = resolveOrgWideEmailId(adminEmail);
        if (orgWideEmailId != null && !Test.isRunningTest()) {
            message.setOrgWideEmailAddressId(orgWideEmailId);
        } else {
            message.setSenderDisplayName(SENDER_DISPLAY_NAME);
        }

        sendEmailWithLogging(message, adminEmail);
    }

    @TestVisible
    private static void sendEmailWithLogging(Messaging.SingleEmailMessage message, String adminEmail) {
        List<Messaging.SendEmailResult> results = Messaging.sendEmail(
            new List<Messaging.SingleEmailMessage>{ message },
            false
        );

        if (results.isEmpty()) {
            System.debug(LoggingLevel.ERROR, 'SMS cleanup email: no send result returned for ' + adminEmail);
            return;
        }

        if (results[0].isSuccess()) {
            System.debug('SMS cleanup email queued for ' + adminEmail);
            return;
        }

        for (Messaging.SendEmailError error : results[0].getErrors()) {
            System.debug(
                LoggingLevel.ERROR,
                'SMS cleanup email failed for ' + adminEmail + ': ' +
                error.getStatusCode() + ' - ' + error.getMessage()
            );
        }
    }

    @TestVisible
    private String buildEmailSubject() {
        return 'Urdu Shadikhana | Monthly SMS Report - ' +
            formatMonthYearLabel(rangeStart) +
            ' (' + deletedCount + ' message' + (deletedCount == 1 ? '' : 's') + ')';
    }

    @TestVisible
    private String buildAttachmentFileName() {
        return 'urdu-shadikhana-sms-' +
            formatMonthYearSlug(rangeStart) +
            '.csv';
    }

    @TestVisible
    private String buildPlainTextBody() {
        return 'Urdu Shadikhana - Monthly SMS Outbound Report\n\n' +
            'Reporting period: ' + formatDateLabel(rangeStart) + ' to ' + formatDateLabel(rangeEnd) + '\n' +
            'Total messages archived: ' + deletedCount + '\n' +
            '  Sent: ' + sentCount + '\n' +
            '  Pending: ' + pendingCount + '\n' +
            '  Failed: ' + failedCount + '\n\n' +
            'The attached CSV contains the message log for this period, including booking date where available. ' +
            'These records have been removed from Salesforce to keep the SMS queue tidy.\n\n' +
            'File: ' + buildAttachmentFileName() + '\n\n' +
            'Urdu Shadikhana Administration';
    }

    @TestVisible
    private String buildHtmlBody() {
        return '<!DOCTYPE html><html><head><meta charset="UTF-8"></head>' +
            '<body style="margin:0;padding:16px;background:#f4f7f5;font-family:Segoe UI,Arial,sans-serif;color:#16324f;">' +
            '<div style="max-width:640px;margin:0 auto;">' +
            '<div style="background:#0f5132;color:#ffffff;padding:14px 18px;border-radius:8px 8px 0 0;">' +
            '<div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Urdu Shadikhana</div>' +
            '<div style="font-size:20px;font-weight:700;margin-top:6px;">Monthly SMS Outbound Report</div>' +
            '<div style="font-size:12px;margin-top:6px;opacity:0.95;">' + escapeHtml(formatMonthYearLabel(rangeStart)) + '</div>' +
            '</div>' +
            '<div style="background:#ffffff;padding:16px 18px;border:1px solid #d5e3da;border-top:none;font-size:13px;line-height:1.6;">' +
            'Your monthly SMS archive is attached as a CSV file. The records below were exported and removed from the org after this report was generated.' +
            '</div>' +
            '<div style="background:#ffffff;border:1px solid #d5e3da;border-top:none;border-radius:0 0 8px 8px;overflow:hidden;">' +
            '<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">' +
            '<tr><td style="padding:12px 18px;border-bottom:1px solid #e8efea;">' +
            buildSummaryRow('Reporting period', formatDateLabel(rangeStart) + ' to ' + formatDateLabel(rangeEnd)) +
            buildSummaryRow('Total archived', String.valueOf(deletedCount)) +
            buildSummaryRow('Attachment', buildAttachmentFileName()) +
            '</td></tr>' +
            '<tr><td style="padding:12px 18px;background:#f8fbf9;">' +
            '<div style="color:#0f5132;font-size:10px;font-weight:800;letter-spacing:0.05em;text-transform:uppercase;margin-bottom:8px;">Delivery summary</div>' +
            '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
            buildStatusPill('Sent', sentCount, '#0f5132', '#f4fbf6') +
            buildStatusPill('Pending', pendingCount, '#856404', '#fff8e6') +
            buildStatusPill('Failed', failedCount, '#842029', '#fff1f2') +
            '</div></td></tr>' +
            '<tr><td style="padding:12px 18px;font-size:12px;color:#667085;line-height:1.5;">' +
            'The CSV includes SMS number, recipient, status, message body, sent time, error details, created date, and booking date.' +
            '</td></tr>' +
            '</table></div></div></body></html>';
    }

    private String buildSummaryRow(String label, String value) {
        return '<div style="display:flex;justify-content:space-between;gap:12px;margin:0 0 8px;line-height:1.4;">' +
            '<span style="color:#667085;font-size:12px;">' + escapeHtml(label) + '</span>' +
            '<span style="color:#16324f;font-size:12px;font-weight:600;text-align:right;">' + escapeHtml(value) + '</span>' +
            '</div>';
    }

    private String buildStatusPill(String label, Integer count, String color, String background) {
        return '<div style="min-width:88px;padding:10px 12px;border-radius:8px;background:' + background +
            ';border:1px solid #e8efea;text-align:center;">' +
            '<div style="font-size:18px;font-weight:800;color:' + color + ';">' + count + '</div>' +
            '<div style="font-size:10px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#667085;margin-top:4px;">' +
            escapeHtml(label) + '</div></div>';
    }

    private void trackStatus(String status) {
        if (status == 'Sent') {
            sentCount++;
        } else if (status == 'Failed') {
            failedCount++;
        } else {
            pendingCount++;
        }
    }

    @TestVisible
    private static String resolveAdminEmail(Shadikhana_Settings__c settings) {
        if (settings != null && String.isNotBlank(settings.Admin_Email__c)) {
            return settings.Admin_Email__c.trim();
        }
        return DEFAULT_ADMIN_EMAIL;
    }

    private static Id resolveOrgWideEmailId(String preferredAddress) {
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
    private static String buildCsvHeader() {
        return String.join(
            new List<String>{
                'SMS Number',
                'To Number',
                'Status',
                'Message Body',
                'Sent At',
                'Error Message',
                'Created Date',
                'Booking Date'
            },
            ','
        );
    }

    @TestVisible
    private static String buildCsvRow(Sms_Outbound__c row) {
        return String.join(
            new List<String>{
                csvEscape(row.Name),
                csvEscape(row.To_Number__c),
                csvEscape(row.Status__c),
                csvEscape(row.Message_Body__c),
                csvEscape(formatDateTime(row.Sent_At__c)),
                csvEscape(row.Error_Message__c),
                csvEscape(formatDateTime(row.CreatedDate)),
                csvEscape(row.Booking__r == null || row.Booking__r.Booking_Date__c == null
                    ? ''
                    : String.valueOf(row.Booking__r.Booking_Date__c))
            },
            ','
        );
    }

    @TestVisible
    private static String csvEscape(String value) {
        if (value == null) {
            return '""';
        }
        String escaped = value.replace('"', '""');
        return '"' + escaped + '"';
    }

    @TestVisible
    private static String formatDateTime(Datetime value) {
        return value == null ? '' : value.format('yyyy-MM-dd HH:mm:ss');
    }

    @TestVisible
    private static String formatDateLabel(Date value) {
        if (value == null) {
            return '';
        }
        return String.valueOf(value.day()).leftPad(2, '0') + '/' +
            String.valueOf(value.month()).leftPad(2, '0') + '/' +
            String.valueOf(value.year());
    }

    @TestVisible
    private static String formatMonthYearLabel(Date value) {
        if (value == null) {
            return '';
        }
        return formatMonthAbbreviation(value) + ' ' + String.valueOf(value.year());
    }

    @TestVisible
    private static String formatMonthYearSlug(Date value) {
        if (value == null) {
            return '';
        }
        return formatMonthAbbreviation(value).toLowerCase() + '-' + String.valueOf(value.year());
    }

    @TestVisible
    private static String formatMonthAbbreviation(Date value) {
        List<String> months = new List<String>{
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        };
        return months[value.month() - 1];
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

    private static Datetime toStartOfDay(Date d) {
        return Datetime.newInstance(d, Time.newInstance(0, 0, 0, 0));
    }

    private static Datetime toEndOfDay(Date d) {
        return Datetime.newInstance(d, Time.newInstance(23, 59, 59, 0));
    }
}
