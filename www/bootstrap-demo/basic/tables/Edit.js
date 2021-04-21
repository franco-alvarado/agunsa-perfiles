class CustomController extends ZCustomComponent {
	onThis_init(options) {	
        this.options = options;	
		if (options.title) this.title.view.text(options.title);
        
        if (options.newRecord) {
            this.title.view.text("Crear Nuevo Usuario");
            this.lblAccion.view.text("Nuevo Usuario:");
            
        } else {
            this.title.view.text("Editar Usuario");
            this.lblAccion.view.text("Editar Usuario:");
            let u = this.options.record;
            this.edName.val = u.name;
            this.edLastName.val = u.lastname;
            this.edEmail.val = u.email;
        }
        
        
    }
    onCmdCancel_click() {this.cancel()}
    muestraError(txt) {
        this.textoMensajeError.view.text(txt);
        this.mensajeError.show();
    }

    
    onCmdOk_click() {
        let u = {
            name:this.edName.val,
            lastname:this.edLastName.val,
            email:this.edEmail.val
        };
        if (!u.name) {
            this.muestraError("You must put Name");
            return;
        }
        if (!u.lastname) {
            this.muestraError("You must put LastName");
            return;
        }
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (!re.test(u.email)) {
            this.muestraError("No valid email");
            return;
        }
        // if (this.options.newRecord) {
        //     zPost("addUsuario.seg", {usuario:u})
        //         .then(usuario => this.close(usuario))
        //         .catch(error => this.showDialog("common/WError", {message:error.toString()}));
        // } else {
        //     zPost("saveUsuario.seg", {usuario:u})
        //         .then(usuario => this.close(usuario))
        //         .catch(error => this.showDialog("common/WError", {message:error.toString()}));
        // }
    }
    
}

