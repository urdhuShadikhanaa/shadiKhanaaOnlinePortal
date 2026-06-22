Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
if (settings == null || settings.Id == null) {
    settings = new Shadikhana_Settings__c();
    settings.SetupOwnerId = UserInfo.getOrganizationId();
}

System.debug('BEFORE exterior=' + settings.Portal_Gallery_Exterior_Id__c);
System.debug('BEFORE interior=' + settings.Portal_Gallery_Interior_Id__c);
System.debug('BEFORE dining=' + settings.Portal_Gallery_Dining_Id__c);

settings.Portal_Gallery_Exterior_Id__c = null;
settings.Portal_Gallery_Interior_Id__c = null;
settings.Portal_Gallery_Dining_Id__c = null;
upsert settings;

ShadikhanaPortalBrandingService.PortalBrandingConfig config =
    ShadikhanaPortalBrandingService.getPortalBrandingConfig();

for (ShadikhanaPortalBrandingService.GalleryImageConfig image : config.galleryImages) {
    System.debug(
        'RESET ' +
            image.resourceName +
            ' customUrl=' +
            image.imageUrl +
            ' label=' +
            image.label
    );
}

System.debug('GALLERY_RESET=SUCCESS');
