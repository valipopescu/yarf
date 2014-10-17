'use strict';
/**
 * Native Node modules are loaded here (kind of namespace)
 * @type {{}}
 */
var nodeNative = {
    http: require('http'),
    url: require('url'),
    fs: require('fs'),
    path: require('path'),
    os: require('os')
};

var externalLibs = {
    busboy: require('busboy'),
    cookie: require('cookie')
};
/**
 * Application Object (holds statics)
 * @type {{}}
 */
var application = {
    /**
     * Accepted methods (static)
     * @type {string[]}
     */
    acceptedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
    /**
     * Static path to app.
     * @type {string}
     */
    pathToApp : "",
    /**
     * Can the application server start?
     * @type {boolean}
     */
    canStart: true,
    /**
     * Mime Types
     * @type {string{string}}
     */
    mimeTypes: JSON.parse(nodeNative.fs.readFileSync(__dirname + "/mime.json", "utf8"))
};

if (Object.isEmpty(application.mimeTypes)) { // should not be able to start if there's no mime types preloaded.
    console.log("unable to load mime.json");
    application.canStart = false;
}
/**
 * Controllers
 * @type {{}}
 */
application.controllers = {};
application.views = {};

/**
 * Base Class for HTTP Server Fucntion. Will be used as base class for the WS(S) as well.
 */
var constructor = function () {
    this.controllerName = "";
    this.controllerPath = "";
    var actionName = "";

    Object.defineProperty(this, "actionName", {
        get: function self () {
            if (this.controllerName === "" || this.controllerPath === "") {
                return "";
            }
            if (actionName === "") {
                if (this.requestedURL.pathArray.isEmpty()) {
                    actionName = "index";
                } else {
                    actionName = this.requestedURL.pathArray.shift();
                }
            }
            actionName = actionName.ucFirst();
            return actionName;
        },
        writeable: false,
        enumerable: true
    });
    this.controllerInstance = null;
    this.actionMethod = "";
    this.requestedURL = {};
    this.session = {};
    this.sessionCookie = null;
    this.incomingCookies = {};// incoming
    this.preparedCookies = []; // outgoing
};

/**
 * Serves the physical files
 * @param req
 * @param res
 * @returns {boolean}
 */
constructor.prototype.servePhysicalFiles = function (req, res) { // gets them as params so that the methods can be reused.
    var physicalPath = nodeNative.path.join(application.pathToApp , 'public' , this.requestedURL.pathname);
    console.log("trying to serve physical path: ", physicalPath);
    if (nodeNative.fs.existsSync(physicalPath) &&
        nodeNative.fs.statSync(physicalPath).isFile()) { // serve physical file
        var fileExtension = req.url.substr((req.url.lastIndexOf(".")));
        if (typeof (application.mimeTypes[fileExtension]) == "string") {
            res.writeHead(200, {"Content-Type": application.mimeTypes[fileExtension]});
        }
        var frs = nodeNative.fs.createReadStream(physicalPath);
        frs.pipe(res);
        //console.log('Piped physical file: ', application['pathToApp'] + '/public' + req.url);
        return true;
    }
    return false;
};

