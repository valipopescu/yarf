
/**
 * Native Node modules are loaded here (kind of namespace)
 * @type {{}}
 */
var nodeNative = {};
nodeNative['http'] = require('http');
nodeNative['url'] = require('url');
nodeNative['fs'] = require('fs');
nodeNative['path'] = require('path');

/**
 * Application Object (holds statics)
 * @type {{}}
 */
var application = {};
/**
 * Static path to app.
 * @type {string}
 */
application['pathToApp'] = "";
/**
 * Accepted methods (static)
 * @type {string[]}
 */
application['acceptedMethods'] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
/**
 * Can the application server start?
 * @type {boolean}
 */
application['canStart'] = true;
/**
 * Mime Types
 * @type {string{string}}
 */
application['mimeTypes'] = JSON.parse(nodeNative.fs.readFileSync(__dirname + "/mime.json", "utf8"));
if (Object.isEmpty(application['mimeTypes'])) { // should not be able to start if there's no mime types preloaded.
    console.log("unable to load mime.json");
    application['canStart'] = false;
}
/**
 * Controllers
 * @type {{}}
 */
application['controllers'] = {};


/**
 * Base Class for HTTP Server Fucntion. Will be used as base class for the WS(S) as well.
 */
var constructor = function(){
    this.controllerName = "";
    this.controllerPath = "";
    var actionName = "";

    Object.defineProperty(this, "actionName", {
        get: function(){
            if(this.controllerName == "" || this.controllerPath == ""){
                return "";
            }
            if(actionName == ""){
                if(arguments.callee.caller !== constructor.prototype.loadController){ // don't run it outside loadController first time.
                    return "";
                }
                if(this.requestedURL.pathArray.isEmpty()){
                    actionName = "index";
                }else{
                    actionName = this.requestedURL.pathArray.shift();
                }
            }
            actionName = actionName.ucFirst();
            return actionName;
        },
        writeable: false,
        enumerable: true
    });

    this.actionMethod = "";
    this.requestedURL = {};
};

/**
 * Serves the physical files
 * @param req
 * @param res
 * @returns {boolean}
 */
constructor.prototype.servePhysicalFiles = function(req, res){ // gets them as params so that the methods can be reused.
    if (nodeNative.fs.existsSync(application['pathToApp'] + '/public' + req.url) &&
        nodeNative.fs.statSync(application['pathToApp'] + '/public' + req.url).isFile()) { // serve physical file
        var fileExtension = req.url.substr((req.url.lastIndexOf(".")));
        if (typeof (application.mimeTypes[fileExtension]) == "string") {
            res.writeHead(200, {"Content-Type": application.mimeTypes[fileExtension]});
        }
        var frs = nodeNative.fs.createReadStream(application['pathToApp'] + '/public' + req.url);
        frs.pipe(res);
        return true;
    }
    return false;
}

constructor.prototype.loadController = function(){
    if (this.requestedURL.pathArray.isEmpty()) { // index controller...
        this.controllerPath = "index";
        this.controllerName = "index";
        var controllerDiskPath = nodeNative.path.join(application['pathToApp'], "/Modules/", this.controllerPath, 'controller.js');
        if (nodeNative.fs.existsSync(controllerDiskPath)) {
            if (typeof(application.controllers[this.controllerName]) == "undefined") {
                application.controllers[this.controllerName] = require(controllerDiskPath);
            }
            return true;
        }
    }
    //console.log('going through the controller stuff');
    // any other controller
    for (var pathComponent in this.requestedURL.pathArray) {
        if (typeof this.requestedURL.pathArray[pathComponent] == 'string') {
            this.controllerPath = this.controllerPath + "/" + this.requestedURL.pathArray[pathComponent];
            this.controllerName = this.requestedURL.pathArray[pathComponent];
            //console.log(this);
            if (nodeNative.fs.existsSync(nodeNative.path.join(application['pathToApp'], "/Modules/", this.controllerPath))) {
                var controllerDiskPath = nodeNative.path.join(application['pathToApp'], "/Modules/", this.controllerPath, 'controller.js');
                if (nodeNative.fs.existsSync(controllerDiskPath)) {
                    if (typeof(application.controllers[this.controllerName]) == "undefined") {
                        console.log("Loading ... ", this.controllerName);
                        application.controllers[this.controllerName] = require(controllerDiskPath);
                        if(typeof application.controllers[this.controllerName] != 'function'){
                            // the loaded controller is not a constructor.
                            return false;
                        }
                        console.log('Loaded: ', this.controllerName);
                    }// else
                    // regardless of whether a controller was loaded or not, the pathArray should now contain only the bit after the controller
                    this.requestedURL.pathArray = this.requestedURL.pathname.replace(this.controllerPath, "").split("/").trim();
                    console.log('Serving Controller: ' + this.controllerName + " with action: "+ this.actionMethod + this.actionName);
                    var actionName = this.actionName; // only to trigger the property.
                    return true;// loaded now or before, the controller should be loaded at this point.
                }// else keep going
            } else {
                return false; // the requested path contains a path that can't be resolved on disk to a controller.
            }
        }
    }
    return false;
}
/**
 * Serves the options requests. Always has status code 200 unless there's something wrong with the server when it returns 500
 * It will show ALL HTTP methods for the current requested controller and action in Allow header
 * @param req
 * @param res
 * @returns {boolean}
 */
