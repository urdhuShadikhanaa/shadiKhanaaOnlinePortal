// Query queued SMS after booking flow (run after test scripts + ~15s wait).
List<Sms_Outbound__c> recent = [
    SELECT Id, To_Number__c, Status__c, CreatedDate
    FROM Sms_Outbound__c
    WHERE CreatedDate >= :Datetime.now().addHours(-1)
    ORDER BY CreatedDate DESC
    LIMIT 20
];
System.debug('=== RECENT SMS OUTBOUND (last hour) count=' + recent.size() + ' ===');
for (Sms_Outbound__c sms : recent) {
    System.debug(sms.Status__c + ' | ' + sms.To_Number__c + ' | ' + sms.CreatedDate);
}
