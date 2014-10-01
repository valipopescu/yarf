/**
 * Created by ValentinP on 30/09/2014.
 */
var nodeNative = {};
nodeNative['fs'] = require('fs');
nodeNative['path'] = require('path');
var application = {
    wsProvider: null,
    pathToApp: ""
};

var constructor = function(){

}

module.exports = function(httpServer){
    // first check whether there's a websocket requirement
    var pathToWS = nodeNative.join(application.pathToApp, 'WS.js');
    if(nodeNative.fs.exists(pathToWS)) {
        application.wsProvider = require(pathToWS);
        var wss = new require('ws').Server({server: httpServer});
        wss.on('connection', function(ws){

            var wsProviderInstance = new application.wsProvider();
//            ws.send('Hello');
            ws.on("message", function (message) {
                ws.send("test");
                console.log('message: ' + message);
            });
            ws.on('close', function () {
                console.log('Stopped');
            })
        });
    }else{
        return;
    }
}