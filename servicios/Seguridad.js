
const ZModule = require("../z-server/z-server").ZModule;
const pgSQL = require("./PgSQL").PgSQL.instance;
const bcrypt = require('bcryptjs');
const uuidv4 = require('uuid/v4');
const smtpConfig = require("./Config").Config.instance.getConfig().smtp;
const nodemailer = require("nodemailer");
const log = require("./Log").Log.instance;
const moment = require('moment-timezone');

const codigoSistema = "PERFILES";
const tipoLog = {
    INFO: 'INFO',
    DEBUG: 'DEBUG',
    ERROR: 'ERROR',
    WARNING: 'WARNING'
}

class Seguridad extends ZModule {
    constructor() {
        super();
        this.inicializaSMTP(smtpConfig);
    }
    static get instance() {
        if (!global.seguridadInstance) global.seguridadInstance = new Seguridad();
        return global.seguridadInstance;
    }

    //INITIAL SETTINGS TO RUN WEB APP
    async inicializa() {
        // Asegurar que exista un administrador activo. Si no existe, se crea admin/admin
        let admins = await pgSQL.executeSQL("select count(*) as n from Usuario where activo='S' and admin='S'", []);
        if (!admins.length || parseInt(admins[0].n) === 0) {
            // Verificar que no exista un usuario 'admin'. Si existe, se activa, se hace administrador y se cambia su clave a 'admin'
            let admin = await pgSQL.executeSQL("select count(*) as n from Usuario where login = 'admin'", []);
            let adminPwd = await this.encript("admin");
            if (!admin.length || parseInt(admin[0].n) === 0) {
                await pgSQL.executeSQL(
                    " insert into Usuario(login, nombre, pwd, email, activo, admin)"
                    + " values ($1, encrypt($2, 'password', '3des'), $3, encrypt($4, 'password', '3des'), $5, $6)",
                    ["admin", "Administrador Default", adminPwd, "admin@agunsa.cl", "S", "S"]
                );
            } else {
                // Actualizar Administrador
                await pgSQL.executeSQL(
                    "update Usuario set pwd=$1, activo='S', admin='S' where login='admin'",
                    [adminPwd]
                )
            }
        }

        //PERFILES
        await this.updateSistema(codigoSistema, "PERFILES - ROLES y PERFILES");
        await this.updatePrivilegio(codigoSistema, "CONSULTA", "Consultar información Usuarios");
        await this.updatePrivilegio(codigoSistema, "LOG", "Acceso a Log del sistema");

        //CMSS
        await this.updateSistema("CMMS", "CMMS - GESTION DE MANTENIMIENTO");
        //LOGS DESDE CMMS
        await this.updatePrivilegio("CMMS", "LOG", "Acceso a Log del sistema");
        //MENU DE OPCIONES DESDE CMMS
        await this.updatePrivilegio("CMMS", "VER-CATALOGOS", "Acceso al menu de Catalogos de Equipos e Inmuebles");
        await this.updatePrivilegio("CMMS", "VER-OT", "Acceso al menu de ordenes de trabajo");
        await this.updatePrivilegio("CMMS", "VER-MANTENEDORES", "Acceso al menu de mantenedores");
        await this.updatePrivilegio("CMMS", "VER-IMPORTAR PACO", "Acceso al menu importar PACO");
        await this.updatePrivilegio("CMMS", "VER-INVENTARIO Y REPUESTOS", "Acceso al menu de inventarios y repuestos");
        await this.updatePrivilegio("CMMS", "VER-REPORTES", "Acceso al menu de reportes");
    }
    //Inicializa la configuracion del servidor SMTP
    async inicializaSMTP(serverMailConfiguration){
        let smtpConfig = {
            service     : serverMailConfiguration.service,
            host        : serverMailConfiguration.host,
            port        : serverMailConfiguration.port,
            secure      : serverMailConfiguration.secure,
            requireTLS  : serverMailConfiguration.requireTLS,
            auth: {
                user: serverMailConfiguration.auth.user,
                pass: serverMailConfiguration.auth.pass
            },
            tls: serverMailConfiguration.tls
        }
        console.log(`[inicializaSMTP][smtpConfig] ${JSON.stringify(smtpConfig, null, 4)} `);
        this._transport = nodemailer.createTransport(smtpConfig);
        try {
            console.log("[inicializaSMTP]   -- Checking SMTP Connection --   ");
            //this.logDebug("   -- Checking SMTP Connection '" + name + "'");
            await this._transport.verify();
            console.log("[inicializaSMTP] Verify on SMTP Connection Success");
        } catch (e) {
            console.error("[inicializaSMTP] Verify on SMTP Connection failed:" + e.toString(), e);
        }
    }
    //ENCRIPT DATA
    encript(pwd) {
        return new Promise((onOk, onError) => {
            bcrypt.hash(pwd, 8, (err, hash) => {
                if (err) onError(err);
                else onOk(hash);
            });
        });
    }
    //COMPARE ENCRIPT DATA
    compareWithEncripted(pwd, hash) {
        return bcrypt.compare(pwd, hash);
    }

