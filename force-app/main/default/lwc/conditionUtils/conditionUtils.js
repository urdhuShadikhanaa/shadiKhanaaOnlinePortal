import LABEL_EQUALS from '@salesforce/label/c.Equals';
import LABEL_GREATER_THAN from '@salesforce/label/c.Greater_Than';
import LABEL_GREATER_THAN_OR_EQUAL_TO from '@salesforce/label/c.Greater_Than_Or_Equal_To';
import LABEL_LESS_THAN from '@salesforce/label/c.Less_Than';
import LABEL_LESS_THAN_OR_EQUAL_TO from '@salesforce/label/c.Less_Than_Or_Equal_To';
import LABEL_NOT_EQUALS from '@salesforce/label/c.Not_Equals';

const operators = {
    EQUALS: {
        value: 'EQUALS',
        label: LABEL_EQUALS
    },
    NOT_EQUAL_TO: {
        value: 'NOT_EQUAL_TO',
        label: LABEL_NOT_EQUALS
    },
    GREATER_THAN: {
        value: 'GREATER_THAN',
        label: LABEL_GREATER_THAN
    },
    LESS_THAN: {
        value: 'LESS_THAN',
        label: LABEL_LESS_THAN
    },
    GREATER_THAN_OR_EQUAL_TO: {
        value: 'GREATER_THAN_OR_EQUAL_TO',
        label: LABEL_GREATER_THAN_OR_EQUAL_TO
    },
    LESS_THAN_OR_EQUAL_TO: {
        value: 'LESS_THAN_OR_EQUAL_TO',
        label: LABEL_LESS_THAN_OR_EQUAL_TO
    }
};

const fieldTypeOperatorsMap = {
    boolean: [operators.EQUALS, operators.NOT_EQUAL_TO],
    date: [
        operators.EQUALS,
        operators.NOT_EQUAL_TO,
        operators.GREATER_THAN,
        operators.GREATER_THAN_OR_EQUAL_TO,
        operators.LESS_THAN,
        operators.LESS_THAN_OR_EQUAL_TO
    ],
    datetime: [
        operators.EQUALS,
        operators.NOT_EQUAL_TO,
        operators.GREATER_THAN,
        operators.GREATER_THAN_OR_EQUAL_TO,
        operators.LESS_THAN,
        operators.LESS_THAN_OR_EQUAL_TO
    ],
    time: [
        operators.EQUALS,
        operators.NOT_EQUAL_TO,
        operators.GREATER_THAN,
        operators.GREATER_THAN_OR_EQUAL_TO,
        operators.LESS_THAN,
        operators.LESS_THAN_OR_EQUAL_TO
    ],
    double: [
        operators.EQUALS,
        operators.NOT_EQUAL_TO,
        operators.GREATER_THAN,
        operators.GREATER_THAN_OR_EQUAL_TO,
        operators.LESS_THAN,
        operators.LESS_THAN_OR_EQUAL_TO
    ],
    integer: [
        operators.EQUALS,
        operators.NOT_EQUAL_TO,
        operators.GREATER_THAN,
        operators.GREATER_THAN_OR_EQUAL_TO,
        operators.LESS_THAN,
        operators.LESS_THAN_OR_EQUAL_TO
    ],
    percent: [
        operators.EQUALS,
        operators.NOT_EQUAL_TO,
        operators.GREATER_THAN,
        operators.GREATER_THAN_OR_EQUAL_TO,
        operators.LESS_THAN,
        operators.LESS_THAN_OR_EQUAL_TO
    ],
    currency: [
        operators.EQUALS,
        operators.NOT_EQUAL_TO,
        operators.GREATER_THAN,
        operators.GREATER_THAN_OR_EQUAL_TO,
        operators.LESS_THAN,
        operators.LESS_THAN_OR_EQUAL_TO
    ],
    picklist: [operators.EQUALS, operators.NOT_EQUAL_TO],
    reference: [operators.EQUALS, operators.NOT_EQUAL_TO]
};

const fieldTypeInputTypeMap = {
    boolean: 'combobox',
    date: 'date',
    datetime: 'datetime',
    time: 'time',
    double: 'number',
    integer: 'number',
    percent: 'number',
    currency: 'number',
    picklist: 'combobox',
    reference: 'combobox'
};

const getSupportedFieldTypes = () => {
    return Object.keys(fieldTypeOperatorsMap);
};

const getOperationsForFieldType = fieldType => {
    return fieldTypeOperatorsMap[fieldType.toLowerCase()] || [];
};

export { operators, getSupportedFieldTypes, getOperationsForFieldType, fieldTypeOperatorsMap, fieldTypeInputTypeMap };