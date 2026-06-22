/* eslint-disable no-console */
/* eslint-disable vars-on-top */
import getTasksForOpportunity from '@salesforce/apex/OpportunityController.getTasksForOpportunity';
import getEventsForOpportunity from '@salesforce/apex/OpportunityController.getEventsForOpportunity';

export default class pqOpportunityEngagementUtils {
    _opportunityId;
    _taskRawData;
    _userMin;
    _userMax;
    _activityMin;
    _activityMax;
    _contactMin;
    _contactMax;
    _matrixMin;
    _matrixMax;
    _matrixPairingsMap;
    _trimLengthSubject = 16;
    _trimLengthUserName = 15;

    constructor(OpportunityId) {
        this._opportunityId = OpportunityId;
    }

    async loadData() {
        let viewModel;

        this.resetVars();

        await Promise.all([
            getTasksForOpportunity({ opptyOrOpptyPlanId: this._opportunityId }),
            getEventsForOpportunity({ opptyOrOpptyPlanId: this._opportunityId })
        ]).then(([resultTasksData, resultEventData]) => {
            let vm = { users: [], activities: [], contacts: [], matrix: [] };

            vm = this.processTaskData(vm, resultTasksData);
            vm = this.processEventData(vm, resultEventData);
            vm = this.distill(vm);
            vm = this.buildMatrix(vm);
            vm = this.sortScores(vm);
            vm = this.injectGradedStyles(vm);

            viewModel = vm;
        });

        return viewModel;
    }

    stringCompare(a, b) {
        if (a > b) {
            return 1;
        }
        if (a < b) {
            return -1;
        }
        return 0;
    }

    resetVars() {
        this._userMin = -1;
        this._userMax = -1;
        this._activityMin = -1;
        this._activityMax = -1;
        this._contactMin = -1;
        this._contactMax = -1;
        this._matrixMin = -1;
        this._matrixMax = -1;
        this._matrixPairingsMap = new Map();
    }

