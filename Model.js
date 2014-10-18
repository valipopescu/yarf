/**
 * Created by vpopescu on 02/10/2014.
 */
var constructor = function(passedObject){
    if(typeof passedObject != 'undefined'){
        for(var enumProperty in this){
            this[enumProperty] = passedObject[enumProperty];
        }
    }
}
module.exports = constructor;