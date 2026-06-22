@RestResource(urlMapping='/shadikhana/sms/v1/*')
global without sharing class ShadikhanaSmsGatewayRest {

    @HttpGet
    global static void getPending() {
        try {
            ShadikhanaSmsGatewayService.assertApiKey(readApiKey());
            ShadikhanaSmsGatewayService.PendingResponse payload =
                new ShadikhanaSmsGatewayService.PendingResponse(
                    ShadikhanaSmsGatewayService.getPendingMessages()
                );
            writeJson(200, payload);
        } catch (Exception error) {
            writeError(error);
        }
    }

    @HttpPost
    global static void acknowledge() {
        try {
            ShadikhanaSmsGatewayService.assertApiKey(readApiKey());
            ShadikhanaSmsGatewayService.AckRequest request =
                (ShadikhanaSmsGatewayService.AckRequest) JSON.deserialize(
                    RestContext.request.requestBody.toString(),
                    ShadikhanaSmsGatewayService.AckRequest.class
                );
            ShadikhanaSmsGatewayService.acknowledgeMessage(
                (Id) request.id,
                request.status,
                request.errorMessage
            );
            writeJson(200, new Map<String, Object>{ 'success' => true });
        } catch (Exception error) {
            writeError(error);
        }
    }

    private static String readApiKey() {
        if (RestContext.request == null || RestContext.request.headers == null) {
            return null;
        }
        Map<String, String> headers = RestContext.request.headers;
        for (String key : headers.keySet()) {
            if (key != null && key.equalsIgnoreCase('X-Api-Key')) {
                return headers.get(key);
            }
        }
        return null;
    }

    private static void writeJson(Integer statusCode, Object payload) {
        RestContext.response.statusCode = statusCode;
        RestContext.response.addHeader('Content-Type', 'application/json');
        RestContext.response.responseBody = Blob.valueOf(JSON.serialize(payload));
    }

    private static void writeError(Exception error) {
        String message = error.getMessage();
        Integer statusCode = resolveStatusCode(error, message);
        RestContext.response.statusCode = statusCode;
        RestContext.response.addHeader('Content-Type', 'application/json');
        RestContext.response.responseBody = Blob.valueOf(
            JSON.serialize(new Map<String, Object>{ 'error' => message })
        );
    }

    private static Integer resolveStatusCode(Exception error, String message) {
        if (!(error instanceof ShadikhanaSmsGatewayException)) {
            return 500;
        }
        if (message != null && (
            message.contains('Invalid SMS Gateway API key') ||
            message.contains('not configured')
        )) {
            return 401;
        }
        return 400;
    }
}
