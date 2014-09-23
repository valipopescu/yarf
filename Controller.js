/**
 * Just some basic data needed for the Controllers
 */
var constructor = function(){
    /**
     * Object for response. Add variables here or set to a string
     * @type {{}}
     */
    this.response = {};
    /**
     * Add / Replace headers to your hearts content
     * @type {{}}
     */
    this.headers = {};
    /**
     * HTTP Status code sent to the requester
     * @type {number}
     */
    this.requestHeaders = {};
    this.responseCode = 200; // by default?
    /**
    this.urlParams = [];
    this._POST = {}; // FORM kind of posts
    this._GET = {}; // get params
    this.remoteIP = "";
    this.remotePort = "";
     */
}
/**
 * Called when the method is finished with all its callbacks or whatever it has to do.
 * @Mandatory
 */
constructor.prototype.end = function(){

}

module.exports = constructor;



///  !(ip.dst == 10.0.0.0/8) && !(ip.dst == 255.255.255.255) && !(eth.dst == ff:ff:ff:ff:ff:ff) && !(ip.dst == 224.0.0.252)