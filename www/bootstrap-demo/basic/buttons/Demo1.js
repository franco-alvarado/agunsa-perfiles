class CustomController extends ZCustomComponent {
    onThis_init() {
        this.counter = 0;
    }
    incrementCounter() {
        this.counter ++;
        this.output.text = "Counter:" + this.counter;
        this.badge.text = this.counter.toString();
    }
    onCmdButton1_click() {this.incrementCounter();}
    onCmdButton2_click() {this.incrementCounter();}
    onCmdButton3_click() {this.incrementCounter();}
    onCmdButton4_click() {this.incrementCounter();}
}