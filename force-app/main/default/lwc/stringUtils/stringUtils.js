export function formatLabel(label, parameters) {
    return label.replace(/\{(\d+)\}/g, function () {
        let value = parameters[parseInt(arguments[1], 10)];

        return value ? value : '';
    });
}