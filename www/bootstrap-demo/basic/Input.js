class CustomController extends ZCustomComponent {
    onThis_init() {
        this.demo1.startDemo("bootstrap-demo/basic/input/Demo1", [
            {name:"Demo1.html", path:"bootstrap-demo/basic/input/Demo1.html"},
            {name:"Demo1.js", path:"bootstrap-demo/basic/input/Demo1.js"}
        ], 300);
        this.demo2.startDemo("bootstrap-demo/basic/input/Demo2", [
            {name:"Demo2.html", path:"bootstrap-demo/basic/input/Demo2.html"},
            {name:"Demo2.js", path:"bootstrap-demo/basic/input/Demo2.js"}
        ], 300);
    }
}