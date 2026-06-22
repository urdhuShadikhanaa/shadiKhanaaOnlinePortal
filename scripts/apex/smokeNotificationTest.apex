Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
if (settings != null && settings.Admin_Mobile_Number__c != null && settings.Admin_Mobile_Number__c.contains(',')) {
    settings.Admin_Mobile_Number__c = settings.Admin_Mobile_Number__c.split(',')[0].trim();
    update settings;
    System.debug('SMOKE: Normalized Admin_Mobile_Number to ' + settings.Admin_Mobile_Number__c);
}

Date bookingDate = Date.today().addDays(120);
Shadikhana_Booking__c booking = new Shadikhana_Booking__c(
    Booking_Date__c = bookingDate,
    End_Date__c = bookingDate,
    Event_Name__c = 'Automated Smoke Test',
    Event_Type__c = 'Other',
    Expected_Guest_Count__c = 50,
    Decoration_Arrangement__c = 'Self',
    Catering_Arrangement__c = 'Self',
    Contact_Name__c = 'Portal Smoke Test',
    Contact_Phone__c = '9876543210',
    Contact_Email__c = settings != null ? settings.Admin_Email__c : 'urdhushadikhanaa@gmail.com',
    Start_Time__c = '10:00',
    End_Time__c = '18:00',
    Daily_Rate__c = 7000,
    Number_of_Days__c = 1,
    Hall_Rental_Amount__c = 7000,
    Estimated_Amount__c = 7000,
    Final_Amount__c = 7000,
    Status__c = 'Pending'
);
insert booking;
System.debug('SMOKE: Created booking ' + booking.Id + ' / ' + booking.Name);

ShadikhanaBookingSmsService.notifyAdminNewBooking(booking.Id);
ShadikhanaBookingEmailService.notifyBookingRequestSubmitted(booking.Id);
System.debug('SMOKE: Queued SMS and email notifications for booking request');
