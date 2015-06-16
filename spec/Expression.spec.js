var range = require('./helpers/range');

describe('Expression', function () {

    var Expression = require('../lib/Expression');

    describe('.parse', function () {

        it('should parse a "secondly" cron correctly', function () {
            var expr = Expression.parse('* * * * * *');

            expect(expr.seconds).toEqual(range(0, 59));
            expect(expr.minutes).toEqual(range(0, 59));
            expect(expr.hours).toEqual(range(0, 23));
            expect(expr.daysOfMonth).toEqual(range(31));
            expect(expr.months).toEqual(range(12));
            expect(expr.daysOfWeek).toEqual(range(0, 7));
        });

        it('should parse a "minutely" cron correctly', function () {
            var expr = Expression.parse('0 0/1 * 1/1 * ?');

            expect(expr.seconds).toEqual([0]);
            expect(expr.minutes).toEqual(range(0, 59));
            expect(expr.hours).toEqual(range(0, 23));
            expect(expr.daysOfMonth).toEqual(range(31));
            expect(expr.months).toEqual(range(12));
            expect(expr.daysOfWeek).toEqual(null);
        });

        // 0 0,1/25 * 1/1 * ?

        it('should parse a daily cron correctly', function () {
            var expr = Expression.parse('0 0 12 1/1 * ?');

            expect(expr.seconds).toEqual([0]);
            expect(expr.minutes).toEqual([0]);
            expect(expr.hours).toEqual([12]);
            expect(expr.daysOfMonth).toEqual(range(31));
            expect(expr.months).toEqual(range(12));
            expect(expr.daysOfWeek).toEqual(null);
        });

        it('should parse a cron for week daysOfMonth', function () {
            var expr = Expression.parse('0 0 12 ? * MON-FRI');

            expect(expr.seconds).toEqual([0]);
            expect(expr.minutes).toEqual([0]);
            expect(expr.hours).toEqual([12]);
            expect(expr.daysOfMonth).toEqual(null);
            expect(expr.months).toEqual(range(12));
            expect(expr.daysOfWeek).toEqual(range(1, 5));
        });
    });

    describe('.alias', function () {

        it('should retrieve correct value for daysOfWeek', function () {
            expect(Expression.alias('daysOfWeek', 'SUN')).toEqual(0);
            expect(Expression.alias('daysOfWeek', 'MON')).toEqual(1);
            expect(Expression.alias('daysOfWeek', 'TUE')).toEqual(2);
            expect(Expression.alias('daysOfWeek', 'WED')).toEqual(3);
            expect(Expression.alias('daysOfWeek', 'THU')).toEqual(4);
            expect(Expression.alias('daysOfWeek', 'FRI')).toEqual(5);
            expect(Expression.alias('daysOfWeek', 'SAT')).toEqual(6);
        });

        it('should retrieve correct value for months', function () {
            expect(Expression.alias('months', 'JAN')).toEqual(1);
            expect(Expression.alias('months', 'FEB')).toEqual(2);
            expect(Expression.alias('months', 'MAR')).toEqual(3);
            expect(Expression.alias('months', 'APR')).toEqual(4);
            expect(Expression.alias('months', 'MAY')).toEqual(5);
            expect(Expression.alias('months', 'JUN')).toEqual(6);
            expect(Expression.alias('months', 'JUL')).toEqual(7);
            expect(Expression.alias('months', 'AUG')).toEqual(8);
            expect(Expression.alias('months', 'SEP')).toEqual(9);
            expect(Expression.alias('months', 'OCT')).toEqual(10);
            expect(Expression.alias('months', 'NOV')).toEqual(11);
            expect(Expression.alias('months', 'DEC')).toEqual(12);
        });
    });

    describe('#next', function () {

        it('should work with a "secondly" cron', function () {
            var expr = Expression.parse('* * * * * *');
            var startDate = new Date(2015, 0, 1);   // Jan 01 2015 00:00:00
            console.log();

            var first = expr.next(startDate);
            expect(first).toEqual(new Date(2015, 0, 1, 0, 0, 1));  // Jan 01 2015 12:00:01

            var second = expr.next(first);
            expect(second).toEqual(new Date(2015, 0, 1, 0, 0, 2)); // Jan 01 2015 12:00:02
        });

        it('should shift a minute with a "secondly" cron starting at 0:0:59', function () {
            var expr = Expression.parse('* * * * * *');
            var startDate = new Date(2015, 0, 1, 0, 0, 59); // Jan 01 2015 00:00:59

            var first = expr.next(startDate);
            expect(first).toEqual(new Date(2015, 0, 1, 0, 1, 0));   // Jan 01 2015 12:01:00

            var second = expr.next(first);
            expect(second).toEqual(new Date(2015, 0, 1, 0, 1, 1));  // Jan 01 2015 12:01:01
        });

        it('should work with a "minutely" cron', function () {
            var expr = Expression.parse('0 0/1 * 1/1 * ?');
            var startDate = new Date(2015, 0, 1);   // Jan 01 2015 00:00:00

            var first = expr.next(startDate);
            expect(first).toEqual(new Date(2015, 0, 1, 0, 1));  // Jan 01 2015 12:01:00

            var second = expr.next(first);
            expect(second).toEqual(new Date(2015, 0, 1, 0, 2)); // Jan 01 2015 12:02:00
        });

        it('should work with a daily cron', function () {
            var expr = Expression.parse('0 0 12 1/1 * ?');
            var startDate = new Date(2015, 0, 1);   // Jan 01 2015 00:00:00

            var first = expr.next(startDate);
            expect(first).toEqual(new Date(2015, 0, 1, 12));    // Jan 01 2015 12:00:00

            var second = expr.next(first);
            expect(second).toEqual(new Date(2015, 0, 2, 12));   // Jan 02 2015 12:00:00
        });

        it('should work with a "week-daily" cron', function () {
            var expr = Expression.parse('0 0 12 ? * MON-FRI');
            var startDate = new Date(2015, 0, 2, 0);    // Fri Jan 02 2015 00:00:00

            var first = expr.next(startDate);
            expect(first).toEqual(new Date(2015, 0, 2, 12));    // Fri Jan 02 2015 12:00:00

            var second = expr.next(first);
            expect(second).toEqual(new Date(2015, 0, 5, 12));   // Mon Jan 05 2015 12:00:00
        });
    });

    describe('#set', function () {

        it('should set value 1,2/3 for minutes', function () {
            var expr = defaultExpression();
            expr.set('minutes', '1,2/3');

            var expected = [1].concat(range(2, 59, 3));
            expect(expr.minutes).toEqual(expected);
        });

        it('should set value 1-3,10-15 for minutes', function () {
            var expr = defaultExpression();
            expr.set('minutes', '1-3,10-15');

            var expected = range(1, 3).concat(range(10, 15));
            expect(expr.minutes).toEqual(expected);
        });

        it('should set value 5 for hours', function () {
            var expr = defaultExpression();
            expr.set('hours', 5);

            expect(expr.hours).toEqual([5]);
        });

        it('should fail to set value ? for daysOfWeek', function () {
            var expr = defaultExpression();
            var fn = expr.set.bind(expr, 'daysOfWeek', '?');

            expect(fn).toThrow();
        });
    });

    describe('#at', function () {

        it('should set value 10 for minutes', function () {
            var expr = defaultExpression();
            expr.at('minutes', 10);

            expect(expr.minutes).toEqual([10]);
        });

        it('should fail to set value 60 for minutes', function () {
            var expr = defaultExpression();
            var fn = expr.at.bind(expr, 'minutes', 60);

            expect(fn).toThrow();
        });
    });

    describe('#and', function () {

        it('should set value [1, 2, 3, 4, 5] for minutes', function () {
            var expr = defaultExpression();
            expr.and('minutes', range(1, 5));

            expect(expr.minutes).toEqual(range(1, 5));
        });

        it('should fail to set value [0, 60] for seconds', function () {
            var expr = defaultExpression();
            var fn = expr.at.bind(expr, 'seconds', [0, 60]);

            expect(fn).toThrow();
        });
    });

    describe('#range', function () {

        it('should set value MON-SUN for daysOfWeek', function () {
            var expr = defaultExpression();
            expr.range('daysOfWeek', Expression.alias('daysOfWeek', 'MON'), Expression.alias('daysOfWeek', 'FRI'));

            expect(expr.daysOfWeek).toEqual(range(1, 5));
        });

        it('should fail to set value 0-60 for seconds', function () {
            var expr = defaultExpression();
            var fn = expr.range.bind(expr, 'seconds', 0, 60);

            expect(fn).toThrow();
        });
    });

    describe('#repeat', function () {

        it('should set value 0/7 for minutes', function () {
            var expr = defaultExpression();
            expr.repeat('minutes', 0, 7);

            expect(expr.minutes).toEqual(range(0, 59, 7));
        });

        it('should fail to set value 0/-4 for hours', function () {
            var expr = defaultExpression();
            var fn = expr.repeat.bind(expr, 'hours', 0, -4);

            expect(fn).toThrow();
        });
    });

    function defaultExpression() {
        return Expression.parse('* * * * * *');
    }

});