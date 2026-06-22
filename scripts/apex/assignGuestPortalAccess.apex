PermissionSet guestPermSet = [
    SELECT Id
    FROM PermissionSet
    WHERE Name = 'Shadikhana_Guest_Portal'
    LIMIT 1
];

List<User> guestUsers = [
    SELECT Id, Username
    FROM User
    WHERE UserType = 'Guest'
      AND IsActive = true
      AND Username LIKE '%urdushadikhana%'
];

if (guestUsers.isEmpty()) {
    guestUsers = [
        SELECT Id, Username
        FROM User
        WHERE UserType = 'Guest'
          AND IsActive = true
        LIMIT 5
    ];
}

Set<Id> guestUserIds = new Map<Id, User>(guestUsers).keySet();
Set<Id> alreadyAssigned = new Set<Id>();

for (PermissionSetAssignment assignment : [
    SELECT AssigneeId
    FROM PermissionSetAssignment
    WHERE PermissionSetId = :guestPermSet.Id
      AND AssigneeId IN :guestUserIds
]) {
    alreadyAssigned.add(assignment.AssigneeId);
}

List<PermissionSetAssignment> assignments = new List<PermissionSetAssignment>();
for (User guestUser : guestUsers) {
    if (!alreadyAssigned.contains(guestUser.Id)) {
        assignments.add(
            new PermissionSetAssignment(
                AssigneeId = guestUser.Id,
                PermissionSetId = guestPermSet.Id
            )
        );
    }
}

if (!assignments.isEmpty()) {
    insert assignments;
}

System.debug('Assigned guest permission set to ' + assignments.size() + ' guest user(s).');
