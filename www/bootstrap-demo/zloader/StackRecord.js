class CustomController extends ZCustomComponent {
    onThis_init() {this.triggerEvent("log", "StackRecord_init")}
    onThis_activate() {this.triggerEvent("log", "StackRecord_activate")}
    onThis_deactivate() {this.triggerEvent("log", "StackRecord_deactivate")}
    refreshRecord(person) {
        this.person = person;
        this.lnkPersonName.text = person.name?person.name:"[Click to add Name]";
        this.lnkPersonAddress.text = person.address?person.address:"[Click to add Address]";
    }
    onLnkPersonName_click() {
        this.triggerEvent("editNameRequest");
    }
    onLnkPersonAddress_click() {
        this.triggerEvent("editAddressRequest");
    }
}