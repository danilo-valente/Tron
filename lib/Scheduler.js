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
    this._expression = expr instanceof Expression ? expr : Expression.parse(expr);
    /** @type {Date} */
    this._startDate = startDate;
    /** @type {Date} */
    this._endDate = endDate;
    /** @type {XDate} */
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