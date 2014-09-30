/**
 * Created by ValentinP on 30/09/2014.
 */
var constructor = function(){
    this.remoteIP = '';
    this.remotePort = '';
}
constructor.prototype.send = function(message){
}

constructor.prototype.onConnect = function(){
    // do some things at connection
}

constructor.prototype.onDisconnect = function(){
}

constructor.prototype.onUnresolvedMessage = function(){

}