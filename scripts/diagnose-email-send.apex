List<OrgWideEmailAddress> addresses = [
    SELECT Id, Address, IsVerified, DisplayName
    FROM OrgWideEmailAddress
    LIMIT 5
];
System.debug('ORG_WIDE_COUNT=' + addresses.size());
for (OrgWideEmailAddress a : addresses) {
    System.debug('OWEA=' + a.Address + ' verified=' + a.IsVerified);
}

Shadikhana_Booking__c booking = [
    SELECT Id, Name, Contact_Email__c, Event_Name__c, Contact_Name__c,
           Booking_Date__c, End_Date__c, Contact_Phone__c, Status__c,
           Start_Time__c, End_Time__c, Estimated_Amount__c, Final_Amount__c,
           Notes__c, Event_Details__c, Booked_By__c
    FROM Shadikhana_Booking__c
    ORDER BY CreatedDate DESC
    LIMIT 1
];

Messaging.SingleEmailMessage msg = new Messaging.SingleEmailMessage();
msg.setToAddresses(new List<String>{ 'urdhushadikhanaa@gmail.com' });
msg.setSubject('Urdu Shadikhana Email Test');
msg.setPlainTextBody('Direct send test at ' + System.now());
msg.setSaveAsActivity(false);
msg.setUseSignature(false);
msg.setSenderDisplayName('Urdu Shadikhana');
if (!addresses.isEmpty() && addresses[0].IsVerified) {
    msg.setOrgWideEmailAddressId(addresses[0].Id);
}

List<Messaging.SendEmailResult> results = Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ msg }, false);
for (Messaging.SendEmailResult r : results) {
    System.debug('EMAIL_SUCCESS=' + r.isSuccess());
    if (!r.isSuccess()) {
        for (Messaging.SendEmailError e : r.getErrors()) {
            System.debug('EMAIL_ERROR=' + e.getStatusCode() + ' ' + e.getMessage());
        }
    }
}

ShadikhanaBookingEmailService.notifyBookingRequestSubmitted(booking.Id);
System.debug('NOTIFY_QUEUED_FOR=' + booking.Id);
