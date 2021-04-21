class CustomController extends ZCustomComponent {
    onThis_init() {
        this.demo1.startDemo("bootstrap-demo/zloader/StackDemo", [
            {name:"StackDemo.html", path:"bootstrap-demo/zloader/StackDemo.html"},
            {name:"StackDemo.js", path:"bootstrap-demo/zloader/StackDemo.js"},
            {name:"StackRecord.html", path:"bootstrap-demo/zloader/StackRecord.html"},
            {name:"StackRecord.js", path:"bootstrap-demo/zloader/StackRecord.js"},
            {name:"StackNameEditor.html", path:"bootstrap-demo/zloader/StackNameEditor.html"},
            {name:"StackNameEditor.js", path:"bootstrap-demo/zloader/StackNameEditor.js"},
            {name:"StackAddressEditor.html", path:"bootstrap-demo/zloader/StackAddressEditor.html"},
            {name:"StackAddressEditor.js", path:"bootstrap-demo/zloader/StackAddressEditor.js"}
        ], 300);
    }
}