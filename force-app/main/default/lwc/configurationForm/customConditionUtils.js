const isLetter = (char) => {
    return char.toLowerCase() !== char.toUpperCase();
};

const transformConditionLogic = (conditionLogic) => {
    conditionLogic = conditionLogic.toUpperCase().replace(/AND/g, '+').replace(/OR/g, '-').replace(/ /g, '');
    return conditionLogic;
};

const resetConditionSymbols = (conditionLogic) => {
    conditionLogic = conditionLogic.replace(/\+/g, 'AND').replace(/-/g, 'OR');
    return conditionLogic;
};

const containsAllConditionAlphabets = (conditionLogic, conditionsLength) => {
    for (let charCode = 65; charCode < 65 + conditionsLength; charCode++) {
        const letter = String.fromCharCode(charCode);

        if (!conditionLogic.includes(letter)) {
            return false;
        }
    }
    return true;
};

const checkStartEndConditions = (conditionLogic) => {
    if (
        conditionLogic[0] === '+' ||
        conditionLogic[0] === '-' ||
        conditionLogic[conditionLogic.length - 1] === '+' ||
        conditionLogic[conditionLogic.length - 1] === '-'
    ) {
        return false;
    }
    return true;
};

const isValidParentheses = (conditionLogic) => {
    const { open, close } = conditionLogic.split('').reduce(
        (counts, char) => {
            if (char === '(') {
                counts.open++;
            } else if (char === ')') {
                counts.close++;
            }
            return counts;
        },
        { open: 0, close: 0 }
    );
    return open === close;
};

const checkAdjacentLetters = (char, nextChar) => {
    if (isLetter(char) && isLetter(nextChar)) {
        return false;
    }
    return true;
};

const checkAdjacentPlusMinus = (char, nextChar) => {
    if ((char === '+' || char === '-') && (nextChar === '+' || nextChar === '-')) {
        return false;
    }
    return true;
};

const checkInvalidOpenParenthesis = (char, nextChar) => {
    if (char === '(' && (nextChar === '+' || nextChar === '-')) {
        return false;
    }
    return true;
};

const checkInvalidCloseParenthesis = (char, nextChar) => {
    if ((char === '+' || char === '-') && nextChar === ')') {
        return false;
    }
    return true;
};

const isValidCharacter = (char, conditionsLength) => {
    const validAlphabetRange = 'A'.charCodeAt(0) + conditionsLength;

    if (
        (char >= 'A' && char < String.fromCharCode(validAlphabetRange)) ||
        char === '(' ||
        char === ')' ||
        char === '+' ||
        char === '-'
    ) {
        return true;
    }
    return false;
};

export {
    transformConditionLogic,
    containsAllConditionAlphabets,
    checkStartEndConditions,
    isValidParentheses,
    checkAdjacentLetters,
    checkAdjacentPlusMinus,
    checkInvalidOpenParenthesis,
    checkInvalidCloseParenthesis,
    isValidCharacter,
    isLetter,
    resetConditionSymbols
};