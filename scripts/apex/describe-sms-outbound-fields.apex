for (String f : Schema.SObjectType.Sms_Outbound__c.fields.getMap().keySet()) {
    System.debug('FIELD=' + f);
}
