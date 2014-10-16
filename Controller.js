'use strict';
/**
 * Just some basic data needed for the Controllers
 */
var constructor = function(){
    /**
     * Object for response. Add variables here or set to a string
     * @type {mixed | ANY } Data Transfer Object preferably
     */
    this.response = {};
    /**
    * html response
    * @type string
    */
    this.htmlResponse = '';
    /**
     * Response headers
     * @type {{}}
     */
    this.headers = {};
    /**
     * Incoming Request Headers
     * @type {{}}
     */
    this.requestHeaders = {};
    /**
     * Response code to be sent with the reply
     * @type {number}
     */
    this.responseCode = 200; // by default?
    /**
     * Files sent with the request
     * @type {{}}
     * @protected
     */
    this._FILES = {};
    /**
     * URL Parameters sent with the request. Contain all url parameters past the chosen action.
     * @type {Array}
     * @protected
     */
    this._URLPARAMS = [];
    /**
     * POST params (if the request was sent with a form)
     * @type {{}}
     * @protected
     */
    this._POST = {}; // FORM kind of posts
    /**
     * Incoming Cookies
     * @type {{}}
     * @private
     */
    this._COOKIE = {};
    /**
     *
     * @type {{}}
     * @private
     */
    this._SESSION = {};
    /**
     * GET Params (url query)
     * @type {{}}
     * @protected
     */
    this._GET = {}; // get params
    /**
     * Actual payload of the request. It will be populated with either string or Object
     * @type {string || object}
     */
    this._PAYLOAD = null; // could be object
    /**
     * Ip of the remote (where the request came from)
     * @todo take the X-Requested-For into consideration
     * @type {string}
     */
    this.remoteIP = "";
    /**
     * Port of the remote (where the request came from)
     * @type {string}
     */
    this.remotePort = "";
};
/**
 * Called when the method is finished with all its callbacks or whatever it has to do.
 * @Mandatory
 */
constructor.prototype.end = function(){

};


//
//constructor.prototype.spec = {
//    'a base one':{
//        someBaseValue: 100
//    }
//};

module.exports = constructor;
