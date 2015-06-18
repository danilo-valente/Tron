'use strict';

var assert = require('assert');
var range = require('./range');
var parser = require('./parser');
var XDate = require('./XDate');
var Set = require('./Set');

/** @type {Expression} */
module.exports = Expression;

/**
 * Field aliases
 * @type {Object}
 * @constant
 */
var ALIASES = {
    seconds: {},
    minutes: {},
    hours: {},
    daysOfMonth: {},
    months: {
        JAN: 1,
        FEB: 2,
        MAR: 3,
        APR: 4,
        MAY: 5,
        JUN: 6,
        JUL: 7,
        AUG: 8,
        SEP: 9,
        OCT: 10,
        NOV: 11,
        DEC: 12
    },
    daysOfWeek: {
        SUN: 0,
        MON: 1,
        TUE: 2,
        WED: 3,
        THU: 4,
        FRI: 5,
        SAT: 6
    }
};

/**
 * Field mappings
 * @type {Array}
 * @constant
 */
var FIELDS = ['seconds', 'minutes', 'hours', 'daysOfMonth', 'months', 'daysOfWeek'];

/**
 * Field defaults
 * @type {Array}
 * @constant
 */
var DEFAULTS = {
    seconds:     '*',
    minutes:     '*',
    hours:       '*',
    daysOfMonth: '*',
    months:      '*',
    daysOfWeek:  '*'
};

/**
 * Prefined intervals
 * @type {Object}
 * @constant
 */
var PRESETS = {
    hourly: '0 0 * * * ?',
    daily: '0 0 0 * * ?',
    weekly: '0 0 0 ? * *',
    monthly: '0 0 0 1 * ?'
};

/**
 * Fields constraints
 * @type {Object.<Array.<number>>}
 * @constant
 */
var CONSTRAINTS = {
    seconds:     [0, 59],
    minutes:     [0, 59],
    hours:       [0, 23],
    daysOfMonth: [1, 31],
    months:      [1, 12],
    daysOfWeek:  [0, 7]
};

/**
 * Days in months
 * @type {Array.<number>}
 * @constant
 */
var DAYS_IN_MONTH = [
    31, 28, 31, 30, 31, 30,
    31, 31, 30, 31, 30, 31
];

/**
 * Expression class constructor
 * @constructor
 * @param {Array.<Array.<number>>} fields  Expression fields parsed values
 */
function Expression(fields) {
    /** @type {Array.<number>} */
    this.seconds = fields[0];
    /** @type {Array.<number>} */
    this.minutes = fields[1];
    /** @type {Array.<number>} */
    this.hours = fields[2];
    /** @type {Array.<number>} */
    this.daysOfMonth = fields[3];
    /** @type {Array.<number>} */
    this.months = fields[4];
    /** @type {Array.<number>} */
    this.daysOfWeek = fields[5];
}

/**
 * Set field value
 * @param {String} field
 * @param {(String|number)} value
 */
Expression.prototype.set = function (field, value) {
    if (typeof value === 'number') {
        return this.at(field, value);
    }

    _validateField(field);

    var constraints = CONSTRAINTS[field];
    var parsedValue = parser.parseField(field, value, constraints[0], constraints[1], ALIASES[field]);
    this._setField(field, parsedValue);
};

/**
 * Set wildcard for field
 * @param field
 */
Expression.prototype.every = function (field) {
    return this.set(field, '*');
};

/**
 * Comma-separated values
 * @param {String} field
 * @param {Array.<number>} values
 */
Expression.prototype.and = function (field, values) {
    _validateField(field);

    var constraints = CONSTRAINTS[field];
    var fieldValue = parser.andSet(values, constraints[0], constraints[1]);
    this._setField(field, fieldValue);
};

/**
 * Set literal value
 * @param {String} field
 * @param {number} value
 */
Expression.prototype.at = function (field, value) {
    _validateField(field);

    var constraints = CONSTRAINTS[field];
    var literalValue = parser.literalSet(value, constraints[0], constraints[1], ALIASES[field]);
    this._setField(field, literalValue);
};

/**
 * Range field (start-end)
 * @param {String} field
 * @param {number} start
 * @param {number} end
 */
Expression.prototype.range = function (field, start, end) {
    _validateField(field);

    var constraints = CONSTRAINTS[field];
    var rangeValue = parser.rangeSet(start, end, constraints[0], constraints[1]);
    this._setField(field, rangeValue);
};

/**
 * Repeat field (start/step)
 * @param {String} field
 * @param {number} offset
 * @param {number} step
 */
