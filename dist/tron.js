(function (f) {
    if (typeof exports === "object" && typeof module !== "undefined") {
        module.exports = f()
    } else if (typeof define === "function" && define.amd) {
        define([], f)
    } else {
        var g;
        if (typeof window !== "undefined") {
            g = window
        } else if (typeof global !== "undefined") {
            g = global
        } else if (typeof self !== "undefined") {
            g = self
        } else {
            g = this
        }
        g.Tron = f()
    }
})(function () {
    var define, module, exports;
    return (function e(t, n, r) {
        function s(o, u) {
            if (!n[o]) {
                if (!t[o]) {
                    var a = typeof require == "function" && require;
                    if (!u && a) return a(o, !0);
                    if (i) return i(o, !0);
                    var f = new Error("Cannot find module '" + o + "'");
                    throw f.code = "MODULE_NOT_FOUND", f
                }
                var l = n[o] = {
                    exports: {}
                };
                t[o][0].call(l.exports, function (e) {
                    var n = t[o][1][e];
                    return s(n ? n : e)
                }, l, l.exports, e, t, n, r)
            }
            return n[o].exports
        }
        var i = typeof require == "function" && require;
        for (var o = 0; o < r.length; o++) s(r[o]);
        return s
    })({
        1: [function (require, module, exports) {
            module.exports = require('./lib/Tron');

        },
        {
            "./lib/Tron": 5
        }],
        2: [function (require, module, exports) {
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
                seconds: '*',
                minutes: '*',
                hours: '*',
                daysOfMonth: '*',
                months: '*',
                daysOfWeek: '*'
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
                seconds: [0, 59],
                minutes: [0, 59],
                hours: [0, 23],
                daysOfMonth: [1, 31],
                months: [1, 12],
                daysOfWeek: [0, 7]
            };

            /**
             * Days in months
             * @type {Array.<number>}
             * @constant
             */
            var DAYS_IN_MONTH = [
            31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

            /**
             * Expression class constructor
             * @constructor
             * @param {Array.<Array.<number>>} fields  Expression fields parsed values
             */

            function Expression(fields) { /** @type {Array.<number>} */
                this.seconds = fields[0]; /** @type {Array.<number>} */
                this.minutes = fields[1]; /** @type {Array.<number>} */
                this.hours = fields[2]; /** @type {Array.<number>} */
                this.daysOfMonth = fields[3]; /** @type {Array.<number>} */
                this.months = fields[4]; /** @type {Array.<number>} */
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
            Expression.prototype.next = function (currentDate, endDate) { /** @type XDate */
                currentDate = new XDate(currentDate); /** @type XDate */
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

                    var isDayOfMonthWildcardMatch = _isWildcardRange(daysOfMonth, dayOfMonthConstraints[0], dayOfMonthConstraints[1]);
                    var isMonthWildcardMatch = _isWildcardRange(daysOfWeek, monthConstraints[0], monthConstraints[1]);
                    var isDayOfWeekWildcardMatch = _isWildcardRange(daysOfWeek, dayOfWeekConstraints[0], dayOfWeekConstraints[1]);

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
             * Parse input expression
             *
             * @public
             * @param {String} expression Input expression
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
             * Detect if input range fully matches constraint bounds
             * @param {Array} valuesRange Input range
             * @param {number} min
             * @param {number} max
             * @returns {Boolean}
             * @private
             */

            function _isWildcardRange(valuesRange, min, max) {
                return valuesRange.length > 0 && valuesRange.length === max + (min < 1 ? 1 : 0);
            }
        },
        {
            "./Set": 4,
            "./XDate": 6,
            "./parser": 7,
            "./range": 8,
            "assert": 9
        }],
        3: [function (require, module, exports) {
            'use strict';

            var XDate = require('./XDate');
            var Expression = require('./Expression');

            /** @type {Scheduler} */
            module.exports = Scheduler;

            /**
             * Scheduler class constructor
             * @param {(Expression|String)} expr
             * @param {Date=} [startDate=new Date()]
             * @param {Date=} endDate
             * @constructor
             */

            function Scheduler(expr, startDate, endDate) {
                if (!startDate) {
                    startDate = new Date();
                }

                /** @type {Expression} */
                this._expression = expr instanceof Expression ? expr : Expression.parse(expr); /** @type {Date} */
                this._startDate = startDate; /** @type {Date} */
                this._endDate = endDate; /** @type {XDate} */
                this._currentDate = new XDate(startDate);
            }

            /**
             * Find next suitable date
             *
             * @public
             * @return {Date}
             */
            Scheduler.prototype.next = function () {
                var nextDate = this._expression.next(this._currentDate, this._endDate);

                // When internal date is not mutated, append one second as a padding
                if (!nextDate || this._currentDate.getTime() !== nextDate.getTime()) {
                    nextDate.addSecond();
                }

                return nextDate;
            };

            /**
             * Check if next suitable date exists
             *
             * @public
             * @return {Boolean}
             */
            Scheduler.prototype.hasNext = function () {
                return this._expression.hasNext(this._currentDate);
            };

            /**
             * Reset expression iterator state
             * @public
             */
            Scheduler.prototype.reset = function () {
                this._currentDate = new XDate(this._startDate);
            };
        },
        {
            "./Expression": 2,
            "./XDate": 6
        }],
        4: [function (require, module, exports) {
            module.exports = Set;

            /**
             * Set class constructor
             * @param {(Set|Array|*)} collection
             * @param {Function} wrapper
             * @constructor
             */

            function Set(collection, wrapper) {
                if (typeof collection === 'function') {
                    wrapper = collection;
                    collection = null;
                }

                /** @type {Object.<String, *>} */
                this._items = {}; /** @type {number} */
                this._length = 0; /** @type {Function} */
                this._wrapper = typeof wrapper === 'function' ? wrapper : String;

                if (collection instanceof Set) {
                    this.addAll(collection._items);
                } else if (Array.isArray(collection)) {
                    this.addAll(collection);
                }
            }

            /**
             * Add item to set
             * @param {*} item
             */
            Set.prototype.add = function (item) {
                if (!this.contains(item)) {
                    this._items[item] = true;
                    this._length++;
                }
            };

            /**
             * Add all items to set
             * @param {(Array.<*>|Set<*>)} items
             */
            Set.prototype.addAll = function (items) {
                if (items instanceof Set) {
                    items = Object.keys(items._items);
                }

                var self = this;
                items.forEach(function (item) {
                    self.add(item);
                });
            };

            /**
             * Check if set contains item
             * @param {Boolean} item
             */
            Set.prototype.contains = function (item) {
                return item in this._items;
            };

            /**
             * Remove item from set
             */
            Set.prototype.remove = function (item) {
                if (this.contains(item)) {
                    delete this._items[item];
                    this._length--;
                    return true;
                }

                return false;
            };

            /**
             * Length of the set
             * @returns {number}
             */
            Set.prototype.length = function () {
                return this._length;
            };

            /**
             * Array representation of the set
             * @returns {Array.<*>}
             */
            Set.prototype.toArray = function () {
                var self = this;
                return Object.keys(this._items).map(function (item) {
                    return self._wrapper(item);
                });
            };

            /**
             * Sorted array representation of the set
             * @param {Function=} fn
             * @returns {Array.<*>}
             */
            Set.prototype.toSortedArray = function (fn) {
                return this.toArray().sort(fn ||
                function (a, b) {
                    if (a < b) {
                        return -1;
                    }
                    if (a > b) {
                        return 1;
                    }
                    return 0;
                });
            };

            Set.Number = function (collection) {
                return new Set(collection, Number);
            };
        },
        {}],
        5: [function (require, module, exports) {
            'use strict';

            var Expression = require('./Expression');
            var Scheduler = require('./Scheduler');

            module.exports = {
                Expression: Expression,
                Scheduler: Scheduler,
                version: '0.1.0'
            };
        },
        {
            "./Expression": 2,
            "./Scheduler": 3
        }],
        6: [function (require, module, exports) {
            'use strict';

            module.exports = XDate;

            /**
             * XDate constructor
             * @constructor
             * @param {Date} date
             */

            function XDate(date) { /** @type {Date} */
                this._date = new Date(date);
            }

            XDate.prototype.date = function () {
                return this._date;
            };

            /**
             * @returns {number}
             */
            XDate.prototype.getDate = function () {
                return this._date.getDate();
            };

            /**
             * @returns {number}
             */
            XDate.prototype.getDay = function () {
                return this._date.getDay();
            };

            /**
             * @returns {number}
             */
            XDate.prototype.getFullYear = function () {
                return this._date.getFullYear();
            };

            /**
             * @returns {number}
             */
            XDate.prototype.getHours = function () {
                return this._date.getHours();
            };

            /**
             * @returns {number}
             */
            XDate.prototype.getMinutes = function () {
                return this._date.getMinutes();
            };

            /**
             * @returns {number}
             */
            XDate.prototype.getMilliseconds = function () {
                return this._date.getMilliseconds();
            };

            /**
             * @returns {number}
             */
            XDate.prototype.getMonth = function () {
                return this._date.getMonth();
            };

            /**
             * @returns {number}
             */
            XDate.prototype.getSeconds = function () {
                return this._date.getSeconds();
            };

            /**
             * @returns {number}
             */
            XDate.prototype.getTime = function () {
                return this._date.getTime();
            };

            /**
             * @param {number} value
             */
            XDate.prototype.setDate = function (value) {
                this._date.setDate(value);
            };

            /**
             * @param {number} value
             */
            XDate.prototype.setFullYear = function (value) {
                this._date.setFullYear(value);
            };

            /**
             * @param {number} value
             */
            XDate.prototype.setHours = function (value) {
                this._date.setHours(value);
            };

            /**
             * @param {number} value
             */
            XDate.prototype.setMilliseconds = function (value) {
                this._date.setMilliseconds(value);
            };

            /**
             * @param {number} value
             */
            XDate.prototype.setMinutes = function (value) {
                this._date.setMinutes(value);
            };

            /**
             * @param {number} value
             */
            XDate.prototype.setMonth = function (value) {
                this._date.setMonth(value);
            };

            /**
             * @param {number} value
             */
            XDate.prototype.setTime = function (value) {
                this._date.setTime(value);
            };

            /**
             * @param {number} value
             */
            XDate.prototype.setSeconds = function (value) {
                this._date.setSeconds(value);
            };

            /**
             * Increment year
             */
            XDate.prototype.addYear = function () {
                this.setFullYear(this.getFullYear() + 1);
            };

            /**
             * Increment month
             */
            XDate.prototype.addMonth = function () {
                this.setDate(1);
                this.setHours(0);
                this.setMinutes(0);
                this.setSeconds(0);
                this.setMonth(this.getMonth() + 1);
            };

            /**
             * Increment day
             */
            XDate.prototype.addDay = function () {
                var day = this.getDate();
                this.setDate(day + 1);

                this.setHours(0);
                this.setMinutes(0);
                this.setSeconds(0);

                if (this.getDate() === day) {
                    this.setDate(day + 2);
                }
            };

            /**
             * Increment hour
             */
            XDate.prototype.addHour = function () {
                var hours = this.getHours();
                this.setHours(hours + 1);

                if (this.getHours() === hours) {
                    this.setHours(hours + 2);
                }

                this.setMinutes(0);
                this.setSeconds(0);
            };

            /**
             * Increment minute
             */
            XDate.prototype.addMinute = function () {
                this.setMinutes(this.getMinutes() + 1);
                this.setSeconds(0);
            };

            /**
             * Increment second
             */
            XDate.prototype.addSecond = function () {
                this.setSeconds(this.getSeconds() + 1);
            };
        },
        {}],
        7: [function (require, module, exports) {
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

                var value = aliases && atom in aliases ? aliases[atom] : _parseInt(atom, minValue, maxValue);

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
        },
        {
            "./Set": 4,
            "./range": 8,
            "assert": 9
        }],
        8: [function (require, module, exports) {
            module.exports = range;

            /**
             * Create an array with elements from [start] to [end], incrementing by [increment]
             * @private
             * @param {number} start
             * @param {number} end
             * @param {number} [increment=1]
             * @returns {Array.<number>}
             */

            function range(start, end, increment) {
                increment = increment || 1;

                var result = [];
                for (var i = start; i <= end; i += increment) {
                    result.push(i);
                }

                return result;
            }
        },
        {}],
        9: [function (require, module, exports) {
            // http://wiki.commonjs.org/wiki/Unit_Testing/1.0
            //
            // THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
            //
            // Originally from narwhal.js (http://narwhaljs.org)
            // Copyright (c) 2009 Thomas Robinson <280north.com>
            //
            // Permission is hereby granted, free of charge, to any person obtaining a copy
            // of this software and associated documentation files (the 'Software'), to
            // deal in the Software without restriction, including without limitation the
            // rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
            // sell copies of the Software, and to permit persons to whom the Software is
            // furnished to do so, subject to the following conditions:
            //
            // The above copyright notice and this permission notice shall be included in
            // all copies or substantial portions of the Software.
            //
            // THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
            // IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
            // FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
            // AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
            // ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
            // WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
            // when used in node, this will actually load the util module we depend on
            // versus loading the builtin util module as happens otherwise
            // this is a bug in node module loading as far as I am concerned
            var util = require('util/');

            var pSlice = Array.prototype.slice;
            var hasOwn = Object.prototype.hasOwnProperty;

            // 1. The assert module provides functions that throw
            // AssertionError's when particular conditions are not met. The
            // assert module must conform to the following interface.
            var assert = module.exports = ok;

            // 2. The AssertionError is defined in assert.
            // new assert.AssertionError({ message: message,
            //                             actual: actual,
            //                             expected: expected })
            assert.AssertionError = function AssertionError(options) {
                this.name = 'AssertionError';
                this.actual = options.actual;
                this.expected = options.expected;
                this.operator = options.operator;
                if (options.message) {
                    this.message = options.message;
                    this.generatedMessage = false;
                } else {
                    this.message = getMessage(this);
                    this.generatedMessage = true;
                }
                var stackStartFunction = options.stackStartFunction || fail;

                if (Error.captureStackTrace) {
                    Error.captureStackTrace(this, stackStartFunction);
                }
                else {
                    // non v8 browsers so we can have a stacktrace
                    var err = new Error();
                    if (err.stack) {
                        var out = err.stack;

                        // try to strip useless frames
                        var fn_name = stackStartFunction.name;
                        var idx = out.indexOf('\n' + fn_name);
                        if (idx >= 0) {
                            // once we have located the function frame
                            // we need to strip out everything before it (and its line)
                            var next_line = out.indexOf('\n', idx + 1);
                            out = out.substring(next_line + 1);
                        }

                        this.stack = out;
                    }
                }
            };

            // assert.AssertionError instanceof Error
            util.inherits(assert.AssertionError, Error);

            function replacer(key, value) {
                if (util.isUndefined(value)) {
                    return '' + value;
                }
                if (util.isNumber(value) && !isFinite(value)) {
                    return value.toString();
                }
                if (util.isFunction(value) || util.isRegExp(value)) {
                    return value.toString();
                }
                return value;
            }

            function truncate(s, n) {
                if (util.isString(s)) {
                    return s.length < n ? s : s.slice(0, n);
                } else {
                    return s;
                }
            }

            function getMessage(self) {
                return truncate(JSON.stringify(self.actual, replacer), 128) + ' ' + self.operator + ' ' + truncate(JSON.stringify(self.expected, replacer), 128);
            }

            // At present only the three keys mentioned above are used and
            // understood by the spec. Implementations or sub modules can pass
            // other keys to the AssertionError's constructor - they will be
            // ignored.
            // 3. All of the following functions must throw an AssertionError
            // when a corresponding condition is not met, with a message that
            // may be undefined if not provided.  All assertion methods provide
            // both the actual and expected values to the assertion error for
            // display purposes.

            function fail(actual, expected, message, operator, stackStartFunction) {
                throw new assert.AssertionError({
                    message: message,
                    actual: actual,
                    expected: expected,
                    operator: operator,
                    stackStartFunction: stackStartFunction
                });
            }

            // EXTENSION! allows for well behaved errors defined elsewhere.
            assert.fail = fail;

            // 4. Pure assertion tests whether a value is truthy, as determined
            // by !!guard.
            // assert.ok(guard, message_opt);
            // This statement is equivalent to assert.equal(true, !!guard,
            // message_opt);. To test strictly for the value true, use
            // assert.strictEqual(true, guard, message_opt);.

            function ok(value, message) {
                if (!value) fail(value, true, message, '==', assert.ok);
            }
            assert.ok = ok;

            // 5. The equality assertion tests shallow, coercive equality with
            // ==.
            // assert.equal(actual, expected, message_opt);
            assert.equal = function equal(actual, expected, message) {
                if (actual != expected) fail(actual, expected, message, '==', assert.equal);
            };

            // 6. The non-equality assertion tests for whether two objects are not equal
            // with != assert.notEqual(actual, expected, message_opt);
            assert.notEqual = function notEqual(actual, expected, message) {
                if (actual == expected) {
                    fail(actual, expected, message, '!=', assert.notEqual);
                }
            };

            // 7. The equivalence assertion tests a deep equality relation.
            // assert.deepEqual(actual, expected, message_opt);
            assert.deepEqual = function deepEqual(actual, expected, message) {
                if (!_deepEqual(actual, expected)) {
                    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
                }
            };

            function _deepEqual(actual, expected) {
                // 7.1. All identical values are equivalent, as determined by ===.
                if (actual === expected) {
                    return true;

                } else if (util.isBuffer(actual) && util.isBuffer(expected)) {
                    if (actual.length != expected.length) return false;

                    for (var i = 0; i < actual.length; i++) {
                        if (actual[i] !== expected[i]) return false;
                    }

                    return true;

                    // 7.2. If the expected value is a Date object, the actual value is
                    // equivalent if it is also a Date object that refers to the same time.
                } else if (util.isDate(actual) && util.isDate(expected)) {
                    return actual.getTime() === expected.getTime();

                    // 7.3 If the expected value is a RegExp object, the actual value is
                    // equivalent if it is also a RegExp object with the same source and
                    // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
                } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
                    return actual.source === expected.source && actual.global === expected.global && actual.multiline === expected.multiline && actual.lastIndex === expected.lastIndex && actual.ignoreCase === expected.ignoreCase;

                    // 7.4. Other pairs that do not both pass typeof value == 'object',
                    // equivalence is determined by ==.
                } else if (!util.isObject(actual) && !util.isObject(expected)) {
                    return actual == expected;

                    // 7.5 For all other Object pairs, including Array objects, equivalence is
                    // determined by having the same number of owned properties (as verified
                    // with Object.prototype.hasOwnProperty.call), the same set of keys
                    // (although not necessarily the same order), equivalent values for every
                    // corresponding key, and an identical 'prototype' property. Note: this
                    // accounts for both named and indexed properties on Arrays.
                } else {
                    return objEquiv(actual, expected);
                }
            }

            function isArguments(object) {
                return Object.prototype.toString.call(object) == '[object Arguments]';
            }

            function objEquiv(a, b) {
                if (util.isNullOrUndefined(a) || util.isNullOrUndefined(b)) return false;
                // an identical 'prototype' property.
                if (a.prototype !== b.prototype) return false;
                // if one is a primitive, the other must be same
                if (util.isPrimitive(a) || util.isPrimitive(b)) {
                    return a === b;
                }
                var aIsArgs = isArguments(a),
                    bIsArgs = isArguments(b);
                if ((aIsArgs && !bIsArgs) || (!aIsArgs && bIsArgs)) return false;
                if (aIsArgs) {
                    a = pSlice.call(a);
                    b = pSlice.call(b);
                    return _deepEqual(a, b);
                }
                var ka = objectKeys(a),
                    kb = objectKeys(b),
                    key, i;
                // having the same number of owned properties (keys incorporates
                // hasOwnProperty)
                if (ka.length != kb.length) return false;
                //the same set of keys (although not necessarily the same order),
                ka.sort();
                kb.sort();
                //~~~cheap key test
                for (i = ka.length - 1; i >= 0; i--) {
                    if (ka[i] != kb[i]) return false;
                }
                //equivalent values for every corresponding key, and
                //~~~possibly expensive deep test
                for (i = ka.length - 1; i >= 0; i--) {
                    key = ka[i];
                    if (!_deepEqual(a[key], b[key])) return false;
                }
                return true;
            }

            // 8. The non-equivalence assertion tests for any deep inequality.
            // assert.notDeepEqual(actual, expected, message_opt);
            assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
                if (_deepEqual(actual, expected)) {
                    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
                }
            };

            // 9. The strict equality assertion tests strict equality, as determined by ===.
            // assert.strictEqual(actual, expected, message_opt);
            assert.strictEqual = function strictEqual(actual, expected, message) {
                if (actual !== expected) {
                    fail(actual, expected, message, '===', assert.strictEqual);
                }
            };

            // 10. The strict non-equality assertion tests for strict inequality, as
            // determined by !==.  assert.notStrictEqual(actual, expected, message_opt);
            assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
                if (actual === expected) {
                    fail(actual, expected, message, '!==', assert.notStrictEqual);
                }
            };

            function expectedException(actual, expected) {
                if (!actual || !expected) {
                    return false;
                }

                if (Object.prototype.toString.call(expected) == '[object RegExp]') {
                    return expected.test(actual);
                } else if (actual instanceof expected) {
                    return true;
                } else if (expected.call({}, actual) === true) {
                    return true;
                }

                return false;
            }

            function _throws(shouldThrow, block, expected, message) {
                var actual;

                if (util.isString(expected)) {
                    message = expected;
                    expected = null;
                }

                try {
                    block();
                } catch (e) {
                    actual = e;
                }

                message = (expected && expected.name ? ' (' + expected.name + ').' : '.') + (message ? ' ' + message : '.');

                if (shouldThrow && !actual) {
                    fail(actual, expected, 'Missing expected exception' + message);
                }

                if (!shouldThrow && expectedException(actual, expected)) {
                    fail(actual, expected, 'Got unwanted exception' + message);
                }

                if ((shouldThrow && actual && expected && !expectedException(actual, expected)) || (!shouldThrow && actual)) {
                    throw actual;
                }
            }

            // 11. Expected to throw an error:
            // assert.throws(block, Error_opt, message_opt);
            assert.throws = function (block, /*optional*/ error, /*optional*/ message) {
                _throws.apply(this, [true].concat(pSlice.call(arguments)));
            };

            // EXTENSION! This is annoying to write outside this module.
            assert.doesNotThrow = function (block, /*optional*/ message) {
                _throws.apply(this, [false].concat(pSlice.call(arguments)));
            };

            assert.ifError = function (err) {
                if (err) {
                    throw err;
                }
            };

            var objectKeys = Object.keys ||
            function (obj) {
                var keys = [];
                for (var key in obj) {
                    if (hasOwn.call(obj, key)) keys.push(key);
                }
                return keys;
            };

        },
        {
            "util/": 13
        }],
        10: [function (require, module, exports) {
            if (typeof Object.create === 'function') {
                // implementation from standard node.js 'util' module
                module.exports = function inherits(ctor, superCtor) {
                    ctor.super_ = superCtor
                    ctor.prototype = Object.create(superCtor.prototype, {
                        constructor: {
                            value: ctor,
                            enumerable: false,
                            writable: true,
                            configurable: true
                        }
                    });
                };
            } else {
                // old school shim for old browsers
                module.exports = function inherits(ctor, superCtor) {
                    ctor.super_ = superCtor
                    var TempCtor = function () {}
                    TempCtor.prototype = superCtor.prototype
                    ctor.prototype = new TempCtor()
                    ctor.prototype.constructor = ctor
                }
            }

        },
        {}],
        11: [function (require, module, exports) {
            // shim for using process in browser
            var process = module.exports = {};
            var queue = [];
            var draining = false;
            var currentQueue;
            var queueIndex = -1;

            function cleanUpNextTick() {
                draining = false;
                if (currentQueue.length) {
                    queue = currentQueue.concat(queue);
                } else {
                    queueIndex = -1;
                }
                if (queue.length) {
                    drainQueue();
                }
            }

            function drainQueue() {
                if (draining) {
                    return;
                }
                var timeout = setTimeout(cleanUpNextTick);
                draining = true;

                var len = queue.length;
                while (len) {
                    currentQueue = queue;
                    queue = [];
                    while (++queueIndex < len) {
                        currentQueue[queueIndex].run();
                    }
                    queueIndex = -1;
                    len = queue.length;
                }
                currentQueue = null;
                draining = false;
                clearTimeout(timeout);
            }

            process.nextTick = function (fun) {
                var args = new Array(arguments.length - 1);
                if (arguments.length > 1) {
                    for (var i = 1; i < arguments.length; i++) {
                        args[i - 1] = arguments[i];
                    }
                }
                queue.push(new Item(fun, args));
                if (queue.length === 1 && !draining) {
                    setTimeout(drainQueue, 0);
                }
            };

            // v8 likes predictible objects


            function Item(fun, array) {
                this.fun = fun;
                this.array = array;
            }
            Item.prototype.run = function () {
                this.fun.apply(null, this.array);
            };
            process.title = 'browser';
            process.browser = true;
            process.env = {};
            process.argv = [];
            process.version = ''; // empty string to avoid regexp issues
            process.versions = {};

            function noop() {}

            process.on = noop;
            process.addListener = noop;
            process.once = noop;
            process.off = noop;
            process.removeListener = noop;
            process.removeAllListeners = noop;
            process.emit = noop;

            process.binding = function (name) {
                throw new Error('process.binding is not supported');
            };

            // TODO(shtylman)
            process.cwd = function () {
                return '/'
            };
            process.chdir = function (dir) {
                throw new Error('process.chdir is not supported');
            };
            process.umask = function () {
                return 0;
            };

        },
        {}],
        12: [function (require, module, exports) {
            module.exports = function isBuffer(arg) {
                return arg && typeof arg === 'object' && typeof arg.copy === 'function' && typeof arg.fill === 'function' && typeof arg.readUInt8 === 'function';
            }
        },
        {}],
        13: [function (require, module, exports) {
            (function (process, global) {
                // Copyright Joyent, Inc. and other Node contributors.
                //
                // Permission is hereby granted, free of charge, to any person obtaining a
                // copy of this software and associated documentation files (the
                // "Software"), to deal in the Software without restriction, including
                // without limitation the rights to use, copy, modify, merge, publish,
                // distribute, sublicense, and/or sell copies of the Software, and to permit
                // persons to whom the Software is furnished to do so, subject to the
                // following conditions:
                //
                // The above copyright notice and this permission notice shall be included
                // in all copies or substantial portions of the Software.
                //
                // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
                // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
                // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
                // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
                // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
                // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
                // USE OR OTHER DEALINGS IN THE SOFTWARE.
                var formatRegExp = /%[sdj%]/g;
                exports.format = function (f) {
                    if (!isString(f)) {
                        var objects = [];
                        for (var i = 0; i < arguments.length; i++) {
                            objects.push(inspect(arguments[i]));
                        }
                        return objects.join(' ');
                    }

                    var i = 1;
                    var args = arguments;
                    var len = args.length;
                    var str = String(f).replace(formatRegExp, function (x) {
                        if (x === '%%') return '%';
                        if (i >= len) return x;
                        switch (x) {
                        case '%s':
                            return String(args[i++]);
                        case '%d':
                            return Number(args[i++]);
                        case '%j':
                            try {
                                return JSON.stringify(args[i++]);
                            } catch (_) {
                                return '[Circular]';
                            }
                        default:
                            return x;
                        }
                    });
                    for (var x = args[i]; i < len; x = args[++i]) {
                        if (isNull(x) || !isObject(x)) {
                            str += ' ' + x;
                        } else {
                            str += ' ' + inspect(x);
                        }
                    }
                    return str;
                };


                // Mark that a method should not be used.
                // Returns a modified function which warns once by default.
                // If --no-deprecation is set, then it is a no-op.
                exports.deprecate = function (fn, msg) {
                    // Allow for deprecating things in the process of starting up.
                    if (isUndefined(global.process)) {
                        return function () {
                            return exports.deprecate(fn, msg).apply(this, arguments);
                        };
                    }

                    if (process.noDeprecation === true) {
                        return fn;
                    }

                    var warned = false;

                    function deprecated() {
                        if (!warned) {
                            if (process.throwDeprecation) {
                                throw new Error(msg);
                            } else if (process.traceDeprecation) {
                                console.trace(msg);
                            } else {
                                console.error(msg);
                            }
                            warned = true;
                        }
                        return fn.apply(this, arguments);
                    }

                    return deprecated;
                };


                var debugs = {};
                var debugEnviron;
                exports.debuglog = function (set) {
                    if (isUndefined(debugEnviron)) debugEnviron = process.env.NODE_DEBUG || '';
                    set = set.toUpperCase();
                    if (!debugs[set]) {
                        if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
                            var pid = process.pid;
                            debugs[set] = function () {
                                var msg = exports.format.apply(exports, arguments);
                                console.error('%s %d: %s', set, pid, msg);
                            };
                        } else {
                            debugs[set] = function () {};
                        }
                    }
                    return debugs[set];
                };


                /**
                 * Echos the value of a value. Trys to print the value out
                 * in the best way possible given the different types.
                 *
                 * @param {Object} obj The object to print out.
                 * @param {Object} opts Optional options object that alters the output.
                 */
                /* legacy: obj, showHidden, depth, colors*/

                function inspect(obj, opts) {
                    // default options
                    var ctx = {
                        seen: [],
                        stylize: stylizeNoColor
                    };
                    // legacy...
                    if (arguments.length >= 3) ctx.depth = arguments[2];
                    if (arguments.length >= 4) ctx.colors = arguments[3];
                    if (isBoolean(opts)) {
                        // legacy...
                        ctx.showHidden = opts;
                    } else if (opts) {
                        // got an "options" object
                        exports._extend(ctx, opts);
                    }
                    // set default options
                    if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
                    if (isUndefined(ctx.depth)) ctx.depth = 2;
                    if (isUndefined(ctx.colors)) ctx.colors = false;
                    if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
                    if (ctx.colors) ctx.stylize = stylizeWithColor;
                    return formatValue(ctx, obj, ctx.depth);
                }
                exports.inspect = inspect;


                // http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
                inspect.colors = {
                    'bold': [1, 22],
                    'italic': [3, 23],
                    'underline': [4, 24],
                    'inverse': [7, 27],
                    'white': [37, 39],
                    'grey': [90, 39],
                    'black': [30, 39],
                    'blue': [34, 39],
                    'cyan': [36, 39],
                    'green': [32, 39],
                    'magenta': [35, 39],
                    'red': [31, 39],
                    'yellow': [33, 39]
                };

                // Don't use 'blue' not visible on cmd.exe
                inspect.styles = {
                    'special': 'cyan',
                    'number': 'yellow',
                    'boolean': 'yellow',
                    'undefined': 'grey',
                    'null': 'bold',
                    'string': 'green',
                    'date': 'magenta',
                    // "name": intentionally not styling
                    'regexp': 'red'
                };


                function stylizeWithColor(str, styleType) {
                    var style = inspect.styles[styleType];

                    if (style) {
                        return '\u001b[' + inspect.colors[style][0] + 'm' + str + '\u001b[' + inspect.colors[style][1] + 'm';
                    } else {
                        return str;
                    }
                }


                function stylizeNoColor(str, styleType) {
                    return str;
                }


                function arrayToHash(array) {
                    var hash = {};

                    array.forEach(function (val, idx) {
                        hash[val] = true;
                    });

                    return hash;
                }


                function formatValue(ctx, value, recurseTimes) {
                    // Provide a hook for user-specified inspect functions.
                    // Check that value is an object with an inspect function on it
                    if (ctx.customInspect && value && isFunction(value.inspect) &&
                    // Filter out the util module, it's inspect function is special
                    value.inspect !== exports.inspect &&
                    // Also filter out any prototype objects using the circular check.
                    !(value.constructor && value.constructor.prototype === value)) {
                        var ret = value.inspect(recurseTimes, ctx);
                        if (!isString(ret)) {
                            ret = formatValue(ctx, ret, recurseTimes);
                        }
                        return ret;
                    }

                    // Primitive types cannot have properties
                    var primitive = formatPrimitive(ctx, value);
                    if (primitive) {
                        return primitive;
                    }

                    // Look up the keys of the object.
                    var keys = Object.keys(value);
                    var visibleKeys = arrayToHash(keys);

                    if (ctx.showHidden) {
                        keys = Object.getOwnPropertyNames(value);
                    }

                    // IE doesn't make error fields non-enumerable
                    // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
                    if (isError(value) && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
                        return formatError(value);
                    }

                    // Some type of object without properties can be shortcutted.
                    if (keys.length === 0) {
                        if (isFunction(value)) {
                            var name = value.name ? ': ' + value.name : '';
                            return ctx.stylize('[Function' + name + ']', 'special');
                        }
                        if (isRegExp(value)) {
                            return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
                        }
                        if (isDate(value)) {
                            return ctx.stylize(Date.prototype.toString.call(value), 'date');
                        }
                        if (isError(value)) {
                            return formatError(value);
                        }
                    }

                    var base = '',
                        array = false,
                        braces = ['{', '}'];

                    // Make Array say that they are Array
                    if (isArray(value)) {
                        array = true;
                        braces = ['[', ']'];
                    }

                    // Make functions say that they are functions
                    if (isFunction(value)) {
                        var n = value.name ? ': ' + value.name : '';
                        base = ' [Function' + n + ']';
                    }

                    // Make RegExps say that they are RegExps
                    if (isRegExp(value)) {
                        base = ' ' + RegExp.prototype.toString.call(value);
                    }

                    // Make dates with properties first say the date
                    if (isDate(value)) {
                        base = ' ' + Date.prototype.toUTCString.call(value);
                    }

                    // Make error with message first say the error
                    if (isError(value)) {
                        base = ' ' + formatError(value);
                    }

                    if (keys.length === 0 && (!array || value.length == 0)) {
                        return braces[0] + base + braces[1];
                    }

                    if (recurseTimes < 0) {
                        if (isRegExp(value)) {
                            return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
                        } else {
                            return ctx.stylize('[Object]', 'special');
                        }
                    }

                    ctx.seen.push(value);

                    var output;
                    if (array) {
                        output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
                    } else {
                        output = keys.map(function (key) {
                            return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
                        });
                    }

                    ctx.seen.pop();

                    return reduceToSingleString(output, base, braces);
                }


                function formatPrimitive(ctx, value) {
                    if (isUndefined(value)) return ctx.stylize('undefined', 'undefined');
                    if (isString(value)) {
                        var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '').replace(/'/g, "\\'").replace(/\\"/g, '"') + '\'';
                        return ctx.stylize(simple, 'string');
                    }
                    if (isNumber(value)) return ctx.stylize('' + value, 'number');
                    if (isBoolean(value)) return ctx.stylize('' + value, 'boolean');
                    // For some reason typeof null is "object", so special case here.
                    if (isNull(value)) return ctx.stylize('null', 'null');
                }


                function formatError(value) {
                    return '[' + Error.prototype.toString.call(value) + ']';
                }


                function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
                    var output = [];
                    for (var i = 0, l = value.length; i < l; ++i) {
                        if (hasOwnProperty(value, String(i))) {
                            output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, String(i), true));
                        } else {
                            output.push('');
                        }
                    }
                    keys.forEach(function (key) {
                        if (!key.match(/^\d+$/)) {
                            output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, key, true));
                        }
                    });
                    return output;
                }


                function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
                    var name, str, desc;
                    desc = Object.getOwnPropertyDescriptor(value, key) || {
                        value: value[key]
                    };
                    if (desc.get) {
                        if (desc.set) {
                            str = ctx.stylize('[Getter/Setter]', 'special');
                        } else {
                            str = ctx.stylize('[Getter]', 'special');
                        }
                    } else {
                        if (desc.set) {
                            str = ctx.stylize('[Setter]', 'special');
                        }
                    }
                    if (!hasOwnProperty(visibleKeys, key)) {
                        name = '[' + key + ']';
                    }
                    if (!str) {
                        if (ctx.seen.indexOf(desc.value) < 0) {
                            if (isNull(recurseTimes)) {
                                str = formatValue(ctx, desc.value, null);
                            } else {
                                str = formatValue(ctx, desc.value, recurseTimes - 1);
                            }
                            if (str.indexOf('\n') > -1) {
                                if (array) {
                                    str = str.split('\n').map(function (line) {
                                        return '  ' + line;
                                    }).join('\n').substr(2);
                                } else {
                                    str = '\n' + str.split('\n').map(function (line) {
                                        return '   ' + line;
                                    }).join('\n');
                                }
                            }
                        } else {
                            str = ctx.stylize('[Circular]', 'special');
                        }
                    }
                    if (isUndefined(name)) {
                        if (array && key.match(/^\d+$/)) {
                            return str;
                        }
                        name = JSON.stringify('' + key);
                        if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
                            name = name.substr(1, name.length - 2);
                            name = ctx.stylize(name, 'name');
                        } else {
                            name = name.replace(/'/g, "\\'").replace(/\\"/g, '"').replace(/(^"|"$)/g, "'");
                            name = ctx.stylize(name, 'string');
                        }
                    }

                    return name + ': ' + str;
                }


                function reduceToSingleString(output, base, braces) {
                    var numLinesEst = 0;
                    var length = output.reduce(function (prev, cur) {
                        numLinesEst++;
                        if (cur.indexOf('\n') >= 0) numLinesEst++;
                        return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
                    }, 0);

                    if (length > 60) {
                        return braces[0] + (base === '' ? '' : base + '\n ') + ' ' + output.join(',\n  ') + ' ' + braces[1];
                    }

                    return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
                }


                // NOTE: These type checking functions intentionally don't use `instanceof`
                // because it is fragile and can be easily faked with `Object.create()`.


                function isArray(ar) {
                    return Array.isArray(ar);
                }
                exports.isArray = isArray;

                function isBoolean(arg) {
                    return typeof arg === 'boolean';
                }
                exports.isBoolean = isBoolean;

                function isNull(arg) {
                    return arg === null;
                }
                exports.isNull = isNull;

                function isNullOrUndefined(arg) {
                    return arg == null;
                }
                exports.isNullOrUndefined = isNullOrUndefined;

                function isNumber(arg) {
                    return typeof arg === 'number';
                }
                exports.isNumber = isNumber;

                function isString(arg) {
                    return typeof arg === 'string';
                }
                exports.isString = isString;

                function isSymbol(arg) {
                    return typeof arg === 'symbol';
                }
                exports.isSymbol = isSymbol;

                function isUndefined(arg) {
                    return arg === void 0;
                }
                exports.isUndefined = isUndefined;

                function isRegExp(re) {
                    return isObject(re) && objectToString(re) === '[object RegExp]';
                }
                exports.isRegExp = isRegExp;

                function isObject(arg) {
                    return typeof arg === 'object' && arg !== null;
                }
                exports.isObject = isObject;

                function isDate(d) {
                    return isObject(d) && objectToString(d) === '[object Date]';
                }
                exports.isDate = isDate;

                function isError(e) {
                    return isObject(e) && (objectToString(e) === '[object Error]' || e instanceof Error);
                }
                exports.isError = isError;

                function isFunction(arg) {
                    return typeof arg === 'function';
                }
                exports.isFunction = isFunction;

                function isPrimitive(arg) {
                    return arg === null || typeof arg === 'boolean' || typeof arg === 'number' || typeof arg === 'string' || typeof arg === 'symbol' || // ES6 symbol
                    typeof arg === 'undefined';
                }
                exports.isPrimitive = isPrimitive;

                exports.isBuffer = require('./support/isBuffer');

                function objectToString(o) {
                    return Object.prototype.toString.call(o);
                }


                function pad(n) {
                    return n < 10 ? '0' + n.toString(10) : n.toString(10);
                }


                var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

                // 26 Feb 16:19:34


                function timestamp() {
                    var d = new Date();
                    var time = [pad(d.getHours()), pad(d.getMinutes()), pad(d.getSeconds())].join(':');
                    return [d.getDate(), months[d.getMonth()], time].join(' ');
                }


                // log is just a thin wrapper to console.log that prepends a timestamp
                exports.log = function () {
                    console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
                };


                /**
                 * Inherit the prototype methods from one constructor into another.
                 *
                 * The Function.prototype.inherits from lang.js rewritten as a standalone
                 * function (not on Function.prototype). NOTE: If this file is to be loaded
                 * during bootstrapping this function needs to be rewritten using some native
                 * functions as prototype setup using normal JavaScript does not work as
                 * expected during bootstrapping (see mirror.js in r114903).
                 *
                 * @param {function} ctor Constructor function which needs to inherit the
                 *     prototype.
                 * @param {function} superCtor Constructor function to inherit prototype from.
                 */
                exports.inherits = require('inherits');

                exports._extend = function (origin, add) {
                    // Don't do anything if add isn't an object
                    if (!add || !isObject(add)) return origin;

                    var keys = Object.keys(add);
                    var i = keys.length;
                    while (i--) {
                        origin[keys[i]] = add[keys[i]];
                    }
                    return origin;
                };

                function hasOwnProperty(obj, prop) {
                    return Object.prototype.hasOwnProperty.call(obj, prop);
                }

            }).call(this, require('_process'), typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
        },
        {
            "./support/isBuffer": 12,
            "_process": 11,
            "inherits": 10
        }]
    }, {}, [1])(1)
});