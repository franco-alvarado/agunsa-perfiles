class CustomController extends ZCustomComponent {
    onThis_init() {
        this.counter = 0;
    }
    onCmdButton_click() {
        this.counter ++;
        this.badge.text = this.counter.toString();
        this.triggerEvent("counterChanged", this.counter);
    }
    describeMe() {return "I'm Panel Two";}
}