class CustomController extends ZCustomComponent {
    onThis_init(options) {
        this._tokenRecuperacion = options.tokenRecuperacion;
        this.view.bootstrapMaterialDesign();
        this.edPwd1.view.focus();
        this.view.on("keyup", e => {
            if (e.keyCode == 13) this.cmdCambiar.view.trigger("click");
        });

        zPost("getInfoRecuperacion.seg", {token:options.tokenRecuperacion})
            .then(info => this.edLogin.val = "[" + info.login + "] " + info.nombre)
            .catch(error => {
                this.divForm.hide();
                this.cmdCambiar.disable();
                this.edLogin.val = "ERROR: " + error.toString();
                this.showDialog("common/WError", {message:error.toString()});
            })
    }

    onCmdCambiar_click() {
        zPost("recuperaPwd.seg", {token:this._tokenRecuperacion, pwd1:this.edPwd1.val, pwd2:this.edPwd2.val})
            .then(_ => {
                this.showDialog("common/WInfo", {message:"Se ha creado o modificado exitosamente su contraseña. Ahora puede ingresar a los diferentes módulos del sistema, de acuerdo a los privilegios que le hayan asignado los administradores."})
                this.view.hide();
            })
            .catch(error => this.showDialog("common/WError", {message:error.toString()}));
    }
}