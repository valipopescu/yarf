var constructor = function(){
    this.statusCode = 404;
    this.ErrorReason = "";
}.extends(require('../Controller'));
constructor.prototype.getIndex = function(){
    this.response = {
        Error: true,
        reason: this.ErrorReason
    }
    // if needed, put this in a closure (like in the case of a chain of callbacks / async calls)
    this.end();
}
module.exports = constructor