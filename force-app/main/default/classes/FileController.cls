/**
* @File Name : FileController.cls
* @Description :
* @Author :
* @Last Modified By :
* @Last Modified On : September 22, 2025
* @Modification Log :
*==============================================================================
* Ver | Date | Author | Modification
*==============================================================================
* 1.0 | September 22, 2025 |   | Initial Version
**/

public with sharing class FileController {
   @AuraEnabled
    public static Map<ID, String> uploadFile(String base64Data, String fileName, String recordId) {
        try {
            // Convert base64 string to Blob
            Blob fileBlob = EncodingUtil.base64Decode(base64Data.split(',')[1]);

            ContentVersion cv = new ContentVersion();
            cv.Title = fileName;
            cv.PathOnClient = fileName;
            cv.VersionData = fileBlob;
           // cv.FirstPublishLocationId = recordId; // Attach to a record (optional)
            insert cv;
            
             cv = [SELECT Id, ContentDocumentId FROM ContentVersion WHERE Id = :cv.Id LIMIT 1];
            
            System.debug('ContentDocumentId: ' + cv.ContentDocumentId);
            System.debug('ContentVersionId: ' + cv.Id);
              List<ContentVersion> docs = [SELECT ContentDocumentId, FileExtension, Title 
                FROM ContentVersion WHERE ContentDocumentId =: cv.ContentDocumentId];
            Map<ID, String> mapIdTitle = new Map<ID, String>();
            for (ContentVersion docLink : docs) {
                mapIdTitle.put(docLink.ContentDocumentId, docLink.Title);
            }
           return mapIdTitle;
        } catch (Exception e) {
            throw new AuraHandledException('Error uploading file: ' + e.getMessage());
        }
    }
}