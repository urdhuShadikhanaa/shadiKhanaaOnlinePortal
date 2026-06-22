Messaging.SingleEmailMessage msg = new Messaging.SingleEmailMessage();
msg.setToAddresses(new List<String>{ 'shabbirali.sfdc@gmail.com' });
msg.setSubject('Urdu Shadikhana - Email diagnostic');
msg.setPlainTextBody('Diagnostic test from urdhu org.');
msg.setSenderDisplayName('Urdu Shadikhana');

Messaging.SendEmailResult[] results = Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ msg }, false);
System.debug('DIAG_SUCCESS=' + results[0].isSuccess());
if (!results[0].isSuccess()) {
    for (Messaging.SendEmailError err : results[0].getErrors()) {
        System.debug('DIAG_ERROR=' + err.getStatusCode() + ' | ' + err.getMessage());
    }
}

List<OrgWideEmailAddress> owea = [SELECT Id, Address, IsVerified FROM OrgWideEmailAddress LIMIT 5];
System.debug('DIAG_OWEACOUNT=' + owea.size());
