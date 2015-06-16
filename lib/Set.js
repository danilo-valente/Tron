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
    this._items = {};
    /** @type {number} */
    this._length = 0;
    /** @type {Function} */
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
    return this.toArray().sort(fn || function (a, b) {
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