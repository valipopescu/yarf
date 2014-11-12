'use strict';

var constructor = function () {
    this.template = null;
    /**
     * Holds compiled template(s) for the view
     * @type {}
     * main will hold the default template
     * which is used if no other is specified
     */
     this.templates = {
         main: null
     };
     /**
     * Stores the template engine e.g. jade, handlebars, etc
     */
     this.engine = null;
     /**
     * holds path to directory root where templates are stored
     * @type string
     */
     this.viewsRoot = "";
};

/**
 * Replace this if you feel necessary.
 * @returns {string}
 */
constructor.prototype.toString = function(){
    throw "View toString Not implemented";
};

module.exports = constructor;
