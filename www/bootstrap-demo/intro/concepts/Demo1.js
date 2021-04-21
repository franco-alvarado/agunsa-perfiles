class CustomController extends ZCustomComponent {
    onEdName_change() {
        this.output.text = this.edName.val?"Hello " + this.edName.val:"Please enter your name";
    }
}