constructor.prototype.loadController = function () {
    //TODO: controllers as files
    var controllerDiskPath;
    if (this.requestedURL.pathArray.isEmpty()) { // index controller...
        this.controllerPath = "index";
        this.controllerName = "index";
        controllerDiskPath = nodeNative.path.join(application.pathToApp, "/Controllers/", this.controllerPath+'.js');
        if (nodeNative.fs.existsSync(controllerDiskPath)) {
            if (typeof(application.controllers[this.controllerName]) == "undefined") {
                console.log("Loading ... ", this.controllerName);
                application.controllers[this.controllerName] = require(controllerDiskPath);
                console.log('Loaded: ', this.controllerName);
            }
            console.log('Serving Controller: ' + this.controllerName + " with action: " + this.actionMethod + this.actionName);
            return true;
        }
    }
    // any other controller
    for (var pathComponent in this.requestedURL.pathArray) {
        if (typeof this.requestedURL.pathArray[pathComponent] == 'string') {
            this.controllerPath = this.controllerPath + "/" + this.requestedURL.pathArray[pathComponent];
            this.controllerName = this.requestedURL.pathArray[pathComponent];
            //console.log(this);
            controllerDiskPath = nodeNative.path.join(application.pathToApp, "/Controllers/", this.controllerPath+'.js');
            console.log(controllerDiskPath);
            if (nodeNative.fs.existsSync(controllerDiskPath)) {
                if (nodeNative.fs.existsSync(controllerDiskPath)) {
                    if (typeof(application.controllers[this.controllerName]) == "undefined") {
                        console.log("Loading ... ", this.controllerName);
                        application.controllers[this.controllerName] = require(controllerDiskPath);
                        if (typeof application.controllers[this.controllerName] != 'function') {
                            // the loaded controller is not a constructor.
                            return false;
                        }
                        console.log('Loaded: ', this.controllerName);
                    }// else
                    // regardless of whether a controller was loaded or not, the pathArray should now contain only the bit after the controller
                    this.requestedURL.pathArray = this.requestedURL.pathname.replace(this.controllerPath, "").split("/").trim();
                    console.log('Serving Controller: ' + this.controllerName + " with action: " + this.actionMethod + this.actionName);
                    //var actionName = this.actionName; // only to trigger the property.
                    return true;// loaded now or before, the controller should be loaded at this point.
                }// else keep going
            } else {
                return false; // the requested path contains a path that can't be resolved on disk to a controller.
            }
        }
    }
    return false;
};
/**
 * Serves the options requests. Always has status code 200 unless there's something wrong with the server when it returns 500
 * It will show ALL HTTP methods for the current requested controller and action in Allow header
 * @param req
 * @param res
 * @returns {boolean}
 */
constructor.prototype.serveOptions = function (req, res) {
    // TODO add swagger library Controller on which all the swagger docblock parsing is done.
    if (req.method == "OPTIONS") {
        if (this.controllerName.isEmpty() || this.controllerPath.isEmpty()) {
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
            if (typeof application.controllers[this.controllerName].prototype[controllerMethodName] == "function" && controllerMethodName.match(methodRegexp) !== null) {
                var acceptedMethod = controllerMethodName.replace(methodRegexp, "").toUpperCase();
                if (acceptedMethod === "") {
                    acceptedMethod = "GET";
                }
                if (application.acceptedMethods.indexOf(acceptedMethod) >= 0) {
                    controllerAcceptedMethods.push(acceptedMethod); // it'll push multiple times to show there's multiple get methods. twice means a version for more than one HTTP method purpose ... shouldn't be more than twice :)
                }
            }
        }
        res.setHeader("Allow", controllerAcceptedMethods.join(', '));
        console.log('ending request');
        res.end();
        return true;
    }
    return false; // wasn't options
};
constructor.prototype.loadViewAndSend = function(req,res){
    // TODO can be improved in readability but that's basically what it should do
    // first try to see whether we can load a view, or have any preloaded (same way we do it with controllers) once done first time it's automatically done after that.
    console.log('path: ', nodeNative.path.join(application.pathToApp, 'Views', this.controllerName, this.actionMethod + this.actionName + ".js"));
    var viewInstance = null;
    if(application.views[this.controllerName] && typeof application.views[this.controllerName][this.actionMethod + this.actionName] === "function"){ // typeof outputs STRING ONLY why check complete equality when you already know it is string v string don't put === in that case
        viewInstance = new application.views[this.controllerName][this.actionMethod + this.actionName](this.controllerInstance.response);
    }else{
        var physicalPath = nodeNative.path.join(application.pathToApp, 'Views', this.controllerName, this.actionMethod + this.actionName + ".js");// you could call them .view.js if you like that better.
        if(nodeNative.fs.existsSync(physicalPath)){
            if (!application.views[this.controllerName]) {
                application.views[this.controllerName] = {};
            }
            application.views[this.controllerName][this.actionMethod + this.actionName] = require(physicalPath);
        }else{
            // no view was found respond with the fact the bloody thing is not supported (406)
            res.setHeader("Acceptable", "Accept: application/json"); // since that is default defined
            res.statusCode = 406;
            res.end();
            return;
        }
        if(typeof application.views[this.controllerName][this.actionMethod + this.actionName] == "function"){ // typeof outputs STRING ONLY why check complete equality when you already know it is string v string don't put === in that case
            viewInstance = new application.views[this.controllerName][this.actionMethod + this.actionName]();
        }else{
            res.setHeader("Acceptable", "Accept: application/json"); // since that is default defined
            res.statusCode = 406;
            res.end();
            return;
        }
    }
    res.setHeader('Content-Type', 'text/html');
    res.write(viewInstance.render(this.controllerInstance.response));
    res.end(); // job done.
};
constructor.prototype.parseHeaderAndRespond = function(req, res) {
    switch (req.headers.accept) {
        case 'application/json':
            res.setHeader('Content-Type', 'application/json');
            if (typeof this.controllerInstance.response != "undefined") {
                res.write(JSON.stringify(this.controllerInstance.response));
            }
            console.log('ending request');
            res.end();
            return;
            //}
        case 'text/html':
        case '*/*':
        default :
            if (typeof this.controllerInstance.response === 'string') {
                res.setHeader('Content-Type', 'text/html');
                res.write(this.controllerInstance.response);
            } else {
                this.loadViewAndSend(req,res);
            }
    }
    console.log('ending request');
    res.end();
};

