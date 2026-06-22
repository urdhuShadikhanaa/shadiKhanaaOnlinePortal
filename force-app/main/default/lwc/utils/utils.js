import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { reduceErrors } from 'c/ldsUtils';

export function isUndefinedOrNull(value) {
    return value === null || value === undefined;
}

export function isNotUndefinedOrNull(value) {
    return !isUndefinedOrNull(value);
}

/**
 * Check if a primitive is undefined, null or blank string.
 * @param value         Value to check.
 * @returns {boolean}   TRUE when the given value is undefined, null or blank string.
 */
export const isEmpty = (value) => {
    return isUndefinedOrNull(value) || value === '';
};

export const isNotEmpty = (value) => {
    return !isEmpty(value);
};

/**
 * Check if an object is empty
 * @param object         Object to check.
 * @returns {boolean}   TRUE when the given object is empty.
 */
export const isEmptyObject = (object) => {
    for (let key in object) {
        // eslint-disable-next-line no-prototype-builtins
        if (object.hasOwnProperty(key)) {
            return false;
        }
    }

    return true;
};

/** ****************
 * Set Operations *
 ******************/
export function isSuperset(set, subset) {
    for (const elem of subset) {
        if (!set.has(elem)) {
            return false;
        }
    }

    return true;
}

export function union(setA, setB) {
    const _union = new Set(setA);

    for (const elem of setB) {
        _union.add(elem);
    }

    return _union;
}

export function intersection(setA, setB) {
    const _intersection = new Set();

    for (const elem of setB) {
        if (setA.has(elem)) {
            _intersection.add(elem);
        }
    }

    return _intersection;
}

export function symmetricDifference(setA, setB) {
    const _difference = new Set(setA);

    for (const elem of setB) {
        if (_difference.has(elem)) {
            _difference.delete(elem);
        } else {
            _difference.add(elem);
        }
    }

    return _difference;
}

export function difference(setA, setB) {
    const _difference = new Set(setA);

    for (const elem of setB) {
        _difference.delete(elem);
    }

    return _difference;
}

export function hexToRgb(hex, alpha) {
    hex = hex.replace('#', '');
    if (hex.length !== 3 && hex.length !== 6) {
        return 'rgba(255,255,255,0.0)';
    }
    let r = parseInt(hex.length === 3 ? hex.slice(0, 1).repeat(2) : hex.slice(0, 2), 16);
    let g = parseInt(hex.length === 3 ? hex.slice(1, 2).repeat(2) : hex.slice(2, 4), 16);
    let b = parseInt(hex.length === 3 ? hex.slice(2, 3).repeat(2) : hex.slice(4, 6), 16);

    if (alpha) {
        return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
    }

    return 'rgb(' + r + ', ' + g + ', ' + b + ')';
}

export function isDate(input) {
    return input && Object.prototype.toString.call(input) === '[object Date]' && !isNaN(input);
}

export function isLightColor(hex) {
    try {
        if (hex.indexOf('#') === 0) {
            hex = hex.slice(1);
        }

        // Convert 3-digit hex to 6-digits.
        if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }

        let r = parseInt(hex.slice(0, 2), 16);
        let g = parseInt(hex.slice(2, 4), 16);
        let b = parseInt(hex.slice(4, 6), 16);

        // http://stackoverflow.com/a/3943023/112731
        return r * 0.299 + g * 0.587 + b * 0.114 > 186;
    } catch (err) {
        return true;
    }
}

// Dot-notation nested field value finder within a data object.
export function getFieldValue(field, data) {
    let fieldArray = field.split('.');

    for (let i = 0; i < fieldArray.length; i++) {
        if (data[fieldArray[i]] === undefined) {
            return null;
        }
        data = data[fieldArray[i]];
    }

    return data;
}

export function getLinkLabel(input) {
    const parser = new DOMParser();
    const doc3 = parser.parseFromString(input, 'text/html');
    const elem = doc3?.getElementsByTagName('a');

    if (elem && elem.length > 0) {
        return elem[0].innerText;
    }

    if (isUrl(input)) {
        return input;
    }

    return '';
}

export function getUrl(input) {
    const parser = new DOMParser();
    const doc3 = parser.parseFromString(input, 'text/html');
    const elem = doc3?.getElementsByTagName('a');

    if (elem && elem.length > 0) {
        return elem[0].getAttribute('href');
    }

    if (isUrl(input)) {
        return input;
    }

    return '';
}

export function containsHtmlLink(input) {
    const parser = new DOMParser();
    const doc3 = parser.parseFromString(input, 'text/html');
    const elem = doc3?.getElementsByTagName('a');

    if (elem && elem.length > 0) {
        return true;
    }

    if (isUrl(input)) {
        return true;
    }

    return false;
}

export function isUrl(input) {
    // https://mathiasbynens.be/demo/url-regex using @diegoperini
    const urlRegex =
        '^(?:(?:(?:https?|ftp):)?\\/\\/)(?:\\S+(?::\\S*)?@)?(?:(?!(?:10|127)(?:\\.\\d{1,3}){3})(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z0-9\\u00a1-\\uffff][a-z0-9\\u00a1-\\uffff_-]{0,62})?[a-z0-9\\u00a1-\\uffff]\\.)+(?:[a-z\\u00a1-\\uffff]{2,}\\.?))(?::\\d{2,5})?(?:[/?#]\\S*)?$';

    let reg = new RegExp(urlRegex, 'i');

    return reg.test(input);
}

export function isEmail(input) {
    // https://stackoverflow.com/questions/46155/how-to-validate-an-email-address-in-javascript
    const emailRegex =
        "[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?";

    let reg = new RegExp(emailRegex, 'i');

    return reg.test(input);
}

export const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0,
            v = c === 'x' ? r : (r & 0x3) | 0x8;

        return v.toString(16);
    });
};

// Checks if the target value exists in a JSON object.
export const hasKey = (obj, keys) => {
    return (
        keys.length > 0 &&
        keys.every((key) => {
            // eslint-disable-next-line no-prototype-builtins
            if (typeof obj !== 'object' || !obj.hasOwnProperty(key)) {
                return false;
            }
            obj = obj[key];

            return true;
        })
    );
};

const removeWhiteSpace = (value) => {
    return value ? value.replaceAll(new RegExp('\\s+', 'g'), '') : '';
};

const flatten = (value) => {
    return value ? value.replaceAll(new RegExp('\\.', 'g'), '_') : '';
};

export const createFlattenedSetFromDelimitedString = (string, delimiter) => {
    const cleanString = removeWhiteSpace(string);
    const flatString = flatten(cleanString);

    return new Set(flatString.split(delimiter));
};

export const generateUUID2 = () => {
    var d = new Date().getTime();

    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
        d += performance.now(); // Use high-precision timer if available
    }

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;

        d = Math.floor(d / 16);

        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
};

export function getMathResult(expression) {
    // eslint-disable-next-line no-new-func
    return new Function('return ' + expression)();
}

export function showErrorToast(error, context, title = 'Error') {
    let message = reduceErrors(error);

    context.dispatchEvent(
        new ShowToastEvent({
            title,
            message,
            variant: 'error'
        })
    );
}

export function showWarningToast(warning, context, title = 'Warning') {
    let message = reduceErrors(warning);

    context.dispatchEvent(
        new ShowToastEvent({
            title,
            message,
            variant: 'warning'
        })
    );
}

export function getPageReference(pageApiName, recordId = '') {
    return {
        type: 'standard__recordPage',
        attributes: {
            recordId: recordId,
            objectApiName: pageApiName,
            actionName: 'view'
        }
    };
}