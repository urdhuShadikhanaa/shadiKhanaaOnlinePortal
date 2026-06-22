// Fix portal login hints for the current org (run once after site creation).
Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
if (settings == null || settings.Id == null) {
    settings = new Shadikhana_Settings__c();
    settings.SetupOwnerId = UserInfo.getOrganizationId();
}

User adminUser = [
    SELECT Username
    FROM User
    WHERE Id = :UserInfo.getUserId()
    LIMIT 1
];

List<Network> networks = [
    SELECT UrlPathPrefix
    FROM Network
    WHERE UrlPathPrefix != null
    ORDER BY CreatedDate DESC
    LIMIT 1
];

settings.Portal_Admin_Username__c = adminUser.Username;
settings.Portal_Admin_Password__c = null;
settings.Portal_Login_Notes__c =
    'Sign in with the administrator username below and your Salesforce org password (the same password you use for Setup).';

if (!networks.isEmpty() && String.isNotBlank(networks[0].UrlPathPrefix)) {
    String orgHost = URL.getOrgDomainUrl().getHost().replace('.my.salesforce.com', '.my.site.com');
    String siteBase = 'https://' + orgHost + '/' + networks[0].UrlPathPrefix;
    settings.Portal_Site_URL__c = siteBase;
    settings.Portal_Login_URL__c = siteBase + '/login';
}

upsert settings;
System.debug('PORTAL_LOGIN_FIXED_USERNAME=' + settings.Portal_Admin_Username__c);
System.debug('PORTAL_LOGIN_FIXED_SITE_URL=' + settings.Portal_Site_URL__c);
