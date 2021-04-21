class CustomController extends ZCustomComponent {
    onThis_init(options) {
        this.options = options;
        this.view.bootstrapMaterialDesign();
        this.mensajeError.hide();
        if (options.newRecord) {
            this.title.view.text("Crear Nuevo Grupo");
            this.lblAccion.view.text("Nuevo Grupo:");
        } else {
            this.title.view.text("Editar Grupo");
            this.lblAccion.view.text("Editar Grupo:");
            let g = options.record;
            this.edNombre.val = g.nombre;

        }
    }
    onCmdCancel_click() {this.cancel()}
    muestraError(txt) {
        this.textoMensajeError.view.text(txt);
        this.mensajeError.show();
    }
    onCmdOk_click() {
        let g = {
            nombre:this.edNombre.val
        }
        if (!g.nombre) {
            this.muestraError("Debe ingresar el nombre del grupo");
            return;
        }

        if (this.options.newRecord) {
            zPost("addGrupo.seg", {grupo:g})
                .then(grupo => this.close(grupo))
                .catch(error => this.showDialog("common/WError", {message:error.toString()}));
        } else {
            let gUpdate = {
                id: this.options.record.id,
                nombre:this.edNombre.val
            } 
            zPost("saveGrupo.seg", {grupo:gUpdate})
                .then(grupo => this.close(grupo))
                .catch(error => this.showDialog("common/WError", {message:error.toString()}));
        }
    }
}