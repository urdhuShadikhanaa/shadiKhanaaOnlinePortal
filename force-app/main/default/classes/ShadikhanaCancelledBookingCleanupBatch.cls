public class ShadikhanaCancelledBookingCleanupBatch implements Database.Batchable<SObject> {

    private final Date rangeStart;
    private final Date rangeEnd;

    public ShadikhanaCancelledBookingCleanupBatch() {
        Date firstOfCurrentMonth = Date.today().toStartOfMonth();
        rangeEnd = firstOfCurrentMonth.addDays(-1);
        rangeStart = rangeEnd.toStartOfMonth();
    }

    public ShadikhanaCancelledBookingCleanupBatch(Date startDate, Date endDate) {
        rangeStart = startDate;
        rangeEnd = endDate;
    }

    public Database.QueryLocator start(Database.BatchableContext context) {
        return Database.getQueryLocator(
            [
                SELECT Id
                FROM Shadikhana_Booking__c
                WHERE Status__c = 'Cancelled'
                  AND Booking_Date__c >= :rangeStart
                  AND Booking_Date__c <= :rangeEnd
            ]
        );
    }

    public void execute(Database.BatchableContext context, List<Shadikhana_Booking__c> scope) {
        if (!scope.isEmpty()) {
            delete scope;
        }
    }

    public void finish(Database.BatchableContext context) {
    }
}
