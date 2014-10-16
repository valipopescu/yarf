/**
 * Class Extend
 * @param baseClass
 * @returns {Function} extended class constructor (add your prototype(s) to it)
 */
Function.prototype.extends = function (baseClass) {
    if (typeof baseClass == "function") {
        this.prototype = new baseClass();
        this.prototype.parent = baseClass;
        this.prototype.constructor = this;
        return this;
    } else {
        return this;
    }
};
