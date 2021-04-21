class CustomController extends ZCustomComponent {
    onThis_init() {
        this.edSubscribe.checked = true;
    }
    onEdEmail_change() {
        this.output.text = "email:" + this.edEmail.val;
    }
    onEdSubscribe_change() {
        this.output.text = "subscribe:" + this.edSubscribe.checked;
    }
}