    processTaskData(vm, data) {
        data.forEach((t) => {
            var matrixKey = 'm-' + t.whoId + '_' + t.ownerId;
            switch (t.taskSubType) {
                case 'Call':
                    vm.users.push({
                        key: 'u-' + t.id,
                        rollup: t.ownerId,
                        text: t.assignedTo,
                        textTrimmed:
                            t.assignedTo.length > this._trimLengthUserName
                                ? t.assignedTo.substring(0, this._trimLengthUserName) + '...'
                                : t.assignedTo,
                        score: 1,
                        details: [t.assignedTo + ' -> Call -> ' + t.whoName],
                        detailTokens: [
                            {
                                t1: t.assignedTo,
                                id1: t.ownerId,
                                t2: 'Call',
                                id2: t.id,
                                t3: t.whoName,
                                id3: t.whoId
                            }
                        ]
                    });
                    vm.activities.push({
                        key: 'a-' + t.id,
                        rollup: t.taskSubType,
                        text: t.subject,
                        score: 1,
                        details: [t.assignedTo + ' -> Call -> ' + t.whoName],
                        detailTokens: [
                            {
                                t1: t.assignedTo,
                                id1: t.ownerId,
                                t2: 'Call',
                                id2: t.id,
                                t3: t.whoName,
                                id3: t.whoId
                            }
                        ]
                    });
                    vm.contacts.push({
                        key: 'c-' + t.id,
                        rollup: t.whoId,
                        contact: t.whoId,
                        text: t.whoName,
                        score: 1,
                        details: [t.assignedTo + ' -> Call -> ' + t.whoName],
                        detailTokens: [
                            {
                                t1: t.assignedTo,
                                id1: t.ownerId,
                                t2: 'Call',
                                id2: t.id,
                                t3: t.whoName,
                                id3: t.whoId
                            }
                        ]
                    });

                    if (this._matrixPairingsMap.has(matrixKey)) {
                        var matrixCallItem = this._matrixPairingsMap.get(matrixKey);
                        matrixCallItem.score++;
                        matrixCallItem.details.push(t.assignedTo + ' -> Call -> ' + t.whoName);
                        matrixCallItem.detailTokens.push({
                            t1: t.assignedTo,
                            id1: t.ownerId,
                            t2: 'Call',
                            id2: t.id,
                            t3: t.whoName,
                            id3: t.whoId
                        });
                        this.setMatrixMinMax(matrixCallItem.score);
                    } else {
                        this._matrixPairingsMap.set(matrixKey, {
                            key: matrixKey,
                            score: 1,
                            contact: t.whoName,
                            user: t.assignedTo,
                            details: [t.assignedTo + ' -> Call -> ' + t.whoName],
                            detailTokens: [
                                {
                                    t1: t.assignedTo,
                                    id1: t.ownerId,
                                    t2: 'Call',
                                    id2: t.id,
                                    t3: t.whoName,
                                    id3: t.whoId
                                }
                            ]
                        });
                        this.setMatrixMinMax(1);
                    }
                    break;

                case 'Email':
                    vm.users.push({
                        key: 'u-' + t.id,
                        rollup: t.ownerId,
                        text: t.assignedTo,
                        textTrimmed:
                            t.assignedTo.length > this._trimLengthUserName
                                ? t.assignedTo.substring(0, this._trimLengthUserName) + '...'
                                : t.assignedTo,
                        score: 1,
                        details: [t.assignedTo + ' -> Email'],
                        detailTokens: [
                            {
                                t1: t.assignedTo,
                                id1: t.ownerId,
                                t2:
                                    t.subject > this._trimLengthSubject
                                        ? t.subject.substring(0, this._trimLengthSubject) + '...'
                                        : t.subject,
                                id2: t.id,
                                t3: null,
                                id3: null
                            }
                        ]
                    });
                    vm.activities.push({
                        key: 'a-' + t.id,
                        rollup: t.taskSubType,
                        text: t.subject,
                        score: 1,
                        details: [t.assignedTo + ' -> Email'],
                        detailTokens: [
                            {
                                t1: t.assignedTo,
                                id1: t.ownerId,
                                t2:
                                    t.subject > this._trimLengthSubject
                                        ? t.subject.substring(0, this._trimLengthSubject) + '...'
                                        : t.subject,
                                id2: t.id,
                                t3: null,
                                id3: null
                            }
                        ]
                    });
                    break;

                case 'Task':
                    vm.users.push({
                        key: 'u-' + t.id,
                        rollup: t.ownerId,
                        text: t.assignedTo,
                        textTrimmed:
                            t.assignedTo.length > this._trimLengthUserName
                                ? t.assignedTo.substring(0, this._trimLengthUserName) + '...'
                                : t.assignedTo,
                        score: 1,
                        details: [
                            t.assignedTo +
                                ' -> Task ' +
                                (t.subject !== undefined
                                    ? "'" + t.subject.substring(0, this._trimLengthSubject) + "' "
                                    : '') +
                                '-> ' +
                                t.whoName
                        ],
                        detailTokens: [
                            {
                                t1: t.assignedTo,
                                id1: t.ownerId,
                                t2:
                                    'Task' +
                                    (t.subject !== undefined
                                        ? " '" + t.subject.substring(0, this._trimLengthSubject) + "'"
                                        : ''),
                                id2: t.id,
                                t3: t.whoName,
                                id3: t.whoId
                            }
                        ]
                    });
                    vm.activities.push({
                        key: 'a-' + t.id,
                        rollup: t.taskSubType,
                        text: t.subject,
                        score: 1,
                        details: [
                            t.assignedTo +
                                ' -> Task ' +
                                (t.subject !== undefined
                                    ? "'" + t.subject.substring(0, this._trimLengthSubject) + "' "
                                    : '') +
                                '-> ' +
                                t.whoName
                        ],
                        detailTokens: [
                            {
                                t1: t.assignedTo,
                                id1: t.ownerId,
                                t2:
                                    'Task' +
                                    (t.subject !== undefined
                                        ? " '" + t.subject.substring(0, this._trimLengthSubject) + "'"
                                        : ''),
                                id2: t.id,
                                t3: t.whoName,
                                id3: t.whoId
                            }
                        ]
                    });
                    vm.contacts.push({
                        key: 'c-' + t.id,
                        rollup: t.whoId,
                        text: t.whoName,
                        score: 1,
                        details: [
                            t.assignedTo +
                                ' -> Task ' +
                                (t.subject !== undefined
                                    ? "'" + t.subject.substring(0, this._trimLengthSubject) + "' "
                                    : '') +
                                '-> ' +
                                t.whoName
                        ],
                        detailTokens: [
                            {
                                t1: t.assignedTo,
                                id1: t.ownerId,
                                t2:
                                    'Task' +
                                    (t.subject !== undefined
                                        ? " '" + t.subject.substring(0, this._trimLengthSubject) + "'"
                                        : ''),
                                id2: t.id,
                                t3: t.whoName,
                                id3: t.whoId
                            }
                        ]
                    });

                    if (this._matrixPairingsMap.has(matrixKey)) {
                        var matrixTaskItem = this._matrixPairingsMap.get(matrixKey);
                        matrixTaskItem.score++;
                        matrixTaskItem.details.push(
                            t.assignedTo +
                                ' -> Task ' +
                                (t.subject !== undefined
                                    ? "'" + t.subject.substring(0, this._trimLengthSubject) + "' "
                                    : '') +
                                '-> ' +
                                t.whoName
                        );
                        matrixTaskItem.detailTokens.push({
                            t1: t.assignedTo,
                            id1: t.ownerId,
                            t2:
                                'Task' +
                                (t.subject !== undefined
                                    ? " '" + t.subject.substring(0, this._trimLengthSubject) + "'"
                                    : ''),
                            id2: t.id,
                            t3: t.whoName,
                            id3: t.whoId
                        });
                        this.setMatrixMinMax(matrixTaskItem.score);
                    } else {
                        this._matrixPairingsMap.set(matrixKey, {
                            key: matrixKey,
                            score: 1,
                            contact: t.whoName,
                            user: t.assignedTo,
                            details: [
                                t.assignedTo +
                                    ' -> Task ' +
                                    (t.subject !== undefined
                                        ? "'" + t.subject.substring(0, this._trimLengthSubject) + "' "
                                        : '') +
                                    '-> ' +
                                    t.whoName
                            ],
                            detailTokens: [
                                {
                                    t1: t.assignedTo,
                                    id1: t.ownerId,
                                    t2:
                                        'Task' +
                                        (t.subject !== undefined
                                            ? " '" + t.subject.substring(0, this._trimLengthSubject) + "'"
                                            : ''),
                                    id2: t.id,
                                    t3: t.whoName,
                                    id3: t.whoId
                                }
                            ]
                        });
                        this.setMatrixMinMax(1);
                    }
                    break;

                default:
                    break;
            }
        });

        return vm;
    }

