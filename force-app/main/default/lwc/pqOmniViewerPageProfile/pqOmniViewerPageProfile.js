import { LightningElement, api, track } from 'lwc';
import { getFieldValue, generateUUID } from 'c/utils';
import Loading from '@salesforce/label/c.Loading';

import Click_Here_To_Refresh from '@salesforce/label/c.Click_Here_To_Refresh';

export default class pqOmniViewerPageProfile extends LightningElement {
    @track _personMapMemberData;

    @track _personContactData;

    @track _personContactExtendedData;

    @track _layoutFieldData;

    labels = {
        Click_Here_To_Refresh,
        Loading
    };

    loaded = false;

    pageLayout;

    needsRefresh = false;

    addressList;

    _contactId;

    @api profileImageData;

    // ----------------------------------------------------

    passthroughEvent(event) {
        this.needsRefresh = true;
        const passedEvent = new CustomEvent(event.type, {
            detail: event.detail
        });

        // Dispatches the event.
        this.dispatchEvent(passedEvent);
    }

    refreshClicked() {
        this.needsRefresh = false;
        const passedEvent = new CustomEvent('refreshcontactclicked', {});

        // Dispatches the event.
        this.dispatchEvent(passedEvent);
    }

    @api
    get personMapMemberData() {
        return this._personMapMemberData;
    }

    set personMapMemberData(data) {
        this._personMapMemberData = data;
    }

    @api
    get personContactData() {
        return this._personContactData;
    }

    set personContactData(data) {
        this._personContactData = data;
        if (this.pageLayout) {
            this._layoutFieldData = this.processMetaDataAPILayoutModel(this.pageLayout);
        }
    }

    @api
    get personContactExtendedData() {
        return this._personContactExtendedData;
    }

    set personContactExtendedData(data) {
        this._personContactExtendedData = data;
    }

    // ----------------------------------------------------

    get hasData() {
        return this._layoutFieldData !== null;
    }

    @api
    set contactId(val) {
        this._contactId = val;
        this.loadData();
    }

    get contactId() {
        return this._contactId;
    }

    connectedCallback() {
        this.loadData();
    }

    async loadData() {
        this.pageLayout = this.getGenericLayout();
        this._layoutFieldData = this.processMetaDataAPILayoutModel(this.pageLayout);
        this.loaded = true;
    }

    get layoutFieldData() {
        return this._layoutFieldData;
    }

