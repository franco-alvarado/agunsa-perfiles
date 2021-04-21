class CustomController extends ZCustomComponent {
    onThis_init() {
        this.view.bootstrapMaterialDesign();   
        this.view.find("#edSearch").attr('placeholder', 'Buscar Usuarios');     
        this.refrescaSistemas();
        this.refrescaTipos();
        this.refresca();
        this.view.find("#msgDescargando").hide();
    }

    onCmdBuscarLog_click(){
        this.listaLogs.refresh();
    }

    onCmdLimpiaLog_click(){
        this.refrescaSistemas();
        this.refrescaTipos();
        this.edSistemas.val="";
        this.edTipos.val="";
        this.edFiltro.val="";
        this.view.find("#iconSearch").removeClass("fa-times").addClass("fa-search");
        this.listaLogs.refresh();
    }

    refresca() {
        this.listaLogs.refresh();
    }

    onEdFiltro_change() {
        this.refresca();
    }

    preparaFila(row) {
        return row;
    }
    
    onEdSistemas_change() {
        let codigo = this.edSistemas.val;
        this.refresca();
    }

    onEdTipos_change() {
        this.listaLogs.refresh();
    }

    refrescaSistemas(){
        zPost("getSistemas.seg", {filtro:""})
        .then(sistemas => {
            sistemas.splice(0,0,{codigo:"", nombre:"[Todos los Sistemas]"});
            this.edSistemas.setRows(sistemas, null, "text-dark");
        })
        .catch(error => console.error(error));
    }

    refrescaTipos(){
        zPost("getTiposLog.log", {})
        .then(tipos => {
            tipos.splice(0,0,{codigo:"", nombre:"[Todos los Tipos]"});
            this.edTipos.setRows(tipos, null, "text-dark");
        })
        .catch(error => console.error(error));
    }

    registraHandlersFilas() {

    }
    onListaLogs_getRows(cb) {
        let fechaInicio = this.edDiaDesde.getDate();
        let fechaFinAux    = this.edDiaHasta.getDate();
        let fechaFin = new Date();

        fechaFin.setDate(fechaFinAux.getDate()+1);
        
        let diaMas =   {
                ano: fechaFin.getFullYear(),
                mes: fechaFin.getMonth(),
                dia: fechaFin.getDate()
            }
        let filtro = {
            sistema: this.edSistemas.val,
            usuario: this.edFiltro.val.trim(),
            tipo: this.edTipos.val,
            fechaDesde: {
                ano: fechaInicio.getFullYear(),
                mes: fechaInicio.getMonth(),
                dia: fechaInicio.getDate()
            },
            fechaHasta: {
                ano: fechaFin.getFullYear(),
                mes: fechaFin.getMonth(),
                dia: fechaFin.getDate()
            }
        }

        zPost("getLogsFiltro.log", {filtro:filtro}, logs => {
            logs.length>0?this.cmdExport.show():this.cmdExport.hide();
            cb(logs);
           
        });
        
    }
    onListaLogs_afterPaint() {
       // this.registraHandlersFilas();
    }

    onCmdExport_click() {
        this.cmdExport.hide();
        this.view.find("#msgDescargando").show();
        let fechaInicio = this.edDiaDesde.getDate();
        let fechaFinAux    = this.edDiaHasta.getDate();
        let fechaFin = new Date();

        fechaFin.setDate(fechaFinAux.getDate()+1);
        
        let diaMas =   {
                ano: fechaFin.getFullYear(),
                mes: fechaFin.getMonth(),
                dia: fechaFin.getDate()
            }
        let filtro = {
            sistema: this.edSistemas.val,
            usuario: this.edFiltro.val.trim(),
            tipo: this.edTipos.val,
            fechaDesde: {
                ano: fechaInicio.getFullYear(),
                mes: fechaInicio.getMonth(),
                dia: fechaInicio.getDate()
            },
            fechaHasta: {
                ano: fechaFin.getFullYear(),
                mes: fechaFin.getMonth(),
                dia: fechaFin.getDate()
            }
        }

        zPost("getLogsFiltro.log", {filtro:filtro}) 
            .then(logs => {
                let csv = logs
                .reduce((accum, r) => {
                    return  accum +
                            "\n" + r.sistema + 
                            ";" + r.usuario + ";" + r.login +
                            ";" + r.tipo + ";" + r.fecharegistro + ";" + this.preparaCSV(r.texto);
                }, "Sistema;Usuario;Login;Tipo Evento;Fecha Evento;Descripción");
                this.cmdExport.show();
                this.view.find("#msgDescargando").hide();
                var blob = new Blob(["\uFEFF" + csv], {type: 'data:text/csv;charset=utf-8'});
                var objectUrl = URL.createObjectURL(blob);
                var link = document.createElement("a");
                link.href = objectUrl;
                link.download = "perfiles-log.csv";
                link.target = "_blank";
                link.click();
            })
            .catch(error => {
                this.cmdExport.show();
                this.view.find("#msgDescargando").hide();
                this.showDialog("common/WError", {message:error.toString()});
            });
    }

    preparaCSV(v) {
        return ("" + v).replace(/\;/, ",");
    }
  
    onListaLogs_editRequest(idx, row) {

    }
 
}