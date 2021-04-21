'use strict';

const zsModules = {}
const zsListeners = []
let internalErrorMessage = "Internal Error. Please retry later";

exports.registerListener = listener => zsListeners.push(listener)
exports.registerModule = (extension, zModule) => zsModules[extension] = zModule
exports.setInternalErrorMessage = msg => internalErrorMessage = msg
exports.resolve = function(req, res) {
	var p0 = req.url.lastIndexOf("/");
	var p1 = req.url.lastIndexOf(".");
	var ext = req.url.substring(p1+1);
	var ope = req.url.substring(p0+1, p1);
    var arg = req.body;
    arg = arg?arg:{};
    if (req.get("Z-Token")) arg.zToken = req.get("Z-Token");
    let module = zsModules[ext];
    if (!module) {
        returnError(res, "No module registered at extension '" + ext + "'");
        return;
    }
    module.resolve(ope, arg)
        .then(ret => returnOK(res, ret))
        .catch(error => returnError(res, error));
}

function returnError(res, error) {
    if (typeof error == "string") {
        res.status(400).send(error);
    } else { 
        console.trace(error);
        res.status(500).send(internalErrorMessage);
    }
}
function returnOK(res, ret) {
    res.setHeader('Content-Type', 'application/json');
    res.status(200);
    res.send(ret?ret:null);    
}

const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
const ARGUMENT_NAMES = /([^\s,]+)/g;

exports.ZModule = class ZModule {
    constructor() {}
    get name() {return this.constructor.name}
    getArgumentNames(method) {
        var fnStr = method.toString().replace(STRIP_COMMENTS, '');
        var result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
        if(result === null) result = [];
        return result;
    }
    resolve(operationName, arg) {
        console.log('resolve');
        return new Promise((resolve, reject) => {
            let method = this[operationName];
            if (!method) {reject("Operation '" + operationName + "' not found in module '" + this.name + "'"); return;}
            let params = this.getArgumentNames(method);
            let paramValues = params.map(p => arg[p]);
            let resultOrPromise;
            try {
                resultOrPromise = method.apply(this, paramValues);
            } catch(error) {
                reject(error);
                return;
            }
            if (!resultOrPromise) {
                resolve(null);
            } else if (resultOrPromise instanceof Promise) {
                resultOrPromise
                    .then(ret => {
                        resolve(ret)
                    })
                    .catch(err => reject(err));
            } else  {
                resolve(resultOrPromise);
            }
        });
    }
}