    getGenericLayout() {
        return {
            detailLayoutSections: [
                {
                    columns: 2,
                    heading: 'Contact Information',
                    layoutRows: [
                        {
                            layoutItems: [
                                {
                                    label: 'Contact Owner',
                                    layoutComponents: [
                                        {
                                            details: {
                                                label: 'Owner ID',
                                                length: 18,
                                                name: 'OwnerId',
                                                referenceTo: ['User'],
                                                relationshipName: 'Owner',
                                                soapType: 'tns:ID',
                                                type: 'reference'
                                            },
                                            type: 'Field',
                                            value: 'OwnerId'
                                        }
                                    ]
                                },
                                {
                                    label: 'Phone',
                                    layoutComponents: [
                                        {
                                            details: {
                                                label: 'Business Phone',
                                                length: 40,
                                                name: 'Phone',
                                                referenceTo: [],
                                                relationshipName: null,
                                                soapType: 'xsd:string',
                                                sortable: true,
                                                type: 'phone'
                                            },
                                            type: 'Field',
                                            value: 'Phone'
                                        }
                                    ]
                                }
                            ],
                            numItems: 2
                        },
                        {
                            layoutItems: [
                                {
                                    label: 'Name',
                                    layoutComponents: [
                                        {
                                            components: [
                                                {
                                                    details: {
                                                        label: 'Salutation',
                                                        length: 40,
                                                        referenceTo: [],
                                                        relationshipName: null,
                                                        soapType: 'xsd:string',
                                                        type: 'picklist'
                                                    },
                                                    type: 'Field',
                                                    value: 'Salutation'
                                                },
                                                {
                                                    details: {
                                                        label: 'First Name',
                                                        length: 40,
                                                        name: 'FirstName',
                                                        referenceTo: [],
                                                        relationshipName: null,
                                                        soapType: 'xsd:string',
                                                        type: 'string'
                                                    },
                                                    type: 'Field',
                                                    value: 'FirstName'
                                                },
                                                {
                                                    details: {
                                                        label: 'Last Name',
                                                        length: '80',
                                                        referenceTo: [],
                                                        relationshipName: null,
                                                        soapType: 'xsd:string',
                                                        type: 'string'
                                                    },
                                                    type: 'Field',
                                                    value: 'LastName'
                                                }
                                            ],
                                            details: {
                                                label: 'Full Name',
                                                length: 121,
                                                name: 'Name',
                                                referenceTo: [],
                                                relationshipName: null,
                                                soapType: 'xsd:string',
                                                type: 'string'
                                            },
                                            type: 'Field',
                                            value: 'Name'
                                        }
                                    ]
                                },
                                {
                                    label: 'Home Phone',
                                    layoutComponents: [
                                        {
                                            details: {
                                                label: 'Home Phone',
                                                length: 40,
                                                referenceTo: [],
                                                relationshipName: null,
                                                soapType: 'xsd:string',
                                                type: 'phone'
                                            },
                                            type: 'Field',
                                            value: 'HomePhone'
                                        }
                                    ]
                                }
                            ],
                            numItems: 2
                        },
                        {
                            layoutItems: [
                                {
                                    label: 'Account Name',
                                    layoutComponents: [
                                        {
                                            details: {
                                                label: 'Account ID',
                                                length: 18,
                                                name: 'AccountId',
                                                referenceTo: ['Account'],
                                                relationshipName: 'Account',
                                                soapType: 'tns:ID',
                                                type: 'reference'
                                            },
                                            type: 'Field',
                                            value: 'AccountId'
                                        }
                                    ]
                                },
                                {
                                    label: 'Mobile',
                                    layoutComponents: [
                                        {
                                            details: {
                                                label: 'Mobile Phone',
                                                length: 40,
                                                name: 'MobilePhone',
                                                referenceTo: [],
                                                relationshipName: null,
                                                soapType: 'xsd:string',
                                                type: 'phone'
                                            },
                                            type: 'Field',
                                            value: 'MobilePhone'
                                        }
                                    ]
                                }
                            ],
                            numItems: 2
                        },
                        {
                            layoutItems: [
                                {
                                    label: 'Title',
                                    layoutComponents: [
                                        {
                                            details: {
                                                label: 'Title',
                                                length: 128,
                                                referenceTo: [],
                                                relationshipName: null,
                                                soapType: 'xsd:string',
                                                type: 'string'
                                            },
                                            type: 'Field',
                                            value: 'Title'
                                        }
                                    ]
                                },
                                {
                                    label: 'Other Phone',
                                    layoutComponents: [
                                        {
                                            details: {
                                                label: 'Other Phone',
                                                length: 40,
                                                name: 'OtherPhone',
                                                referenceTo: [],
                                                relationshipName: null,
                                                soapType: 'xsd:string',
                                                type: 'phone'
                                            },
                                            type: 'Field',
                                            value: 'OtherPhone'
                                        }
                                    ]
                                }
                            ],
                            numItems: 2
                        },
                        {
                            layoutItems: [
                                {
                                    label: 'Department',
                                    layoutComponents: [
                                        {
                                            details: {
                                                label: 'Department',
                                                length: '80',
                                                name: 'Department',
                                                referenceTo: [],
                                                relationshipName: null,
                                                soapType: 'xsd:string',
                                                type: 'string'
                                            },
                                            type: 'Field',
                                            value: 'Department'
                                        }
                                    ]
                                },
                                {
                                    label: 'Fax',
                                    layoutComponents: [
                                        {
                                            details: {
                                                label: 'Business Fax',
                                                length: 40,
                                                name: 'Fax',
                                                referenceTo: [],
                                                relationshipName: null,
                                                soapType: 'xsd:string',
                                                type: 'phone'
                                            },
                                            type: 'Field',
                                            value: 'Fax'
                                        }
                                    ]
                                }
                            ],
                            numItems: 2
                        },
                        {
                            layoutItems: [
                                {
                                    label: 'Birthdate',
                                    layoutComponents: [
                                        {
                                            details: {
                                                label: 'Birthdate',
                                                length: '0',
                                                name: 'Birthdate',
                                                referenceTo: [],
                                                relationshipName: null,
                                                soapType: 'xsd:date',
                                                type: 'date'
                                            },
                                            type: 'Field',
                                            value: 'Birthdate'
                                        }
                                    ]
                                },
                                {
                                    label: 'Email',
                                    layoutComponents: [
                                        {
                                            details: {
                                                label: 'Email',
                                                length: '80',
                                                referenceTo: [],
                                                relationshipName: null,
                                                soapType: 'xsd:string',
                                                type: 'email'
                                            },
                                            type: 'Field',
                                            value: 'Email'
                                        }
                                    ]
                                }
                            ],
                            numItems: 2
                        },
                        {
                            layoutItems: [
                                {
                                    label: 'Reports To',
                                    layoutComponents: [
                                        {
                                            details: {
                                                label: 'Reports To ID',
                                                length: 18,
                                                name: 'ReportsToId',
                                                referenceTo: ['Contact'],
                                                relationshipName: 'ReportsTo',
                                                soapType: 'tns:ID',
                                                type: 'reference'
                                            },
                                            type: 'Field',
                                            value: 'ReportsToId'
                                        }
                                    ]
                                },
                                {
                                    label: 'Assistant',
                                    layoutComponents: [
                                        {
                                            details: {
                                                label: "Assistant's Name",
                                                length: 40,
                                                name: 'AssistantName',
                                                referenceTo: [],
                                                relationshipName: null,
                                                soapType: 'xsd:string',
                                                type: 'string'
                                            },
                                            type: 'Field',
                                            value: 'AssistantName'
                                        }
                                    ]
                                }
                            ],
                            numItems: 2
                        },
                        {
                            layoutItems: [
                                {
                                    label: 'Lead Source',
                                    layoutComponents: [
                                        {
                                            details: {
                                                label: 'Lead Source',
                                                length: 255,
                                                name: 'LeadSource',
                                                referenceTo: [],
                                                relationshipName: null,
                                                soapType: 'xsd:string',
                                                type: 'picklist'
                                            },
                                            type: 'Field',
                                            value: 'LeadSource'
                                        }
                                    ]
                                },
                                {
                                    label: 'Asst. Phone',
                                    layoutComponents: [
                                        {
                                            details: {
                                                label: 'Asst. Phone',
                                                length: 40,
                                                name: 'AssistantPhone',
                                                referenceTo: [],
                                                relationshipName: null,
                                                soapType: 'xsd:string',
                                                type: 'phone'
                                            },
                                            type: 'Field',
                                            value: 'AssistantPhone'
                                        }
                                    ]
                                }
                            ],
                            numItems: 2
                        }
                    ]
                },
                {
                    columns: 2,
                    heading: 'Address Information',
                    layoutRows: [
                        {
                            layoutItems: [
                                {
                                    label: 'Mailing Address',
                                    layoutComponents: [
                                        {
                                            components: [
                                                {
                                                    details: {
                                                        label: 'Mailing Street',
                                                        length: 255,
                                                        name: 'MailingStreet',
                                                        referenceTo: [],
                                                        relationshipName: null,
                                                        soapType: 'xsd:string',
                                                        type: 'textarea'
                                                    },
                                                    type: 'Field',
                                                    value: 'MailingStreet'
                                                },
                                                {
                                                    details: {
                                                        label: 'Mailing City',
                                                        length: 40,
                                                        name: 'MailingCity',
                                                        referenceTo: [],
                                                        relationshipName: null,
                                                        soapType: 'xsd:string',
                                                        type: 'string'
                                                    },
                                                    type: 'Field',
                                                    value: 'MailingCity'
                                                },
                                                {
                                                    details: {
                                                        label: 'Mailing State/Province',
                                                        name: 'MailingState',
                                                        referenceTo: [],
                                                        relationshipName: null,
                                                        soapType: 'xsd:string',
                                                        type: 'string'
                                                    },
                                                    type: 'Field',
                                                    value: 'MailingState'
                                                },
                                                {
                                                    details: {
                                                        label: 'Mailing Zip/Postal Code',
                                                        length: 20,
                                                        name: 'MailingPostalCode',
                                                        soapType: 'xsd:string',
                                                        type: 'string'
                                                    },
                                                    type: 'Field',
                                                    value: 'MailingPostalCode'
                                                },
                                                {
                                                    details: {
                                                        label: 'Mailing Country',
                                                        length: '80',
                                                        name: 'MailingCountry',
                                                        referenceTo: [],
                                                        relationshipName: null,
                                                        soapType: 'xsd:string',
                                                        type: 'string'
                                                    },
                                                    type: 'Field',
                                                    value: 'MailingCountry'
                                                }
                                            ],
                                            details: {
                                                label: 'Mailing Address',
                                                name: 'MailingAddress',
                                                referenceTo: [],
                                                relationshipName: null,
                                                soapType: 'urn:address',
                                                type: 'address'
                                            },
                                            fieldType: 'address',
                                            type: 'Field',
                                            value: 'MailingAddress'
                                        }
                                    ]
                                },
                                {
                                    label: 'Other Address',
                                    layoutComponents: [
                                        {
                                            components: [
                                                {
                                                    details: {
                                                        label: 'Other Street',
                                                        length: 255,
                                                        name: 'OtherStreet',
                                                        soapType: 'xsd:string',
                                                        type: 'textarea'
                                                    },
                                                    type: 'Field',
                                                    value: 'OtherStreet'
                                                },
                                                {
                                                    details: {
                                                        label: 'Other City',
                                                        length: 40,
                                                        name: 'OtherCity',
                                                        referenceTo: [],
                                                        relationshipName: null,
                                                        soapType: 'xsd:string',
                                                        type: 'string'
                                                    },
                                                    type: 'Field',
                                                    value: 'OtherCity'
                                                },
                                                {
                                                    details: {
                                                        label: 'Other State/Province',
                                                        length: '80',
                                                        name: 'OtherState',
                                                        referenceTo: [],
                                                        relationshipName: null,
                                                        soapType: 'xsd:string',
                                                        type: 'string'
                                                    },
                                                    type: 'Field',
                                                    value: 'OtherState'
                                                },
                                                {
                                                    details: {
                                                        label: 'Other Zip/Postal Code',
                                                        length: 20,
                                                        name: 'OtherPostalCode',
                                                        referenceTo: [],
                                                        relationshipName: null,
                                                        soapType: 'xsd:string',
                                                        type: 'string'
                                                    },
                                                    type: 'Field',
                                                    value: 'OtherPostalCode'
                                                },
                                                {
                                                    details: {
                                                        label: 'Other Country',
                                                        length: '80',
                                                        name: 'OtherCountry',
                                                        referenceTo: [],
                                                        relationshipName: null,
                                                        soapType: 'xsd:string',
                                                        type: 'string'
                                                    },
                                                    type: 'Field',
                                                    value: 'OtherCountry'
                                                }
                                            ],
                                            details: {
                                                label: 'Other Address',
                                                length: '0',
                                                name: 'OtherAddress',
                                                referenceTo: [],
                                                relationshipName: null,
                                                soapType: 'urn:address',
                                                type: 'address'
                                            },
                                            fieldType: 'address',
                                            type: 'Field',
                                            value: 'OtherAddress'
                                        }
                                    ]
                                }
                            ],
                            numItems: 2
                        }
                    ]
                },
                {
                    columns: 2,
                    heading: 'System Information',
                    layoutRows: [
                        {
                            layoutItems: [
                                {
                                    label: 'Created By',
                                    layoutComponents: [
                                        {
                                            details: {
                                                label: 'Created By ID',
                                                length: 18,
                                                name: 'CreatedById',
                                                referenceTo: ['User'],
                                                relationshipName: 'CreatedBy',
                                                soapType: 'tns:ID',
                                                type: 'reference'
                                            },
                                            type: 'Field',
                                            value: 'CreatedById'
                                        },
                                        {
                                            type: 'Separator',
                                            value: ', '
                                        },
                                        {
                                            details: {
                                                label: 'Created Date',
                                                length: '0',
                                                name: 'CreatedDate',
                                                referenceTo: [],
                                                relationshipName: null,
                                                soapType: 'xsd:dateTime',
                                                type: 'datetime'
                                            },
                                            type: 'Field',
                                            value: 'CreatedDate'
                                        }
                                    ]
                                },
                                {
                                    label: 'Last Modified By',
                                    layoutComponents: [
                                        {
                                            details: {
                                                label: 'Last Modified By ID',
                                                length: 18,
                                                name: 'LastModifiedById',
                                                referenceTo: ['User'],
                                                relationshipName: 'LastModifiedBy',
                                                soapType: 'tns:ID',
                                                type: 'reference'
                                            },
                                            type: 'Field',
                                            value: 'LastModifiedById'
                                        },
                                        {
                                            type: 'Separator',
                                            value: ', '
                                        },
                                        {
                                            details: {
                                                label: 'Last Modified Date',
                                                length: '0',
                                                name: 'LastModifiedDate',
                                                referenceTo: [],
                                                relationshipName: null,
                                                soapType: 'xsd:dateTime',
                                                type: 'datetime'
                                            },
                                            type: 'Field',
                                            value: 'LastModifiedDate'
                                        }
                                    ]
                                }
                            ],
                            numItems: 2
                        }
                    ]
                },
                {
                    columns: 1,
                    heading: 'Description Information',
                    layoutRows: [
                        {
                            layoutItems: [
                                {
                                    label: 'Description',
                                    layoutComponents: [
                                        {
                                            details: {
                                                label: 'Contact Description',
                                                length: 32000,
                                                name: 'Description',
                                                referenceTo: [],
                                                relationshipName: null,
                                                soapType: 'xsd:string',
                                                type: 'textarea'
                                            },
                                            type: 'Field',
                                            value: 'Description'
                                        }
                                    ]
                                }
                            ],
                            numItems: 1
                        }
                    ]
                }
            ]
        };
    }

