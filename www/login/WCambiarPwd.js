class CustomController extends ZCustomComponent {
    onThis_init(options) {
        this.view.bootstrapMaterialDesign();
        this.view.on("keyup", e => {
            if (e.keyCode == 13) this.cmdOk.view.trigger("click");
        })
        setTimeout(() => {
            this.edPwd.view.focus();
        }, 500);
    }
    onCmdCancel_click() {this.cancel()}
    onCmdOk_click() {
        zPost("cambiaPwd.seg", {pwd:this.edPwd.val.trim(), pwd1:this.edPwd1.val.trim(), pwd2:this.edPwd2.val.trim()})
            .then(() => {
                this.showDialog("common/WInfo", {message:"Su contraseña ha sido modificada"});
                this.close();
            })
            .catch(error => this.showDialog("common/WError", {message:error.toString()}));
    }
}