// Create test booking for SMS auto-send check (phone: 9966634403)
// Run: sf apex run --target-org urdhu --file scripts/apex/create-test-booking-sms.apex

Integer pendingBefore = [SELECT COUNT() FROM Sms_Outbound__c WHERE Status__c = 'Pending'];

Date d = Date.today().addDays(40);
Shadikhana_Booking__c booking = new Shadikhana_Booking__c(
    Booking_Date__c = d,
    End_Date__c = d,
    Event_Name__c = 'Auto SMS Test Event',
    Event_Type__c = 'Wedding',
    Expected_Guest_Count__c = 50,
    Decoration_Arrangement__c = 'Self',
    Catering_Arrangement__c = 'Self',
    Contact_Name__c = 'Auto SMS Test User',
    Contact_Phone__c = '9966634403',
    Status__c = 'Pending',
    Daily_Rate__c = 1000,
    Number_of_Days__c = 1,
    Estimated_Amount__c = 1000,
    Final_Amount__c = 1000
);
insert booking;
System.debug('Created booking: ' + booking.Id);

ShadikhanaBookingSmsService.notifyAdminNewBooking(booking.Id);
System.debug('Admin SMS notification enqueued for new booking.');

Integer pendingAfter = [SELECT COUNT() FROM Sms_Outbound__c WHERE Status__c = 'Pending'];
System.debug('Pending SMS before=' + pendingBefore + ' after enqueue=' + pendingAfter);
System.debug('If gateway is Running on phone, admin SMS should send within poll interval (~30s).');
