'use strict';

module.exports = function(req, res, instance) {
    switch (req.headers.accept) {
        case 'application/json':
            //
            res.setHeader('Content-Type', 'application/json');
            if (typeof instance.response != "undefined") {
                res.write(JSON.stringify(instance.response));
            }
            console.log('ending request');
            res.end();
            return;
            //}
        case 'text/html':
        case '*/*':
        default :
            //if (typeof this.response == "string" && !this.response.isEmpty())
            res.write(instance.response.toString());
    }
    console.log('ending request');
    res.end();
};