Expression.prototype.repeat = function (field, offset, step) {
    _validateField(field);

    var constraints = CONSTRAINTS[field];
    var repeatValue = parser.repeatSet(offset, step, constraints[0], constraints[1]);
    this._setField(field, repeatValue);
};

/**
 * Set value for field
 * @param {String} field
 * @param {(Array.<number>|Set.<number>)} value
 * @private
 */
Expression.prototype._setField = function (field, value) {
    if (field === 'daysOfWeek' || field === 'daysOfMonth') {
        var sibling = field === 'daysOfWeek' ? 'daysOfMonth' : 'daysOfWeek';
        assert(value, 'Cannot directly set ? for ' + field + '. Instead, just set ' + sibling + ' to any valid value');

        // Since we are setting a valid value for 'field', we must unset its sibling's value (set to ?=null)
        this[sibling] = null;
    }

    // Set the value of the field anyway
    this[field] = value instanceof Set ? value.toSortedArray() : value;
};

/**
 * Find next suitable dates
 * @public
 * @param {Date} startDate Start date
 * @param {Number=} steps Numbers of steps to iterate
 * @return {Array.<Date>} The next future dates
 */
Expression.prototype.nextDates = function (startDate, steps) {
    var dates = [];
    while (--steps >= 0) {
        startDate = this.next(startDate);
        dates.push(startDate);
    }

    return dates;
};

/**
 * Find next suitable date
 * @public
 * @param {Date} currentDate Current date
 * @param {Date=} endDate Current date
 * @return {Date} The next future date
 */
Expression.prototype.next = function (currentDate, endDate) {
    /** @type XDate */
    currentDate = new XDate(currentDate);
    /** @type XDate */
    endDate = endDate ? new XDate(endDate) : null;

    currentDate.addSecond();

    // Find matching schedule
    while (true) {
        // Validate timespan
        if (endDate && endDate.getTime() < currentDate.getTime()) {
            return null;
        }

        // Day of months and week matching:
        //
        // "The day of a command's execution can be specified by two fields --
        // day of months, and day of week.  If  both	 fields	 are  restricted  (ie,
        // aren't  *),  the command will be run when either field matches the cur-
        // rent time.  For example, "30 4 1,15 * 5" would cause a command to be
        // run at 4:30 am on the  1st and 15th of each months, plus every Friday."
        //
        // http://unixhelp.ed.ac.uk/CGI/man-cgi?crontab+5
        //
        var dayOfMonthConstraints = CONSTRAINTS.daysOfMonth;
        var monthConstraints = CONSTRAINTS.months;
        var dayOfWeekConstraints = CONSTRAINTS.daysOfWeek;

        var daysOfMonth = this.daysOfMonth || range(dayOfMonthConstraints[0], dayOfMonthConstraints[1]);
        var daysOfWeek = this.daysOfWeek || range(dayOfWeekConstraints[0], dayOfWeekConstraints[1]);

        var daysOfMonthMatch = _matchSchedule(currentDate.getDate(), daysOfMonth);
        var daysOfWeekMatch = _matchSchedule(currentDate.getDay(), daysOfWeek);

        var isDayOfMonthWildcardMatch = _isWildcard(daysOfMonth, dayOfMonthConstraints[0], dayOfMonthConstraints[1]);
        var isMonthWildcardMatch = _isWildcard(daysOfWeek, monthConstraints[0], monthConstraints[1]);
        var isDayOfWeekWildcardMatch = _isWildcard(daysOfWeek, dayOfWeekConstraints[0], dayOfWeekConstraints[1]);

        // Validate days in months if explicit value is given
        if (!isMonthWildcardMatch) {
            var currentYear = currentDate.getFullYear();
            var currentMonth = currentDate.getMonth() + 1;
            var previousMonth = currentMonth === 1 ? 11 : currentMonth - 1;
            var daysInPreviousMonth = DAYS_IN_MONTH[previousMonth - 1];
            var daysOfMonthRangeMax = daysOfMonth[daysOfMonth.length - 1];

            // Handle leap year
            var isLeap = currentYear % 4 === 0 && (currentYear % 100 !== 0 || currentYear % 400 === 0);
            if (isLeap) {
                daysInPreviousMonth = 29;
            }

            assert(this.months[0] !== previousMonth || daysInPreviousMonth >= daysOfMonthRangeMax, 'Invalid explicit day of months definition');
        }

        // Add day if not day of months is set (and no match) and day of week is wildcard
        if (!isDayOfMonthWildcardMatch && isDayOfWeekWildcardMatch && !daysOfMonthMatch) {
            currentDate.addDay();
            continue;
        }

        // Add day if not day of week is set (and no match) and day of months is wildcard
        if (isDayOfMonthWildcardMatch && !isDayOfWeekWildcardMatch && !daysOfWeekMatch) {
            currentDate.addDay();
            continue;
        }

        // Add day if day of month and week are non-wildcard values and both doesn't match
        if (!(isDayOfMonthWildcardMatch && isDayOfWeekWildcardMatch) && !daysOfMonthMatch && !daysOfWeekMatch) {
            currentDate.addDay();
            continue;
        }

        // Match months
        if (!_matchSchedule(currentDate.getMonth() + 1, this.months)) {
            currentDate.addMonth();
            continue;
        }

        // Match hours
        if (!_matchSchedule(currentDate.getHours(), this.hours)) {
            currentDate.addHour();
            continue;
        }

        // Match minutes
        if (!_matchSchedule(currentDate.getMinutes(), this.minutes)) {
            currentDate.addMinute();
            continue;
        }

        // Match seconds
        if (!_matchSchedule(currentDate.getSeconds(), this.seconds)) {
            currentDate.addSecond();
            continue;
        }

        break;
    }

    return currentDate.date();
};

