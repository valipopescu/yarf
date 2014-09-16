/**
 * Utility function to trim an array from empty strings. It will also not copy over the functions
 */
Array.prototype.trim = function () {
    var newArray = [];
    for (var key in this) {
        if (typeof(this[key]) != 'undefined' && this[key] != '') {
            if (typeof this.__proto__[key] == "undefined" || this[key] != this.__proto__[key]) {
                newArray.push(this[key]);
            }
        }
    }
    return newArray;
};