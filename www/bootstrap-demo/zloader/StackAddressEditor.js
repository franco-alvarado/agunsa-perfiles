class CustomController extends ZCustomComponent {
    onThis_init(options) {        
        this.triggerEvent("log", "StackAddressEditor_init")
        this.edAddress.val = options.person.address;
        this.validate();
    }
    onThis_activate() {this.triggerEvent("log", "StackAddressEditor_activate")}
    onThis_deactivate() {this.triggerEvent("log", "StackAddressEditor_deactivate")}
    onEdAddress_change() {this.validate()}
    validate() {
        this.cmdOk.setEnabled(this.edAddress.val?true:false);
    }
    onCmdCancel_click() {
        this.triggerEvent("cancel");
    }
    onCmdOk_click() {
        this.triggerEvent("addressChanged", this.edAddress.val);
    }
}