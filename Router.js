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
 * Native Node modules are loaded here (kind of namespace)
 * @type {{}}
 */
var nodeNative = {};
nodeNative['http'] = require('http');
nodeNative['url'] = require('url');
nodeNative['fs'] = require('fs');
nodeNative['path'] = require('path');

/**
 * Base Class for HTTP Server Fucntion. Will be used as base class for the WS(S) as well.
 */
var constructor = function(){
    this.controllerName = "";
    this.controllerPath = "";
    this.requestedURL = {};
};

/**
 * Serves the physical files
 * @param req
 * @param res
 * @returns {boolean}
 */
constructor.prototype.servePhysicalFiles = function(req, res){ // gets them as params so that the methods can be reused.
    if (nodeNative.fs.existsSync(pathToApp + '/public' + req.url) &&
        nodeNative.fs.statSync(pathToApp + '/public' + req.url).isFile()) { // serve physical file
        var fileExtension = this.req.url.substr((req.url.lastIndexOf(".")));
        if (typeof (mimeTypes[fileExtension]) == "string") {
            res.writeHead(200, {"Content-Type": mimeTypes[fileExtension]});
        }
        var frs = nodeNative.fs.createReadStream(pathToApp + '/public' + req.url);
        frs.pipe(res);
        return true;
    }
    return false;
}

constructor.prototype.loadController = function(){
    if (this.requestedURL.pathArray.isEmpty()) { // index controller...
        this.controllerPath = "index";
        this.controllerName = "index";
        var controllerDiskPath = nodeNative.path.join(application.pathToApp, "/Modules/", this.controllerPath, 'controller.js');
        if (nodeNative.fs.existsSync(controllerDiskPath)) {
            if (typeof(application.controllers[this.controllerName]) == "undefined") {
                application.controllers[this.controllerName] = require(controllerDiskPath);
            }
            return true;
        }
    }
    // any other controller
    for (var pathComponent in this.requestedURL.pathArray) {
        if (typeof this.requestedURL.pathArray[pathComponent] == 'string') {
            this.controllerPath = this.controllerPath + "/" + this.requestedURL.pathArray[pathComponent];
            this.controllerName = this.requestedURL.pathArray[pathComponent];
            if (nodeNative.fs.existsSync(nodeNative.path.join(application.pathToApp, "/Modules/", this.controllerPath))) {
                var controllerDiskPath = nodeNative.path.join(application.pathToApp, "/Modules/", this.controllerPath, 'controller.js');
                if (nodeNative.fs.existsSync(controllerDiskPath)) {
                    if (typeof(application.controllers[this.controllerName]) == "undefined") {
                        console.log("Loading ... ", this.controllerName);
                        application.controllers[this.controllerName] = require(controllerDiskPath);
                        console.log('Loaded: ', application);
                    }// else
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
 * creates a new server function.
 * @returns {function(this:constructor)}
 */
module.exports.HTTPServerFunction = function(){
    return function(req,res){
        console.log('Serving request for url: ', req.url, 'from ', req.connection.remoteAddress, req.connection.remotePort);
        if (application.acceptedMethods.indexOf(req.method) == -1) { // simply refuse unaccepted methods.
            res.statusCode = 501;
            return;
        }
        if(this.servePhysicalFiles(req, res)){
            return;
        }
        this.requestedURL = nodeNative.url.parse(req.url, true);
        this.requestedURL.pathArray = this.requestedURL.pathname.split('/').trim();
    }.bind(new constructor());
}

