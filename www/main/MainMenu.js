class CustomController extends ZCustomComponent {
    onThis_init() {
        this.lblNombreUsuario.view.text(window.app.sesion.usuario.nombre);
        this.lblFooterNombreUsuario.view.text(window.app.sesion.usuario.nombre);

        if (!window.app.sesion.tienePrivilegio("CONSULTA") && !window.app.sesion.tienePrivilegio("ADMIN")) {
            this.itemUsuariosGlobal.hide();
        }
        if (!window.app.sesion.tienePrivilegio("LOG") && !window.app.sesion.tienePrivilegio("ADMIN")) {
            this.itemLog.hide();
        }
        this.onCmdHome_click();
    }
    onCmdLogout_click() {
        //this.triggerEvent("logout");
        try {
            let logout = zPost("logout.seg", {codigoSistema:"PERFILES"});
            this.triggerEvent("logout", logout);
        } catch(error) {
            this.showDialog("common/WError", {message:error});
        }
    }

    onCmdHome_click() {
        if (window.app.sesion.tienePrivilegio("ADMIN") || window.app.sesion.tienePrivilegio("CONSULTA")) {
            this.vistaLoader.load("./usuarios/Usuarios");
        } else {
            this.vistaLoader.load("./log/Log");
        }
    }

    onCmdCambiarPwd_click() {
        this.showDialog("login/WCambiarPwd");
    }

    // Opciones menú Usuarios
    onCmdConfUsuarios_click() {
        this.vistaLoader.load("./usuarios/Usuarios");
    }
    onCmdConfGrupos_click() { 
        this.vistaLoader.load("./usuarios/Grupos");
    }

    onCmdPrivilegiosUsuario_click(){
        this.vistaLoader.load("./usuarios/privilegios");
    }
    
    onCmdLog_click() {
        this.vistaLoader.load("./log/Log");
    }


    // onCmdConfGruposUsuarios_click() {
    //     this.vistaLoader.load("./usuarios/GrupoUsuarios");
    // }

    // Eventos de cambio de panel
    onVistaLoader_editarControles(servicio) {
        console.log("editar controles de ", servicio);
        this.vistaLoader.push("./configurar/Controles", {servicio:servicio});
    }
    onVistaLoader_volver() {
        this.vistaLoader.pop();
    }
}