/**
 * Check if next suitable date exists
 *
 * @public
 * @param {Date} startDate
 * @return {Boolean}
 */
Expression.prototype.hasNext = function (startDate) {
    return !!this.next(startDate);
};

/**
 * String representation of the expression
 * @returns {String}
 */
Expression.prototype.toString = function () {

    return _fieldToString('seconds', this.seconds) + ' '
        + _fieldToString('minutes', this.minutes) + ' '
        + _fieldToString('hours', this.hours) + ' '
        + _fieldToString('daysOfMonth', this.daysOfMonth) + ' '
        + _fieldToString('months', this.months) + ' '
        + _fieldToString('daysOfWeek', this.daysOfWeek);
};

/**
 * String representation of a field
 * @returns {String}
 */
Expression.prototype.fieldToString = function (field) {
    _validateField(field);

    return _fieldToString(field, this[field]);
};

/**
 * Parse input expression
 *
 * @public
 * @param {String} expression Input expression
 * @returns {Expression}
 */
Expression.parse = function (expression) {
    // Is input expression predefined?
    if (PRESETS[expression]) {
        expression = PRESETS[expression];
    }

    // Split fields
    var len = FIELDS.length;
    var atoms = expression.match(/\S+/g);
    assert(atoms.length === len, 'Invalid expression. Should contain exactly ' + len + ' atoms');

    // Resolve fields
    var fields = FIELDS.map(function (field, i) {
        var value = atoms[i] || DEFAULTS[field];
        var constraints = CONSTRAINTS[field];
        return parser.parseField(field, value, constraints[0], constraints[1], ALIASES[field]);
    });

    assert(fields[3] || fields[5], 'Must specify either daysOfMonth or daysOfWeek');
    assert((fields[3] && !fields[5]) || (!fields[3] && fields[5]), 'Cannot specify both daysOfMonth and daysOfWeek');

    return new Expression(fields);
};

/**
 * Set/get alias value
 * @param {String} field
 * @param {String} key
 * @param {number} [value]
 * @returns {(number|undefined)}
 */
Expression.alias = function (field, key, value) {
    _validateField(field);

    var aliases = ALIASES[field];
    var ikey = String(key).toUpperCase();

    if (value !== undefined) {
        aliases[ikey] = value;
        return;
    }

    return aliases[ikey];
};

/**
 * Validate field name
 * @param field
 * @private
 */
function _validateField(field) {
    assert(FIELDS.indexOf(field) !== -1, 'Invalid field ' + field);
}

/**
 * Match field value
 *
 * @param {number} value
 * @param {Array} sequence
 * @returns {Boolean}
 * @private
 */
function _matchSchedule(value, sequence) {
    var i, len = sequence.length;
    for (i = 0; i < len; i++) {
        if (sequence[i] >= value) {
            return sequence[i] === value;
        }
    }

    return sequence[0] === value;
}

/**
 * Stringify field
 * @param {String} field
 * @param {Array.<number>} values
 * @returns {String}
 * @private
 */
function _fieldToString(field, values) {
    var constraints = CONSTRAINTS[field];
    var minValue = constraints[0];
    var maxValue = constraints[1];

    if (!values) {
        return '?';
    }

     if (_isWildcard(values, minValue, maxValue)) {
         return '*';
     }

    return values.join(',');
}

/**
 * Detect if values array fully matches constraint bounds
 * @param {Array} values Input range
 * @param {number} minValue
 * @param {number} maxValue
 * @returns {Boolean}
 * @private
 */
function _isWildcard(values, minValue, maxValue) {
    return values.length > 0 && values.length === maxValue + (minValue < 1 ? 1 : 0);
}