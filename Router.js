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
 * Native Node modules are loaded here (kind of namespace)
 * @type {{}}
 */
var nodeNative = {};
nodeNative['http'] = require('http');
nodeNative['url'] = require('url');
nodeNative['fs'] = require('fs');
nodeNative['path'] = require('path');


var constructor = function(){
    this.req = nodeNative['http'].IncomingMessage;
    this.res = nodeNative['http'].ServerResponse;
    this.controllerName = "";
    this.controllerPath = "";
};

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
application['controllers'] = {};

constructor.prototype.servePhysicalFiles = function(){
    if (nodeNative.fs.existsSync(pathToApp + '/public' + this.req.url) &&
        nodeNative.fs.statSync(pathToApp + '/public' + this.req.url).isFile()) { // serve physical file
        var fileExtension = this.req.url.substr((req.url.lastIndexOf(".")));
        if (typeof (mimeTypes[fileExtension]) == "string") {
            this.res.writeHead(200, {"Content-Type": mimeTypes[fileExtension]});
        }
        var frs = nodeNative.fs.createReadStream(pathToApp + '/public' + this.req.url);
        frs.pipe(this.res);
        return true;
    }
    return false;
}

constructor.prototype.loadController = function(){

}

/**
 * creates a new server function.
 * @returns {function(this:constructor)}
 */
module.exports = function(){
    return function(req,res){
        this.req = req;
        this.res = res;
    }.bind(new constructor());
}