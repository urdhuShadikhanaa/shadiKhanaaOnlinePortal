Id bookingId = [SELECT Id FROM Shadikhana_Booking__c WHERE Name = 'SB-0000' LIMIT 1].Id;
new ShadikhanaBookingEmailService.BookingConfirmedEmailQueueable(bookingId).execute(null);
System.debug('RESENT_CONFIRMATION_EMAIL=true bookingId=' + bookingId);
