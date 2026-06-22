Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
String adminEmail = settings != null && String.isNotBlank(settings.Admin_Email__c)
    ? settings.Admin_Email__c.trim()
    : 'urdhushadikhanaa@gmail.com';

Messaging.SingleEmailMessage msg = new Messaging.SingleEmailMessage();
msg.setToAddresses(new List<String>{ adminEmail });
msg.setSubject('Urdu Shadikhana - Please confirm you received this test');
msg.setPlainTextBody(
    'If you received this email, Salesforce outbound email is working for urdhushadikhanaa@gmail.com.\n\n' +
    'Check your Spam/Promotions folder if you do not see it in Inbox.\n\n' +
    'Sent at: ' + String.valueOf(System.now())
);
msg.setSaveAsActivity(false);
msg.setUseSignature(false);
msg.setSenderDisplayName('Urdu Shadikhana');
msg.setReplyTo(adminEmail);

Messaging.SendEmailResult[] results = Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ msg }, false);
System.debug('RESEND_SUCCESS=' + results[0].isSuccess());
if (!results[0].isSuccess()) {
    for (Messaging.SendEmailError err : results[0].getErrors()) {
        System.debug('RESEND_ERROR=' + err.getStatusCode() + ' | ' + err.getMessage());
    }
}
