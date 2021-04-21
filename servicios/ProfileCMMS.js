const ZModule = require("../z-server/z-server").ZModule;
const Log = require("./Log");
const pgSQL = require("./PgSQL").PgSQL.instance;
const log = require("./Log").Log.instance;
const seguridad = require("./Seguridad").Seguridad.instance;
const classInstances = ['psSQL', 'log', 'seguridad'];
const config = require("./Config").Config.instance.getConfig();

async function loginReceptor(req, res) {
    try {
        let body = req.body;
        let header = req.headers;
        console.log(`[perfiles][loginReceptor][header] ${JSON.stringify(header.authorization, null, 4)}`);
        console.log(`[perfiles][loginReceptor][body] ${JSON.stringify(body, null, 4)}`);
        let bearerToken = config.general.bearerTokenCMMS;
        //validate bearerToken
        if (!bearerToken || bearerToken != header.authorization.split(' ')[1]) {
            res.status(200).send({ status: 401, message: `Authentication error` });
        }else{
            //Process service
            await seguridad.login(body.login, body.pwd, body.codigoSistema).then( response => {
                console.log(`[perfiles][loginReceptor][response] ${JSON.stringify(response, null, 4)}`);    
                res.status(200).send({ status: 200, msg: response });
            }).catch((error) => {
                console.log(`[perfiles][loginReceptor][error] ${JSON.stringify(error, null, 4)}`);    
                res.status(200).send({ status: 400, error: error });
            });
        }
    } catch(error) {
        console.log(`[perfiles][loginReceptor][error] ${JSON.stringify(error, null, 4)}`);
        if (typeof error == 'string' ) res.status(400).send(error);
        else res.status(500).send({ msg: error });
    }
}

async function logoutReceptor(req, res) {
    try {
        let body = req.body;
        let header = req.headers;
        console.log(`[perfiles][logoutReceptor][header] ${JSON.stringify(header.authorization, null, 4)}`);
        console.log(`[perfiles][logoutReceptor][body] ${JSON.stringify(body, null, 4)}`);
        let bearerToken = config.general.bearerTokenCMMS;
        //validate bearerToken
        if (!bearerToken || bearerToken != header.authorization.split(' ')[1]) {
            res.status(200).send({ status: 401, message: `Authentication error` });
        }else{
            //Process service
            await seguridad.logout(body.zToken, body.codigoSistema).then( response => {
                console.log(`[perfiles][logoutReceptor][response] ${JSON.stringify(response, null, 4)}`);    
                res.status(200).send({ status: 200, msg: response });
            }).catch((error) => {
                console.log(`[perfiles][logoutReceptor][error] ${JSON.stringify(error, null, 4)}`);    
                res.status(200).send({ status: 400, error: error });
            });
        }
    } catch(error) {
        console.log(`[perfiles][logoutReceptor][error] ${JSON.stringify(error, null, 4)}`);
        if (typeof error == 'string' ) res.status(400).send(error);
        else res.status(500).send({ msg: error });
    }
}

async function generaTokenRecuperacionReceptor(req, res) {
    try {
        let body = req.body;
        let header = req.headers;
        console.log(`[perfiles][generaTokenRecuperacionReceptor][header] ${JSON.stringify(header.authorization, null, 4)}`);
        console.log(`[perfiles][generaTokenRecuperacionReceptor][body] ${JSON.stringify(body, null, 4)}`);
        let bearerToken = config.general.bearerTokenCMMS;
        //validate bearerToken
        if (!bearerToken || bearerToken != header.authorization.split(' ')[1]) {
            res.status(200).send({ status: 401, message: `Authentication error` });
        }else{
            //Process service
            await seguridad.generaTokenRecuperacion(body.login).then( response => {
                console.log(`[perfiles][generaTokenRecuperacionReceptor][response] ${JSON.stringify(response, null, 4)}`);    
                res.status(200).send({ status: 200, msg: response });
            }).catch((error) => {
                console.log(`[perfiles][generaTokenRecuperacionReceptor][error] ${JSON.stringify(error, null, 4)}`);    
                res.status(200).send({ status: 400, error: error });
            });
        }
    } catch(error) {
        console.log(`[perfiles][generaTokenRecuperacionReceptor][error] ${JSON.stringify(error, null, 4)}`);
        if (typeof error == 'string' ) res.status(400).send(error);
        else res.status(500).send({ msg: error });
    }
}

async function cambiaPwdRecuperacionReceptor(req, res) {
    try {
        let body = req.body;
        let header = req.headers;
        console.log(`[perfiles][cambiaPwdRecuperacionReceptor][header] ${JSON.stringify(header.authorization, null, 4)}`);
        console.log(`[perfiles][cambiaPwdRecuperacionReceptor][body] ${JSON.stringify(body, null, 4)}`);
        let bearerToken = config.general.bearerTokenCMMS;
        //validate bearerToken
        if (!bearerToken || bearerToken != header.authorization.split(' ')[1]) {
            res.status(200).send({ status: 401, message: `Authentication error` });
        }else{
            //Process service
            await seguridad.cambiaPwd(body.token, body.pwd, body.pwd1, body.pwd2).then( response => {
                console.log(`[perfiles][cambiaPwdRecuperacionReceptor][response] ${JSON.stringify(response, null, 4)}`);    
                res.status(200).send({ status: 200, msg: response });
            }).catch((error) => {
                console.log(`[perfiles][cambiaPwdRecuperacionReceptor][error] ${JSON.stringify(error, null, 4)}`);    
                res.status(200).send({ status: 400, error: error });
            });
        }
    } catch(error) {
        console.log(`[perfiles][cambiaPwdRecuperacionReceptor][error] ${JSON.stringify(error, null, 4)}`);
        if (typeof error == 'string' ) res.status(400).send(error);
        else res.status(500).send({ msg: error });
    }
}

async function getPrivilegiosSesionReceptor(req, res) {
    try {
        let body = req.body;
        let header = req.headers;
        console.log(`[perfiles][getPrivilegiosSesionReceptor][header] ${JSON.stringify(header.authorization, null, 4)}`);
        console.log(`[perfiles][getPrivilegiosSesionReceptor][body] ${JSON.stringify(body, null, 4)}`);
        let bearerToken = config.general.bearerTokenCMMS;
        //validate bearerToken
        if (!bearerToken || bearerToken != header.authorization.split(' ')[1]) {
            res.status(200).send({ status: 401, message: `Authentication error` });
        }else{
            //Process service
            await seguridad.getPrivilegiosSesion(body.zToken, body.codigoSistema).then( response => {
                console.log(`[perfiles][getPrivilegiosSesionReceptor][response] ${JSON.stringify(response, null, 4)}`);    
                res.status(200).send({ status: 200, msg: response });
            }).catch((error) => {
                console.log(`[perfiles][getPrivilegiosSesionReceptor][error] ${JSON.stringify(error, null, 4)}`);    
                res.status(200).send({ status: 400, error: error });
            });
        }
    } catch(error) {
        console.log(`[perfiles][getPrivilegiosSesionReceptor][error] ${JSON.stringify(error, null, 4)}`);
        if (typeof error == 'string' ) res.status(400).send(error);
        else res.status(500).send({ msg: error });
    }
}


module.exports = {
    loginReceptor,
    logoutReceptor,
    generaTokenRecuperacionReceptor,
    cambiaPwdRecuperacionReceptor,
    getPrivilegiosSesionReceptor
}