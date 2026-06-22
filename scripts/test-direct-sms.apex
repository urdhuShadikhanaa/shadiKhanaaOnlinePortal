Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
System.debug('Settings SID=' + settings.Twilio_Account_SID__c + ' From=' + settings.Twilio_From_Number__c);

ShadikhanaBookingSmsService.sendSmsMessage(
    '6364054881',
    'Urdu Shadikhana: Twilio admin test SMS is working.',
    settings
);
ShadikhanaBookingSmsService.sendSmsMessage(
    '9849939703',
    'Urdu Shadikhana: Your booking confirmation SMS test is working.',
    settings
);
System.debug('Direct SMS test callouts completed');