    getLayoutSectionCSSClass(columns) {
        let sectionCSSClass = '';

        switch (columns) {
            case 1:
                sectionCSSClass = 'one-column-layout';
                break;

            case 2:
                sectionCSSClass = 'two-column-layout';
                break;

            default:
                sectionCSSClass = 'two-column-layout';
                break;
        }

        return sectionCSSClass;
    }

    sortAddressFields(fields) {
        let list = [];

        for (const field of fields) {
            if (field !== null) {
                list.push({
                    field: field.dataref,
                    label: "Contact's " + field.label,
                    rel: 'Contact',
                    data: field.value
                });
            }
        }

        return list.length !== 0 ? list : null;
    }

    generateField(fieldRef) {
        let _id;
        let _dataref;
        let _value;
        let _label;
        let _type;
        let _max;
        let _isRichText;
        let _isAddress;
        let _isAddressPopulated;

        _id = generateUUID();

        if (fieldRef.layoutComponents[0]?.details.relationshipName !== null) {
            _dataref = fieldRef.layoutComponents[0]?.details.relationshipName + '.Name';
        } else {
            _dataref = fieldRef.layoutComponents[0]?.value;
        }

        _value = getFieldValue(_dataref, this.personContactData);
        _label = fieldRef.label;
        _type = fieldRef.layoutComponents[0]?.details.type;
        _max = fieldRef.layoutComponents[0]?.details.length;
        _isRichText = fieldRef.layoutComponents[0]?.details.extraTypeInfo === 'richtextarea';
        _isAddress = fieldRef.layoutComponents[0]?.fieldType === 'address';
        _isAddressPopulated = _value !== null;

        let _field = {
            id: _id,
            value: _value,
            dataref: _dataref,
            label: _label,
            type: _type,
            max: _max,
            isRichText: _isRichText,
            isAddress: _isAddress,
            isAddressPopulated: _isAddressPopulated
        };

        return _field;
    }