    async _getUsuarioPorLoginOEmail(loginOEmail) {
        try {
            let campo = (loginOEmail.indexOf("@") > 0) ? "email" : "login";
            let valor = (loginOEmail.indexOf("@") > 0) ? "=cast(encrypt($1, 'password','3des') AS varchar)" : "=$1";
            let rows = await pgSQL.executeSQL(
                "select login as login, convert_from(decrypt(cast(nombre as bytea),'password','3des'::text), 'utf8') AS nombre, " + 
                "       pwd as pwd, " + 
                "       convert_from(decrypt(cast(email as bytea),'password','3des'::text), 'utf8') AS email, " + 
                "       activo as activo, admin as admin" +
                "  from Usuario" +
                " where " + campo + valor,
                [loginOEmail]
            );
            if (!rows.length) {
                return null;
            }
            let r = rows[0];
            return {
                login:r.login, 
                nombre:r.nombre, 
                activo:r.activo == "S", 
                pwd:r.pwd, 
                email:r.email, 
                admin:r.admin == "S"
            }
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async getPrivilegiosUsuarioEnSistema(codSistema, login) {
        try {
            let rows = await pgSQL.executeSQL(
                "select distinct(p.codigo) as codigo" +
                "  from privilegio p, privilegio_en_grupo pg, usuario_en_grupo ug, sistema s" +
                " where p.id_sistema = s.id" +
                "   and s.codigo = $1" +
                "   and pg.id_privilegio = p.id" +
                "   and pg.id_grupo = ug.id_grupo" +
                "   and ug.login = $2"
                , [codSistema, login]);
            return rows.map(r => r.codigo);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async getMapaPrivilegiosSesion(zToken) {
        try {
            let rows = await pgSQL.executeSQL(
                "select map_privilegios as mapa" +
                "  from Sesion_Usuario" +
                " where token = $1"
                , [zToken]);
            if (!rows || !rows.length) return {};
            return JSON.parse(rows[0].mapa);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async setMapaPrivilegiosSesion(zToken, mapa) {
        try {
            await pgSQL.executeSQL(
                "update Sesion_Usuario set map_privilegios = $1" +
                " where token = $2"
                , [JSON.stringify(mapa), zToken]);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async touchSesion(zToken) {
        let client;
        try {
            client = await pgSQL.getClient();
            let result = await client.query({
                rowMode:"array",
                text:"update Sesion_Usuario set ultima_actividad = $1 where token = $2", 
                values:[moment().tz('America/Santiago').format(), zToken]//values:[new Date(), zToken]
            });
            //console.log("n:" + result.rowCount + ", token: " + zToken);
            if (result.rowCount !== 1) throw "La sesión del usuario ha vencido o es inválida. Debe reingresar al sistema";
        } catch (error) {
            console.error(error);
            throw error;
        } finally {
            if (client) pgSQL.releaseClient(client);
        }
    }

    async login(login, pwd, codigoSistema) {
        try {
            console.log('[login]', login, pwd, codigoSistema);
            if (!codigoSistema) throw "Error interno: No se indicó el código del sistema";
            const mensajeInvalido = "Usuario o Contraseña Inválidos";
            let u = await this._getUsuarioPorLoginOEmail(login);
            if (!u) {
                throw mensajeInvalido;
            }
            if (!u.activo) throw "El usuario ha sido desactivado. Consulte al administrador del Sistema";
            if (!(await this.compareWithEncripted(pwd, u.pwd))) throw mensajeInvalido;
            // Obtener privilegios asociados al usuario por sus grupos. Si se une a una sesión existente,
            // los privilegios en el mapa se actualizan. Si es nueva, se crean
            let privilegiosEnSistema = await this.getPrivilegiosUsuarioEnSistema(codigoSistema, login);
            console.log(`[login][privilegiosEnSistema] ${JSON.stringify(privilegiosEnSistema, null, 4)}`);
            if (codigoSistema == "PERFILES" && u.admin) privilegiosEnSistema.push("ADMIN");
            if (!privilegiosEnSistema || !privilegiosEnSistema.length) {
                throw "Privilegios Insuficientes";
            }            
            // Buscar si existe una sesion activa para retornarla
            let rows = await pgSQL.executeSQL("select token as token from Sesion_Usuario where login=$1", [u.login]);
            let sesion = {privilegios:privilegiosEnSistema};
            if (rows.length) {
                let token = rows[0].token;
                sesion.token = token;
                let mapaPrivilegios = await this.getPrivilegiosSesion(token, codigoSistema);
                mapaPrivilegios[codigoSistema] = privilegiosEnSistema;
                await this.setMapaPrivilegiosSesion(token, mapaPrivilegios);
                await this.touchSesion(token);
            } else {
                let token = uuidv4();
                let mapaPrivilegios = {};
                mapaPrivilegios[codigoSistema] = privilegiosEnSistema;
                await pgSQL.executeSQL(
                    "insert into Sesion_Usuario (token, login, map_privilegios, ultima_actividad) values ($1, $2, $3, $4)",
                    [token, u.login, JSON.stringify(mapaPrivilegios), new Date()]
                );
                sesion.token = token;
            }
            sesion.usuario = { login: u.login, nombre: u.nombre, email: u.email, admin: u.admin};
            log.registraLog(sesion.token, codigoSistema, tipoLog.INFO, "Inicio de Sesión (login)");
            return sesion;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async getUsuarioDeSesion(zToken) {
        try {
            let rows = await pgSQL.executeSQL(
                "select u.login as login, " + 
                "       convert_from(decrypt(cast(nombre as bytea),'password','3des'::text), 'utf8') AS nombre, " +
                "       convert_from(decrypt(cast(email as bytea),'password','3des'::text), 'utf8') AS email, " + 
                "       u.pwd as pwd," +
                "       u.activo as activo," +
                "       u.admin as admin" +
                "  from Sesion_Usuario s, Usuario u" +
                " where s.token = $1" +
                "   and u.login = s.login"
                , [zToken]);
            
            if (!rows || !rows.length) return null;
            let r = rows[0];
            console.log('getUsuarioDeSesion ' + JSON.stringify(r, null, 4));
            return {
                login:r.login, nombre:r.nombre, email:r.email, 
                activo:r.activo == "S",
                admin:r.admin == "S",
                pwd:r.pwd
            }
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async getPrivilegiosSesion(zToken, codigoSistema) {
        try {
            await this.touchSesion(zToken);
            // Buscar privilegios en la sesión para el sistema. Si no se han creado, se actualizan            
            let mapaPrivilegios = await this.getMapaPrivilegiosSesion(zToken);
            if (!mapaPrivilegios[codigoSistema]) {
                let usuario = await this.getUsuarioDeSesion(zToken);
                if (!usuario) throw "Sesión Inválida";
                let privilegiosEnSistema = await this.getPrivilegiosUsuarioEnSistema(codigoSistema, usuario.login);
                mapaPrivilegios[codigoSistema] = privilegiosEnSistema;
                await this.setMapaPrivilegiosSesion(zToken, mapaPrivilegios);
                return privilegiosEnSistema;
            } else {
                return mapaPrivilegios[codigoSistema];
            }
        } catch (error) {
            console.error(error);
            throw error;
        }
    }    

    async logout(zToken, codigoSistema) {
        try {
            await log.registraLog(zToken, codigoSistema, tipoLog.INFO, "Cierre de Sesión (logout)");
            await pgSQL.executeSQL("delete from Sesion_Usuario where token=$1", [zToken]);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async generaTokenRecuperacion(login) {
        let tokenRecuperacion;
        let usuario = await this._getUsuarioPorLoginOEmail(login);
        if (!usuario) {
            throw "No se encontró ningún usuario con la identificación o dirección de correo indicado";
        }
        try {
            tokenRecuperacion = await this._creaTokenRecuperacion(usuario.login);
        } catch (error) {
            throw "No se puede crear el token de recuperación:" + error.toString();
        }
        try {
            let config = require("./Config").Config.instance.getConfig();
            let url = config.general.urlSitioCorreo + "?recupera=" + tokenRecuperacion;
            await this._sendMail(usuario.email, "Recuperación de Contraseña en Sistema CMMS", null,
                "<html><body><h3><body>Recuperación de Contraseña</h3><hr />" +
                "<p><b>Sr(a). " + usuario.nombre + ":</b></p>" +
                "<p>Se ha solicitado la creación de una nueva contraseña en el sistema CMMS asociada a esta dirección de correo electrónico. Si usted no lo ha solicitado, sólo ignore este mensaje.</p>" +
                "<p>Su identificación de usuario (login) en el sistema es <b>" + usuario.login + "</b></p>" +
                "<p>Para crear su nueva contraseña, por favor haga click en <a href='" + url + "'>este enlace</a></p>" +
                "<hr /><p><i>Este es un correo automático del Sistema CMMS, por favor no lo responda.</i></p></body></html>"
            );
        } catch (error) {
            console.log("error enviando correo:", error);
            throw "No se puede enviar el correo al nuevo usuario:" + error.toString();
        }
    }

    async getUsuarios(zToken, filtro) {
        try {
            this.touchSesion(zToken);
            let rows = await pgSQL.executeSQL(
                "select login as login, " +
                "       convert_from(decrypt(cast(nombre as bytea),'password','3des'::text), 'utf8') AS nombre, " +
                "       convert_from(decrypt(cast(email as bytea),'password','3des'::text), 'utf8') AS email, " + 
                "       activo as activo, admin as admin" +
                "  from Usuario" +
                " where lower(login) like $1 or lower(convert_from(decrypt(cast(nombre as bytea),'password','3des'::text), 'utf8')) like $1 or lower(convert_from(decrypt(cast(email as bytea),'password','3des'::text), 'utf8')) like $1" +
                " order by nombre",
                ["%" + filtro.toLowerCase().trim() + "%"]
            );

            return rows.map(r => {
                return { login: r.login, nombre: r.nombre, email: r.email, activo: r.activo == "S", admin: r.admin == "S" }
            })
        } catch (error) {
            log.registraLog(zToken, codigoSistema, tipoLog.INFO, "Error en obtener usuario(s)");
            console.error(error);
            throw error;
        }
    }

    async getUsuario(login) {
        try {
            let rows = await pgSQL.executeSQL(
                "select convert_from(decrypt(cast(nombre as bytea),'password','3des'::text), 'utf8') AS nombre, " + 
                "       convert_from(decrypt(cast(email as bytea),'password','3des'::text), 'utf8') AS email, " +
                "       activo as activo, admin as admin" +
                "  from Usuario where login=$1",
                [login]
            );
            if (!rows.length) return null;
            return rows[0];
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async _creaTokenRecuperacion(login) {
        try {
            let token = uuidv4();
            await pgSQL.executeSQL(
                "insert into Token_Recuperacion(token, tiempo_creacion, login) values " +
                "($1, current_timestamp, $2)",
                [token, login]
            );
            return token;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async addUsuario(zToken, usuario) {
        // if(!this.tienePrivilegio(zToken, "ASASASSS")) throw "Privilegios insuficientes.";
        if (await this.getUsuario(usuario.login)) {
            log.registraLog(zToken, codigoSistema, tipoLog.INFO, "Intento de agregar usuario con login ya existente " + usuario.login);
            throw "Ya existe un usuario con la misma identificación (login)";
        }
        let pwd = await this.encript(usuario.login);
        let tokenRecuperacion;
        try {
            tokenRecuperacion = await this._creaTokenRecuperacion(usuario.login);
        } catch (error) {
            log.registraLog(zToken, codigoSistema, tipoLog.INFO, "No se pudo crear token de recuperación");
            throw "No se puede crear el token de recuperación:" + error.toString();
        }
        try {
            let config = require("./Config").Config.instance.getConfig();
            let url = config.general.urlSitioCorreo + "?recupera=" + tokenRecuperacion;
            await this._sendMail(usuario.email, "Cuenta creada en Sistema CMMS", null,
                "<html><body><h3><body>Cuenta Creada</h3><hr />" +
                "<p><b>Sr(a). " + usuario.nombre + ":</b></p>" +
                "<p>Se ha creado una nueva cuenta de para el sistema CMMS asociada a esta dirección de correo electrónico.</p>" +
                "<p>Su identificación de usuario (login) en el sistema es <b>" + usuario.login + "</b></p>" +
                "<p>Para crear su contraseña, por favor haga click en <a href='" + url + "'>este enlace</a></p>" +
                "<hr /><p><i>Este es un correo automático del Sistema CMMS, por favor no lo responda.</i></p></body></html>"
            );
        } catch (error) {
            log.registraLog(zToken, codigoSistema, tipoLog.INFO, "No se pudo enviar email al correo del nuevo usuario " + usuario.login);
            throw "No se puede enviar el correo al nuevo usuario:" + error.toString();
        }
        try {
            //Se agregó la encriptación a dos campos. Por defecto la clave de encriptación es 'password'.
            //Falta añadir la clave de encriptación como parámetro, y que cada vez que se cambie, se aplique la nueva
            //encriptación a todos los campos.
            await pgSQL.executeSQL(
                "insert into Usuario(login, pwd, nombre, email, activo, admin)" +
                " values ($1, $2, encrypt($3, 'password','3des'), encrypt($4, 'password','3des'), $5, $6)",
                [usuario.login, pwd, usuario.nombre, usuario.email, usuario.activo ? "S" : "N", usuario.admin ? "S" : "N"]
            );
            log.registraLog(zToken, codigoSistema, tipoLog.INFO, "Usuario: " + usuario.login + " creado");
            return usuario;
        } catch (error) {
            log.registraLog(zToken, codigoSistema, tipoLog.INFO, "No se pudo agregar el usuario " + usuario.login + "a la base de datos");
            console.error(error);
            throw error;
        }
    }

    async saveUsuario(zToken, usuario) {
        if (!this.tienePrivilegio(zToken, 'ADMIN-CONFIG')) throw "Privilegios Insuficientes";
        try {
            await pgSQL.executeSQL(
                "update Usuario set nombre=encrypt(cast($1 as bytea), 'password','3des'), email=encrypt(cast($2 as bytea), 'password','3des'), activo=$3, admin=$4" +
                " where login = $5",
                [usuario.nombre, usuario.email, usuario.activo ? "S" : "N", usuario.admin ? "S" : "N", usuario.login]
            );
            log.registraLog(zToken, codigoSistema, tipoLog.INFO, "Se actualizó datos de usuario " + usuario.login);
            return usuario;
        } catch (error) {
            log.registraLog(zToken, codigoSistema, tipoLog.INFO, "No se actualizó los datos del usuario " + usuario.login);
            console.error(error);
            throw error;
        }
    }

    async deleteUsuario(zToken, usuario) {
        if (!this.tienePrivilegio(zToken, 'ADMIN-CONFIG')) throw "Privilegios Insuficientes";
        //CONTAR TODOS LOS USUARIOS QUE SON ADMIN, SI NO EXISTE NINGUN MAS, NO SE PUEDE ELIMINAR
        //if (usuario.admin == 'S') throw "Usuario Admin no se puede eliminar";
        try {
            await pgSQL.executeSQL(
                "delete from Sesion_Usuario where login = $1",
                [usuario.login]
            );
            await pgSQL.executeSQL(
                "delete from usuario_en_grupo where login = $1",
                [usuario.login]
            );
            await pgSQL.executeSQL(
                "delete from Usuario where login = $1",
                [usuario.login]
            );
            log.registraLog(zToken, codigoSistema, tipoLog.INFO, "Se eliminó el usuario " + usuario.login);
        } catch (error) {
            log.registraLog(zToken, codigoSistema, tipoLog.ERROR, "Error al eliminar el usuario " + usuario.login);
            console.error(error);
            throw error;
        }

    }

    _sendMail(to, subject, text, html) {
        return new Promise( async(onOk, onError) => {
            let message = {
                from: smtpConfig.from,
                subject: subject,
                to: to,
                text: text,
                html: html
            }
            console.log(`[_sendEmail][message] ${JSON.stringify(message, null, 4)}`);
            this._transport.sendMail(message, (err, info) => {
                if (err) {
                    console.error("Error Enviando correo", err);
                    onError(err);
                } else { 
                    onOk(info);
                }
            });
        })
    }

    async getInfoRecuperacion(token) {
        try {
            let rows = await pgSQL.executeSQL(
                "select r.login as login, convert_from(decrypt(cast(u.nombre as bytea),'password','3des'::text), 'utf8')" +
                "  from Token_Recuperacion r, Usuario u" +
                " where r.token = $1" +
                "   and u.login = r.login" +
                "   and u.activo = 'S'",
                [token]
            );
            if (!rows.length) throw "El token de recuperación de contraseña es inválido o ha caducado. Debe generar uno nuevo (opción 'Olvidé mi Contraseña' en la página inicial del sistema) o contactarse con el administrador del sistema";
            let u = rows[0];
            console.log(`[getInfoRecuperacion][login] ${JSON.stringify(u, null, 4)}`);
            return {
                login: u.login, nombre: u.convert_from ? u.convert_from : u.nombre
            }
        } catch (error) {
            log.registraLog(token, codigoSistema, tipoLog.ERROR, "No se pudo recuperar la información de usuario");
            console.error(error);
            throw error;
        }
    }

    validaNivelPwd(pwd) {
        let options = {
            uppercase:1, lowercase:1, digit:1, alphaNumeric:1, min:8
        }
        if (!require("complexity").check(pwd, options)) {
            throw "La contraseña debe tener al menos 8 caracteres, contener mayúsculas, minúsculas y al menos un número"; 
        }
    }

    async recuperaPwd(token, pwd1, pwd2) {
        try {
            let info = await this.getInfoRecuperacion(token);
            if (pwd1 != pwd2) throw "La contraseña y su repetición son diferentes";
            this.validaNivelPwd(pwd1);
            let pwd = await this.encript(pwd1.trim());
            await pgSQL.executeSQL(
                "update Usuario set pwd=$1 where login=$2",
                [pwd, info.login]
            );
            await pgSQL.executeSQL(
                "delete from Token_Recuperacion where token=$1", [token]
            )            
        } catch (error) {
            log.registraLog(token, codigoSistema, tipoLog.ERROR, "Error al intentar recuperar contraseña");
            console.error(error);
            throw error;
        }
    }

    async cambiaPwd(zToken, pwd, pwd1, pwd2) {
        try {
            let u = await this.getUsuarioDeSesion(zToken);
            if (!u) throw "Usuario eliminado";
            if (!u.activo) throw "El usuario ha sido desactivado. Consulte al administrador del Sistema";
            if (!(await this.compareWithEncripted(pwd, u.pwd))) throw "La contraseña actual es inválida";
            if (pwd1 != pwd2) throw "La nueva contraseña y su repetición son diferentes";
            this.validaNivelPwd(pwd1);            

            let newPwd = await this.encript(pwd1.trim());
            await pgSQL.executeSQL(
                "update Usuario set pwd=$1 where login=$2",
                [newPwd, u.login]
            );
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async _buscaSistemaCodigo(codigo) {
        let rows;
        try {
            rows = await pgSQL.executeSQL("select s.id, s.codigo, s.nombre, s.activo from sistema s where s.codigo = $1 and s.activo = 'S'", [codigo]);
            if (rows.length == 0) return null;
            else return rows[0];
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async findPrivilegios(codigoPrivilegio, codigoSistema) {
        try {
            let rows = await pgSQL.executeSQL(
                " select p.id as id, p.codigo as codigo, p.id_sistema as id_sistema from privilegio p, sistema s "
                + " where p.id_sistema = s.id "
                + " and p.codigo = $1 and s.codigo = $2", [codigoPrivilegio, codigoSistema]);
            if (rows.length == 0) return null;
            else return rows[0];
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async updateSistema(codigo, nombre) {
        let s = await this._buscaSistemaCodigo(codigo);
        let esNuevo = (s == null);
        try {
            if (esNuevo) {
                await pgSQL.executeSQL(
                    "insert into sistema(codigo, nombre, activo) values " +
                    "($1, $2, $3)",
                    [codigo, nombre, 'S']
                );
            } else {
                await pgSQL.executeSQL(
                    "update sistema set nombre=$1  where id=$2", [nombre, s.id]
                );
            }
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async updatePrivilegio(codigoSistema, codigoPrivilegio, nombrePriv) {
        let p = await this.findPrivilegios(codigoPrivilegio, codigoSistema);
        let esNuevo = (p == null);
        let s = await this._buscaSistemaCodigo(codigoSistema);
        try {
            if (esNuevo) {
                await pgSQL.executeSQL(
                    "insert into privilegio(codigo, id_sistema, nombre) values " +
                    "($1, $2, $3)",
                    [codigoPrivilegio, s.id, nombrePriv]
                )
            } else {
                await pgSQL.executeSQL(
                    "update privilegio set nombre=$1 where id=$2 and id_sistema=$3", [nombrePriv, p.id, s.id]
                )
            }
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async getAllGrupos(zToken, filtro) {
        try {
            let rows = await pgSQL.executeSQL(
                " select id as id, nombre as nombre " +
                "  from grupo_usuarios" +
                " where lower(nombre) like $1" +
                " order by nombre",
                ["%" + filtro.toLowerCase().trim() + "%"]
            );
            return rows.map(r => {
                return { id: r.id, nombre: r.nombre }
            })
        } catch (error) {
            log.registraLog(zToken, codigoSistema, tipoLog.DEBUG, "No se pudo obtener los grupos de usuarios");
            console.error(error);
            throw error;
        }
    }

    async getGrupoNombre(nombre) {
        try {
            let rows = await pgSQL.executeSQL(
                "select id as id, nombre as nombre" +
                "  from grupo_usuarios" +
                " where nombre = $1",
                [nombre]
            );
            if (!rows.length) return null;
            let g = rows[0];
            return { id: g.id, nombre: g.nombre }
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async addGrupo(zToken, grupo) {
        let g = await this.getGrupoNombre(grupo.nombre);
        if (g) throw "Ya existe una grupo con el mismo nombre";
        try {
            await pgSQL.executeSQL(
                "insert into grupo_usuarios(nombre) values " +
                "($1)",
                [grupo.nombre]
            );
            return grupo;
        } catch (error) {
            log.registraLog(zToken, codigoSistema, tipoLog.ERROR, "Error al intentar agregar el grupo " + grupo);
            console.error(error);
            throw error;
        }
    }

    async saveGrupo(zToken, grupo) {
        try {
            await pgSQL.executeSQL(
                "update grupo_usuarios set nombre=$1 where id=$2",
                [grupo.nombre, grupo.id]
            );
            return grupo;
        } catch (error) {
            log.registraLog(zToken, codigoSistema, tipoLog.INFO, "No se pudo guardar el grupo de usuarios " + grupo);
            console.error(error);
            throw error;
        }
    }

    async deleteGrupo(zToken, grupo) {
        try {
            let rows = await pgSQL.executeSQL("select count(*) as n from usuario_en_grupo where id_grupo=$1", [grupo.id]);
            if (rows.length && parseInt(rows[0].n) > 0) throw "Hay Usuarios asociados a éste grupo.";

            let privs = await pgSQL.executeSQL("select count(*) as n from privilegio_en_grupo where id_grupo=$1", [grupo.id]);
            if (privs.length && parseInt(privs[0].n) > 0) throw "Existen privilegios asociados a éste grupo.";

            await pgSQL.executeSQL(
                "delete from grupo_usuarios where id=$1",
                [grupo.id]
            );
        } catch (error) {
            log.registraLog(zToken, codigoSistema, tipoLog.INFO, "No se pudo eliminar el grupo de usuarios " + grupo);
            console.error(error);
            throw error;
        }
    }

    async getUsuariosGrupos(zToken, filtro, grupo) {
        try {
            let rows = await pgSQL.executeSQL(
                " (select u.login as login, convert_from(decrypt(cast(u.nombre as bytea),'password','3des'::text), 'utf8') as nombre," +
                "        case when g.id isnull then -1 else g.id end as id_grupo" +
                "   from usuario_en_grupo us, grupo_usuarios g, usuario u" +
                "       where u.activo='S' and g.id = $1" +
                "       and u.login = us.login and g.id = us.id_grupo" +
                "       and (lower(u.login) like $2 or lower(convert_from(decrypt(cast(u.nombre as bytea),'password','3des'::text), 'utf8')) like $2) " +
                "       order by u.nombre)" +
                " union all" +
                " (select u.login, convert_from(decrypt(cast(u.nombre as bytea),'password','3des'::text), 'utf8') as nombre," +
                "       case when g.id <> $1 then -1 else (case when g.id isnull then -1 else g.id end) end" +
                "    from usuario u left join usuario_en_grupo us on u.login = us.login left join grupo_usuarios g on us.id_grupo = g.id" +
                "        where u.activo='S' " +
                "        and (lower(u.login) like $2 or lower(convert_from(decrypt(cast(u.nombre as bytea),'password','3des'::text), 'utf8')) like $2) " +
                "        and u.login not in " +
                "        (select distinct usu.login" +
                "             from usuario_en_grupo ueg, grupo_usuarios gus, usuario usu" +
                "                where  ueg.id_grupo = $1 and usu.activo='S'" +
                "                       and ueg.login = usu.login and gus.id = ueg.id_grupo)" +
                "                      group by u.login, u.nombre, case when g.id <> $1 then -1 else (case when g.id isnull then -1 else g.id end) end" +
                "                      order by u.nombre)",

                [grupo.id, "%" + filtro.toLowerCase().trim() + "%"]
            );

            let esAsignado;
            return rows.map(r => {
                if (r.id_grupo == -1) {
                    esAsignado = 'N'
                } else if (r.id_grupo != grupo.id) {
                    esAsignado = 'N'
                } else if (r.id_grupo == grupo.id) {
                    esAsignado = 'S'
                }
                return { login: r.login, nombre: r.nombre, asignado: esAsignado == "S" }
            })
        } catch (error) {
            log.registraLog(zToken, codigoSistema, tipoLog.INFO, "No se pudo obtener los usuario(s) del grupo " + grupo);
            console.error(error);
            throw error;
        }
    }

    async addUsuarioEngrupo(zToken, usuario, grupo) {
        try {
            await pgSQL.executeSQL(
                "insert into usuario_en_grupo(login, id_grupo) values " +
                "($1, $2)",
                [usuario.login, grupo.id]
            );
        } catch (error) {
            log.registraLog(zToken, codigoSistema, tipoLog.INFO, "No se pudo agregar usuario(s) al grupo " + grupo);
            console.error(error);
            throw error;
        }
    }

    async saveUsuarioEngrupo(zToken, usuario, grupo) {
        try {
            let rows = await pgSQL.executeSQL(" select count(*) as n from usuario_en_grupo where login=$1 and id_grupo=$2",
                [usuario.login, grupo.id]);
            //si ya existe el registro, lo elimina
            if (rows.length && parseInt(rows[0].n) > 0) {
                await pgSQL.executeSQL("delete from usuario_en_grupo where login=$1 and id_grupo=$2",
                    [usuario.login, grupo.id]);
                //si el registro no existe, lo agrega
            } else {
                this.addUsuarioEngrupo(zToken, usuario, grupo);
            }
            return usuario;
        } catch (error) {
            log.registraLog(zToken, codigoSistema, tipoLog.INFO, "No se pudo actualizar datos de usuario(s) en el grupo " + grupo);
            console.error(error);
            throw error;
        }
    }

    async getSistemas(zToken, filtro) {
        try {
            let rows = await pgSQL.executeSQL(
                " select s.id as id, s.codigo as codigo, s.nombre as nombre " +
                " from sistema s where activo = 'S'" +
                " and (lower(s.nombre) like $1 or lower(s.codigo) like $1 )",
                ["%" + filtro.toLowerCase().trim() + "%"]
            );
            return rows.map(r => {
                return { id: r.id, codigo: r.codigo, nombre: r.nombre }
            })
        } catch (error) {
            log.registraLog(zToken, codigoSistema, tipoLog.INFO, "No se pudo obtener sistemas");
            console.error(error);
            throw error;
        }
    }

    async getAllPrivilegiosGrupo(zToken, filtro, codigoSistema, grupo) {
        try {
            let rows = await pgSQL.executeSQL(
                " (select p.id as id, " +
                " p.codigo as codigo, p.nombre as nombre," +
                " case when g.id isnull then -1 else g.id end as esAsignado" +
                "   from privilegio_en_grupo pg, privilegio p, grupo_usuarios g, sistema s" +
                "   where s.id = p.id_sistema" +
                "   and pg.id_grupo = g.id" +
                "   and (lower(p.codigo) like $3 or lower(p.nombre) like $3 )" +
                "   and pg.id_privilegio = p.id" +
                "   and g.id = $1" +
                "   and s.codigo=$2)" +
                " union all" +
                " (select p.id, p.codigo, p.nombre," +
                "        case when g.id <> $1 then -1 else (case when g.id isnull then -1 else g.id end) end" +
                "    from privilegio p left join privilegio_en_grupo pg on p.id=pg.id_privilegio left join grupo_usuarios g on g.id = pg.id_grupo left join sistema s" +
                "      on s.id = p.id_sistema where s.codigo=$2 " +
                "     and (lower(p.codigo) like $3 or lower(p.nombre) like $3 )" +
                "     and p.id not in (" +
                "           select p.id as idPrivilegio" +
                "           from privilegio_en_grupo pg, privilegio p, grupo_usuarios g, sistema s" +
                "           where s.id = p.id_sistema" +
                "           and pg.id_grupo = g.id" +
                "           and pg.id_privilegio = p.id" +
                "           and g.id = $1" +
                "           and s.codigo=$2)" +
                "           group by p.id, p.codigo, p.nombre, " +
                "           case when g.id <> $1 then -1 else (case when g.id isnull then -1 else g.id end) end) ",
                [grupo.id, codigoSistema, "%" + filtro.toLowerCase().trim() + "%"]
            );

            let ret;
            return rows.map(r => {
                if (r.esasignado < 0) {
                    ret = "N";
                } else if (r.esasignado != grupo.id) {
                    ret = "N";
                } else if (r.esasignado == grupo.id) {
                    ret = "S";
                }
                return { id: r.id, codigo: r.codigo, nombre: r.nombre, asignado: ret == "S" }

            })

        } catch (error) {
            log.registraLog(zToken, codigoSistema, tipoLog.INFO, "No se pudo obtener los privilegios del grupo " + grupo);
            console.error(error);
            throw error;
        }
    }

    async savePrivilegioEnGrupo(zToken, privilegio, grupo) {
        try {
            let rows = await pgSQL.executeSQL(" select count(*) as n from privilegio_en_grupo where id_privilegio=$1 and id_grupo=$2",
                [privilegio.id, grupo.id]);
            //si ya existe el registro, lo elimina
            if (rows.length && parseInt(rows[0].n) > 0) {
                await pgSQL.executeSQL("delete from privilegio_en_grupo where id_privilegio=$1 and id_grupo=$2",
                    [privilegio.id, grupo.id]);
                //si el registro no existe, lo agrega
            } else {
                this.addPrivilegioEngrupo(zToken, privilegio, grupo);
            }
            return privilegio;
        } catch (error) {
            log.registraLog(zToken, codigoSistema, tipoLog.INFO, "No se pudo guardar los privilegios al grupo " + grupo);
            console.error(error);
            throw error;
        }
    }

    async addPrivilegioEngrupo(zToken, privilegio, grupo) {
        try {
            await pgSQL.executeSQL(
                "insert into privilegio_en_grupo(id_privilegio, id_grupo) values " +
                "($1, $2)",
                [privilegio.id, grupo.id]
            );
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async getPrivilegiosPorSistema(sistema, grupo) {
        let folderOpen = "<i class='fa fa-folder-open mr-2'></i>";
        let folder = "<i class='fa fa-folder mr-2'></i>";
        try {
            let rows = await pgSQL.executeSQL(
                " select p.id as id, p.nombre as nombre" +
                " from privilegio_en_grupo pg, grupo_usuarios g, privilegio p, sistema s" +
                " where p.id = pg.id_privilegio and g.id = pg.id_grupo and s.id = p.id_sistema" +
                " and s.nombre=$1 and g.id=$2" +
                " order by p.nombre",
                [sistema.label, grupo.id]
            )
            let privilegios = {};
            return rows.map(r => {
                return privilegios = {
                    label: r.nombre,
                    icon: folder,
                    expandedIcon: folderOpen,
                    autoExpand: false,
                    nodes: false
                }
            });

        } catch (error) {
            throw error;
        }

    }

    async getSistemasArbol(zToken, grupo) {
        let folderOpen = "<i class='fa fa-folder-open mr-2'></i>";
        let folder = "<i class='fa fa-folder mr-2'></i>";

        let arbol = [];
        //@pendiente validar más privilegio
        try {
            let rows = await pgSQL.executeSQL(
                " select s.codigo as codigo, s.nombre as nombre " +
                " from privilegio_en_grupo pg, grupo_usuarios g, privilegio p, sistema s" +
                " where p.id = pg.id_privilegio and g.id = pg.id_grupo and s.id = p.id_sistema" +
                " and pg.id_grupo=$1" +
                " group by s.codigo, s.nombre" +
                " order by s.nombre",
                [grupo.id]
            );
            return rows.map(r => {
                return {
                    label: r.nombre,
                    icon: folder,
                    expandedIcon: folderOpen,
                    autoExpand: true
                }
            });

        } catch (error) {
            log.registraLog(zToken, codigoSistema, tipoLog.INFO, "No se pudo generar el árbol para el grupo " + grupo);
            console.error(error);
            throw error;
        }
    }

    async getSistemasByUsuario(zToken, usuario) {
        let folderOpen = "<i class='fa fa-folder-open mr-2'></i>";
        let folder = "<i class='fa fa-folder mr-2'></i>";

        let arbol = [];
        //@pendiente validar más privilegio
        try {
            let rows = await pgSQL.executeSQL(
                " select s.codigo as codigo, s.nombre as nombre" +
                " from usuario_en_grupo ug, privilegio_en_grupo pg, privilegio p, sistema s" +
                "    where pg.id_grupo = ug.id_grupo" +
                "      and p.id = pg.id_privilegio" +
                "      and p.id_sistema = s.id" +
                "      and ug.login=$1" +
                " group by s.codigo, s.nombre" +
                " order by s.nombre",
                [usuario.login]
            );
            return rows.map(r => {
                return {
                    label: r.nombre,
                    codigo: r.codigo,
                    icon: folder,
                    expandedIcon: folderOpen,
                    autoExpand: true
                }
            });

        } catch (error) {
            log.registraLog(zToken, codigoSistema, tipoLog.INFO, "No se pudo obtener los sistemas por getSistemasByUsuarios");
            console.error(error);
            throw error;
        }
    }

    async getPrivilegiosByUsuarioSistema(zToken, sistema, usuario) {
        let branch = "<i class='fa fa-key mr-2'></i>";
        let rows;
        try {
            rows = await pgSQL.executeSQL(
                " select p.id as id," +
                " p.nombre as nombre," +
                " p.codigo as codigo, " +
                " s.id as id_sistema, " +
                " s.codigo as codigo_sistema" +
                " from privilegio p, privilegio_en_grupo pg, usuario_en_grupo ug, sistema s" +
                " where p.id = pg.id_privilegio" +
                " and pg.id_grupo = ug.id_grupo" +
                " and s.id = p.id_sistema" +
                " and ug.login = $1" +
                " and s.codigo = $2" +
                " group by p.id, p.nombre,  p.codigo, s.id, s.codigo" +
                " order by p.id, s.codigo",
                [usuario.login, sistema.codigo]
            )
            return rows.map(r => {
                return {
                    label: r.nombre,
                    icon: branch,
                    expandedIcon: branch,
                    autoExpand: false,
                    nodes: false
                }
            });

        } catch (error) {
            log.registraLog(zToken, codigoSistema, tipoLog.INFO, "No se pudo obtener los privilegios en getPrivilegiosByUsuarioSistema");
            console.error(error);
            throw error;
        }
    }

    async getPrivilegiosBySistema(zToken, codigoSistema) {
        let mapReturn = [];
        try {
            let rows = await pgSQL.executeSQL(
                "select map_privilegios as mapPrivilegios" +
                "  from sesion_usuario" +
                " where token=$1",
                [zToken]
            );
            if (!rows.length) return null;

            let mapJson = JSON.parse(rows[0].mapprivilegios);

            if (mapJson[codigoSistema] != undefined) {
                mapJson[codigoSistema].forEach(m => {
                    mapReturn.push(m);
                })
            }
            return mapReturn;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async getUsuarioToken(zToken) {
        try {
            await this.touchSesion(zToken);
            let rows = await pgSQL.executeSQL(
                " select convert_from(decrypt(cast(u.nombre as bytea),'password','3des'::text), 'utf8') as nombre, " + 
                "        u.login as login," +
                "        convert_from(decrypt(cast(u.email as bytea),'password','3des'::text), 'utf8') as email,  " +
                "        u.activo as activo,  " +
                "        u.admin as isAdmin " +
                " from Usuario u, sesion_usuario su " +
                " where  u.login=su.login  " +
                " and su.token = $1",
                [zToken]
            );
            if (!rows.length) return null;
            return rows[0];
        } catch (error) {
            //log.registraLog(zToken, codigoSistema, tipoLog.INFO, "No se pudo obtener usuario en getUsuarioToken");
            console.error(error);
            throw error;
        }
    }

    async tienePrivilegio(zToken, codigo) {
        await this.touchSesion(zToken);
        let ret = false;
        let p = await this.getPrivilegiosSesion(zToken, codigoSistema);
        if (p.includes(codigo)) {
            ret = true;
        }
        return ret;

    }

    async getGruposPorPrivilegio(codigo) {
        //let arreglo = await this.getGruposPorPrivilegio("LOG");
        let grupos = [];
        try {
            let rows = await pgSQL.executeSQL(
                " select pg.id_grupo as id from privilegio_en_grupo pg, privilegio p " +
                " where p.id = pg.id_privilegio and p.codigo =$1 " +
                " group by pg.id_grupo ",
                [codigo]
            );

            rows.forEach(r => {
                grupos.push(r.id);
            })
            return grupos;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async getGruposSistemaPrivilegio(codigoSistema, codigoPrivilegio) {
        let grupos = [];
        try {
            let rows = await pgSQL.executeSQL(
                " select g.id as id, g.nombre as nombre from privilegio_en_grupo pg, privilegio p, sistema s, grupo_usuarios g" +
                " where p.id = pg.id_privilegio and s.id = p.id_sistema and g.id=pg.id_grupo " +
                " and p.codigo=$1 and s.codigo = $2 group by g.id, g.nombre ",
                [codigoPrivilegio, codigoSistema]
            );

            rows.forEach(r => {
                grupos.push({id:r.id, nombre:r.nombre});
            })
            return grupos;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async getIdsGruposSesion(zToken) {
        try {
            let rows = await pgSQL.executeSQL(
                "select ug.id_grupo as id_grupo" +
                "  from Usuario_en_Grupo ug, Sesion_Usuario s" +
                " where ug.login = s.login" +
                "   and s.token = $1",
                [zToken]
            );
            return rows.map(r => r.id_grupo);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

}

exports.Seguridad = Seguridad;