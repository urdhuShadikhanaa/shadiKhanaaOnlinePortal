List<Shadikhana_Booking__c> recent = [
    SELECT Name, Event_Name__c, Status__c, Contact_Email__c, CreatedDate
    FROM Shadikhana_Booking__c
    ORDER BY CreatedDate DESC
    LIMIT 5
];
for (Shadikhana_Booking__c b : recent) {
    System.debug('RECENT=' + b.Name + ' | ' + b.Event_Name__c + ' | ' + b.Status__c + ' | ' + b.Contact_Email__c);
}
