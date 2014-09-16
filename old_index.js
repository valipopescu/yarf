require('./utils/consoleLog.js');
require('./utils/extend.js');
require('./utils/arrayTrim.js');
require('./utils/stringUpperCase.js');
/**
 * Native Node modules are loaded here. Please load them here if possible
 * @type {{}}
 */
var nodeNative = {};
nodeNative['http'] = require('http');
nodeNative['url'] = require('url');
nodeNative['fs'] = require('fs');
nodeNative['path'] = require('path');

var mimeTypesContent = nodeNative.fs.readFileSync(__dirname + "/mime.json", "utf8");
var mimeTypes = JSON.parse(mimeTypesContent);
var canStart = true;
if (Object.isEmpty(mimeTypes)) {
    console.log("unable to load mime.json");
    canStart = false;
}
var application = {};
/**
 * Holds lazy loaded controllers Prototypes (Classes as they're called in OOLs)
 */
application['controllers'] = {};
/**
 * Error Controller (used in various situations where an error needs to be given)
 */
application.controllers["Error"] = require('./Controllers/Error.js');
// NOT ACCEPTING TRACE!!!
var servePhysicalFiles = function(req, res){
    if (nodeNative.fs.existsSync(pathToApp + '/public' + req.url) &&
        nodeNative.fs.statSync(pathToApp + '/public' + req.url).isFile()) { // serve physical file
        var fileExtension = req.url.substr((req.url.lastIndexOf(".")));
        if (typeof (mimeTypes[fileExtension]) == "string") {
            res.writeHead(200, {"Content-Type": mimeTypes[fileExtension]});
        }
        var frs = nodeNative.fs.createReadStream(pathToApp + '/public' + req.url);
        frs.pipe(res);
        return true;
    }
    return false;
}
/**
 *
 * @param requestedURL
 * @returns {{controllerName: string, controllerPath: string}}
 */
var loadController = function(requestedURL){
    var controllerName = "";
    var controllerPath = "";
    if (requestedURL.pathArray.isEmpty()) { // index controller...
        controllerPath = "index";
        controllerName = "index";
        var controllerDiskPath = nodeNative.path.join(pathToApp, "/Modules/", controllerPath, 'controller.js');
        if (nodeNative.fs.existsSync(controllerDiskPath)) {
            if (typeof(application.controllers[controllerName]) == "undefined") {
                application.controllers[controllerName] = require(controllerDiskPath);
            }
            foundPath = true;
        }
    } else { // any other controller
        for (var pathComponent in requestedURL.pathArray) {
            if (typeof requestedURL.pathArray[pathComponent] == 'string') {
                controllerPath = controllerPath + "/" + requestedURL.pathArray[pathComponent];
                controllerName = requestedURL.pathArray[pathComponent];
                if (nodeNative.fs.existsSync(nodeNative.path.join(pathToApp, "/Modules/", controllerPath))) {
                    var controllerDiskPath = nodeNative.path.join(pathToApp, "/Modules/", controllerPath, 'controller.js');
                    if (nodeNative.fs.existsSync(controllerDiskPath)) {
                        if (typeof(application.controllers[controllerName]) == "undefined") {
                            console.log("Loading ... ", controllerName);
                            application.controllers[controllerName] = require(controllerDiskPath);
                            console.log('Loaded: ', application);
                        }
                        foundPath = true;
                        break;
                    }
                } else {
                    break;
                }
            }
        }
    }
    return foundPath ? {controllerName: controllerName, controllerPath: controllerPath} : null;
}

