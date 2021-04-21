class ZTree extends ZComponent {
    constructor(e, container, basePath) {
        super(e, container, basePath);
        this._tree = {
            labelColumn:e.data("z-label-col")?e.data("z-label-col"):"label",
            indentWidth:e.data("z-indent-width")?parseInt(e.data("z-indent-width")):20,
            selectedId:null, //idx-idx-...
            loadingMessage:e.data("z-loading-message")?e.data("z-loading-message"):"Loading ...",
            root:null,
            activeClass:e.data("z-active-class")?e.data("z-active-class"):"bg-primary text-white"
        }
        if (!e.hasClass("list-group")) e.addClass("list-group p-0");        
    }
    getNodeById(id) {
	    if (id === null || id === undefined || id === "") return null;
	    var idx = ("" + id).split("-");
	    var node = this._tree.root;
	    for (var i=0; i<idx.length; i++) {
	        node = node.nodes[parseInt(idx[i])];
	    }
	    return node;
	}
	getElementNodeById(id) {
	    var found = this.view.find("*[data-zid='" + id + "']");
	    if (!found.length) {
	        return null;
	    }
	    return found;
	}
	getIndentElement(depth) {
	    var html = "<span style='margin-left:";
	    html += (this._tree.indentWidth * depth - 10);
	    html += "px;'></span>";
	    return html;
	}
	getLoadingMessage(depth) {
	    return "<div>" + this.getIndentElement(depth + 2) + "<i class='fas fa-spinner fa-spin mr-2'></i>" + this._tree.loadingMessage + "</div>";
	}
	getSelectedNode() {
	    return this.getNodeById(this._tree.selectedId);
	}
	setSelectedNode(n) {
	    this._tree.selectedId = n._id;
	    var idx = ("" + n._id).split("-");
	    var node = this._tree.root;
	    for (var i=0; i<idx.length; i++) {
	        node = node.nodes[parseInt(idx[i])];
	        node.expanded = true;
	    }
	    this.paint();
	}
	getParentNode(node) {
	    var id = node._id;
	    var p = id.lastIndexOf("-");
	    if (p < 0) return null;
	    var parentId = id.substring(0,p);
	    return this.getNodeById(parentId);
	}
	findNodeFrom(level, comparator) {
	    var found = null, i=0;
	    while (!found && i < level.length) {
	        var n = level[i];
	        if (comparator(n)) {
	            found = n;
	        } else if (n.nodes && n.loaded) {
	            found = this.findNodeFrom(n.nodes, comparator);
	        }
	        i++;
	    }
	    return found;
	}
	findNode(comparator) {
	    return this.findNodeFrom(this._tree.root.nodes, comparator);
	}
	reloadChildren(n, onReady) {
	    if (!n) {
	        this.refresh(onReady);
	        return;
	    }
	    n.nodes = true;
	    n.loaded = false;
	    n.expanded = true;
	    this.loadLevel(n._id, () => {
	        this.paint();
	        if (onReady) onReady();
	    });
	}
	triggerSeleccionChange() {
	    this.triggerEvent("selectionChange", [this.getSelectedNode()]);
	}
	refresh(onReady) {
	    this._tree.root = {nodes:[]};
	    this._tree.selectedId = null;
	    this.view.html(this.getLoadingMessage(0));
	    this.triggerEvent("getLevel", [null, level => {
			console.log('level ', level, typeof level);
	        level.forEach((n, i) => {
	            n._id = "" + i;
	        });
			this._tree.root = {nodes:level};
			this.paint();
			this.triggerSeleccionChange();
			if (onReady) onReady();
		}]);
	}
	loadLevel(parentId, onReady) {
	    var e = this.getElementNodeById(parentId);
	    if (!e) return;
	    var node = this.getNodeById(parentId);
	    var depth = ("" + parentId).split("-").length;
        e.after(this.getLoadingMessage(depth));
        if (node.nodes === undefined) {
            this.triggerEvent("getLevel", [node, level => {
                level.forEach((n, i) => {
                    n._id = parentId + "-" + i;
                });
                node.nodes = level;
                node.loaded = true;
                if (onReady) onReady();
            }]);
        } else {
            node.nodes.forEach((n, i) => {
                n._id = parentId + "-" + i;
            })
            node.loaded = true;
            if (onReady) onReady();
        }
	}
	paintLevel(level, depth) {
		if(this.paintCallback) return this.paintCallback(level, depth);
	    var html = "";
	    level.forEach(n => {
	        var expandable = n.nodes?true:false;
	        html += "<a href='#' class='list-group-item list-group-item-action pr-0 py-2' data-zid='" + n._id + "'>";
	        html += this.getIndentElement(depth);
	        if (!expandable) {
	            html += n.icon;
	        } else {
	            html += "<span class='expander' data-znodeid='" + n._id + "'>";
	            if (n.expandedIcon) {
	                html += n.expanded?n.expandedIcon:n.icon;
	            } else {
	                html += n.icon;
	            }
	            html += "</span>";
	        }
	        html += n[this._tree.labelColumn] + "</a>";
	        if (n.nodes && n.loaded && n.expanded) html += this.paintLevel(n.nodes, depth + 1);
	    });
	    return html;
    }
	setPaintCallback(cb){
		this.paintCallback = cb;
	}
    expandLevel(id) {
        var node = this.getNodeById(id);
        if (!node.loaded) {
            this.loadLevel(id, () => {
                node.expanded = true;
                this.paint();
            });
        } else {
            node.expanded = !node.expanded;
            this.paint();
        }
    }
	paint() {
	    var html = this.paintLevel(this._tree.root.nodes, 0);
	    this.view.html(html);
	    this.view.find(".expander").css({cursor:"pointer"}).click((e) => {
	        e.preventDefault();
	        var id = $(e.currentTarget).data("znodeid");
	        this.expandLevel(id);
	        return false;
	    });
	    this.view.find("a").click((e) => {
            var id = $(e.currentTarget).data("zid");
            let node = this.getNodeById(id);
            if (node.autoExpand) this.expandLevel(id);
	        this._tree.selectedId = id;
	        this.paintSelected();
	        this.triggerSeleccionChange();
	    });
	    this.view.find("a").dblclick((e) => {
	        this.triggerEvent("dblClick", [this.getSelectedNode()]);
	    });
	    this.paintSelected();
	}
	paintSelected() {
	    this.view.find("a").removeClass(this._tree.activeClass);
	    var id = this._tree.selectedId;
	    if (id !== null && id !== undefined && id !== "") {
	        var elementNode = this.getElementNodeById(this._tree.selectedId);
	        if (elementNode) {
	            elementNode.addClass(this._tree.activeClass);
	        } else {
	            this._tree.selectedId = null;
	            this.triggerSeleccionChange();
	        }
	    }
	}
}

zRegisterDOMFactory("DIV", (e, container, basePath) => {
    if (e.data("z-tree")) {
        return new ZTree(e, container, basePath);
    }
    return null;
})