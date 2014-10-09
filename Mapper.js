/**
 * Created by vpopescu on 02/10/2014.
 */
var constructor = function(){
    this.db = require('Router.js').getMongoConn();
}
module.exports = constructor;