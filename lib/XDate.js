'use strict';

module.exports = XDate;

/**
 * XDate constructor
 * @constructor
 * @param {Date} date
 */
function XDate(date) {
    /** @type {Date} */
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