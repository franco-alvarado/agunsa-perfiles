class CustomController extends ZCustomComponent {
    onThis_init(options) {
        this.options = options;
        this.view.bootstrapMaterialDesign();
        this.mensajeError.hide();
        // this.title.view.text("Asignar Permisos a grupo");
        this.lblAccion.view.text("");
        this.view.on("keyup", e => {
            if (e.keyCode == 13) this.cmdOk.view.trigger("click");
        });

        zPost("getSistemas.seg", {filtro:""})
            .then(sistemas=>{
                sistemas.splice(0,0,{codigo:"", nombre:"[Seleccione Sistema]"});
                this.edSistemas.setRows(sistemas);
                document.getElementsByTagName("option")[0].disabled="disabled";
                // this.edSistemas.view.attr("disabled", true);
                this.listaPrivilegios.refresh();
            })
            .catch(error => console.error(error));

        this.listaPrivilegios.hideColumn("id");
        
    }
    onEdFiltroPrivilegio_change() { this.listaPrivilegios.refresh() }

    onEdSistemas_change() {
        let codigo = this.edSistemas.val;
        let sn = this.edSistemas.getSelectedRow();
        this.subtituloSistema.view.text(sn.nombre);
        if (codigo!=null) {
            this.listaPrivilegios.refresh();
        }
    }

    onListaPrivilegios_getRows(cb) {
        zPost("getAllPrivilegiosGrupo.seg", {filtro:this.edFiltroPrivilegio.val.trim(), codigoSistema: this.edSistemas.val, grupo:this.options.grupo}, 
            privilegios => {
                privilegios.forEach(u => this.preparaFilaPrivilegios(u));
            cb(privilegios);
        });
    }

    onListaPrivilegios_afterPaint() {
       this.registraHandlersFilas();
    }

    registraHandlersFilas() {
        this.listaPrivilegios.view.find(".activo-toggler").change(e => {
            let c = $(e.currentTarget).prop("checked")?true:false;
            console.log( $(e.currentTarget));
            let id = $(e.currentTarget).data("privilegio");  
            let idx = this.listaPrivilegios.rows.findIndex(r => r.id == id);
            if (idx < 0) return;
            let r = this.listaPrivilegios.rows[idx];
            r.asignado = c;
            zPost("savePrivilegioEnGrupo.seg", {privilegio:r, grupo:this.options.grupo})
                .then(() => {
                    this.preparaFilaPrivilegios(r);
                    this.listaPrivilegios.updateRow(idx, r);
                })
                .catch(error => this.showDialog("common/WError", {message:error.toString()}));
        });
    }

    preparaFilaPrivilegios(row) {
        delete row._rowClass;
        if (!row.asignado) {
            row._rowClass="table-danger";
        }
        let edAsignado = 
        "<div class='togglebutton'><label style='line-height:0.6;'>" +
            "<input class='activo-toggler' id='checkAll' name='checkAll' data-privilegio='" + row.id + "' type='checkbox'" + (row.asignado?" checked='checked'":"") + ">" +
            "   <span class='toggle'></span>" +
        "</label></div>";
         row.edAsignado = edAsignado;
        return row;    
    }

 /*    onCheckedAll_change(){
        let i =0;
        if(this.checkedAll.checked==true){
            
            while(i<document.getElementsByName("checkAll").length){
            document.getElementsByName("checkAll")[i].checked=true;
            i++;
            }
            
        }else{
            
            while(i<document.getElementsByName("checkAll").length){
            document.getElementsByName("checkAll")[i].checked=false;
            i++;
            }
            
        }
    }
    onCheckedAll_click(){
        if(this.checkedAll.checked){
            let isAllChecked = 0;
        }else{
            let isAllChecked = 1;
        }
        if(isAllChecked==0){
            while(i<document.getElementsByName("checkAll").length){
                document.getElementsByName("checkAll")[i].checked=true;
                i++;
            }
        }else{
            while(i<document.getElementsByName("checkAll").length){
                document.getElementsByName("checkAll")[i].checked=false;
                i++;
            }
        }
    } */

    onCmdCancel_click() {this.cancel()}
    muestraError(txt) {
        this.textoMensajeError.view.text(txt);
        this.mensajeError.show();
    }
    onCmdOk_click() {
        this.close(true);
    }
}
