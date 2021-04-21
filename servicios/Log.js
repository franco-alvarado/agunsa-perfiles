const ZModule = require("../z-server/z-server").ZModule;
const pgSQL = require("./PgSQL").PgSQL.instance;
const moment = require('moment-timezone');


class Log extends ZModule {
    static get instance() {
        if (!global.adminInstance) global.adminInstance = new Log();
        return global.adminInstance;
    }

    async registraLog(zToken, codigoSistema, tipo, texto){
        let seg = require("./Seguridad").Seguridad.instance;
        let u;
        try {
            u = await seg.getUsuarioToken(zToken);
        } catch(error) {
            //
        }
        if (!u) {
            console.error("[Log.registraLog] No se encontró el usuario asociado al token '" + zToken + "'");
            return;
        }
        let s = await seg._buscaSistemaCodigo(codigoSistema);
        if (!s) {
            console.error("[Log.registraLog] No se encontró el sistema con código '" + codigoSistema + "'");
            return;
        }
        try {
            await pgSQL.executeSQL(
                "insert into log(nombreusuario, loginusuario, tipo, codigosistema, nombresistema, texto, fecharegistro) values " +
                "(encrypt($1, 'password','3des'), $2, $3, $4, $5, $6, current_timestamp)",
                [u.nombre, u.login, tipo, codigoSistema, s.nombre, texto]
            )
        } catch(error) {
            console.error(error);
            throw error;
        }
    }

    async getLogsFiltro(zToken, filtro){
        let seg = require("./Seguridad").Seguridad.instance;
        let fechaDesde = this.object2Date(filtro.fechaDesde);
        let fechaHasta =  this.object2Date(filtro.fechaHasta);
        var q = " select id as id, fecharegistro as fecha, codigosistema as codigo_sistema, tipo as tipo, texto as texto, ";
        q += "  convert_from(decrypt(cast(nombreusuario as bytea),'password','3des'::text), 'utf8') AS nombre, loginusuario as login, nombresistema";
        q += " from log"; 
        q +=     "  where fecharegistro >= $1 and fecharegistro < $2";
        if(filtro.sistema){
            q += "  and codigosistema = '"+filtro.sistema+"'";
        }
        if(filtro.usuario!=""){
          q +=  " and (lower(loginusuario) like '%" + filtro.usuario.toLowerCase().trim() + "%'"  + " or lower(convert_from(decrypt(cast(nombreusuario as bytea),'password','3des'::text), 'utf8')) like '% "+ filtro.usuario.toLowerCase().trim() + "%' )"
        }
        if(filtro.tipo){
            q += " and tipo = '"+filtro.tipo+"'"; 
        }
        q += " order by fecharegistro desc";
          try {
              let rows = await pgSQL.executeSQL(q, [fechaDesde.format(), fechaHasta.format()]);
              return rows.map(r => {
                let descripcionTipo = this.mapTipos()[r.tipo];
                  return { sistema:r.nombresistema, usuario:r.nombre, login:r.login, tipo: descripcionTipo, fecharegistro:this.formateaFechaHora(moment().tz('America/Santiago').year(r.fecha.getFullYear()).month(r.fecha.getMonth()).date(r.fecha.getDate()).hour(r.fecha.getHours()).minute(r.fecha.getMinutes()).second(r.fecha.getSeconds()).millisecond(r.fecha.getMilliseconds())), texto:r.texto}
              })
          } catch (error) {
              console.error(error);
              throw error;
          } 
    }

    formateaFechaHora(dt) {
        var meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
        var dd = dt.date();
        var MM = meses[dt.month()];
        var yyyy = dt.year();
        var hh = dt.hour();
        var mm = dt.minute();
        return (dd < 10?"0":"") + dd + "/" + MM + "/" + yyyy + " " + (hh<10?"0":"") + hh + ":" + (mm<10?"0":"") + mm;
    }

    object2Date(o) {
        return moment().tz('America/Santiago').year(o.ano).month(o.mes).date(o.dia).hour(0).minute(0).second(0).millisecond(0);//new Date(o.ano, o.mes, o.dia, 0, 0, 0);
    }

    formateaFechaHoraSegundos(dt) {
        var meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
        var dd = dt.date();
        var MM = meses[dt.month()];
        var yyyy = dt.year();
        var hh = dt.hour();
        var mm = dt.minute();
        var ss = dt.second();
        return (dd < 10?"0":"") + dd + "/" + MM + "/" + yyyy + " " + (hh<10?"0":"") + hh + ":" + (mm<10?"0":"") + mm + ":" + (ss<10?"0":"") + ss;
    }
    

    getTiposLog(){
        let tipos = [];
        tipos[0]=({codigo: 'INFO', nombre:'Información'});
        tipos[1]=({codigo: 'DEBUG', nombre:'Debug'});
        tipos[2]=({codigo: 'ERROR', nombre:'Error'});
        tipos[3]=({codigo: 'WARNING', nombre:'Warning'});

        return tipos;
    }

    mapTipos(){
        let tipos = {};
        tipos['INFO']="Información";
        tipos['DEBUG']="Debug";
        tipos['ERROR']="Error";
        tipos['WARNING']="Warning";

        return tipos;
    }

    getHoraServer() {
        console.log("getHoraServer");
        return new Promise((onOk, onError) => {
            var time = moment().tz('America/Santiago').valueOf();//new Date().getTime();
            onOk(time);
        });
    }
    
}

exports.Log = Log;