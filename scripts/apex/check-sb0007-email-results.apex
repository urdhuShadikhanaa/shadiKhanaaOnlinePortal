Id bookingId = 'a01fj00001KjfXfAAJ';
Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
Shadikhana_Booking__c booking = [
    SELECT Id, Name, Contact_Email__c, Contact_Phone__c, Booking_Date__c, End_Date__c,
           Event_Name__c, Event_Type__c, Expected_Guest_Count__c, Decoration_Arrangement__c,
           Catering_Arrangement__c, Contact_Name__c, Notes__c, Status__c, Booked_By__c,
           Start_Time__c, End_Time__c, Event_Details__c, Daily_Rate__c, Number_of_Days__c,
           Estimated_Amount__c, Final_Amount__c, Hall_Rental_Amount__c, Decoration_Charge__c,
           Catering_Charge__c
    FROM Shadikhana_Booking__c
    WHERE Id = :bookingId
    LIMIT 1
];

String requester = ShadikhanaBookingEmailService.resolveRequesterEmail(booking);
String admin = settings.Admin_Email__c;
System.debug('CHECK_REQUESTER=' + requester);
System.debug('CHECK_ADMIN=' + admin);

List<Messaging.SingleEmailMessage> msgs = new List<Messaging.SingleEmailMessage>();
if (String.isNotBlank(requester)) {
    msgs.add(ShadikhanaBookingEmailService.buildMessage(
        requester,
        'TEST Urdu Shadikhana - Booking Request Received (' + booking.Name + ')',
        ShadikhanaBookingEmailService.buildUserRequestAckPlainBody(booking),
        ShadikhanaBookingEmailService.buildUserRequestAckHtmlBody(booking),
        admin,
        booking.Id
    ));
}
if (String.isNotBlank(admin)) {
    msgs.add(ShadikhanaBookingEmailService.buildMessage(
        admin,
        'TEST New Booking Request ' + booking.Name + ' - Action Required',
        ShadikhanaBookingEmailService.buildAdminNewBookingPlainBody(booking, settings),
        ShadikhanaBookingEmailService.buildAdminNewBookingHtmlBody(booking, settings),
        requester,
        booking.Id
    ));
}

List<Messaging.SendEmailResult> results = Messaging.sendEmail(msgs, false);
for (Integer i = 0; i < results.size(); i++) {
    String toAddr = msgs[i].getToAddresses()[0];
    System.debug('CHECK_RESULT idx=' + i + ' to=' + toAddr + ' success=' + results[i].isSuccess());
    if (!results[i].isSuccess()) {
        for (Messaging.SendEmailError err : results[i].getErrors()) {
            System.debug('CHECK_ERROR to=' + toAddr + ' code=' + err.getStatusCode() + ' msg=' + err.getMessage());
        }
    }
}
