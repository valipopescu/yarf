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
    this.responseCode = 200; // by default?
}
/**
 * Called when the method is finished with all its callbacks or whatever it has to do.
 * @Mandatory
 */
constructor.prototype.end = function(){

}

module.exports = constructor;