    processEventData(vm, data) {
        data.forEach((t) => {
            var matrixKey = 'm-' + t.whoId + '_' + t.ownerId;
            vm.users.push({
                key: 'u-' + t.id,
                rollup: t.ownerId,
                text: t.ownerName,
                textTrimmed:
                    t.ownerName.length > this._trimLengthUserName
                        ? t.ownerName.substring(0, this._trimLengthUserName) + '...'
                        : t.ownerName,
                score: 1,
                details: [
                    t.ownerName +
                        ' -> Event ' +
                        (t.subject !== undefined ? "'" + t.subject.substring(0, this._trimLengthSubject) + "' " : '') +
                        '-> ' +
                        t.whoName
                ],
                detailTokens: [
                    {
                        t1: t.ownerName,
                        id1: t.ownerId,
                        t2:
                            'Event' +
                            (t.subject !== undefined
                                ? " '" + t.subject.substring(0, this._trimLengthSubject) + "'"
                                : ''),
                        id2: t.id,
                        t3: t.whoName,
                        id3: t.whoId
                    }
                ]
            });
            vm.activities.push({
                key: 'a-' + t.id,
                rollup: t.eventSubType,
                text: t.subject,
                score: 1,
                details: [
                    t.ownerName +
                        ' -> Event ' +
                        (t.subject !== undefined ? "'" + t.subject.substring(0, this._trimLengthSubject) + "' " : '') +
                        '-> ' +
                        t.whoName
                ],
                detailTokens: [
                    {
                        t1: t.ownerName,
                        id1: t.ownerId,
                        t2:
                            'Event' +
                            (t.subject !== undefined
                                ? " '" + t.subject.substring(0, this._trimLengthSubject) + "'"
                                : ''),
                        id2: t.id,
                        t3: t.whoName,
                        id3: t.whoId
                    }
                ]
            });
            vm.contacts.push({
                key: 'c-' + t.id,
                rollup: t.whoId,
                contact: t.whoId,
                text: t.whoName,
                score: 1,
                details: [
                    t.ownerName +
                        ' -> Event ' +
                        (t.subject !== undefined ? "'" + t.subject.substring(0, this._trimLengthSubject) + "' " : '') +
                        '-> ' +
                        t.whoName
                ],
                detailTokens: [
                    {
                        t1: t.ownerName,
                        id1: t.ownerId,
                        t2:
                            'Event' +
                            (t.subject !== undefined
                                ? " '" + t.subject.substring(0, this._trimLengthSubject) + "'"
                                : ''),
                        id2: t.id,
                        t3: t.whoName,
                        id3: t.whoId
                    }
                ]
            });

            if (this._matrixPairingsMap.has(matrixKey)) {
                var matrixTaskItem = this._matrixPairingsMap.get(matrixKey);
                matrixTaskItem.score++;
                matrixTaskItem.details.push(
                    t.ownerName +
                        ' -> Event ' +
                        (t.subject !== undefined ? "'" + t.subject.substring(0, this._trimLengthSubject) + "' " : '') +
                        '-> ' +
                        t.whoName
                );
                matrixTaskItem.detailTokens.push({
                    t1: t.ownerName,
                    id1: t.ownerId,
                    t2:
                        'Event' +
                        (t.subject !== undefined ? " '" + t.subject.substring(0, this._trimLengthSubject) + "'" : ''),
                    id2: t.id,
                    t3: t.whoName,
                    id3: t.whoId
                });
                this.setMatrixMinMax(matrixTaskItem.score);
            } else {
                this._matrixPairingsMap.set(matrixKey, {
                    key: matrixKey,
                    score: 1,
                    contact: t.whoName,
                    user: t.ownerName,
                    details: [
                        t.ownerName +
                            ' -> Event ' +
                            (t.subject !== undefined
                                ? "'" + t.subject.substring(0, this._trimLengthSubject) + "' "
                                : '') +
                            '-> ' +
                            t.whoName
                    ],
                    detailTokens: [
                        {
                            t1: t.ownerName,
                            id1: t.ownerId,
                            t2:
                                'Event' +
                                (t.subject !== undefined
                                    ? " '" + t.subject.substring(0, this._trimLengthSubject) + "'"
                                    : ''),
                            id2: t.id,
                            t3: t.whoName,
                            id3: t.whoId
                        }
                    ]
                });
                this.setMatrixMinMax(1);
            }
        });

        return vm;
    }

