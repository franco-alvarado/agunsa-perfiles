class CustomController extends ZCustomComponent {
    onThis_init() {
        this.view.bootstrapMaterialDesign();
        this.treePrivilegios.view.hide();
        this.refresca();
     
    }
    onEdFiltroUsuario_change() { 
        this.treePrivilegios.view.hide();
        this.listaUsuarios.refresh() 
    }

    refresca() { this.listaUsuarios.refresh() }

    preparaFilaUsuario(row) {
        delete row._rowClass;
        if (!row.asignado) {
            row._rowClass = "table-danger";
        }
        let edAsignado =
            "<div class='togglebutton'><label style='line-height:0.6;'>" +
            "<input class='activo-toggler' data-login='" + row.login + "' type='checkbox'" + (row.asignado ? " checked='checked'" : "") + ">" +
            "   <span class='toggle'></span>" +
            "</label></div>";
        row.edAsignado = edAsignado;
        return row;
    }

    preparaFila(row) {
        return row;
    }
    
    onListaUsuarios_rowSelected(idx) {
        let row = this.listaUsuarios.rows[idx];
        this.treePrivilegios.view.show();
        this.treePrivilegios.refresh();
        }

    registraHandlersFilas() {
        this.listaUsuarios.view.find(".activo-toggler").change(e => {
            let c = $(e.currentTarget).prop("checked") ? true : false;
            let login = $(e.currentTarget).data("login");
            let idx = this.listaUsuarios.rows.findIndex(r => r.login == login);
            if (idx < 0) return;
            let r = this.listaUsuarios.rows[idx];
            r.asignado = c;
            zPost("saveUsuarioEngrupo.seg", { usuario: r, grupo: this.lista.rows[this.lista.getSelectedRowIndex()] })
                .then(() => {
                    this.preparaFilaUsuario(r);
                    this.listaUsuarios.updateRow(idx, r);
                })
                .catch(error => this.showDialog("common/WError", { message: error.toString() }));
        });
    }
    onListaUsuarios_afterPaint() {
        this.registraHandlersFilas();
    }


    onListaUsuarios_getRows(cb) {
        zPost("getUsuarios.seg", {filtro:this.edFiltroUsuario.val.trim()}, usuarios => {
            usuarios.forEach(u => this.preparaFila(u));
            cb(usuarios);
        });
    }

    onTreePrivilegios_getLevel(parentNode, cb) {
        let usuarioSel = this.listaUsuarios.rows[this.listaUsuarios.getSelectedRowIndex()];
       if(!parentNode){
            zPost("getSistemasByUsuario.seg", {usuario: usuarioSel }, arbol => {
                if(arbol.length<1){
                    this.mensajePermisos.view.html("El Usuario '" + usuarioSel.nombre + "', no tiene privilegios asociados.");
                    this.colorInfoPermisos.view.attr("class", 'card text-white bg-primary mt-0 mb-0');
                }else{
                    this.mensajePermisos.view.html("El Usuario '" + usuarioSel.nombre + "', tiene los siguientes privilegios:");
                    this.colorInfoPermisos.view.attr("class", 'card text-white bg-success mt-0 mb-0');                   
                 }
                cb(arbol);
            });

        }else{
            zPost("getPrivilegiosByUsuarioSistema.seg", {sistema:parentNode, usuario: usuarioSel }, privilegios => {
                cb(privilegios);
            });
         }   

       
    }  
 }

