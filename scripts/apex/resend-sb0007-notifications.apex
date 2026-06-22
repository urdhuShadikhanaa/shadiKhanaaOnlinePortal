Id bookingId = 'a01fj00001KjfXfAAJ';
ShadikhanaBookingEmailService.sendBookingRequestEmailsNow(bookingId);
ShadikhanaBookingSmsService.notifyRequesterBookingSubmitted(bookingId);
System.debug('SB0007_RESEND_DONE bookingId=' + bookingId);
