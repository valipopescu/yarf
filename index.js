require('./utils/consoleLog.js');
require('./utils/extend.js');
require('./utils/arrayTrim.js');
require('./utils/stringUpperCase.js');
require('./utils/objectIsEmpty.js');
var nodeNative = {};
nodeNative['http'] = require('http');
var server = require('./Router.js');
process.die = function(message){
    "use strict";
    console.log(message);
    process.exit();
}
/**
 *
 * @param portNumber
 * @param pathToApplication
 * @param sslCfg SSL Configs must have key and cert anything else is ignored.s
 * @returns {boolean}
 */
exports.start = function (portNumber, pathToApplication, sslCfg) {
    if (typeof(portNumber) != "number") {
        return false;
    }
    if (typeof pathToApplication == 'undefined' || isEmpty(pathToApplication)) {
        console.log("invalid path to application:", pathToApplication);
        return false;
    }
    var httpServer;
    if (typeof sslCfg == "undefined" || typeof sslCfg.key == "undefined" || typeof sslCfg.cert == "undefined") {
        httpServer = nodeNative.http.createServer(server.HTTPServerFunction(pathToApplication));
    } else {
        httpServer = nodeNative.http.createServer({key: sslCfg.key, cert: sslCfg.cert}, server.HTTPServerFunction(pathToApplication));
    }
    pathToApp = pathToApplication;
    httpServer.listen(portNumber, "127.0.0.1");
    console.log('Server running at http://127.0.0.1:' + portNumber + '/');
}

exports.Controller = require("./Controller.js");