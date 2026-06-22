Id networkId = '0DBfj000002fP1JGAU';
Id userId = UserInfo.getUserId();
List<NetworkMember> existing = [
    SELECT Id
    FROM NetworkMember
    WHERE NetworkId = :networkId AND MemberId = :userId
    LIMIT 1
];
if (existing.isEmpty()) {
    insert new NetworkMember(NetworkId = networkId, MemberId = userId);
    System.debug('NETWORK_MEMBER_CREATED');
} else {
    System.debug('NETWORK_MEMBER_EXISTS');
}
