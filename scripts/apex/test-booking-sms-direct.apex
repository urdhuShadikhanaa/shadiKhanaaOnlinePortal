// Direct booking SMS queue test (bypasses portal controller).
// Run: sf apex run --target-org urdhu --file scripts/apex/test-booking-sms-direct.apex
// Wait ~15s, then: sf apex run --target-org urdhu --file scripts/apex/query-recent-sms-outbound.apex

Integer before = [SELECT COUNT() FROM Sms_Outbound__c];

Date d = Date.today().addDays(45);
Shadikhana_Booking__c booking = new Shadikhana_Booking__c(
    Booking_Date__c = d,
    End_Date__c = d,
    Event_Name__c = 'Direct SMS Test',
    Event_Type__c = 'Wedding',
    Expected_Guest_Count__c = 50,
    Decoration_Arrangement__c = 'Self',
    Catering_Arrangement__c = 'Self',
    Contact_Name__c = 'SMS Test User',
    Contact_Phone__c = '6364054881',
    Status__c = 'Pending',
  Daily_Rate__c = 1000,
    Number_of_Days__c = 1,
    Estimated_Amount__c = 1000,
    Final_Amount__c = 1000
);
insert booking;
System.debug('Booking created: ' + booking.Id);

ShadikhanaBookingSmsService.notifyAdminNewBooking(booking.Id);

booking.Status__c = 'Confirmed';
update booking;
ShadikhanaBookingSmsService.notifyRequesterBookingConfirmed(booking.Id);

Shadikhana_Booking__c booking2 = booking.clone(false, true, false, false);
booking2.Status__c = 'Pending';
insert booking2;
System.debug('Second booking: ' + booking2.Id);
booking2.Status__c = 'Cancelled';
update booking2;
ShadikhanaBookingSmsService.notifyRequesterBookingCancelled(booking2.Id);

Integer after = [SELECT COUNT() FROM Sms_Outbound__c];
System.debug('Sms_Outbound count before=' + before + ' after enqueue calls=' + after);
System.debug('Wait ~15s then run query-recent-sms-outbound.apex');
