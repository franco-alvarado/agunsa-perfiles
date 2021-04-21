class CustomController extends ZCustomComponent {
    onThis_init(options) {
        this.options = options;
        this.view.bootstrapMaterialDesign();
        this.mensajeError.hide();
        if (options.newRecord) {
            this.title.view.text("Crear Nuevo Usuario");
            this.lblAccion.view.text("Nuevo Usuario:");
            this.edActivo.checked = true;
            this.edAdmin.checked = false;
            setTimeout(() => {
                this.edLogin.view.focus();
            }, 500);
        } else {
            this.title.view.text("Editar Usuario");
            this.lblAccion.view.text("Editar Usuario:");
            let u = options.record;
            this.edLogin.disable();
            this.edLogin.val = u.login;
            this.edNombre.val = u.nombre;
            this.edEmail.val = u.email;
            this.edActivo.checked = u.activo;
            this.edAdmin.checked = u.admin;
        }
    }
    onCmdCancel_click() {
        this.cancel();
        document.getElementById("loadingButton").className ="";
    }
    muestraError(txt) {
        this.textoMensajeError.view.text(txt);
        this.mensajeError.show();
        document.getElementById("loadingButton").className ="";
        document.getElementById("cmdOk").disabled = false;
    }
    onCmdOk_click() {
        document.getElementById("cmdOk").disabled = true;
        document.getElementById("loadingButton").className ="fa fa-spinner fa-spin";
        let u = {
            login:this.edLogin.val.trim(),
            nombre:this.edNombre.val,
            email:this.edEmail.val,
            activo:this.edActivo.checked,
            admin:this.edAdmin.checked
        }
        if (!u.login) {
            this.muestraError("Identificación inválida");
            return;
        }
        if (!u.nombre) {
            this.muestraError("Debe ingresar el nombre del usuario");
            return;
        }
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (!re.test(u.email)) {
            this.muestraError("Dirección de Correo inválida");
            return;
        }
        if (this.options.newRecord) {
            zPost("addUsuario.seg", {usuario:u})
                .then(usuario => {
                    this.close(usuario);
                    document.getElementById("loadingButton").className ="";
                    document.getElementById("cmdOk").disabled = false;
                    })
                .catch(error => {
                    document.getElementById("loadingButton").className ="";
                    document.getElementById("cmdOk").disabled = false;
                    this.showDialog("common/WError", {message:error.toString()});
                    });
        } else {
            zPost("saveUsuario.seg", {usuario:u})
                .then(usuario => {
                    this.close(usuario);
                    document.getElementById("loadingButton").className ="";
                    document.getElementById("cmdOk").disabled = false;
                })
                .catch(error => {
                    document.getElementById("loadingButton").className ="";
                    document.getElementById("cmdOk").disabled = false;
                    this.showDialog("common/WError", {message:error.toString()});
            });
        }
    }
}