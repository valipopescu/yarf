Object.defineProperty(Object.prototype, "isEmpty", {
    configurable: true,
    writable: true,
    enumerable: false,
    value: function (object) {
        var __this = this;
        if (typeof __this == "function") {
            __this = object;
        }
        if (__this == null) {
            return true;
        }
        if (typeof(__this) == "undefined") {
            return true;
        }
        switch (__this.__proto__.constructor.name) {
            case "Array":
            case "String":
                return __this.length == 0;
            case "Object":
                for (var key in __this) {
                    if (typeof(__this.__proto__[key]) == "undefined" || __this[key] != __this.__proto__[key])
                        return false;
                }
                break;
            default:
                return false;
        }
        return true;
    }
});
