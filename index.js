global.confPath = process.argv.length > 2?process.argv[2]:__dirname + "/config.json";
const config = require("./servicios/Config").Config.instance;

async function createHTTPServer() {
    const zServer = require("./z-server/z-server");
    const express = require('express');
    const app = express();
    //const bodyParser = require('body-parser');
    const http = require('http');
    const conf = config.getConfig();
    const seguridad = require("./servicios/Seguridad").Seguridad.instance;
    const log = require("./servicios/Log").Log.instance;
    const profileCMMS = require("./servicios/ProfileCMMS");

    await seguridad.inicializa();
    
    zServer.registerModule("conf", config);
    zServer.registerModule("seg", seguridad);
    zServer.registerModule("log", log);
    
    app.use("/", express.static(__dirname + "/www"));
    app.use(express.urlencoded({ extended: false }));
    app.use(express.json());
    app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
        next();
    });

    app.post("/*.*", function(req, res) {
		zServer.resolve(req, res);
    });    

    //Proxy From Agunsa CMMS
    app.post("/login", profileCMMS.loginReceptor);
    app.post("/logout", profileCMMS.logoutReceptor);
    app.post("/generaTokenRecuperacion", profileCMMS.generaTokenRecuperacionReceptor);
    app.post("/cambiaPwd", profileCMMS.cambiaPwdRecuperacionReceptor);
    app.post("/getPrivilegiosSesion", profileCMMS.getPrivilegiosSesionReceptor);
    

    if (conf.webServer.http) {
        var port = conf.webServer.http.port;
        httpServer = http.createServer(app);
        httpServer.listen(port, function () {
            console.log("[agunsa-perfiles] HTTP Server started on port " + port);
        });
    }
}

createHTTPServer();