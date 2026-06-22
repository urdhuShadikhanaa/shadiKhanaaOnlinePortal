export function formatDataValue(value, type = '') {
    let temp;

    switch (type.toLowerCase()) {
        case 'integer':
            temp = parseInt(value, 10);

            return isNaN(temp) ? 0 : temp;
        case 'double':
        case 'currency':
        case 'percent':
            temp = parseFloat(value);

            return isNaN(temp) ? 0 : temp;
        case 'date':
        case 'datetime':
            if (typeof value === 'string') {
                return new Date(value.replace(' ', 'T'));
            }

            return new Date(value);
        case 'text':
        case 'textarea':
        default:
            return value;
    }
}

export function isAverageType(type = '') {
    switch (type.toLowerCase()) {
        case 'percent':
            return true;
        default:
            return false;
    }
}

export function isSummationType(type = '') {
    switch (type.toLowerCase()) {
        case 'currency':
        case 'double':
        case 'integer':
            return true;
        default:
            return false;
    }
}

export function isDateType(type = '') {
    switch (type.toLowerCase()) {
        case 'date':
        case 'datetime':
            return true;
        default:
            return false;
    }
}

export function isCountType(type = '') {
    switch (type.toLowerCase()) {
        case 'boolean':
        case 'picklist':
            return true;
        default:
            return false;
    }
}

export function isTextType(type = '') {
    switch (type.toLowerCase()) {
        case 'text':
        case 'textarea':
            return true;
        default:
            return false;
    }
}