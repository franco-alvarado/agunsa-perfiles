class CustomController extends ZCustomComponent {
    onThis_init() {
        this.demo1.startDemo("bootstrap-demo/zloader/ReplaceDemo", [
            {name:"ReplaceDemo.html", path:"bootstrap-demo/zloader/ReplaceDemo.html"},
            {name:"ReplaceDemo.js", path:"bootstrap-demo/zloader/ReplaceDemo.js"},
            {name:"Panel1.html", path:"bootstrap-demo/zloader/Panel1.html"},
            {name:"Panel1.js", path:"bootstrap-demo/zloader/Panel1.js"},
            {name:"Panel2.html", path:"bootstrap-demo/zloader/Panel2.html"},
            {name:"Panel2.js", path:"bootstrap-demo/zloader/Panel2.js"}
        ], 300);
    }
}