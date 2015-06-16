var assert = require('assert');
var range = require('./range');
var Set = require('./Set');

module.exports = {
    parseField: parseField,
    parseAnd: parseAnd,
    parseRepeat: parseRepeat,
    parseRange: parseRange,
    parseLiteral: parseLiteral,
    andSet: andSet,
    repeatSet: repeatSet,
    rangeSet: rangeSet,
    literalSet: literalSet
};

/**
 * Parse a field
 * @param {String} field
 * @param {String} atom
 * @param {number} minValue
 * @param {number} maxValue
 * @param {Object.<String, number>} aliasMap
 */
function parseField(field, atom, minValue, maxValue, aliasMap) {
    // Check for valid characters.
    assert(/^[a-z\d\/\*\-,?]+$/i.test(atom), 'Invalid field ' + field + ' = ' + atom);

    var aliases = {};
    Object.keys(aliasMap || {}).forEach(function (key) {
        aliases[key.toUpperCase()] = aliasMap[key];
    });

    // and -> repeat -> range -> literal
    return parseAnd(field, atom, minValue, maxValue, aliases);
}

/**
 * Parse a sequence pattern (a,b,...)
 * @param {String} field
 * @param {String} atom
 * @param {number} minValue
 * @param {number} maxValue
 * @param {Object.<String, number>} aliases
 * @returns {Array.<number>}
 */
function parseAnd(field, atom, minValue, maxValue, aliases) {
    var valuesSet = _parseAnd(field, atom, minValue, maxValue, aliases);
    return valuesSet ? valuesSet.toSortedArray() : valuesSet;
}

/**
 * Parse a sequence pattern (a,b,...)
 * @private
 * @param {String} field
 * @param {String} atom
 * @param {number} minValue
 * @param {number} maxValue
 * @param {Object.<String, number>} aliases
 * @returns {Set.<number>}
 */
function _parseAnd(field, atom, minValue, maxValue, aliases) {
    assert(!/^,|,,|,$/.test(atom), 'Invalid sequence ' + atom);

    if (atom.indexOf(',') === -1) {
        return _parseRepeat(field, atom, minValue, maxValue, aliases);
    }
    
    var andValues = atom.split(',').map(function (p) {
        return _parseRepeat(field, p, minValue, maxValue, aliases);
    });

    return andSet(andValues, minValue, maxValue);
}

/**
 * Create a set for an array of values of an AND pattern
 * @param {Array.<Set.<number>>} values
 * @param {number} minValue
 * @param {number} maxValue
 * @returns {Set.<number>}
 */
function andSet(values, minValue, maxValue) {

    var valuesSet = Set.Number();
    var specified = false;
    var unspecified = false;

    values.forEach(function (subset) {

        if (subset !== null) {
            specified = true;

            // Accept both {number} and {Array.<number>}
            subset = typeof subset === 'number' ? [subset] : subset.toArray();
            subset.forEach(function (v) {
                _validateConstraints(v, minValue, maxValue);
                valuesSet.add(v);
            });

        } else {
            unspecified = true;
        }

        // Will not parse invalid expressions like ?,*
        assert(specified ^ unspecified, 'Invalid sequence ' + values.join(','));
    });

    return valuesSet;
}

/**
 * Parse a repeater pattern (offset/step)
 * @param {String} field
 * @param {String} atom
 * @param {number} minValue
 * @param {number} maxValue
 * @param {Object.<String, number>} aliases
 * @returns {Array.<number>}
 */
function parseRepeat(field, atom, minValue, maxValue, aliases) {
    var valuesSet = _parseRepeat(field, atom, minValue, maxValue, aliases);
    return valuesSet ? valuesSet.toSortedArray() : valuesSet;
}

/**
 * Parse a repeater pattern (offset/step)
 * @private
 * @param {String} field
 * @param {String} atom
 * @param {number} minValue
 * @param {number} maxValue
 * @param {Object.<String, number>} aliases
 * @returns {Set.<number>}
 */
function _parseRepeat(field, atom, minValue, maxValue, aliases) {
    if (atom.indexOf('/') === -1) {
        return _parseRange(field, atom, minValue, maxValue, aliases);
    }

    var parts = atom.split('/');
    assert(parts.length === 2, 'Invalid repetition ' + atom);

    var offset = _parseRange(field, parts[0], minValue, maxValue, aliases);
    if (!offset) {
        return null;
    }

    var step = _parseInt(parts[1], minValue);
    return _repeatSet(offset, step, minValue, maxValue);
}

/**
 * Create a set of repeater values
 * @param {number} offset
 * @param {number} step
 * @param {number} minValue
 * @param {number} maxValue
 * @returns {Set.<number>}
 */
function repeatSet(offset, step, minValue, maxValue) {
    return _repeatSet(Set.Number([offset]), step, minValue, maxValue);
}

/**
 * Create a set of repeater values
 * @param {Set.<number>} offset
 * @param {number} step
 * @param {number} minValue
 * @param {number} maxValue
 * @returns {Set.<number>}
 */
function _repeatSet(offset, step, minValue, maxValue) {
    _validateConstraints(step, 0, Number.MAX_SAFE_INTEGER, 'Repeater step cannot be negative');

    if (step === 0) {
        return offset;
    }

    var maxLen = maxValue - minValue + 1;
    var valuesSet = Set.Number();

    // Iterate over all possible offsets
    var array = offset.toArray();
    while (array.length > 0 && valuesSet.length() < maxLen) {
        var start = array.shift();
        _validateConstraints(start, minValue, maxValue);

        // Add all values from 'offset[0]' to 'maxValue' incrementing 'step'
        var repeatRange = range(start, maxValue, step);
        valuesSet.addAll(repeatRange);
    }

    return valuesSet;
}

