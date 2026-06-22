List<Shadikhana_Booking__c> smokeBookings = [
    SELECT Id, Name
    FROM Shadikhana_Booking__c
    WHERE Event_Name__c = 'Automated Smoke Test'
    AND Status__c = 'Pending'
];
System.debug('CLEANUP: deleting ' + smokeBookings.size() + ' smoke test booking(s)');
delete smokeBookings;