var serverFunction = function (req, res) {
    // first of all this part should never exist if there's NGINX running in front of node.
    // this is going to be similar to "try_files" directive from NGINX
    console.log('Serving request for url: ', req.url, 'from ', req.connection.remoteAddress, req.connection.remotePort);
    if (acceptedMethods.indexOf(req.method) == -1) { // simply refuse unaccepted methods.
        res.statusCode = 501;
        return;
    }
    if (servePhysicalFiles(req,res)){
        return;
    }
    //TODO: Handle File Upload. For now it's not going to be handled as I don't need it
    var requestedURL = nodeNative.url.parse(req.url, true);
    requestedURL.pathArray = requestedURL.pathname.split('/').trim();
    var loadedController = loadController(requestedURL);
    if (loadedController == null) { // refuse requests for modules that don't exist.
        res.statusCode = 501;
        console.log("Couldn't find a module for the requested url: " + req.url, requestedURL);
        res.end();
        return;
    }

    requestedURL.pathArray = requestedURL.pathname.replace(loadedController.controllerPath, "").split('/').trim();
    var methodName = "";
    if (requestedURL.pathArray.isEmpty()) {
        methodName = "index";
    } else {
        methodName = requestedURL.pathArray.shift();
    }

    if (req.method == "OPTIONS") {
        res.statusCode = 200;
        var controllerAcceptedMethods = [];
        var methodRegexp = new RegExp(methodName, 'i');
        for (var controllerMethodName in application.controllers[loadedController.controllerName].prototype) {
            if (Object.prototype[controllerMethodName] == application.controllers[loadedController.controllerName].prototype[loadedController.controllerMethodName]) {
                continue;// ignore base Object methods. it may well be that there's a method in the controller called isEmpty...
                // it won't be ignored (mainly because it can't be identical to the one in Object ... if it is then it's ignored)
            }
            if (typeof application.controllers[loadedController.controllerName].prototype[controllerMethodName] == "function" && controllerMethodName.match(methodRegexp) != null) {
                var acceptedMethod = controllerMethodName.replace(methodRegexp, "").toUpperCase();
                if (acceptedMethod == "") {
                    acceptedMethod = "GET";
                }
                if (acceptedMethods.indexOf(acceptedMethod) >= 0) {
                    controllerAcceptedMethods.push(acceptedMethod); // it'll push multiple times to show there's multiple get methods. twice means a version for more than one HTTP method purpose ... shouldn't be more than twice :)
                }
            }
        }
        res.setHeader("Allow", controllerAcceptedMethods.join(', '));
        res.end();
    }
    var controllerInstance = null;
    methodName = req.method.toLowerCase() + methodName.ucFirst();
    var endFunction = function () { // don't depend on promises. just notify when done.
        res.statusCode = this.statusCode || res.statusCode;
        if (typeof this.headers == "object" && !this.headers.isEmpty()) {
            for (var headerName in this.headers) {
                res.setHeader(headerName, this.headers[headerName]);
            }
        }
        switch (req.headers['accept']) {
            case 'application/json':
                if (typeof this.response == "object" && !this.response.isEmpty())
                    res.write(JSON.stringify(this.response));
                break;
            case 'text/html':
            case '*/*':
                if (typeof this.response == "object") {
                    // test whether a view can be found, load it and pass everything in...
                }
            default :
                if (typeof this.response == "string" && !this.response.isEmpty())
                    res.write(this.response.toString());
        }
        res.end();
    }
    application.controllers[loadedController.controllerName].prototype.end = endFunction;
    if (typeof application.controllers[loadedController.controllerName].prototype[methodName] == "function") {// now we know that the method is there...
        controllerInstance = new (application.controllers[loadedController.controllerName])();// finally create an instance for the controller
        application.controllers[loadedController.controllerName].prototype[methodName].apply(controllerInstance);
    } else {
        res.statusCode = 501; // Not implemented.
        endFunction();
    }
}
var WebSocket = require("ws");
/**
 *
 * @param portNumber
 * @param pathToApplication
 * @param sslCfg SSL Configs must have key and cert anything else is ignored.s
 * @returns {boolean}
 */
exports.start = function (portNumber, pathToApplication, sslCfg) {
    if (canStart == false)
        return canStart;
    if (typeof(portNumber) != "number") {
        return false;
    }
    if (isEmpty(pathToApplication)) {
        console.log("invalid path to application:", pathToApplication);
        return false;
    }
    var httpServer;
    if (typeof sslCfg == "undefined" || typeof sslCfg.key == "undefined" || typeof sslCfg.cert == "undefined") {
        httpServer = nodeNative.http.createServer(serverFunction)
    } else {
        httpServer = nodeNative.http.createServer({key: sslCfg.key, cert: sslCfg.cert}, serverFunction);
    }
    pathToApp = pathToApplication;

    var wss = new WebSocket.Server({server: httpServer});
    wss.on('connection', function (WS) {
        //console.log("connection made", WS.upgradeReq.connection.remoteAddress + " : " + WS.upgradeReq.connection.remotePort);
        //WS.send("Welcome ");
        WS.on("message", function (message) {
            WS.send("test");
            console.log('message: ' + message);
        });
        WS.on('close', function () {
            console.log('Stopped');
        })
    });
    httpServer.listen(portNumber, "127.0.0.1");// for now always on specified port of the localhost.
    console.log('Server running at http://127.0.0.1:' + portNumber + '/');
}

exports.Controller = require("./Controller.js");