    buildMatrix(vm) {
        var tempUsers = [];
        vm.users.forEach((user) => {
            tempUsers.push({
                key: user.rollup,
                userId: user.rollup,
                text: user.text,
                details: [],
                detailTokens: []
            });
        });
        var tempUsersToClone = JSON.stringify(tempUsers);
        tempUsers.sort((a, b) => {
            return this.stringCompare(a.text, b.text);
        });

        vm.matrix = [];
        vm.contacts.forEach((contact) => {
            if (!vm.matrix.find((mi) => mi.key === contact.rollup)) {
                vm.matrix.push({
                    key: contact.rollup,
                    contact: contact.text,
                    users: JSON.parse(tempUsersToClone)
                });
            }
        });
        vm.matrix.sort((a, b) => {
            return this.stringCompare(a.contact, b.contact);
        });

        vm.matrix.forEach((contact) => {
            contact.users.forEach((user) => {
                var pairKey = 'm-' + contact.key + '_' + user.userId;
                if (this._matrixPairingsMap.has(pairKey)) {
                    var pairData = this._matrixPairingsMap.get(pairKey);
                    user.key = pairData.key;
                    user.score = pairData.score;
                    user.details = pairData.details;
                    user.detailTokens = pairData.detailTokens;
                }
            });
        });

        return vm;
    }

