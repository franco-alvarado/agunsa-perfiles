class CustomController extends ZCustomComponent {
    onThis_init() {
        this.demo1.startDemo("bootstrap-demo/intro/concepts/Demo1", [
            {name:"Demo1.html", path:"bootstrap-demo/intro/concepts/Demo1.html"},
            {name:"Demo1.js", path:"bootstrap-demo/intro/concepts/Demo1.js"}
        ], 200);
    }
}