constructor.prototype.createEndFunction = function (req, res) {

    if (this.controllerInstance === null) {
        return false;
    }
    Object.defineProperty(this.controllerInstance, 'end', {
        value: function () {
            if (application.sessionCollection) {
                application.sessionCollection.findAndModify({
                    _id: new externalLibs.mongoDriver.ObjectID(this.sessionCookie)
                },{
                    $natural: 1
                },{
                    $set: {
                        lastAccessed: new Date(),
                        data: this.controllerInstance._SESSION
                    }
                },{
                    new: true
                }, function (err, doc) {
                    if (err) {
                        res.statusCode = 500;
                        console.log('ending request');
                        res.end();
                        console.log("couldn't update session in mongo", err);
                    } else {
                        if (typeof this.controllerInstance.headers == "object" && !this.controllerInstance.headers.isEmpty()) {
                            for (var headerName in this.controllerInstance.headers) {
                                if (headerName.match(/set-cookie/i) === null) // IGNORE any cookies set manually through headers.
                                    res.setHeader(headerName, this.controllerInstance.headers[headerName]);
                                else{
                                    console.log('Attempted to set cookie: ' + headerName + ' to ' + this.controllerInstance.headers[headerName] + ' in controller' + this.controllerName );
                                }
                            }
                        }
                        res.setHeader('Set-Cookie', this.preparedCookies);

                        res.statusCode = this.controllerInstance.statusCode || res.statusCode;
                        this.parseHeaderAndRespond(req, res);
                    }
                }.bind(this));
            } else {
                this.parseHeaderAndRespond(req, res);
            }
            // now go through the session data and save it to the db
        }.bind(this)
    });
    return true;
};

constructor.prototype.multipartParse = function (req, res) {

    /**
     * @TODO: have a flag on the action so that the parsing can be done with progress function (or somethign similar).
     * @TODO: The progress function can be used to push over websocket the progress of the upload (or something along that line)
     */
    var busboy = new externalLibs.busboy({ headers: req.headers });
    var actions = 1;
    busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
        fieldname = unescape(fieldname.replace(/\+/g, ' '));
        ++actions;
        var tmpFileName = nodeNative.path.join(nodeNative.os.tmpdir(), 'yarfTmpFile_' + (new Date()).getTime().toString(16) + Math.round(Math.random() * 1e15).toString(16));
        this.controllerInstance._FILES[fieldname] = {
            fileName: filename,
            encoding: encoding,
            mimetype: mimetype,
            tmpfName: tmpFileName
        };
        file.pipe(nodeNative.fs.createWriteStream(tmpFileName)).on('unpipe', function () {
            if (--actions === 0) {
                this.runAction();
            }
        }.bind(this));
    }.bind(this));
    busboy.on('field', function (fieldname, val, fieldnameTruncated, valTruncated) {
        this.controllerInstance._POST[unescape(fieldname.replace(/\+/g, ' '))] = unescape(val.replace(/\+/g, ' '));
    }.bind(this));
    busboy.on('partsLimit', function () {
        throw new Error('Busboy parts limit reached');
    });
    busboy.on('filesLimit', function () {
        throw new Error('Busboy parts limit reached');
    });
    busboy.on('fieldsLimit', function () {
        throw new Error('Busboy parts limit reached');
    });
    busboy.on('finish', function () {
        if (--actions === 0) {
            this.runAction();
        }
    }.bind(this));
    return req.pipe(busboy);
};

