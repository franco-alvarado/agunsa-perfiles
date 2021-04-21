class CustomController extends ZCustomComponent{
    onThis_init(){
        this.demo1.startDemo("bootstrap-demo/basic/showdialogs/Demo1", [
            {name:"Demo1.html", path:"bootstrap-demo/basic/showdialogs/Demo1.html"},
            {name:"Dialog.html", path:"bootstrap-demo/basic/showdialogs/Dialog.html"},
            {name:"Demo1.js", path:"bootstrap-demo/basic/showdialogs/Demo1.js"},
            {name:"Dialog.js", path:"bootstrap-demo/basic/showdialogs/Dialog.js"}
        ], 300);
    }
}