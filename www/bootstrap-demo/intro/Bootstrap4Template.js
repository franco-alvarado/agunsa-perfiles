class CustomController extends ZCustomComponent {
    onThis_init() {
        this.demo1.startDemo("bootstrap-demo/intro/templates/bootstrap4/Main", [
            {name:"index.html", path:"bootstrap-demo/intro/templates/bootstrap4/index.html"},
            {name:"Main.html", path:"bootstrap-demo/intro/templates/bootstrap4/Main.html"},
            {name:"Main.js", path:"bootstrap-demo/intro/templates/bootstrap4/Main.js"}
        ], 500);
    }
}