constructor.prototype.parseRequest = function (req, res) {
    var multiPartParse = false;
    if (typeof(req.headers['content-type']) == 'undefined') {
        // might be a get request
        return this.runAction();
    }
    switch (req.headers['content-type']) {
        case 'application/json':
            var requestData = '';
            req.on('data', function (data) {
                requestData += data;
            });
            req.on('end', function () {
                var payload;
                try {
                    payload = JSON.parse(requestData);
                } catch (e) {
                    payload = requestData;
                } finally {
                    Object.defineProperty(this.controllerInstance, '_PAYLOAD', {
                        enumerable: true,
                        configurable: false,
                        writeable: false,
                        value: payload
                    });
                    this.runAction();
                }
            }.bind(this));
            return true;
        case 'application/x-www-form-urlencoded':
        case 'multipart/form-data':
            multiPartParse = true;
            break;
        default:
            if (typeof req.headers['content-type'] != 'undefined' && req.headers['content-type'].indexOf('multipart/form-data') != -1) {
                multiPartParse = true;
            } else {
                // just put the contents on the payload as is.
                this.controllerInstance.payload = "";
                req.on('data', function (data) {
                    this.controllerInstance.payload += data;
                }.bind(this));
                req.on('end', function () {
                    this.runAction();
                }.bind(this));
                return true;
            }
            break;
    }
    if (multiPartParse === true) {
        this.multipartParse(req, res);
    } else {
        console.log('how the fuck did it get here?!');
        this.runAction();
    }
    return true;
};
constructor.prototype.runAction = function () {
    this.controllerInstance[this.actionMethod + this.actionName]();
    return true;
};

constructor.prototype.serveAction = function (req, res) {
    if (typeof application.controllers[this.controllerName].prototype[this.actionMethod + this.actionName] == 'function') {
        this.controllerInstance = new application.controllers[this.controllerName]();
        if (!this.createEndFunction(req, res)) {
            console.log('returning false');
            return false;
        }
        if (typeof this.controllerInstance !== 'object' || this.controllerInstance === null) {
            console.log('returning false');
            return false;
        }
        // inside the instance start defining properties:
        Object.defineProperties(this.controllerInstance, {
            remoteIp:{
                enumerable: true,
                configurable: false,
                writeable: false,
                value: req.headers['X-Forwarded-For'] || req.connection.remoteAddress
            },
            remotePort:{
                enumerable: true,
                configurable: false,
                writeable: false,
                value: req.connection.remotePort
            },
            _GET: {
                enumerable: true,
                configurable: false,
                writeable: false,
                value: this.requestedURL.query
            },
            _FILES: {
                enumerable: true,
                configurable: false,
                writeable: false,
                value: {}
            },
            _POST: {
                enumerable: true,
                configurable: false,
                writeable: false,
                value: {}
            },
            _URLPARAMS: {
                enumerable: true,
                configurable: false,
                writeable: false,
                value: this.requestedURL.pathArray
            },
            _SESSION: {
                enumerable: true,
                configurable: false,
                writeable: false, // means that it can't be set to null or anything funny.
                value: this.session
            },
            _COOKIE: {
                enumerable: true,
                configurable: false,
                writeable: false,
                value: this.incomingCookies
            },
            setCookie: {
                enumerable: false,
                configurable: false,
                writeable: false,
                value: function(cookieName, cookieValue, options){
                    if(cookieName == application.options.session.sessVarName) // IGNORE setting the session cookie to something else.
                        return;
                    this.preparedCookies.push(externalLibs.cookie.serialize(cookieName, cookieValue));
                }.bind(this)
            }
        });

        // TODO : Give the controllers an option to yield to subcontrollers, eventually ability to add request Params and stuff
        // this option will get to use up the rest of the urlParams after the controller has taken all it needs.
        return this.parseRequest(req, res);
    } else {
        console.log("Controller " + this.controllerName + " does not contain a method: " + this.actionMethod + this.actionName + "");
        return false;
    }
};
constructor.prototype.sessionInit = function (req, res) {
    if (typeof application.sessionCollection === 'undefined') {
        if (!this.serveAction(req, res)) { // serve the action as is ... got no sessions! NO IN MEMORY SESSIONS! DO NOT !!! Not scalable ... bad
            res.statusCode = 501;
            console.log('ending request');
            res.end();
            console.log("couldn't serve the action");
        }
        console.log('serving without sessions');
        return; // regardless of whether an error was returned or not just return
    }
    if (typeof req.headers.cookie === 'string') {
        this.incomingCookies = externalLibs.cookie.parse(req.headers.cookie);
        this.sessionCookie = this.incomingCookies[application.options.session.sessVarName];
        delete this.incomingCookies[application.options.session.sessVarName];
    }
    application.sessionCollection.findAndModify({
        _id: new externalLibs.mongoDriver.ObjectID(this.sessionCookie)
    },{
        $natural: 1
    },
    {
        $set: {
            lastAccessed: new Date()
        }
    },{
        new: true,
        upsert: true
    }, function (err, doc) {
        if (err) {
            res.statusCode = 500;
            console.log('ending request');
            res.end();
            console.log("couldn't create session in mongo", err);
        } else {
            if(this.sessionCookie === undefined){
                this.preparedCookies.push(externalLibs.cookie.serialize(application.options.session.sessVarName, doc._id.toString()));
            }
            this.sessionCookie = doc._id.toString();
            for (var sessionVarName in doc.data) {
                this.session[sessionVarName] = doc.data[sessionVarName];
            }
            if (!this.serveAction(req, res)) {
                res.statusCode = 501;
                console.log('ending request');
                res.end();
                console.log("couldn't serve the action");
            }
        }
    }.bind(this));
};
constructor.prototype.process = function (req, res) {
    if (application.acceptedMethods.indexOf(req.method) == -1) { // simply refuse unaccepted methods.
        res.statusCode = 501;
        console.log('ending request');
        res.end();
        return;
    }

    this.requestedURL = nodeNative.url.parse(req.url, true);
    if (this.servePhysicalFiles(req, res)) {
        return;
    }
    this.actionMethod = req.method.toLowerCase();
    this.requestedURL.pathArray = this.requestedURL.pathname.split('/').trim();
    if (!this.loadController()) {
        res.statusCode = 500;
        console.log('ending request');
        res.end();
        console.log("Couldn't load controller for the " + req.url + " request");
        return;
    }
    if (this.serveOptions(req, res)) {// served already s
        return;
    }
    this.sessionInit(req, res);
};


