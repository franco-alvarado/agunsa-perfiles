class CustomController extends ZCustomComponent {
    onThis_init() {
        this.person = {name:null, address:null};        
        // Initial pane is 'StackRecord'
        this.loader.active.refreshRecord(this.person);
    }
    addToLog(txt) {
        if (!this.log.val) {
            this.log.val = "Events log in sub-panels\n-------------------------------------------------";
        }
        this.log.val += ("\n" + txt)
    }
    onLoader_log(line) {this.addToLog(line)}
    onLoader_editNameRequest() {
        this.loader.push("./StackNameEditor", {person:this.person});
    }
    onLoader_editAddressRequest() {
        this.loader.push("./StackAddressEditor", {person:this.person});
    }
    onLoader_cancel() {
        this.loader.pop();
    }
    onLoader_nameChanged(name) {
        this.person.name = name;
        this.loader.pop()
            .then(_ => this.loader.active.refreshRecord(this.person));
    }    
    onLoader_addressChanged(address) {
        this.person.address = address;
        this.loader.pop()
            .then(_ => this.loader.active.refreshRecord(this.person));
    }    
}