/**
 * Parse a range pattern (start-end)
 * @param {String} field
 * @param {String} atom
 * @param {number} minValue
 * @param {number} maxValue
 * @param {Object.<String, number>} aliases
 * @returns {Array.<number>}
 */
function parseRange(field, atom, minValue, maxValue, aliases) {
    var valuesSet = _parseRange(field, atom, minValue, maxValue, aliases);
    return valuesSet ? valuesSet.toSortedArray() : valuesSet;
}

/**
 * Parse a range pattern (start-end)
 * @private
 * @param {String} field
 * @param {String} atom
 * @param {number} minValue
 * @param {number} maxValue
 * @param {Object.<String, number>} aliases
 * @returns {Set.<number>}
 */
function _parseRange(field, atom, minValue, maxValue, aliases) {
    if (atom.indexOf('-') === -1) {
        return _parseLiteral(field, atom, minValue, maxValue, aliases);
    }

    var parts = atom.split('-');
    assert(parts.length === 2, 'Invalid range ' + atom);

    var start = _parseLiteral(field, parts[0], minValue, maxValue, aliases);
    if (!start) {
        return null;
    }

    var end = _parseLiteral(field, parts[1], minValue, maxValue, aliases);
    if (!end) {
        return null;
    }

    return _rangeSet(start.toArray(), end.toArray(), minValue, maxValue);
}

/**
 * Create a set of range
 * @param {number} start
 * @param {number} end
 * @param {number} minValue
 * @param {number} maxValue
 * @returns {Set.<number>}
 */
function rangeSet(start, end, minValue, maxValue) {
    return _rangeSet([start], [end], minValue, maxValue);
}

/**
 * Create a set of range
 * @param {Array.<number>} start
 * @param {Array.<number>} end
 * @param {number} minValue
 * @param {number} maxValue
 * @returns {Set.<number>}
 */
function _rangeSet(start, end, minValue, maxValue) {
    var maxLen = maxValue - minValue + 1;
    var valuesSet = Set.Number();

    // Iterate over all possible starting values
    while (start.length > 0 && valuesSet.length() < maxLen) {
        var s = start.shift();
        _validateConstraints(s, minValue, maxValue);

        // Iterate over all possible ending values
        while (end.length > 0 && valuesSet.length() < maxLen) {
            var e = end.shift();
            _validateConstraints(e, minValue, maxValue);
            assert(s <= e, 'Start value should be lower than or equal end value');

            // Add all values from 's' to 'e'
            valuesSet.addAll(range(s, e));
        }
    }

    return valuesSet;
}

/**
 * Parse *, ?, aliases and integer values
 * @param {String} field
 * @param {String} atom
 * @param {number} minValue
 * @param {number} maxValue
 * @param {Object.<String, number>} aliases
 * @returns {Array.<number>}
 */
function parseLiteral(field, atom, minValue, maxValue, aliases) {
    var valuesSet = _parseLiteral(field, atom, minValue, maxValue, aliases);
    return valuesSet ? valuesSet.toSortedArray() : valuesSet;
}

/**
 * Parse *, ?, aliases and integer values
 * @private
 * @param {String} field
 * @param {String} atom
 * @param {number} minValue
 * @param {number} maxValue
 * @param {Object.<String, number>} aliases
 * @returns {Set.<number>}
 */
function _parseLiteral(field, atom, minValue, maxValue, aliases) {
    if (atom === '?') {
        assert(field === 'daysOfWeek' || field === 'daysOfMonth', '? is only valid for daysOfWeek and daysOfMonth');
        return null;
    }

    return literalSet(atom, minValue, maxValue, aliases);
}
/**
 *
 * Create set for numeric values
 * @param {String} atom
 * @param {number} minValue
 * @param {number} maxValue
 * @param {Object.<String, number>} aliases
 * @returns {Set.<number>}
 */
function literalSet(atom, minValue, maxValue, aliases) {
    if (atom === '*') {
        var wildcardRange = range(minValue, maxValue);
        return Set.Number(wildcardRange);
    }

    var value = aliases && atom in aliases
        ? aliases[atom]
        : _parseInt(atom, minValue, maxValue);

    return Set.Number([value]);
}

/**
 * Parse integer values, respecting [minValue] and [maxValue] constraints
 * @private
 * @param {String} atom
 * @param {number} [minValue]
 * @param {number} [maxValue]
 * @returns {Number}
 */
function _parseInt(atom, minValue, maxValue) {

    assert(/^\d+$/.test(atom), 'Invalid number ' + atom);

    var n = parseInt(atom, 10);
    assert(!isNaN(n), 'Invalid number ' + atom);
    _validateConstraints(n, minValue, maxValue);

    return n;
}

/**
 * Validate number constraints
 * @private
 * @param {number} value
 * @param {number} [minValue=Number.MIN_VALUE]
 * @param {number} [maxValue=Number.MAX_VALUE]
 * @param {String} [message]
 */
function _validateConstraints(value, minValue, maxValue, message) {
    minValue = !isNaN(minValue) ? minValue : Number.MIN_VALUE;
    maxValue = !isNaN(maxValue) ? maxValue : Number.MAX_VALUE;

    if (!message) {
        message = 'Value ' + value + ' should be within range ' + minValue + ' and ' + maxValue;
    }

    assert(value >= minValue && value <= maxValue, message);
}