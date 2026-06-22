// Diagnose SMS cleanup email delivery to admin.
Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
String adminEmail = settings != null && String.isNotBlank(settings.Admin_Email__c)
    ? settings.Admin_Email__c.trim()
    : 'urdhushadikhanaa@gmail.com';
System.debug('DIAG_ADMIN_EMAIL=' + adminEmail);

List<OrgWideEmailAddress> owea = [
    SELECT Id, Address, DisplayName, IsVerified
    FROM OrgWideEmailAddress
    ORDER BY Address ASC
];
System.debug('DIAG_OWEACOUNT=' + owea.size());
for (OrgWideEmailAddress row : owea) {
    System.debug('DIAG_OWEA=' + row.Address + ' | verified=' + row.IsVerified);
}

// 1) Plain email without attachment
Messaging.SingleEmailMessage plain = new Messaging.SingleEmailMessage();
plain.setToAddresses(new List<String>{ adminEmail });
plain.setSubject('Urdu Shadikhana - Plain email diagnostic');
plain.setPlainTextBody('Plain diagnostic test to admin email.');
plain.setSenderDisplayName('Urdu Shadikhana');
plain.setSaveAsActivity(false);
Messaging.SendEmailResult[] plainResults = Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ plain }, false);
System.debug('DIAG_PLAIN_SUCCESS=' + plainResults[0].isSuccess());
if (!plainResults[0].isSuccess()) {
    for (Messaging.SendEmailError err : plainResults[0].getErrors()) {
        System.debug('DIAG_PLAIN_ERROR=' + err.getStatusCode() + ' | ' + err.getMessage());
    }
}

// 2) Email with CSV attachment (same as cleanup batch)
Messaging.EmailFileAttachment attachment = new Messaging.EmailFileAttachment();
attachment.setFileName('urdu-shadikhana-sms-test.csv');
attachment.setBody(Blob.valueOf('SMS Number,To Number,Status\n"SMS-00001","9876543210","Sent"'));
attachment.setContentType('text/csv');

Messaging.SingleEmailMessage withAttachment = new Messaging.SingleEmailMessage();
withAttachment.setToAddresses(new List<String>{ adminEmail });
withAttachment.setSubject('Urdu Shadikhana - Attachment email diagnostic');
withAttachment.setPlainTextBody('Attachment diagnostic test to admin email.');
withAttachment.setFileAttachments(new List<Messaging.EmailFileAttachment>{ attachment });
withAttachment.setSaveAsActivity(false);
withAttachment.setSenderDisplayName('Urdu Shadikhana');

Messaging.SendEmailResult[] attachResults = Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ withAttachment }, false);
System.debug('DIAG_ATTACH_SUCCESS=' + attachResults[0].isSuccess());
if (!attachResults[0].isSuccess()) {
    for (Messaging.SendEmailError err : attachResults[0].getErrors()) {
        System.debug('DIAG_ATTACH_ERROR=' + err.getStatusCode() + ' | ' + err.getMessage());
    }
}

// 3) Run today's cleanup batch if records exist
Integer todayCount = [SELECT COUNT() FROM Sms_Outbound__c WHERE CreatedDate = TODAY];
System.debug('DIAG_TODAY_SMS_COUNT=' + todayCount);
