class CustomController extends ZCustomComponent {
    onThis_init(options) {
        this.view.bootstrapMaterialDesign();
        this.mensajeError.hide();
        this.mensajeEnviando.hide();
        if (options.login) this.edLogin.val = options.login;
        this.view.on("keyup", e => {
            if (e.keyCode == 13) this.cmdOk.view.trigger("click");
        })
        setTimeout(_ => this.edLogin.view.focus(), 500);
    }
    onCmdCancel_click() {this.cancel()}
    muestraError(txt) {
        this.mensajeEnviando.hide();
        this.textoMensajeError.view.text(txt);
        document.getElementById("loadingButton").className ="";
        document.getElementById("cmdOk").disabled = false;
        this.mensajeError.show();        
    }
    onCmdOk_click() {
        document.getElementById("cmdOk").disabled = true;
        document.getElementById("loadingButton").className ="fa fa-spinner fa-spin";
        this.mensajeError.hide();
        this.mensajeEnviando.hide();
        let login = this.edLogin.val.trim();
        if (!login) {
            this.muestraError("Identificación inválida");
            return;
        }
        this.mensajeError.hide();
        this.mensajeEnviando.hide();
        zPost("generaTokenRecuperacion.seg", {login:login})
            .then(_ => {
                this.mensajeEnviando.hide();
                document.getElementById("loadingButton").className ="";
                document.getElementById("cmdOk").disabled = false;
                this.showDialog("common/WInfo", {message:"Se le ha enviado un mensaje a su dirección de correo electrónico. Siga las instrucciones en el mensaje para la creación de la nueva contraseña"});
                this.close();
            })
            .catch(error => this.muestraError(error.toString()));
    }
}