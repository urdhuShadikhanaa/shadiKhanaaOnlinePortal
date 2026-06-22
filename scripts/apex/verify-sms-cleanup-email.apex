// Verify admin report email with improved HTML template and full CSV header sample.
Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
String adminEmail = settings != null && String.isNotBlank(settings.Admin_Email__c)
    ? settings.Admin_Email__c.trim()
    : 'urdhushadikhanaa@gmail.com';

String csvBody =
    'SMS Number,To Number,Status,Message Body,Sent At,Error Message,Created Date,Booking Date\n' +
    '"SMS-00099","9876543210","Sent","Test SMS verification message","","","2026-06-21 10:00:00","2026-06-21"';

Messaging.EmailFileAttachment attachment = new Messaging.EmailFileAttachment();
attachment.setFileName('urdu-shadikhana-sms-test.csv');
attachment.setBody(Blob.valueOf(csvBody));
attachment.setContentType('text/csv');

ShadikhanaSmsOutboundCleanupBatch batch =
    new ShadikhanaSmsOutboundCleanupBatch(Date.today(), Date.today());
batch.deletedCount = 1;
batch.sentCount = 1;

Messaging.SingleEmailMessage message = new Messaging.SingleEmailMessage();
message.setToAddresses(new List<String>{ adminEmail });
message.setSubject(batch.buildEmailSubject());
message.setPlainTextBody(batch.buildPlainTextBody());
message.setHtmlBody(batch.buildHtmlBody());
message.setFileAttachments(new List<Messaging.EmailFileAttachment>{ attachment });
message.setSaveAsActivity(false);
message.setSenderDisplayName('Urdu Shadikhana');

Messaging.SendEmailResult[] results = Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ message }, false);
System.debug('TEST_EMAIL_SUCCESS=' + results[0].isSuccess());
System.debug('TEST_EMAIL_TO=' + adminEmail);
