class CustomController extends ZCustomComponent {
    onThis_init() {
    }
    onCmdOk_click() {
        this.output.text = "The value of the select is : " + this.edCar.val;         
    }
}