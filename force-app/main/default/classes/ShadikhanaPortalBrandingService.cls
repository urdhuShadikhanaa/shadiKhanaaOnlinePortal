public without sharing class ShadikhanaPortalBrandingService {

    public static final String BRANDING_SECRET_KEY = '@AdminSpen@202456';

    private static final Map<String, String> GALLERY_SLOT_TO_FIELD = new Map<String, String>{
        'ShadikhanaHallExterior' => 'Portal_Gallery_Exterior_Id__c',
        'ShadikhanaHallInterior' => 'Portal_Gallery_Interior_Id__c',
        'ShadikhanaDiningArea' => 'Portal_Gallery_Dining_Id__c'
    };

    public class AddressLineConfig {
        @AuraEnabled public String id;
        @AuraEnabled public String label;
        @AuraEnabled public String value;
    }

    public class GalleryImageConfig {
        @AuraEnabled public String id;
        @AuraEnabled public String resourceName;
        @AuraEnabled public String label;
        @AuraEnabled public String caption;
        @AuraEnabled public String imageUrl;
        @AuraEnabled public String cacheKey;
    }

    private static final Integer DEFAULT_SEATING_CAPACITY = 500;
    private static final Integer DEFAULT_COMFORTABLE_GUESTS = 350;

    public class PortalBrandingConfig {
        @AuraEnabled public String venueName;
        @AuraEnabled public String footerPhone;
        @AuraEnabled public String footerAdditionalPhone;
        @AuraEnabled public String footerEmail;
        @AuraEnabled public String headerAddressLine;
        @AuraEnabled public String fullAddress;
        @AuraEnabled public Integer seatingCapacity;
        @AuraEnabled public Integer comfortableGuests;
        @AuraEnabled public List<AddressLineConfig> addressLines;
        @AuraEnabled public List<GalleryImageConfig> galleryImages;
    }

    public class BrandingSaveRequest {
        @AuraEnabled public String venueName;
        @AuraEnabled public String footerPhone;
        @AuraEnabled public String footerAdditionalPhone;
        @AuraEnabled public String footerEmail;
        @AuraEnabled public String headerAddressLine;
        @AuraEnabled public String fullAddress;
        @AuraEnabled public Integer seatingCapacity;
        @AuraEnabled public Integer comfortableGuests;
    }

    public static void assertBrandingSecret(String secretKey) {
        if (String.isBlank(secretKey) || secretKey.trim() != BRANDING_SECRET_KEY) {
            throw new AuraHandledException('Invalid branding secret key.');
        }
    }

    public static PortalBrandingConfig getPortalBrandingConfig() {
        Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
        PortalBrandingConfig config = defaultConfig();
        if (settings == null) {
            return config;
        }

        if (String.isNotBlank(settings.Portal_Venue_Name__c)) {
            config.venueName = settings.Portal_Venue_Name__c.trim();
        }
        if (String.isNotBlank(settings.Portal_Header_Address__c)) {
            config.headerAddressLine = settings.Portal_Header_Address__c.trim();
            config.fullAddress = config.headerAddressLine;
        } else if (String.isNotBlank(settings.Portal_Full_Address__c)) {
            config.fullAddress = settings.Portal_Full_Address__c.trim();
        }
        if (String.isNotBlank(settings.Admin_Mobile_Number__c)) {
            config.footerPhone = settings.Admin_Mobile_Number__c.trim();
        }
        if (String.isNotBlank(settings.Footer_Additional_Phone__c)) {
            config.footerAdditionalPhone = settings.Footer_Additional_Phone__c.trim();
        }
        if (String.isNotBlank(settings.Admin_Email__c)) {
            config.footerEmail = settings.Admin_Email__c.trim();
        }

        applySettingsFallbacks(config, settings);
        config.seatingCapacity = resolveSeatingCapacity(settings);
        config.comfortableGuests = resolveComfortableGuests(settings);
        if (String.isNotBlank(config.headerAddressLine)) {
            config.addressLines = buildAddressLinesFromHeader(config.headerAddressLine);
        } else if (String.isNotBlank(config.fullAddress)) {
            config.addressLines = buildAddressLinesFromHeader(config.fullAddress);
        }
        config.galleryImages = buildGalleryImages(settings);
        return config;
    }

    public static PortalBrandingConfig savePortalBrandingConfig(
        String secretKey,
        BrandingSaveRequest request
    ) {
        assertBrandingSecret(secretKey);

        Shadikhana_Settings__c settings = loadOrCreateSettings();
        PortalBrandingConfig existing = getPortalBrandingConfig();

        String venueName = resolveTextValue(
            request != null ? request.venueName : null,
            settings.Portal_Venue_Name__c,
            existing.venueName
        );
        String headerAddressLine = resolveTextValue(
            request != null ? request.headerAddressLine : null,
            settings.Portal_Header_Address__c,
            existing.headerAddressLine
        );
        String fullAddress = resolveTextValue(
            request != null ? request.fullAddress : null,
            settings.Portal_Full_Address__c,
            existing.fullAddress
        );
        String footerPhone = resolveTextValue(
            request != null ? request.footerPhone : null,
            settings.Admin_Mobile_Number__c,
            existing.footerPhone
        );
        String footerAdditionalPhone = resolveTextValue(
            request != null ? request.footerAdditionalPhone : null,
            settings.Footer_Additional_Phone__c,
            existing.footerAdditionalPhone
        );
        String footerEmail = resolveTextValue(
            request != null ? request.footerEmail : null,
            settings.Admin_Email__c,
            existing.footerEmail
        );

        if (String.isNotBlank(headerAddressLine)) {
            fullAddress = headerAddressLine;
        }

        Integer seatingCapacity = resolveIntegerValue(
            request != null ? request.seatingCapacity : null,
            settings.Hall_Seating_Capacity__c,
            existing.seatingCapacity
        );
        Integer comfortableGuests = resolveIntegerValue(
            request != null ? request.comfortableGuests : null,
            settings.Hall_Comfortable_Guests__c,
            existing.comfortableGuests
        );

        settings.Portal_Venue_Name__c = venueName;
        settings.Portal_Header_Address__c = headerAddressLine;
        settings.Portal_Full_Address__c = fullAddress;
        settings.Admin_Mobile_Number__c = footerPhone;
        settings.Footer_Additional_Phone__c = footerAdditionalPhone;
        settings.Admin_Email__c = footerEmail;
        settings.Hall_Seating_Capacity__c = seatingCapacity;
        settings.Hall_Comfortable_Guests__c = comfortableGuests;
        upsert settings;

        return getPortalBrandingConfig();
    }

    @TestVisible
    private static List<AddressLineConfig> buildAddressLinesFromHeader(String headerAddressLine) {
        List<AddressLineConfig> lines = new List<AddressLineConfig>();
        if (String.isBlank(headerAddressLine)) {
            return defaultConfig().addressLines;
        }

        List<String> parts = new List<String>();
        for (String part : headerAddressLine.split(',')) {
            if (String.isNotBlank(part)) {
                parts.add(part.trim());
            }
        }

        if (parts.isEmpty()) {
            return defaultConfig().addressLines;
        }

        String doorValue = parts[0].replaceAll('(?i)^Door No:?\\s*', '').trim();
        if (String.isBlank(doorValue)) {
            doorValue = parts[0];
        }

        lines.add(buildAddressLine('door', 'Door No', doorValue));

        if (parts.size() > 1) {
            lines.add(buildAddressLine('village', 'Village', parts[1]));
        }
        if (parts.size() > 2) {
            lines.add(buildAddressLine('town', 'Town', parts[2]));
        }
        if (parts.size() > 3) {
            lines.add(buildAddressLine('district', 'District', parts[3]));
        }
        if (parts.size() > 4) {
            List<String> stateParts = new List<String>();
            for (Integer index = 4; index < parts.size(); index++) {
                stateParts.add(parts[index]);
            }
            lines.add(buildAddressLine('state', 'State', String.join(stateParts, ', ')));
        }

        return lines;
    }

    @TestVisible
    private static String resolveTextValue(String requestedValue, String storedValue, String fallbackValue) {
        if (String.isNotBlank(requestedValue)) {
            return requestedValue.trim();
        }
        if (String.isNotBlank(storedValue)) {
            return storedValue.trim();
        }
        return String.isBlank(fallbackValue) ? null : fallbackValue.trim();
    }

    @TestVisible
    private static Integer resolveIntegerValue(
        Integer requestedValue,
        Decimal storedValue,
        Integer fallbackValue
    ) {
        if (requestedValue != null && requestedValue > 0) {
            return requestedValue;
        }
        if (storedValue != null && storedValue > 0) {
            return Integer.valueOf(String.valueOf(storedValue));
        }
        return fallbackValue != null && fallbackValue > 0 ? fallbackValue : null;
    }

    @TestVisible
    private static Integer resolveSeatingCapacity(Shadikhana_Settings__c settings) {
        if (settings != null &&
            settings.Hall_Seating_Capacity__c != null &&
            settings.Hall_Seating_Capacity__c > 0) {
            return Integer.valueOf(String.valueOf(settings.Hall_Seating_Capacity__c));
        }
        return DEFAULT_SEATING_CAPACITY;
    }

    @TestVisible
    private static Integer resolveComfortableGuests(Shadikhana_Settings__c settings) {
        if (settings != null &&
            settings.Hall_Comfortable_Guests__c != null &&
            settings.Hall_Comfortable_Guests__c > 0) {
            return Integer.valueOf(String.valueOf(settings.Hall_Comfortable_Guests__c));
        }
        return DEFAULT_COMFORTABLE_GUESTS;
    }

    public static GalleryImageConfig uploadPortalGalleryImage(
        String secretKey,
        String resourceName,
        String base64Data,
        String contentType
    ) {
        assertBrandingSecret(secretKey);

        if (String.isBlank(resourceName) || !GALLERY_SLOT_TO_FIELD.containsKey(resourceName)) {
            throw new AuraHandledException('Invalid gallery image slot.');
        }
        if (String.isBlank(base64Data)) {
            throw new AuraHandledException('Image file data is required.');
        }

        Blob imageBody;
        try {
            imageBody = EncodingUtil.base64Decode(base64Data);
        } catch (Exception ex) {
            throw new AuraHandledException('Unable to read uploaded image.');
        }

        if (imageBody == null || imageBody.size() == 0) {
            throw new AuraHandledException('Uploaded image is empty.');
        }
        if (imageBody.size() > 5242880) {
            throw new AuraHandledException('Image must be 5 MB or smaller.');
        }

        ContentVersion version = new ContentVersion();
        version.Title = resourceName + '-' + String.valueOf(Datetime.now().getTime());
        version.PathOnClient = resourceName + resolveFileExtension(contentType);
        version.VersionData = imageBody;
        version.IsMajorVersion = true;
        insert version;

        ContentVersion savedVersion = [
            SELECT ContentDocumentId
            FROM ContentVersion
            WHERE Id = :version.Id
            LIMIT 1
        ];

        Shadikhana_Settings__c settings = loadOrCreateSettings();
        settings.put(GALLERY_SLOT_TO_FIELD.get(resourceName), savedVersion.ContentDocumentId);
        upsert settings;

        GalleryImageConfig imageConfig = new GalleryImageConfig();
        imageConfig.resourceName = resourceName;
        imageConfig.imageUrl = buildContentDocumentUrl(savedVersion.ContentDocumentId);
        imageConfig.cacheKey = String.valueOf(Datetime.now().getTime());
        return imageConfig;
    }

    @TestVisible
    private static Shadikhana_Settings__c loadOrCreateSettings() {
        Shadikhana_Settings__c settings = Shadikhana_Settings__c.getOrgDefaults();
        if (settings == null || settings.Id == null) {
            settings = new Shadikhana_Settings__c();
            settings.SetupOwnerId = UserInfo.getOrganizationId();
        }
        return settings;
    }

    @TestVisible
    private static void applySettingsFallbacks(
        PortalBrandingConfig config,
        Shadikhana_Settings__c settings
    ) {
        if (config == null) {
            return;
        }

        if (String.isBlank(config.footerPhone)) {
            config.footerPhone = settings != null && String.isNotBlank(settings.Admin_Mobile_Number__c)
                ? settings.Admin_Mobile_Number__c.trim()
                : '6364054881';
        }
        if (String.isBlank(config.footerAdditionalPhone)) {
            config.footerAdditionalPhone = settings != null &&
                String.isNotBlank(settings.Footer_Additional_Phone__c)
                ? settings.Footer_Additional_Phone__c.trim()
                : '9652741400';
        }
        if (String.isBlank(config.footerEmail)) {
            config.footerEmail = settings != null && String.isNotBlank(settings.Admin_Email__c)
                ? settings.Admin_Email__c.trim()
                : 'urdhushadikhanaa@gmail.com';
        }
    }

    @TestVisible
    private static List<GalleryImageConfig> buildGalleryImages(Shadikhana_Settings__c settings) {
        List<GalleryImageConfig> images = defaultConfig().galleryImages;
        if (settings == null) {
            return images;
        }

        Map<String, String> contentDocumentIds = new Map<String, String>{
            'ShadikhanaHallExterior' => settings.Portal_Gallery_Exterior_Id__c,
            'ShadikhanaHallInterior' => settings.Portal_Gallery_Interior_Id__c,
            'ShadikhanaDiningArea' => settings.Portal_Gallery_Dining_Id__c
        };

        for (GalleryImageConfig image : images) {
            String contentDocumentId = contentDocumentIds.get(image.resourceName);
            if (String.isNotBlank(contentDocumentId)) {
                image.imageUrl = buildContentDocumentUrl(contentDocumentId);
                image.cacheKey = contentDocumentId;
            }
        }
        return images;
    }

    @TestVisible
    private static String buildContentDocumentUrl(String contentDocumentId) {
        if (String.isBlank(contentDocumentId)) {
            return null;
        }
        return '/sfsites/c/sfc/servlet.shepherd/document/download/' + contentDocumentId;
    }

    @TestVisible
    private static String resolveFileExtension(String contentType) {
        if (String.isBlank(contentType)) {
            return '.jpg';
        }
        if (contentType.contains('png')) {
            return '.png';
        }
        if (contentType.contains('webp')) {
            return '.webp';
        }
        return '.jpg';
    }

    @TestVisible
    private static PortalBrandingConfig defaultConfig() {
        PortalBrandingConfig config = new PortalBrandingConfig();
        config.venueName = 'Urdu Shadikhana';
        config.footerPhone = '6364054881';
        config.footerAdditionalPhone = '9652741400';
        config.footerEmail = 'urdhushadikhanaa@gmail.com';
        config.headerAddressLine =
            'Door No 3/276, Aravapalli, Nandalur, YSR Kadapa, Andhra Pradesh, India';
        config.fullAddress = 'Door No: 3/276, Aravapalli, Nandalur, Andhra Pradesh, India';
        config.seatingCapacity = DEFAULT_SEATING_CAPACITY;
        config.comfortableGuests = DEFAULT_COMFORTABLE_GUESTS;

        config.addressLines = new List<AddressLineConfig>();
        config.addressLines.add(buildAddressLine('door', 'Door No', '3/276'));
        config.addressLines.add(buildAddressLine('village', 'Village', 'Aravapalli'));
        config.addressLines.add(buildAddressLine('town', 'Town', 'Nandalur'));
        config.addressLines.add(buildAddressLine('district', 'District', 'YSR Kadapa'));
        config.addressLines.add(buildAddressLine('state', 'State', 'Andhra Pradesh, India'));

        config.galleryImages = new List<GalleryImageConfig>();
        config.galleryImages.add(buildGalleryImage(
            'exterior',
            'ShadikhanaHallExterior',
            'Shadikhana Exterior',
            'Front view of Urdu Shadikhana'
        ));
        config.galleryImages.add(buildGalleryImage(
            'interior',
            'ShadikhanaHallInterior',
            'Main Hall',
            'Spacious main hall for ceremonies and gatherings'
        ));
        config.galleryImages.add(buildGalleryImage(
            'dining',
            'ShadikhanaDiningArea',
            'Dining Area',
            'Dining and event seating arrangement'
        ));
        return config;
    }

    private static AddressLineConfig buildAddressLine(String idValue, String label, String value) {
        AddressLineConfig line = new AddressLineConfig();
        line.id = idValue;
        line.label = label;
        line.value = value;
        return line;
    }

    private static GalleryImageConfig buildGalleryImage(
        String idValue,
        String resourceName,
        String label,
        String caption
    ) {
        GalleryImageConfig image = new GalleryImageConfig();
        image.id = idValue;
        image.resourceName = resourceName;
        image.label = label;
        image.caption = caption;
        image.cacheKey = 'default';
        return image;
    }
}
