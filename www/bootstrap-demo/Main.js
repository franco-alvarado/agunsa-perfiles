class CustomController extends ZCustomComponent {
    onThis_init() {
        this.componentsTree.refresh();
    }
    onComponentsTree_getLevel(parentNode, cb) {
        let info = "<i class='fas fa-info-circle mr-2'></i>";
        let folder = "<i class='far fa-folder mr-2'></i>";
        let folderExpanded = "<i class='far fa-folder-open mr-2'></i>";
        let basicComponent = "<i class='fas fa-puzzle-piece mr-2'></i>";
        let compoundComponent = "<i class='fas fa-columns mr-2'></i>";
        cb([
            {label:"Z-MVC Introduction", icon:folder, expandedIcon:folderExpanded, autoExpand:true, nodes:[
                {label:"Concepts", path:"./intro/Concepts", icon:info, nodes:false},
                {label:"Starting Bootstrap 4 Template", path:"./intro/Bootstrap4Template", icon:info, nodes:false}
            ]},
            {label:"Basic HTML Components", icon:folder, expandedIcon:folderExpanded, autoExpand:true, nodes:[
                {label:"Buttons", path:"./basic/Buttons", icon:basicComponent, nodes:false},
                {label:"Input", path:"./basic/Input", icon:basicComponent, nodes:false},
                {label:"Select", path:"./basic/Select", icon:basicComponent, nodes:false},
                {label:"Tables", path:"./basic/Tables", icon:basicComponent, nodes:false},
                {label:"BootstrapTree", path:"./basic/BootstrapTree", icon:basicComponent, nodes:false},
                {label:"Show Dialogs", path:"./basic/ShowDialogs", icon:basicComponent, nodes:false}
            ]}
            ,
            {label:"Dynamic content", icon:folder, expandedIcon:folderExpanded, autoExpand:true, nodes:[
                {label:"ZAutoLoad / Replace", path:"./zloader/Replace", icon:compoundComponent, nodes:false},
                {label:"ZAutoLoad / Transitions", path:"./zloader/Stack", icon:compoundComponent, nodes:false}
            ]}
        ]);
    }
    onComponentsTree_selectionChange(node) {
        if (node && node.path) {
            this.mainLoader.load(node.path);
        }
    }
}