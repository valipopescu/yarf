/**
 * Just some basic data needed for the Controllers
 */
var constructor = function(){
    /**
     * Object for response. Add variables here or set to a string
     * @type {mixed | ANY } Data Transfer Object preferably
     */
    this.response = null;
    /**
     * Add / Replace headers to your hearts content
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
     * GET Params (url query)
     * @type {{}}
     * @protected
     */
    this._GET = {}; // get params
    /**
     * Actual payload of the request. It will be populated with either string or Object
     * @type {string || object}
     */
    this.payload = null; // could be object
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
}
/**
 * Called when the method is finished with all its callbacks or whatever it has to do.
 * @Mandatory
 */
constructor.prototype.end = function(){

}
//
//constructor.prototype.spec = {
//    'a base one':{
//        someBaseValue: 100
//    }
//};

module.exports = constructor;



///  !(ip.dst == 10.0.0.0/8) && !(ip.dst == 255.255.255.255) && !(eth.dst == ff:ff:ff:ff:ff:ff) && !(ip.dst == 224.0.0.252)