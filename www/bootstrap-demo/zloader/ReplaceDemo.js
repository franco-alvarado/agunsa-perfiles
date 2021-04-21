class CustomController extends ZCustomComponent {
    onThis_init() {
        this.counter = 0;
        this.refreshDescription();
    }
    refreshDescription() {
        this.lblContent.text = "Active content says:" + this.loader.active.describeMe();
    }
    onCmdPanel1_click() {
        this.loader.load("./Panel1")
            .then(controller => this.refreshDescription());
    }
    onCmdPanel2_click() {
        this.loader.load("./Panel2")
            .then(controller => this.refreshDescription());
    }
    onLoader_counterChanged(counter) {
        this.lblCounter.text = "Counter:" + counter;
    }
}