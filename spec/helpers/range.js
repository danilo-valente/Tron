module.exports = range;

/**
 * Create an array with elements from [start] to [end], incrementing by [increment]
 * @param {number} start
 * @param {number} end
 * @param {number} [increment=1]
 * @returns {Array.<number>}
 */
function range(start, end, increment) {
    increment = increment || 1;

    if (end === undefined) {
        end = start;
        start = 1;
    }

    var result = [];
    for (var i = start; i <= end; i += increment) {
        result.push(i);
    }

    return result;
}