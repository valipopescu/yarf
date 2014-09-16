/**
 * add timestamp to console.log
 */
(function () {
    Object.defineProperty(global, '__stack', {
        get: function () {
            var orig = Error.prepareStackTrace;
            Error.prepareStackTrace = function (_, stack) {
                return stack;
            };
            var err = new Error;
            Error.captureStackTrace(err, arguments.callee);
            var stack = err.stack;
            Error.prepareStackTrace = orig;
            return stack;
        }
    });

    Object.defineProperty(global, '__line', {
        get: function () {
            return __stack[1].getLineNumber();
        }
    });
    var initialConsoleLog = console.log;
    console.log = function () {
        Array.prototype.unshift.apply(arguments, [(new Date()).toString()]);
        initialConsoleLog.apply(this, arguments);
    }
})();