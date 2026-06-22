// Debug what the gateway REST API returns for pending SMS.
List<ShadikhanaSmsGatewayService.SmsOutboundMessage> msgs =
    ShadikhanaSmsGatewayService.getPendingMessages();
System.debug('Pending message count: ' + msgs.size());
for (ShadikhanaSmsGatewayService.SmsOutboundMessage m : msgs) {
    Integer bodyLen = m.body == null ? 0 : m.body.length();
    System.debug('id=' + m.id + ' to=' + m.toNumber + ' bodyLen=' + bodyLen);
}
System.debug(
  'JSON=' +
  JSON.serialize(new ShadikhanaSmsGatewayService.PendingResponse(msgs))
);
