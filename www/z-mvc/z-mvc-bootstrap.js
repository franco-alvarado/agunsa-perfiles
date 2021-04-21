zShowDialog = (url, options, component, okCallback, cancelCallback) => {    
    let cnt = $("body").find("#dialogs-container");
    if (!cnt || !cnt.length) {
        $("body").append("<div id='dialogs-container'></div>");
        cnt = $("body").find("#dialogs-container");
    }
    let dialogUrl = zComposeURL(url, component.basePath);
    let p = dialogUrl.lastIndexOf("/");
    let dialogId = p >= 0?dialogUrl.substring(p+1):dialogUrl;
    let newBasePath = p >= 0?dialogUrl.substring(0,p):"";
    zLoadComponent(dialogUrl)
        .then(({html, controllerClass}) => {                
            let subview = $(html);
            if (!subview.prop("id")) subview.prop("id", dialogId);
            dialogId = subview.prop("id");
            cnt.append(subview);
            let dialogElement = cnt.find("#" + dialogId);                
            var exports = {};
            try {
                eval(controllerClass + "\nexports.customController = CustomController;");
            } catch(error) {
                console.error(error);
                throw(error);
            }
            if (!exports.customController) {
                throw("Declared class name in controller must be 'CustomController'");
            }
            let controller = new exports.customController(dialogElement, null, newBasePath);
            controller._isDialog = true;
            controller.view.modal({
                show: false,
                keyboard: true,
                backdrop: "static"
            });
            controller.view.modal("handleUpdate");
            controller.view.on("hidden.bs.modal", () => {                
                if (controller._closeFromController) {
                    controller.deactivate();
                    return;
                }
                if (controller._cancelCallback) controller._cancelCallback();
                controller.deactivate();
                controller.view.remove();
            });
            controller._okCallback = okCallback;
            controller._cancelCallback = cancelCallback;
            controller.init(options)
                .then(() => {
                    controller.view.modal("show");
                    controller.activate()
                })
                .catch(error => {throw(error)});
        })
        .catch(error => {throw(error)});    
}
zCloseDialog = (component, result) => {
    if (!component._isDialog) throw "Component is not a dialog";    
    component._closeFromController = true;
    component.view.on("hidden.bs.modal", () => {
        if (component._okCallback) component._okCallback(result);
        component.view.remove();
    });
    component.view.modal("hide");
}
zCancelDialog = (component) => {
    if (!component._isDialog) throw "Component " + component.id + " is not a dialog";    
    component._closeFromController = true;
    component.view.on("hidden.bs.modal", () => {
        if (component._cancelCallback) component._cancelCallback();
        component.view.remove();
    });
    component.view.modal("hide");
}

class BootstrapTabs extends ZComponent {
    get selectedId() {return this._selectedId}
    set selectedId(id) {
        let a = this.view.find("a[href='#" + id + "']");
        if (!a || !a.length) throw "No tab found with id '" + id + "'";
        $(a).tab("show");
        this._selectedId = id;
    }
    get selected() {return this.container[this._selectedId]}
    set selected(cmp) {this.selectedId = cmp.id}
    onThis_init() {
        // find initial active tab
        let selected = this.view.find("a.active");
        if (!selected || !selected.length) throw "Can't find selected tab";        
        this._selectedId = this.getTabId(selected.prop("href"));
        this.view.find("a").on("shown.bs.tab", e => {
            this._selectedId = this.getTabId($(e.target).prop("href"));
            this.triggerEvent("change", [this._selectedId]);
        });
    }
    
    getTabId(href) {
        let p = href.indexOf("#");
        if (p >= 0) return href.substring(p+1);
        return null;
    }
}

zRegisterDOMFactory("UL", (e, container, basePath) => {
    if (e.hasClass("nav") && e.hasClass("nav-tabs")) {
        if (e.find("[data-toggle='tab']").length > 0) {
            return new BootstrapTabs(e, container, basePath);
        }
    }
});

class BootstrapInput extends ZInput {
    setValidation(v) {
        this.view.removeClass("is-invalid is-valid");
        this.view.addClass(v?"is-valid":"is-invalid");
    }
}

zRegisterDOMFactory("INPUT", (e, container, basePath) => {
    return new BootstrapInput(e, container, basePath);
});