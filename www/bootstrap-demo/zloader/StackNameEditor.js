class CustomController extends ZCustomComponent {
    onThis_init(options) {        
        this.triggerEvent("log", "StackNameEditor_init")
        this.edName.val = options.person.name;
        this.validate();
    }
    onThis_activate() {this.triggerEvent("log", "StackNameEditor_activate")}
    onThis_deactivate() {this.triggerEvent("log", "StackNameEditor_deactivate")}
    onEdName_change() {this.validate()}
    validate() {
        this.cmdOk.setEnabled(this.edName.val?true:false);
    }
    onCmdCancel_click() {
        this.triggerEvent("cancel");
    }
    onCmdOk_click() {
        this.triggerEvent("nameChanged", this.edName.val);
    }
}