constructor.prototype.serveOptions = function(req, res){
    "use strict";
    // TODO add swagger library Controller on which all the swagger docblock parsing is done.
    if (req.method == "OPTIONS") {
        if(this.controllerName.isEmpty() || this.controllerPath.isEmpty()){
            console.log("serve Options called without a controller being loaded. Server error.");
            res.statusCode = 500; // no matter this got here it's an internal server error.
            return true;
        }
        res.statusCode = 200; // no matter what this thing has options.
        var controllerAcceptedMethods = [];
        var methodRegexp = new RegExp(this.actionName, 'i');
        for (var controllerMethodName in application.controllers[this.controllerName].prototype) {
            if (Object.prototype[controllerMethodName] == application.controllers[this.controllerName].prototype[controllerMethodName]) {
                continue;// ignore base Object methods. it may well be that there's a method in the controller called isEmpty...
                // it won't be ignored (mainly because it can't be identical to the one in Object ... if it is then it's ignored)
            }
            if (typeof application.controllers[this.controllerName].prototype[controllerMethodName] == "function" && controllerMethodName.match(methodRegexp) != null) {
                var acceptedMethod = controllerMethodName.replace(methodRegexp, "").toUpperCase();
                if (acceptedMethod == "") {
                    acceptedMethod = "GET";
                }
                if (application.acceptedMethods.indexOf(acceptedMethod) >= 0) {
                    controllerAcceptedMethods.push(acceptedMethod); // it'll push multiple times to show there's multiple get methods. twice means a version for more than one HTTP method purpose ... shouldn't be more than twice :)
                }
            }
        }
        res.setHeader("Allow", controllerAcceptedMethods.join(', '));
        res.end();
        return true;
    }
    return false; // wasn't options
}
constructor.prototype.createEndFunction = function(req,res){
    "use strict";
    var serverInstance = this;
    if(this.controllerName.isEmpty()){
        return false;
    }
    application.controllers[this.controllerName].prototype.end = function(){
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
    return true;
}
constructor.prototype.serveAction = function(){
    "use strict";
    var controllerMethod = this.actionMethod + this.actionName;
    console.log(controllerMethod);
    if(typeof application.controllers[this.controllerName].prototype[controllerMethod] == 'function'){
        var controllerInstance = new application.controllers[this.controllerName]();
        if(typeof controllerInstance != 'object' || controllerInstance == null){
            return false;
        }
//        console.log(this.requestedURL);
        // inside the instance start defining properties:
        Object.defineProperty(controllerInstance, '_GET', {
            enumerable: true,
            configurable: false,
            writeable: false,
            value: this.requestedURL.query
        });
        
        controllerInstance[controllerMethod]();
        console.log(controllerInstance);
        return true;
    }else{
        return false;
    }
}

/**
 * creates a new server function.
 * @returns {function(this:constructor)}
 */
module.exports.HTTPServerFunction = function(pathToApplication){
    application['pathToApp'] = pathToApplication;

    return function(req,res){
        try {
            var __this = new constructor();
            console.log('Serving request for url: ', req.url, 'from ', req.connection.remoteAddress, req.connection.remotePort);
            if (application.acceptedMethods.indexOf(req.method) == -1) { // simply refuse unaccepted methods.
                res.statusCode = 501;
                res.end();
                return;
            }
            __this.actionMethod = req.method.toLowerCase();
            if (__this.servePhysicalFiles(req, res)) {
                return;
            }
            __this.requestedURL = nodeNative.url.parse(req.url, true);
            __this.requestedURL.pathArray = __this.requestedURL.pathname.split('/').trim();
            if (!__this.loadController()) {
                res.statusCode = 500;
                res.end();
                console.log("Couldn't load controller for the " + req.url + " request");
                return;
            }
            if (__this.serveOptions(req, res)) {// served alread
                return;
            }
            if (!__this.createEndFunction(req, res)) {
                res.statusCode = 500;
                res.end();
                console.log("couldn't create the end function for the " + req.url + " url");
                return;
            }
            if (!__this.serveAction(req, res)) {
                res.statusCode = 500;
                res.end();
                console.log("couldn't serve the action")
            }
        }catch(e){
            res.statusCode = 500;
            res.end();
            console.log("Uncaught exception", e);
        }

        res.end();

    }
}

