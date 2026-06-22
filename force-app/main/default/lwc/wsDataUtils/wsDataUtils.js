import {
    formatDataValue,
    isSummationType,
    isAverageType,
    isCountType,
    isTextType,
    isDateType
} from 'c/dataFormatUtils';

export function getAmountSumsForCells(cells, highlights = []) {
    var existingRowMap;
    var existingColumnMap;
    let allSummaries = {
        displayFields: {},
        rows: {},
        columns: {}
    };

    if (Array.isArray(cells) && cells.length) {
        cells.forEach((cell) => {
            existingRowMap = allSummaries.rows[cell.rowId];
            if (!existingRowMap) {
                existingRowMap = {};
            }
            existingColumnMap = allSummaries.columns[cell.columnId];
            if (!existingColumnMap) {
                existingColumnMap = {};
            }
            cell.tiles.forEach((tile) => {
                if (tile.highlight && tile.highlight.Id && highlights.indexOf(tile.highlight.Id) === -1) {
                    return;
                }
                tile.displayFields.forEach((field) => {
                    if (
                        field.fieldType === 'amountType' &&
                        field.id &&
                        (isSummationType(field.type) || isAverageType(field.type))
                    ) {
                        allSummaries.displayFields[field.id] = calculateValues(
                            allSummaries.displayFields[field.id],
                            field
                        );
                        existingRowMap[field.id] = calculateValues(existingRowMap[field.id], field);
                        existingColumnMap[field.id] = calculateValues(existingColumnMap[field.id], field);
                    }
                });
            });
            allSummaries.rows[cell.rowId] = existingRowMap;
            allSummaries.columns[cell.columnId] = existingColumnMap;
        });
        allSummaries.displayFields = Object.values(allSummaries.displayFields);
        let formattedRows = {};

        Object.keys(allSummaries.rows).forEach((key) => {
            formattedRows[key] = Object.values(allSummaries.rows[key]);
        });
        allSummaries.rows = formattedRows;
        let formattedColumns = {};

        Object.keys(allSummaries.columns).forEach((key) => {
            formattedColumns[key] = Object.values(allSummaries.columns[key]);
        });
        allSummaries.columns = formattedColumns;
    }

    return allSummaries;
}

export function formattedSummaryDisplayData(type, dataList) {
    if (isSummationType(type)) {
        return formatSummaryData(dataList);
    }
    if (isAverageType(type)) {
        return formatAverageData(dataList);
    }
    if (isCountType(type)) {
        return formatCountData(dataList);
    }
    if (isTextType(type)) {
        return formatTextData(dataList);
    }
    if (isDateType(type)) {
        return formatDateType(dataList);
    }

    return formatUnknownData(dataList);
}

function calculateValues(existingItem, field) {
    const { abbreviation, displayName, id, type, data, color } = field;

    if (!existingItem) {
        existingItem = {
            abbreviation,
            displayName,
            id,
            type,
            color,
            dataIds: [],
            count: 0,
            value: 0,
            sum: 0,
            selected: true
        };
    }
    existingItem = { ...existingItem };
    data.forEach((dataItem) => {
        const key = dataItem.objectId + ' - ' + dataItem.secondaryObjectId;

        if (existingItem.dataIds.includes(key)) {
            return;
        }
        existingItem.count += 1;
        existingItem.dataIds.push(key);
        existingItem.sum += formatDataValue(dataItem.value, type);
    });
    existingItem.value =
        existingItem.count > 0 && isAverageType(type) ? existingItem.sum / existingItem.count : existingItem.sum;

    return existingItem;
}

function formatSummaryData(dataList) {
    return dataList.reduce((sum, data) => {
        return sum + data.value;
    }, 0);
}

function formatAverageData(dataList) {
    if (dataList.length <= 0) {
        return 0;
    }

    return formatSummaryData(dataList) / dataList.length;
}

function formatCountData(dataList) {
    const countMap = dataList.reduce((map, data) => {
        var key = data.value;
        var count = map[key];

        if (!count) {
            count = 0;
        }
        count++;
        map[key] = count;

        return map;
    }, {});

    return Object.entries(countMap)
        .reduce((text, [name, count]) => {
            return text + '\n' + name + ': ' + count;
        }, '')
        .replace(/^(\n)/, '');
}

function formatTextData(dataList) {
    return dataList
        .reduce((text, data) => {
            if (data.value) {
                text = text + '\n' + data.value;
            }

            return text;
        }, '')
        .replace(/^(\n)/, '');
}

function formatDateType(dataList) {
    if (dataList.length > 0) {
        return dataList[0].value;
    }

    return '';
}

function formatUnknownData(dataList) {
    return formatTextData(dataList);
}