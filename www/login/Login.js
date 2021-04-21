class CustomController extends ZCustomComponent {
    onThis_init() {
        this.view.bootstrapMaterialDesign();
        this.edLogin.view.focus();
        this.view.on("keyup", e => {
            if (e.keyCode == 13) this.cmdLogin.view.trigger("click");
        })
        //start value
        this.edLogin.val = "admin@agunsa.cl";
    }
    async onCmdLogin_click() {
        this.edLogin.clearValidation();
        let login = this.edLogin.val.trim();
        if (!login) {
            this.edLogin.setValidationError();
            return;
        }
        let pwd = this.edPwd.val.trim();
        try {
            let sesion = await zPost("login.seg", {login:login, pwd:pwd, codigoSistema:"PERFILES"});
            this.triggerEvent("login", sesion);
        } catch(error) {
            this.showDialog("common/WError", {message:error});
        }
    }    

    onCmdOlvidoPwd_click() {
        this.showDialog("./WOlvidoPwd", {login:this.edLogin.val});
    }
}