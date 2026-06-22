@IsTest
private class ShadikhanaBookingPublicAccessTest {

    @IsTest
    static void testPublicAccessQueries() {
        Date bookingDate = Date.today().addDays(20);
        Date endDate = bookingDate.addDays(1);

        insert new Portal_Banner__c(
            Title__c = 'Welcome',
            Message__c = 'Book Urdu Shadikhana',
            Is_Active__c = true,
            Banner_Style__c = 'Info',
            Sort_Order__c = 1
        );

        insert new List<Shadikhana_Booking__c>{
            new Shadikhana_Booking__c(
                Booking_Date__c = bookingDate,
                End_Date__c = endDate,
                Event_Name__c = 'Confirmed Event',
                Contact_Name__c = 'Confirmed User',
                Contact_Phone__c = '9876543210',
                Status__c = 'Confirmed',
                Booked_By__c = UserInfo.getUserId()
            ),
            new Shadikhana_Booking__c(
                Booking_Date__c = bookingDate.addDays(5),
                Event_Name__c = 'Pending Event',
                Contact_Name__c = 'Pending User',
                Contact_Phone__c = '9876543211',
                Status__c = 'Pending',
                Booked_By__c = UserInfo.getUserId()
            )
        };

        Test.startTest();
        List<Portal_Banner__c> banners = ShadikhanaBookingPublicAccess.queryActiveBanners();
        List<Shadikhana_Booking__c> calendarBookings =
            ShadikhanaBookingPublicAccess.queryCalendarBookingsOverlappingRange(bookingDate, endDate);
        List<Shadikhana_Booking__c> confirmedBookings =
            ShadikhanaBookingPublicAccess.queryConfirmedBookingsOverlappingRange(bookingDate, endDate);
        Integer confirmedCount =
            ShadikhanaBookingPublicAccess.countOverlappingConfirmedBookings(bookingDate, endDate, null);
        Integer activeCount =
            ShadikhanaBookingPublicAccess.countOverlappingActiveBookings(bookingDate, endDate, null);
        Test.stopTest();

        System.assertEquals(1, banners.size());
        System.assertEquals(1, calendarBookings.size());
        System.assertEquals(1, confirmedBookings.size());
        System.assertEquals(1, confirmedCount);
        System.assertEquals(1, activeCount);
    }

    @IsTest
    static void testPublicAccessCountsWithExcludeId() {
        Date bookingDate = Date.today().addDays(30);

        Shadikhana_Booking__c booking = new Shadikhana_Booking__c(
            Booking_Date__c = bookingDate,
            Event_Name__c = 'Exclude Test',
            Contact_Name__c = 'Exclude User',
            Contact_Phone__c = '9876543212',
            Status__c = 'Confirmed',
            Booked_By__c = UserInfo.getUserId()
        );
        insert booking;

        Test.startTest();
        Integer confirmedCount = ShadikhanaBookingPublicAccess.countOverlappingConfirmedBookings(
            bookingDate,
            bookingDate,
            booking.Id
        );
        Integer activeCount = ShadikhanaBookingPublicAccess.countOverlappingActiveBookings(
            bookingDate,
            bookingDate,
            booking.Id
        );
        Test.stopTest();

        System.assertEquals(0, confirmedCount);
        System.assertEquals(0, activeCount);
    }
}
