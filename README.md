yarf
====
## Yet Another Restful Framework

The framework is meant to be a very lightweight REST Framework to be used in applications that want to match the traditional Model Mapper View Controller (MMVC).
It requires your application to have a certain folder structure:
```
MainAppFolder\
    |
    |---Controllers\
    |       |
    |       |---controllerName.js
    |       |---controllerName1.js
    |---Mappers\
    |       |
    |       |---mapperName.js
    |       |---mapperName1.js
    |---Models\
    |       |
    |       |---modelName.js
    |---public\
    |       |
    |       |--file.html
    |       |--folder\
    |       |    |---file.jpg (or any other format)
```
* **Controller** - contains the actions preceded by their HTTP Verbs. For example:

```javascript
var constructor = function () {
    this.usersMapper = new(require('../Mappers/users.js'))();
    this.userModelClass = require('../Models/user.js');
}.extends(require('yarf').Controller);

constructor.prototype.postLogin = function () {
    if(typeof this._PAYLOAD['email'] == "undefined" || typeof this._PAYLOAD['password'] == "undefined"){
        this.statusCode = 404;
        this.response = undefined;
        return this.end();
    }
    this.usersMapper.login(this._PAYLOAD['email'], this._PAYLOAD['password'], function(err, doc){
        if(err){
            this.statusCode = 500; // something happened in the db server?!
        }else {
            if (doc == null || doc == undefined) {
                console.log('Login attempt failed from ', this.remoteIP, ":", this.remotePort , " with payload: ", this._PAYLOAD);
                this.response = undefined;
                this.statusCode = 404;
            }else{
                this._SESSION['login'] = doc._id.toString();
                this.response = doc;
                this.statusCode = 200;
            }
        }
        this.end();
    }.bind(this));
};

module.exports = constructor;
```


Controllers expose several **properties**:


| Property Name        | What it does
|:--------------------:|:------------
| `this._SESSION`      | contains all the session data that has been added to it in previous calls
| `this._GET`          | contains all query string vars: `http://yoursite.tld/user/processGetVars?getVar1=300` will produce `this._GET['getVar1']` with the value of `300`
| `this._POST`         | contains all form fields sent through POST
| `this._FILES`        | contains a list of files and where they are stored on the disk currently (temporary store), as well as their details as sent by the client
| `this._URLPARAMS`    | an array with the params sent by url: `http://site.tld/user/action/paramValue1/paramValue2` will produce `['paramValue1', 'paramValue2']`
| `this._PAYLOAD`      | contains the payload as received. If `Content-Type` was set to `application/json` then payload will contain the parsed object
| `this.remoteIp`      | ip of the remote (for now it respects directly the X-Forwarded-For header, future versions will make it so it respects only from trusted list of ips)
| `this.remotePort`    | the port of the remote connection. (when proxied the value may be inacurate)


Controllers also expose the following methods:


| Method Name         | What it does
|:--------------------|:-------------
| `this.setCookie`    | `function(cookieName, cookieValue, options)` Sets a cookie with the `cookieValue` value and `cookieName` name. Can add standard cookie options
| `this.end`          | call this when you're done with your request and the system can send the data to the user.


* **Mapper** - Contains data access layer. Will be used directly by the Controller. It has a `this.db` pointing to the current MongoDB connection An example:

```javascript
var constructor = function () {
    Object.defineProperty(this, 'collection', {
        value: this.db.collection("users")
    });
    this.collection.ensureIndex({
        email: 1
    }, {unique: 1}, function (err) {
        if (err)throw err
    });
    this.collection.ensureIndex({
        email: 1,
        password: 1
    }, function (err) {
        if (err) throw err;
    });
}.extends(require('yarf').Mapper);
constructor.prototype.login = function (email, password, cb) {
    this.collection.findOne({
        email: email,
        password: digestPassword(password)
    }, {
        password:0
    }, function (err, doc) {
        if(err) console.log('!!!!ERROR IN DB!!!!', err);
        cb(err, doc);
    });// no need to bind.
};
module.exports = constructor;
```
* **Model** - Contains the model of the data. For example:
```javascript
var constructor = function(passedObject){
    // todo complete this model with proper checks and everything.
    var email = "";
    var password="";
    var name = "";
    var surname = "";
    var dob = new Date();
    var phoneNumber = "";
    Object.defineProperties(this,{
        email:{
            enumerable: true,
            configurable: false,
            set: function(paramMail){
                // ensure the email is correct
                if(!emailTest.test(paramMail)){ // all these checks will be replaced by specs
                    throw "Not Email";
                }
                email = paramMail;
            },
            get: function(){
                return email;
            }
        },
        password: {
            enumerable: true,
            configurable: false,
            set: function(passParam){
                if(typeof passParam != "string" || passParam.length < 8 ){ // whatever other stuff you may want to use
                    throw "invalid password";
                }
                password = passParam;
            },
            get: function(){
                return password;
            }
        }
    });

    if(typeof passedObject != 'undefined'){
        for(var enumProperty in this){
            this[enumProperty] = passedObject[enumProperty];
        }
    }
}.extends(require('yarf').Model);
module.exports = constructor;
```

##Boilerplate
Example app.js:
```javascript
var yarf = require("yarf");
yarf.start(8000, __dirname+"/Server", {
    mongo:{
        url: 'mongodb://localhost/myApp'
    },
    session:{
        collName: "mySessionCollection",
        sessVarName: "sid"
    }
});
```

##Future Roadmap:
* Uses location based views via EJS (closest to the way views are parsed in most PHP frameworks) or other template framework to reply to `Content-type: text/html` and `Content-Type: */*`
* Interfaces with mySQL if need arises or other dbs.
* Break the code a bit more from the Router.js eventually into more files
