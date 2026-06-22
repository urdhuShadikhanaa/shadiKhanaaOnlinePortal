// Ensure the running admin user can access the Urdu Shadikhana Experience site.
Id userId = UserInfo.getUserId();
Network network = [
    SELECT Id, Name
    FROM Network
    WHERE UrlPathPrefix = 'urdushadikhana'
    LIMIT 1
];

List<NetworkMember> existing = [
    SELECT Id
    FROM NetworkMember
    WHERE NetworkId = :network.Id AND MemberId = :userId
    LIMIT 1
];

if (existing.isEmpty()) {
    insert new NetworkMember(NetworkId = network.Id, MemberId = userId);
    System.debug('NETWORK_MEMBER_CREATED=true');
} else {
    System.debug('NETWORK_MEMBER_EXISTS=true');
}

System.debug('NETWORK_ACCESS_NETWORK=' + network.Name);