/**
 * Router class for reuse in websockets.
 * @type {constructor}
 */
module.exports.routerClass = constructor;

/**
 * creates a new server function.
 * @returns {function(this:constructor)}
 */
module.exports.HTTPServerFunction = function (pathToApplication, options) {
    application.pathToApp = pathToApplication;
    application.options = options;
    var canProcess = true;
    if (typeof application.options.session == 'undefined') {
        application.options.session = {};
    }
    if (typeof application.options.session.sessVarName != "string") {
        application.options.session.sessVarName = 'yjs';
    }
    if (typeof application.options.session.collName != "string") {
        application.options.session.collName = '__y_sessions';
    }
    if (typeof application.options.mongo === 'object' && typeof application.options.mongo.url === 'string') {
        canProcess = false;
        externalLibs.mongoDriver = require('mongodb');
        externalLibs.mongoDriver.connect(application.options.mongo.url, function (err, db) {
            if (err) throw err; // fatal ?!
            application.mongoConn = db;
            var baseController = require('./Controller.js');
            baseController.prototype.db = application.mongoConn; // adds to ALL controllers
            baseController.prototype.db.ObjectID = externalLibs.mongoDriver.ObjectID;
            application.sessionCollection = baseController.prototype.db.collection(application.options.session.collName);
            application.sessionCollection.ensureIndex({
                lastAccessed: 1
            }, {
                expireAfterSeconds: (typeof options.session === "object" && options.session !== null && typeof options.session.expireAfterSeconds === "number") ? options.session.expireAfterSeconds : 7200 // 2 hours
            }, function () {
                canProcess = true;
            });
        });
    }
    return function (req, res) {
        try {
            if (canProcess === false) {
                throw new Error('Still initializing... can not process');
            }
            var requestProcessor = new constructor();
            console.log('Serving request for url: ', req.url, 'from ', req.connection.remoteAddress, req.connection.remotePort);
            requestProcessor.process(req, res);
        } catch (e) {
            res.statusCode = 500;
            console.log('ending request');
            res.end();
            console.log("Uncaught exception", e, e.stack);
        }
    };
};

module.exports.getMongoConn = function(){
    return application.mongoConn;
};
