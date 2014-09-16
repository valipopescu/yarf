/**
 * Upper Case First character in string.
 * @returns {string}
 */
String.prototype.ucFirst = function () {
    return this[0].toUpperCase() + this.slice(1);
}
/**
 * Upper case all the words of a string split by a delimiter
 * @param delimiter = " " (default is space character)
 * @returns {string}
 */
String.prototype.ucWords = function (delimiter) {
    delimiter = typeof(delimiter) == "undefined" ? /\s+/g : delimiter;
    var words = this.split(delimiter);
    for (var i in words) {
        words[i] = words[i].ucFirst();
    }
    return words.join(delimiter == /\s+/g ? ' ' : delimiter);
}