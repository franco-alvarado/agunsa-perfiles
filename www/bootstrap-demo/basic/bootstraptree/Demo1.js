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
        let envira = "<i class='fab fa-envira mr-2'></i>";
        let tree = "<i class='fas fa-tree mr-2'></i>";
        let branch ="<i class='fab fa-pagelines mr-2'></i>";
        cb([
            {label:"Branch Node 1", icon:branch, expandedIcon:branch, autoExpand:true, nodes:[
                {label:"Children Node 1.1", path:"", icon:envira, nodes:false},
                {label:"Children Node 1.2", path:"", icon:envira, nodes:false}
            ]},
            {label:"Branch Node 2", icon:branch, expandedIcon:branch, autoExpand:true, nodes:[
                {label:"Branch Node 2.1", path:"", icon:branch, expandedIcon:branch, autoExpand:true, nodes:[
                    {label:"Children Node 2.1.1", path:"", icon:envira, nodes:false},
                    {label:"Children Node 2.1.2", path:"", icon:envira, nodes:false}
            ]},
                {label:"Children Node 2.2", path:"", icon:envira, nodes:false},
                {label:"Children Node 2.3", path:"", icon:envira, nodes:false}
                
            ]}
        ]);
    }
    onComponentsTree_selectionChange(node) {
        console.log(node);
        if (node) {
            this.output.text = "The node selected is : "+ node.label;
        }
    }
}