    processMetaDataAPILayoutModel(layoutData) {
        if (!layoutData || !layoutData.detailLayoutSections) {
            return null;
        }
        let _layout = [];
        let _field;
        let _addressFields = [];

        for (const section of layoutData.detailLayoutSections) {
            if (typeof section === 'object' && section !== null) {
                let _sectionFields = [];

                for (const row of section.layoutRows) {
                    for (const item of row.layoutItems) {
                        switch (item.layoutComponents[0]?.type) {
                            case 'Field':
                                _field = this.generateField(item);
                                if (_field.isAddress && _field.isAddressPopulated) {
                                    _addressFields.push(_field);
                                }
                                _sectionFields.push(_field);
                                break;

                            case 'EmptySpace':
                                _sectionFields.push({
                                    id: generateUUID(),
                                    name: '',
                                    label: '',
                                    type: 'Blank',
                                    max: 0,
                                    isAddress: false,
                                    isAddressPopulated: false
                                });
                                break;

                            default:
                                break;
                        }
                    }
                }

                // Sections
                _layout.push({
                    id: generateUUID(),
                    label: section.heading,
                    class: this.getLayoutSectionCSSClass(section.columns),
                    fields: _sectionFields
                });
            }
        }

        this.addressList = null;
        if (_addressFields.length > 0) {
            this.addressList = this.sortAddressFields(_addressFields);
        }

        return _layout;
    }
}