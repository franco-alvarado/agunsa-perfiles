class CustomController extends ZCustomComponent {
    onThis_init() {
        this.view.bootstrapMaterialDesign();
        this.esAdmin = window.app.sesion.tienePrivilegio("ADMIN");
        if (!this.esAdmin) {
            this.cmdAgregarUsuario.hide();
            this.listaUsuarios.removeEditColumn();
        }
        this.refresca();
    }
    onEdFiltro_change() {this.refresca()}
    refresca() {this.listaUsuarios.refresh()}
    preparaFila(row) {
        delete row._rowClass;
        if (!row.activo) {
            row._rowClass="table-danger";
        } else if (row.admin) {
            row._rowClass="table-warning";
        }
        let edAdmin = 
            "<div class='togglebutton'><label style='line-height:0.6;'>" +
                "<input class='admin-toggler' data-login='" + row.login + "' type='checkbox'" + (row.admin?" checked='checked'":"") + (this.esAdmin?"":" disabled='disabled' ") + ">" +
                "   <span class='toggle'></span>" +
            "</label></div>";
        row.edAdmin = edAdmin;
        let edActivo = 
            "<div class='togglebutton'><label style='line-height:0.6;'>" +
                "<input class='activo-toggler' data-login='" + row.login + "' type='checkbox'" + (row.activo?" checked='checked'":"") + (this.esAdmin?"":" disabled='disabled' ") + ">" +
                "   <span class='toggle'></span>" +
            "</label></div>";
        row.edActivo = edActivo;
        return row;
    }
    registraHandlersFilas() {
        this.listaUsuarios.view.find(".admin-toggler").change(e => {
            let c = $(e.currentTarget).prop("checked")?true:false;
            let login = $(e.currentTarget).data("login");            
            let idx = this.listaUsuarios.rows.findIndex(r => r.login == login);
            if (idx < 0) return;
            let r = this.listaUsuarios.rows[idx];
            r.admin = c;
            zPost("saveUsuario.seg", {usuario:r})
                .then(() => {
                    this.preparaFila(r);
                    this.listaUsuarios.updateRow(idx, r);
                })
                .catch(error => this.showDialog("common/WError", {message:error.toString()}));
        });
        this.listaUsuarios.view.find(".activo-toggler").change(e => {
            let c = $(e.currentTarget).prop("checked")?true:false;
            let login = $(e.currentTarget).data("login");            
            let idx = this.listaUsuarios.rows.findIndex(r => r.login == login);
            if (idx < 0) return;
            let r = this.listaUsuarios.rows[idx];
            r.activo = c;
            zPost("saveUsuario.seg", {usuario:r})
                .then(() => {
                    this.preparaFila(r);
                    this.listaUsuarios.updateRow(idx, r);
                })
                .catch(error => this.showDialog("common/WError", {message:error.toString()}));
        });
    }
    onListaUsuarios_getRows(cb) {
        zPost("getUsuarios.seg", {filtro:this.edFiltro.val.trim()}, usuarios => {
            usuarios.forEach(u => this.preparaFila(u));
            cb(usuarios);
        });
    }
    onListaUsuarios_afterPaint() {
        this.registraHandlersFilas();
    }
    onCmdAgregarUsuario_click() {
        this.showDialog("./WEdUsuario", {newRecord:true}, usuario => this.refresca());
    }
    onListaUsuarios_editRequest(idx, row) {
        if (!this.esAdmin) return;
        this.showDialog("./WEdUsuario", {record:row}, usuario => {
            this.listaUsuarios.updateRow(idx, this.preparaFila(usuario));
        });
    }
    onListaUsuarios_deleteRequest(idx, row) {
        if (!this.esAdmin) return;
        this.showDialog("common/WConfirm", {message:"¿Confirma que desea eliminar el usuario '" + row.nombre + "'?"}, () => {
            zPost("deleteUsuario.seg", {usuario:row})
                .then(() => {
                    this.listaUsuarios.deleteRow(idx);
                })
                .catch(error => this.showDialog("common/WError", {message:error.toString()}));
        });
    }    
}