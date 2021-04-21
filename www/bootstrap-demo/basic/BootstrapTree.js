class CustomController extends ZCustomComponent {
    onThis_init() {
        this.demo1.startDemo("bootstrap-demo/basic/bootstraptree/Demo1", [
            {name:"Demo1.html", path:"bootstrap-demo/basic/bootstraptree/Demo1.html"},
            {name:"Demo1.js", path:"bootstrap-demo/basic/bootstraptree/Demo1.js"}
        ], 300);
    }
}