    setMatrixMinMax(value) {
        if (this._matrixMin === -1) {
            this._matrixMin = value;
        }
        if (this._matrixMax === -1) {
            this._matrixMax = value;
        }
        if (value < this._matrixMin) {
            this._matrixMin = value;
        }
        if (value > this._matrixMax) {
            this._matrixMax = value;
        }
    }

    distill(vm) {
        var seenLists = { users: new Map(), activities: new Map(), contacts: new Map() };
        var distilled = { users: new Map(), activities: new Map(), contacts: new Map() };
        var temp = { users: [], activities: [], contacts: [] };

        vm.users.forEach((item) => {
            this.rollup(item, seenLists, distilled, 'users');
        });
        vm.activities.forEach((item) => {
            this.rollup(item, seenLists, distilled, 'activities');
        });
        vm.contacts.forEach((item) => {
            this.rollup(item, seenLists, distilled, 'contacts');
        });

        distilled.users.forEach((item) => {
            if (this._userMin === -1) {
                this._userMin = item.score;
            }
            if (this._userMax === -1) {
                this._userMax = item.score;
            }
            if (item.score < this._userMin) {
                this._userMin = item.score;
            }
            if (item.score > this._userMax) {
                this._userMax = item.score;
            }
            temp.users.push(item);
        });

        distilled.activities.forEach((item) => {
            if (this._activityMin === -1) {
                this._activityMin = item.score;
            }
            if (this._activityMax === -1) {
                this._activityMax = item.score;
            }
            if (item.score < this._activityMin) {
                this._activityMin = item.score;
            }
            if (item.score > this._activityMax) {
                this._activityMax = item.score;
            }
            temp.activities.push(item);
        });

        distilled.contacts.forEach((item) => {
            if (this._contactMin === -1) {
                this._contactMin = item.score;
            }
            if (this._contactMax === -1) {
                this._contactMax = item.score;
            }
            if (item.score < this._contactMin) {
                this._contactMin = item.score;
            }
            if (item.score > this._contactMax) {
                this._contactMax = item.score;
            }
            temp.contacts.push(item);
        });

        vm.users = temp.users;
        vm.activities = temp.activities;
        vm.contacts = temp.contacts;

        return vm;
    }

    rollup = (item, seenLists, distilled, section) => {
        if (!seenLists[section].has(item.rollup)) {
            seenLists[section].set(item.rollup, item);
            distilled[section].set(item.rollup, item);
        } else {
            distilled[section].get(item.rollup).score++;
            if (item.details[0] !== undefined) {
                distilled[section].get(item.rollup).details.push(item.details[0]);
            }
            if (item.detailTokens[0] !== undefined) {
                distilled[section].get(item.rollup).detailTokens.push(item.detailTokens[0]);
            }
        }
    };

    sortScores(data) {
        data.users.sort((a, b) => b.score - a.score);
        data.activities.sort((a, b) => b.score - a.score);
        data.contacts.sort((a, b) => b.score - a.score);
        return data;
    }

    normalizeBetweenTwoRanges = (val, minVal, maxVal, newMin, newMax) => {
        if (val === undefined) {
            return newMin;
        }
        if (minVal === maxVal) {
            return newMax;
        }
        return newMin + ((val - minVal) * (newMax - newMin)) / (maxVal - minVal);
    };

    injectGradedStyles(data) {
        data.users.forEach((u) => {
            u.class =
                'entry user b' +
                Math.trunc(this.normalizeBetweenTwoRanges(u.score, this._userMin, this._userMax, 1, 10));
        });

        data.activities.forEach((a) => {
            a.class =
                'entry activity b' +
                Math.trunc(this.normalizeBetweenTwoRanges(a.score, this._activityMin, this._activityMax, 1, 10));
        });

        data.contacts.forEach((c) => {
            c.class =
                'entry contact b' +
                Math.trunc(this.normalizeBetweenTwoRanges(c.score, this._contactMin, this._contactMax, 1, 10));
        });

        data.matrix.forEach((m) => {
            m.users.forEach((u) => {
                if (u.score === undefined) {
                    u.class = 'matrix cross empty';
                } else {
                    u.class =
                        'matrix cross b' +
                        Math.trunc(this.normalizeBetweenTwoRanges(u.score, this._matrixMin, this._matrixMax, 1, 10));
                }
            });
        });

        return data;
    }
}