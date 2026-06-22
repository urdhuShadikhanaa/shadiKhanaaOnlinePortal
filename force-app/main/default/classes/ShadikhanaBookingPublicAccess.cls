public without sharing class ShadikhanaBookingPublicAccess {

    public static List<Portal_Banner__c> queryActiveBanners() {
        List<Portal_Banner__c> records = [
            SELECT Id, Name, Title__c, Message__c, Is_Active__c, Banner_Style__c, Sort_Order__c
            FROM Portal_Banner__c
            WHERE Is_Active__c = true
            ORDER BY Sort_Order__c ASC NULLS LAST, CreatedDate ASC
            LIMIT 20
        ];

        List<Portal_Banner__c> filtered = new List<Portal_Banner__c>();
        for (Portal_Banner__c record : records) {
            if (String.isNotBlank(record.Message__c)) {
                filtered.add(record);
            }
        }
        return filtered;
    }

    public static List<Shadikhana_Booking__c> queryCalendarBookingsOverlappingRange(
        Date rangeStart,
        Date rangeEnd
    ) {
        return [
            SELECT Id, Name, Booking_Date__c, End_Date__c, Event_Name__c, Contact_Name__c,
                   Contact_Phone__c, Contact_Email__c, Notes__c, Status__c, Booked_By__c,
                   Start_Time__c, End_Time__c, Event_Details__c, Daily_Rate__c, Number_of_Days__c,
                   Estimated_Amount__c, Final_Amount__c, Event_Type__c, Expected_Guest_Count__c,
                   Decoration_Arrangement__c, Catering_Arrangement__c, Hall_Rental_Amount__c,
                   Decoration_Charge__c, Catering_Charge__c
            FROM Shadikhana_Booking__c
            WHERE Status__c IN ('Pending', 'Confirmed')
              AND Booking_Date__c <= :rangeEnd
              AND (
                  End_Date__c >= :rangeStart
                  OR (End_Date__c = NULL AND Booking_Date__c >= :rangeStart)
              )
            ORDER BY Booking_Date__c ASC
        ];
    }

    public static List<Shadikhana_Booking__c> queryConfirmedBookingsOverlappingRange(
        Date rangeStart,
        Date rangeEnd
    ) {
        return [
            SELECT Id, Name, Booking_Date__c, End_Date__c, Event_Name__c, Contact_Name__c,
                   Contact_Phone__c, Contact_Email__c, Notes__c, Status__c, Booked_By__c,
                   Start_Time__c, End_Time__c, Event_Details__c, Daily_Rate__c, Number_of_Days__c,
                   Estimated_Amount__c, Final_Amount__c, Event_Type__c, Expected_Guest_Count__c,
                   Decoration_Arrangement__c, Catering_Arrangement__c, Hall_Rental_Amount__c,
                   Decoration_Charge__c, Catering_Charge__c
            FROM Shadikhana_Booking__c
            WHERE Status__c = 'Confirmed'
              AND Booking_Date__c <= :rangeEnd
              AND (
                  End_Date__c >= :rangeStart
                  OR (End_Date__c = NULL AND Booking_Date__c >= :rangeStart)
              )
            ORDER BY Booking_Date__c ASC
        ];
    }

    public static Integer countOverlappingConfirmedBookings(
        Date startDate,
        Date endDate,
        Id excludeBookingId
    ) {
        if (excludeBookingId == null) {
            return [
                SELECT COUNT()
                FROM Shadikhana_Booking__c
                WHERE Status__c = 'Confirmed'
                  AND Booking_Date__c <= :endDate
                  AND (
                      End_Date__c >= :startDate
                      OR (End_Date__c = NULL AND Booking_Date__c >= :startDate)
                  )
            ];
        }

        return [
            SELECT COUNT()
            FROM Shadikhana_Booking__c
            WHERE Status__c = 'Confirmed'
              AND Id != :excludeBookingId
              AND Booking_Date__c <= :endDate
              AND (
                  End_Date__c >= :startDate
                  OR (End_Date__c = NULL AND Booking_Date__c >= :startDate)
              )
        ];
    }

    public static Integer countOverlappingActiveBookings(
        Date startDate,
        Date endDate,
        Id excludeBookingId
    ) {
        if (excludeBookingId == null) {
            return [
                SELECT COUNT()
                FROM Shadikhana_Booking__c
                WHERE Status__c IN ('Pending', 'Confirmed')
                  AND Booking_Date__c <= :endDate
                  AND (
                      End_Date__c >= :startDate
                      OR (End_Date__c = NULL AND Booking_Date__c >= :startDate)
                  )
            ];
        }

        return [
            SELECT COUNT()
            FROM Shadikhana_Booking__c
            WHERE Status__c IN ('Pending', 'Confirmed')
              AND Id != :excludeBookingId
              AND Booking_Date__c <= :endDate
              AND (
                  End_Date__c >= :startDate
                  OR (End_Date__c = NULL AND Booking_Date__c >= :startDate)
              )
        ];
    }
}
