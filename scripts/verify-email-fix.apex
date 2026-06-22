List<OrgWideEmailAddress> addresses = [
    SELECT Id, Address, IsVerified
    FROM OrgWideEmailAddress
    WHERE IsVerified = true
    LIMIT 1
];

Shadikhana_Booking__c booking = [
    SELECT Id
    FROM Shadikhana_Booking__c
    ORDER BY CreatedDate DESC
    LIMIT 1
];

Messaging.SingleEmailMessage msg = new Messaging.SingleEmailMessage();
msg.setToAddresses(new List<String>{ 'urdhushadikhanaa@gmail.com' });
msg.setSubject('Urdu Shadikhana Email Fix Verification');
msg.setPlainTextBody('Email fix verification at ' + System.now());
msg.setSaveAsActivity(false);
msg.setUseSignature(false);
if (!addresses.isEmpty()) {
    msg.setOrgWideEmailAddressId(addresses[0].Id);
}

List<Messaging.SendEmailResult> results = Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ msg }, false);
System.debug('VERIFY_SUCCESS=' + results[0].isSuccess());
if (!results[0].isSuccess()) {
    for (Messaging.SendEmailError e : results[0].getErrors()) {
        System.debug('VERIFY_ERROR=' + e.getStatusCode() + ' ' + e.getMessage());
    }
}

ShadikhanaBookingEmailService.notifyBookingRequestSubmitted(booking.Id);
System.debug('BOOKING_EMAIL_QUEUED=' + booking.Id);
