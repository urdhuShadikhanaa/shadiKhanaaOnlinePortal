/**
 * Reduces one or more LDS errors into a string[] of error messages.
 * @param {FetchResponse|FetchResponse[]} errors
 * @return {String[]} Error messages
 */
export function reduceErrors(errors) {
    if (!Array.isArray(errors)) {
        errors = [errors];
    }

    return (
        errors

            // Remove null/undefined items
            .filter((error) => !!error)

            // Extract an error message
            .map((error) => {
                // UI API read errors
                if (Array.isArray(error.body)) {
                    return error.body.map((e) => e.message);
                }

                // FIELD VALIDATION, FIELD, and trigger.addError
                if (
                    error.body &&
                    error.body.enhancedErrorType &&
                    error.body.enhancedErrorType.toLowerCase() === 'recorderror' &&
                    error.body.output
                ) {
                    let firstError = '';

                    if (
                        error.body.output.errors.length &&
                        error.body.output.errors[0].errorCode.includes('_') // One of the many salesforce errors with underscores
                    ) {
                        firstError = error.body.output.errors[0].message;
                    }
                    if (!error.body.output.errors.length && error.body.output.fieldErrors) {
                        // It's in a really weird format...
                        firstError =
                            error.body.output.fieldErrors[Object.keys(error.body.output.fieldErrors)[0]][0].message;
                    }

                    return firstError;
                }

                // UI API DML, Apex and network errors
                if (error.body && typeof error.body.message === 'string') {
                    return error.body.message;
                }

                // PAGE ERRORS
                if (error.body && error.body.pageErrors.length) {
                    return error.body.pageErrors[0].message;
                }

                // JS errors
                if (typeof error.message === 'string') {
                    return error.message;
                }

                // Unknown error shape so try HTTP status text
                return error.statusText;
            })

            // Flatten
            .reduce((prev, curr) => prev.concat(curr), [])

            // Remove empty strings
            .filter((message) => !!message)
    );
}