var range = require('./helpers/range');

describe('parser', function () {

    var parser = require('../lib/parser');
    var Set = require('../lib/Set');

    var anySet = jasmine.any(Set);

    var MIN_VALUE = 1;
    var MAX_VALUE = 10;
    var FULL_RANGE = range(MIN_VALUE, MAX_VALUE);
    var ALIASES = {
        MY_ALIAS: 1,
        MON: 1,
        FRI: 5
    };

    describe('.parseLiteral', function () {

        it('should integer values', function () {
            var values = parseLiteral('minutes', '5');
            expect(values).toEqual([5]);
        });

        it('should parse aliases', function () {
            var values = parseLiteral('minutes', 'MY_ALIAS');
            expect(values).toEqual([1]);
        });

        it('should parse wildcards', function () {
            var values = parseLiteral('minutes', '*');
            expect(values).toEqual(FULL_RANGE);
        });

        it('should parse ? to null', function () {
            var values = parseLiteral('daysOfWeek', '?');
            expect(values).toEqual(null);
        });

        it('should fail to arse ? on minutes', function () {
            var fn = parseLiteral.bind(null, 'minutes', '?');
            expect(fn).toThrow();
        });

        /**
         * @param {String} field
         * @param {String} pattern
         * @returns {*}
         */
        function parseLiteral(field, pattern) {
            return parser.parseLiteral(field, pattern, MIN_VALUE, MAX_VALUE, ALIASES);
        }
    });

    describe('.parseRange', function () {

        it('should parse interval 1-5', function () {
            var values = parseRange('minutes', '1-5');
            expect(values).toEqual(range(1, 5));
        });

        it('should parse interval *-5', function () {
            var values = parseRange('minutes', '*-5');
            expect(values).toEqual(range(1, 5));
        });

        it('should parse interval 5-1', function () {
            var fn = parseRange.bind(null, 'minutes', '5-1');
            expect(fn).toThrow();
        });

        it('should parse interval 1-*', function () {
            var values = parseRange('minutes', '1-*');
            expect(values).toEqual(FULL_RANGE);
        });

        it('should parse interval MON-FRI', function () {
            var values = parseRange('daysOfWeek', 'MON-FRI');
            expect(values).toEqual(range(1, 5));
        });

        it('should parse interval ?-10 to null', function () {
            var values = parseRange('daysOfWeek', '?-10');
            expect(values).toEqual(null);
        });

        it('should parse interval 1-? to null', function () {
            var values = parseRange('daysOfMonth', '1-?');
            expect(values).toEqual(null);
        });

        it('should parse interval *-? to null', function () {
            var values = parseRange('daysOfMonth', '*-?');
            expect(values).toEqual(null);
        });

        it('should fail to parse interval 0-10', function () {
            var fn = parseRange.bind(null, 'minutes', '0-10');
            expect(fn).toThrow();
        });

        it('should fail to parse interval 1-11', function () {
            var fn = parseRange.bind(null, 'minutes', '1-11');
            expect(fn).toThrow();
        });

        /**
         * @param {String} field
         * @param {String} pattern
         * @returns {*}
         */
        function parseRange(field, pattern) {
            return parser.parseRange(field, pattern, MIN_VALUE, MAX_VALUE, ALIASES);
        }
    });

    describe('.parseRepeat', function () {

        it('should parse interval 1/2', function () {
            var values = parseRepeat('minutes', '1/2');
            expect(values).toEqual(range(1, MAX_VALUE, 2));
        });

        it('should parse interval 3/1', function () {
            var values = parseRepeat('minutes', '3/1');
            expect(values).toEqual(range(3, MAX_VALUE));
        });

        it('should parse interval 1/11', function () {
            var values = parseRepeat('minutes', '1/11');
            expect(values).toEqual(range(1, MAX_VALUE, 11));
        });

        it('should parse interval */5', function () {
            var values = parseRepeat('minutes', '*/5');
            expect(values).toEqual(FULL_RANGE);
        });

        it('should parse interval 5/1', function () {
            var values = parseRepeat('minutes', '5/1');
            expect(values).toEqual(range(5, MAX_VALUE, 1));
        });

        it('should fail to parse interval 1/*', function () {
            var fn = parseRepeat.bind(null, 'minutes', '1/*');
            expect(fn).toThrow();
        });

        it('should parse interval ?/10 to null', function () {
            var values = parseRepeat('daysOfWeek', '?/10');
            expect(values).toEqual(null);
        });

        it('should fail to parse interval 1/?', function () {
            var fn = parseRepeat.bind(null, 'minutes', '1/?');
            expect(fn).toThrow();
        });

        it('should fail to parse interval */?', function () {
            var fn = parseRepeat.bind(null, 'minutes', '*/?');
            expect(fn).toThrow();
        });

        it('should parse interval ?/* to null', function () {
            var values = parseRepeat('daysOfMonth', '?/*');
            expect(values).toEqual(null);
        });

        it('should fail to arse interval ?/* on minutes', function () {
            var fn = parseRepeat.bind(null, 'minutes', '?/*');
            expect(fn).toThrow();
        });

        it('should fail to parse interval 0/10', function () {
            var fn = parseRepeat.bind(null, 'minutes', '0/10');
            expect(fn).toThrow();
        });

        it('should fail to parse interval 1/11', function () {
            var fn = parseRepeat.bind(null, 'minutes', '1-11');
            expect(fn).toThrow();
        });

        it('should parse 1-2/3', function () {
            var values = parseRepeat('minutes', '1-2/3');
            expect(values).toEqual([1, 2, 4, 5, 7, 8, 10]);
        });

        it('should parse 2-1/3', function () {
            var fn = parseRepeat.bind(null, 'minutes', '2-1/3');
            expect(fn).toThrow();
        });

        /**
         * @param {String} field
         * @param {String} pattern
         * @returns {*}
         */
        function parseRepeat(field, pattern) {
            return parser.parseRepeat(field, pattern, MIN_VALUE, MAX_VALUE, ALIASES);
        }
    });

    describe('.parseAnd', function () {

        it('should parse interval 1,2', function () {
            var values = parseAnd('minutes', '1,2');
            expect(values).toEqual([1, 2]);
        });

        it('should parse interval 3,1', function () {
            var values = parseAnd('minutes', '3,1');
            expect(values).toEqual([1, 3]);
        });

        it('should parse interval 1,2,3', function () {
            var values = parseAnd('minutes', '1,2,3');
            expect(values).toEqual([1, 2, 3]);
        });

        it('should parse interval *,5', function () {
            var values = parseAnd('minutes', '*,5');
            expect(values).toEqual(FULL_RANGE);
        });

        it('should parse interval 5,1', function () {
            var values = parseAnd('minutes', '5,1');
            expect(values).toEqual([1, 5]);
        });

        it('should parse interval 1,*', function () {
            var values = parseAnd('minutes', '1,*');
            expect(values).toEqual(range(MIN_VALUE, MAX_VALUE, 1));
        });

        it('should fail to parse interval ?,10', function () {
            var fn = parseAnd.bind(null, 'minutes', '?,10');
            expect(fn).toThrow();
        });

        it('should fail to parse interval 1,?', function () {
            var fn = parseAnd.bind(null, 'minutes', '1,?');
            expect(fn).toThrow();
        });

        it('should fail to parse interval *,?', function () {
            var fn = parseAnd.bind(null, 'minutes', '*,?');
            expect(fn).toThrow();
        });

        it('should fail to parse interval ?,*', function () {
            var fn = parseAnd.bind(null, 'minutes', '?,*');
            expect(fn).toThrow();
        });

        it('should fail to parse interval 0,10', function () {
            var fn = parseAnd.bind(null, 'minutes', '0,10');
            expect(fn).toThrow();
        });

        it('should fail to parse interval 1,11', function () {
            var fn = parseAnd.bind(null, 'minutes', '1,11');
            expect(fn).toThrow();
        });

        it('should parse 1-2/3,3/3', function () {
            var values = parseAnd('minutes', '1-2/3,3/3');
            expect(values).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        });

        it('should parse MON-FRI', function () {
            var values = parseAnd('daysOfWeek', 'MON-FRI');
            expect(values).toEqual(range(1, 5));
        });

        /**
         * @param {String} field
         * @param {String} pattern
         * @returns {*}
         */
        function parseAnd(field, pattern) {
            return parser.parseAnd(field, pattern, MIN_VALUE, MAX_VALUE, ALIASES);
        }
    });

    describe('.andSet', function () {

        it('should create a set for 1,1,2,3,5,8', function () {
            var valuesSet = parser.andSet([1, 1, 2, 3, 5, 8], MIN_VALUE, MAX_VALUE);

            expect(valuesSet).toEqual(anySet);
            expect(valuesSet.toSortedArray()).toEqual([1, 2, 3, 5, 8]);
        });
    });

    describe('.repeatSet', function () {

        it('should fail to create a set for 2/-5', function () {
            var fn = parser.repeatSet.bind(parser, 2, -5, MIN_VALUE, MAX_VALUE);
            expect(fn).toThrow();
        });

        it('should create a set for 2/5', function () {
            var valuesSet = parser.repeatSet(2, 5, MIN_VALUE, MAX_VALUE);

            expect(valuesSet).toEqual(anySet);
            expect(valuesSet.toSortedArray()).toEqual([2, 7]);
        });
    });

    describe('.rangeSet', function () {

        it('should fail to create a set for 1-11', function () {
            var fn = parser.rangeSet.bind(parser, 1, 11, MIN_VALUE, MAX_VALUE);
            expect(fn).toThrow();
        });

        it('should create a set for 2-5', function () {
            var valuesSet = parser.rangeSet(2, 5, MIN_VALUE, MAX_VALUE);

            expect(valuesSet).toEqual(anySet);
            expect(valuesSet.toSortedArray()).toEqual(range(2, 5));
        });
    });
});