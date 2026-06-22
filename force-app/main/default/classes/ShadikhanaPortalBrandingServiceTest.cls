@IsTest
private class ShadikhanaPortalBrandingServiceTest {

    @IsTest
    static void testGetDefaultBrandingConfig() {
        ShadikhanaPortalBrandingService.PortalBrandingConfig config =
            ShadikhanaPortalBrandingService.getPortalBrandingConfig();
        System.assertEquals('Urdu Shadikhana', config.venueName);
        System.assertEquals(3, config.galleryImages.size());
        System.assertEquals(500, config.seatingCapacity);
        System.assertEquals(350, config.comfortableGuests);
    }

    @IsTest
    static void testSaveBrandingConfigRequiresSecret() {
        Boolean caught = false;
        try {
            ShadikhanaPortalBrandingService.savePortalBrandingConfig(
                'wrong-key',
                new ShadikhanaPortalBrandingService.BrandingSaveRequest()
            );
        } catch (AuraHandledException ex) {
            caught = true;
        }
        System.assertEquals(true, caught);
    }

    @IsTest
    static void testSaveBrandingConfigWithSecret() {
        ShadikhanaPortalBrandingService.BrandingSaveRequest request =
            new ShadikhanaPortalBrandingService.BrandingSaveRequest();
        request.venueName = 'Test Venue';
        request.footerPhone = '9999999999';
        request.footerAdditionalPhone = '8888888888';
        request.footerEmail = 'test@example.com';
        request.headerAddressLine = 'Test Address';
        request.fullAddress = 'Test Full Address';
        request.seatingCapacity = 600;
        request.comfortableGuests = 400;

        ShadikhanaPortalBrandingService.PortalBrandingConfig saved =
            ShadikhanaPortalBrandingService.savePortalBrandingConfig(
                ShadikhanaPortalBrandingService.BRANDING_SECRET_KEY,
                request
            );
        System.assertEquals('Test Venue', saved.venueName);
        System.assertEquals('9999999999', saved.footerPhone);
        System.assertEquals(600, saved.seatingCapacity);
        System.assertEquals(400, saved.comfortableGuests);
    }

    @IsTest
    static void testSaveBrandingKeepsExistingValuesWhenFieldsBlank() {
        ShadikhanaPortalBrandingService.BrandingSaveRequest initialRequest =
            new ShadikhanaPortalBrandingService.BrandingSaveRequest();
        initialRequest.venueName = 'Saved Venue';
        initialRequest.footerPhone = '9999999999';
        ShadikhanaPortalBrandingService.savePortalBrandingConfig(
            ShadikhanaPortalBrandingService.BRANDING_SECRET_KEY,
            initialRequest
        );

        ShadikhanaPortalBrandingService.BrandingSaveRequest partialRequest =
            new ShadikhanaPortalBrandingService.BrandingSaveRequest();
        partialRequest.headerAddressLine = 'Updated Address Only';

        ShadikhanaPortalBrandingService.PortalBrandingConfig saved =
            ShadikhanaPortalBrandingService.savePortalBrandingConfig(
                ShadikhanaPortalBrandingService.BRANDING_SECRET_KEY,
                partialRequest
            );

        System.assertEquals('Saved Venue', saved.venueName);
        System.assertEquals('9999999999', saved.footerPhone);
        System.assertEquals('Updated Address Only', saved.headerAddressLine);
        System.assertEquals('Updated Address Only', saved.fullAddress);
    }

    @IsTest
    static void testBuildAddressLinesFromHeader() {
        List<ShadikhanaPortalBrandingService.AddressLineConfig> lines =
            ShadikhanaPortalBrandingService.buildAddressLinesFromHeader(
                'Door No 3/279, Aravapalli, Nandalur, YSR Kadapa, Andhra Pradesh, India'
            );

        System.assertEquals(5, lines.size());
        System.assertEquals('3/279', lines[0].value);
        System.assertEquals('Aravapalli', lines[1].value);
        System.assertEquals('Nandalur', lines[2].value);
        System.assertEquals('YSR Kadapa', lines[3].value);
        System.assertEquals('Andhra Pradesh, India', lines[4].value);
    }

    @IsTest
    static void testGetBrandingUsesHeaderAddressForVenueDisplay() {
        Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
        if (settings == null || settings.Id == null) {
            settings = new Shadikhana_Settings__c();
            settings.SetupOwnerId = UserInfo.getOrganizationId();
        }
        settings.Portal_Header_Address__c = 'Door No 3/279, Aravapalli, Nandalur, YSR Kadapa, Andhra Pradesh, India';
        settings.Portal_Full_Address__c = 'Old full address should be ignored';
        upsert settings;

        ShadikhanaPortalBrandingService.PortalBrandingConfig config =
            ShadikhanaPortalBrandingService.getPortalBrandingConfig();

        System.assertEquals('Door No 3/279, Aravapalli, Nandalur, YSR Kadapa, Andhra Pradesh, India', config.headerAddressLine);
        System.assertEquals('Door No 3/279, Aravapalli, Nandalur, YSR Kadapa, Andhra Pradesh, India', config.fullAddress);
        System.assertEquals(5, config.addressLines.size());
        System.assertEquals('3/279', config.addressLines[0].value);
        System.assertEquals('Aravapalli', config.addressLines[1].value);
        System.assertEquals('Nandalur', config.addressLines[2].value);
        System.assertEquals('YSR Kadapa', config.addressLines[3].value);
        System.assertEquals('Andhra Pradesh, India', config.addressLines[4].value);
    }

    @IsTest
    static void testUploadGalleryImageWithSecret() {
        String tinyPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

        ShadikhanaPortalBrandingService.GalleryImageConfig uploaded =
            ShadikhanaPortalBrandingService.uploadPortalGalleryImage(
                ShadikhanaPortalBrandingService.BRANDING_SECRET_KEY,
                'ShadikhanaHallExterior',
                tinyPngBase64,
                'image/png'
            );

        System.assertNotEquals(null, uploaded.imageUrl);
        System.assertNotEquals(null, uploaded.cacheKey);

        ShadikhanaPortalBrandingService.PortalBrandingConfig config =
            ShadikhanaPortalBrandingService.getPortalBrandingConfig();
        System.assertNotEquals(null, config.galleryImages[0].imageUrl);
    }

    @IsTest
    static void testUploadGalleryImageRejectsInvalidSecret() {
        Boolean caught = false;
        try {
            ShadikhanaPortalBrandingService.uploadPortalGalleryImage(
                'bad-key',
                'ShadikhanaHallExterior',
                'abc',
                'image/png'
            );
        } catch (AuraHandledException ex) {
            caught = true;
        }
        System.assertEquals(true, caught);
    }
}
