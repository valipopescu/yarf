/**
 * add timestamp to console.log
 */
(function () {
    var path = require('path');
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
    Object.defineProperty(console, '__consoleLine', {
        get: function () {
            return __stack[2].getLineNumber();
        }
    });
    Object.defineProperty(console, '__consoleFile', {
        get: function () {
            return __stack[2].getFileName();
        }
    });
    var initialConsoleLog = console.log;
    var maxParent = module;
    while(maxParent['parent']){ // should crawl to maximum level regardless of how deep is it loaded.
        maxParent = maxParent['parent'];
    }
    var baseDirectory = path.dirname(maxParent.filename);
    console.log = function () {
        var current = path.relative(baseDirectory, this.__consoleFile);
        var curDate = new Date();
        Array.prototype.unshift.apply(arguments, [curDate.toJSON() + ' [' +current + ' - '+this.__consoleLine + '] ']);
        initialConsoleLog.apply(this, arguments);
    }
})();