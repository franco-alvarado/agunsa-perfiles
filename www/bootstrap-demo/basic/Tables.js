class CustomController extends ZCustomComponent{
    onThis_init(){
        this.demo1.startDemo("bootstrap-demo/basic/tables/Demo1", [
            {name:"Demo1.html", path:"bootstrap-demo/basic/tables/Demo1.html"},
            {name:"Edit.html", path:"bootstrap-demo/basic/tables/Edit.html"},
            {name:"Demo1.js", path:"bootstrap-demo/basic/tables/Demo1.js"},
            {name:"Edit.js", path:"bootstrap-demo/basic/tables/Edit.js"}
        ], 300);
    }
}