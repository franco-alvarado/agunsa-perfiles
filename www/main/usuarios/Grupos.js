class CustomController extends ZCustomComponent {
    onThis_init() {
        this.view.bootstrapMaterialDesign();
        this.divPermisos.view.hide();
        this.esAdmin = window.app.sesion.tienePrivilegio("ADMIN");
        this.grpConfigurarPrivilegios.hide();
        if (!this.esAdmin) {
            this.cmdAddGrupo.hide();
            this.lista.removeEditColumn();
        }
        //set custom paint level
        this.tree.setPaintCallback((level, depth) => { return this.paintLevel(level, depth) });

        this.refresca();

    }

    onEdFiltroUsuario_change() { this.listaUsuarios.refresh() }
    
    refresca() { this.lista.refresh() }

    preparaFilaUsuario(row) {
        delete row._rowClass;
        if (!row.asignado) {
            row._rowClass = "table-danger";
        }
        let edAsignado =
            "<div class='togglebutton'><label style='line-height:0.6;'>" +
            "<input class='activo-toggler' data-login='" + row.login + "' type='checkbox'" + (row.asignado ? " checked='checked'" : "") + (this.esAdmin?"":" disabled='disabled' ")  + ">" +
            "   <span class='toggle'></span>" +
            "</label></div>";
        row.edAsignado = edAsignado;
        return row;
    }

    preparaFila(row) {
        return row;
    }

    onTabs_change(tab) {
        if (this.esAdmin && tab == "permisos") this.grpConfigurarPrivilegios.show();
        else this.grpConfigurarPrivilegios.hide();
    }

    onLista_rowSelected(idx) {
        this.divPermisos.view.show();
        this.listaUsuarios.refresh();
        this.tree.refresh();
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

    onLista_getRows(cb) {
        zPost("getAllGrupos.seg", { filtro: "" }, grupos => {
            grupos.forEach(c => this.preparaFila(c));
            cb(grupos);
        });
    }

    onListaUsuarios_afterPaint() {
        this.registraHandlersFilas();
    }

    onCmdAddGrupo_click() {
        this.showDialog("./WEdGrupo", { newRecord: true }, _ => this.refresca());
    }

    onLista_editRequest(idx, row) {
        this.showDialog("./WEdGrupo", { record: row }, grupo => {
            this.lista.updateRow(idx, this.preparaFila(grupo));
        });
    }

    onLista_deleteRequest(idx, row) {
        this.showDialog("common/WConfirm", { message: "¿Confirma que desea eliminar el Grupo '" + row.nombre + "'?" }, () => {
            zPost("deleteGrupo.seg", { grupo: row })
                .then(() => {
                    this.lista.deleteRow(idx);
                })
                .catch(error => this.showDialog("common/WError", { message: error.toString() }));
        });
    }

    onListaUsuarios_getRows(cb) {
        zPost("getUsuariosGrupos.seg", { filtro: this.edFiltroUsuario.val.trim(), grupo: this.lista.rows[this.lista.getSelectedRowIndex()] }, usuarios => {
            usuarios.forEach(u => this.preparaFilaUsuario(u));
            cb(usuarios);
        });
    }

    onTree_getLevel(parentNode, cb) {
        //console.log(`onTree_getLevel ${JSON.stringify(parentNode, null, 4)}, ${cb}`);
        let grupoSel = this.lista.rows[this.lista.getSelectedRowIndex()];
        //console.log(`lista ${JSON.stringify(this.lista.rows, null, 4)}`);
        //console.log(`getSelectedRowIndex ${JSON.stringify(this.lista.getSelectedRowIndex(), null, 4)}`);
        //console.log(`grupoSel ${JSON.stringify(grupoSel, null, 4)}`);
        if(!parentNode){
            zPost("getSistemasArbol.seg", { grupo: grupoSel }, arbol => {
                if(arbol.length<1){
                    this.divMensajePrivilegios.view.html("El grupo '" + grupoSel.nombre + "', no tiene privilegios asociados.");
                    this.colorInfo.view.attr("class", 'card text-white bg-primary mt-0 mb-0');
                }else{
                    this.divMensajePrivilegios.view.html("El grupo '" + grupoSel.nombre + "', tiene los siguientes privilegios:");
                    this.colorInfo.view.attr("class", 'card text-white bg-success mt-0 mb-0');
                }
                console.log(`arbol `, arbol, typeof arbol);
                cb(arbol);
            });
        }else{
            zPost("getPrivilegiosPorSistema.seg", {sistema:parentNode, grupo: grupoSel }, privilegios => {
                //console.log(`[getPrivilegiosPorSistema] privilegios ${JSON.stringify(privilegios)}`)
                cb(privilegios);
            });
        } 
    } 

    paintLevel(level, depth){
        try{
            var html = "";
            level.forEach(n => {
                var expandable = n.nodes?true:false;
                html += "<a href='#' class='list-group-item list-group-item-action pr-0 py-2' data-zid='" + n._id + "' style='display: block'>";
                html += this.tree.getIndentElement(depth);
                if (!expandable) {
                    html += n.icon;
                } else {
                    html += "<span class='expander' data-znodeid='" + n._id + "'>";
                    if (n.expandedIcon) {
                        html += n.expanded?n.expandedIcon:n.icon;
                    } else {
                        html += n.icon;
                    }
                    html += "</span>";
                }
                html += n[this.tree._tree.labelColumn];
                //Buttons
                html += "<span><i class='fas fa-trash-alt' style='margin-right: 5px;margin-left: 5px;float: right;'></i></span>";
                html += "<span><i class='fas fa-edit' style='margin-right: 5px;margin-left: 5px;float: right;'></i></span>";
                html += "<span><i class='fas fa-plus-circle' style='margin-right: 5px;margin-left: 5px;float: right;'></i></span>";
                html += "</a>"
                if (n.nodes && n.loaded && n.expanded) html += this.paintLevel(n.nodes, depth + 1);
            });
            return html;
        }catch(error){
            console.error(error);
            return "";
        }
    }
    
    onCmdConfigurarPrivilegios_click() {
        this.showDialog("./WEdPrivilegios", { grupo: this.lista.rows[this.lista.getSelectedRowIndex()] }, 
        _ => this.tree.refresh());
    }
}