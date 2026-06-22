const flattenObject = (propName, obj) => {
    let flatObject = {};

    for (let prop in obj) {
        if (prop) {
            // If this property is an object, we need to flatten again
            let propIsNumber = isNaN(propName);
            let preAppend = propIsNumber ? `${propName}_` : '';

            if (typeof obj[prop] == 'object') {
                flatObject[preAppend + prop] = { ...flatObject, ...flattenObject(preAppend + prop, obj[prop]) };
            } else {
                flatObject[preAppend + prop] = obj[prop];
            }
        }
    }

    return flatObject;
};

const flattenQueryResult = (listOfObjects, objectApiName) => {
    let finalArr = [];

    for (let i = 0; i < listOfObjects.length; i++) {
        let obj = listOfObjects[i];

        for (let prop in obj) {
            if (!Object.prototype.hasOwnProperty.call(obj, prop)) {
                continue;
            }
            if (typeof obj[prop] === 'object' && !Array.isArray(obj[prop])) {
                obj = { ...obj, ...flattenObject(prop, obj[prop]) };
            } else if (Array.isArray(obj[prop])) {
                for (let j = 0; j < obj[prop].length; j++) {
                    obj[`${prop}_${j}`] = { ...obj, ...flattenObject(prop, obj[prop]) };
                }
            }

            // Helps with linkifying name fields
            if (prop === 'Id' && objectApiName) {
                const objectIdProp = { [`${objectApiName}_Id`]: obj[prop] };

                obj = { ...obj, ...objectIdProp };
            }
        }
        finalArr.push(obj);
    }

    return finalArr;
};

export { flattenObject, flattenQueryResult };