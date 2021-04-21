var zDefaultComponentFactory = (domElement, container, basePath) => new ZComponent(domElement, container, basePath);
var zDOMFactories = {};

function zRegisterDOMFactory(tagName, factory) {
    let factories = zDOMFactories[tagName];
    if (!factories) {
        factories = [];
        zDOMFactories[tagName] = factories;
    }
    factories.push(factory);
}

function zFactory(domElement, container, basePath) {
    if (!container && !$(domElement).prop("id")) $(domElement).prop("id", "zRoot");
    if (domElement.data("z-component")) return embeddZComponent(domElement, container, basePath);
    let cmp = null;
    let factories = zDOMFactories[domElement.prop("tagName")];
    if (factories && factories.length) {
        let i = factories.length - 1;
        while (!cmp && i >= 0) {
            cmp = factories[i--](domElement, container, basePath);                        
        }
    }
    if (!cmp) cmp = zDefaultComponentFactory(domElement, container, basePath);
    if (cmp instanceof Promise) return cmp;
    else return new Promise(onOk => onOk(cmp));    
}

// Function replacement for jquery attr to retrieve attr object
// https://stackoverflow.com/questions/14645806/get-all-attributes-of-an-element-using-jquery
(function(old) {
    $.fn.attr = function() {
      if(arguments.length === 0) {
        if(this.length === 0) {
          return null;
        }
  
        var obj = {};
        $.each(this[0].attributes, function() {
          if(this.specified) {
            obj[this.name] = this.value;
          }
        });
        return obj;
      }
  
      return old.apply(this, arguments);
    };
  })($.fn.attr);

function embeddZComponent(domElement, container, basePath) {    
    return new Promise((onOk, onError) => {
        let url = domElement.data("z-component");
        let finalUrl = zComposeURL(url, basePath);
        let p = finalUrl.lastIndexOf("/");
        let newBasePath = p >= 0?finalUrl.substring(0,p):"";
        zLoadComponent(finalUrl)
            .then(({html, controllerClass}) => { 
                // Copy attributes (including classes) declared in referencer to referenced
                let attrs = domElement.attr();
                if (!attrs.id) {
                    onError("Embedded data-z-component should have an id");
                }
                newDomElement = $(html);                
                domElement.replaceWith(newDomElement);
                Object.keys(attrs).forEach(name => {
                    if (name == "class") {
                        attrs.class.split(' ').forEach(c => newDomElement.addClass(c));
                    } else if (name != "data-z-component") {
                        newDomElement.attr(name, attrs[name]);
                    }
                });
                var exports = {};
                try {
                    eval(controllerClass + "\nexports.customController = CustomController;");
                } catch(error) {
                    console.error(error);
                    onError(error);
                    return;
                }
                if (!exports.customController) {
                    onError("Declared class name in controller must be 'CustomController'");
                    return;
                }
                let customComponent = new exports.customController(newDomElement, container, newBasePath);
                onOk(customComponent);
            })
            .catch(error => onError(error));
    })
}

function zComposeURL(url, basePath) {    
    if (url.startsWith("./")) return basePath + url.substring(1);
    else return url;    
}

function zLoadComponent(url) {
    
    return new Promise((resolve, reject) => {
        let promises = [];
        promises.push(new Promise((onOk, onError) => {
            $.ajax({
                url: url + ".html",
                data: null,
                success: html => onOk(html),
                error: (xhr, errorText, errorThrown) => onError(errorThrown),
                cache: false,
                dataType: "html"
            });
        }));
        promises.push(new Promise((onOk, onError) => {
            $.ajax({
                url: url + ".js",
                data: null,
                success: controllerClass => onOk(controllerClass),
                error: (xhr, errorText, errorThrown) => onError(errorThrown),
                //dataType: "script"
                dataType:"text"
            });
        }));
        Promise.all(promises)
            .then(([html, controllerClass]) => {
                resolve({html:html, controllerClass:controllerClass});
            })
            .catch(error => reject(error));
    });
}

function zInit(domElement, options) {
    return new Promise((onOk, onError) => {
        if (typeof domElement == "string") domElement = $(domElement);
        zFactory(domElement)
            .then (cmp => {
                let ret = cmp.init(options);
                // if ret is a Promise ... wait and return
                if (ret instanceof Promise) {
                    ret
                        .then(() => {
                            cmp.activate()
                                .then(() => onOk(cmp))
                                .catch(error => onError(error)); 
                        })
                        .catch(error => onError(error))
                } else {
                    cmp.activate()
                        .then(() => onOk(cmp))
                        .catch(error => onError(error));                    
                }
            })
            .catch(error => onError(error))
    })
}

// Dialog handlers must be overwritten for each view framework (bootstrap, material, jquery-ui, etc...)
var zShowDialog = (url, options, component, okCallback, cancelCallback) => {
    throw "showDialog not overwritten!!";
}
var zCloseDialog = (component, result) => {
    throw "zCloseDialog not overwritten!!";
}
var zCancelDialog = (component) => {
    throw "zCloseDialog not overwritten!!";
}

class ZComponent {
    constructor(domElement, container, basePath) {
        this._view = $(domElement);
        this._container = container;
        this._components = {};
        this._basePath = basePath?basePath:"";
        if (domElement.data("z-clickable")) {
            domElement.click(() => this.triggerEvent("click"));
        }
    }
    get id() {return this._view.prop("id")}
    get view() {return this._view}
    get dynamicView() {return this.container?this.container.view.find("#" + this.id):$("#" + this.id)}
    get container() {return this._container}
    get basePath() {return this._basePath}
    get isCompound() {return false}

    // Common Properties
    get text() {return this.view.text()}
    set text(txt) {this.view.text(txt)}
    get html() {return this.view.html()}
    set html(txt) {this.view.html(txt)}

    describe(indent) {
        if (!indent) indent = "";
        console.log(indent + this.id);
    }
    
    init(options) {
        return new Promise((onOk, onError) => {
            let ret = this.processEvent(this, "init", [options]);
            if (ret && ret instanceof Promise) {
                ret.then(() => onOk(this)).catch(error => onError(error))
            } else {
                onOk(this);
            }
        });
    }
    activate() {
        return new Promise((onOk, onError) => {
            let ret = this.processEvent(this, "activate");
            if (ret && ret instanceof Promise) {
                ret.then(() => onOk(this)).catch(error => onError(error))
            } else {
                onOk(this);
            }
        });
    }
    deactivate() {
        return new Promise((onOk, onError) => {
            let ret = this.processEvent(this, "deactivate");
            if (ret && ret instanceof Promise) {
                ret.then(() => onOk(this)).catch(error => onError(error))
            } else {
                onOk(this);
            }
        });
    }
    
    isEventHandled(component, eventName) {
        let cmpName = (component === this?"this":component.id);
        let methodName = "on" + cmpName.substring(0,1).toUpperCase() + cmpName.substring(1) + "_" + eventName;
        let m = this[methodName];
        return m && typeof m == "function";
    }
    processEvent(component, eventName, args) {
        let cmpName = (component === this?"this":component.id);
        let methodName = "on" + cmpName.substring(0,1).toUpperCase() + cmpName.substring(1) + "_" + eventName;
        let m = this[methodName];
        if (m && typeof m == "function") {
            if (!args) args = [];
            if (args && !Array.isArray(args)) args = [args];
            return m.apply(this, args);
        }
    }
    triggerEvent(eventName, args) {
        if (this.container) return this.container.processEvent(this, eventName, args);
    }
    
    // Common methods
    show() {this.view.show()}
    hide() {this.view.hide()}
    enable() {this.view.prop("disabled", null)}
    disable() {this.view.prop("disabled", "disabled")}
    isEnabled() {return this.prop("disabled")?false:true}
    setEnabled(e) {if (e) this.enable(); else this.disable()}
    showDialog(url, options, okCallback, cancelCallback) {zShowDialog(url, options, this, okCallback, cancelCallback)} 
    close(result) {zCloseDialog(this, result)}
    cancel() {zCancelDialog(this)}
    css(opts) {this.view.css(opts)}
}

class ZInput extends ZComponent {
    constructor(domElement, container, basePath) {
        super(domElement, container, basePath);
        this._lastValue = null;
        this.view.unbind("click");
        this.view.click(() => this.callChange());
        if (domElement.data("z-autochange-delay")) {
            this._autoChangeDelay = parseInt(domElement.data("z-autochange-delay"));
            domElement.keyup(() => this.callChange());
        } else {
            this._autoChangeDelay = 100;
            domElement.change(() => this.callChange());
        }

        if (domElement.data("z-datepicker")) {
			domElement.datepicker({language:"es", format:"dd/M/yyyy", autoclose:true});
			domElement.datepicker("setDate", new Date());
            
			domElement.show = function() {domElement.datepicker("show");};
		}
    }
    get val() {return this.view.val()}
    set val(v) {this.view.val(v); this.view.trigger("change")}
    get checked() {return this.view.prop("checked")?true:false}
    set checked(c) {this.view.prop("checked", c)}    
    get autoChangeDelay() {return this._autoChangeDelay}
 
    getDate () {
        var dt = new Date(this.view.datepicker("getDate").getTime());
        dt.setHours(0);
        dt.setMinutes(0);
        dt.setSeconds(0);
        dt.setMilliseconds(0);
        return dt;
    }

     setDate (d) {this.view.datepicker("setDate", d);}

    callChange() {
        if (this._autoChangeTimer) clearTimeout(this._autoChangeTimer);
        this._autoChangeTimer = setTimeout(() => {
            this._autoChangeTimer = null;
            this.triggerChange();
        }, this.autoChangeDelay)

    }

    
    triggerChange() {
        let type = this.view.prop("type");
        if (type == "checkbox") {
            this.triggerEvent("change");
        } else {
            let v = this.val;
            if (v != this._lastValue) this.triggerEvent("change");
            this._lastValue = v;
        }
    }


    
    focus() {this.view.focus()}    
}

class ZTextArea extends ZComponent {
    constructor(domElement, container, basePath) {
        super(domElement, container, basePath);
    }
    get val() {return this.view.val()}
    set val(v) {this.view.val(v); this.view.trigger("change")}
}

class ZButton extends ZComponent {
    constructor(domElement, container, basePath) {
        super(domElement, container, basePath);
        domElement.click(e => {
            if (container && container.isEventHandled(this, "click")) {
                this.triggerEvent("click")
                e.preventDefault();
            }
        });
    }
}

class ZSelect extends ZComponent {
    constructor(domElement, container, basePath) {
        super(domElement, container, basePath);
        domElement.change(() => this.triggerEvent("change"));
        this.idField = domElement.data("z-id-field");
        this.labelField = domElement.data("z-label-field");
        this.placeHolder = domElement.data("z-placeholder");
        this.placeHolderEnable = domElement.data("z-placeholder-enable");
        this._rows = null;
    }
    get val() {
        let idx = this.view.val();
        if (idx && idx >= 0) return this._rows[idx][this.idField];        
        else return null;
    }
    set val(v) {
        if (!v) this.view.val("");
        let idx = this._rows.findIndex(r => r[this.idField] == v);
        if (idx >= 0) this.view.val(idx);
        this.view.trigger("change")
    }    
    getRows() {return this._rows}
    setRows(rows, selectedId, optionsClasses) {
        this._rows = rows;        
        let html = rows.reduce((st, row, i) => {
            return st + "<option value='" + i + "' " + (selectedId !== undefined && row[this.idField] == selectedId?"selected":"") + (optionsClasses?" class='" + optionsClasses + "'":"") + ">" + row[this.labelField] + "</option>";
        }, this.placeHolder?"<option selected disabled>" + this.placeHolder + "</option>":"");
        this.view.html(html);
    }    
    getSelectedRow() {
        let idx = this.view.val();
        if (idx >= 0) return this._rows[idx];
        else return null;
    }
    getSelectedRowIndex() {
        let idx = this.view.val();
        if (idx >= 0) return idx;
        else return -1;
    }
}

class ZBasicSelect extends ZComponent {
    constructor(domElement, container, basePath) {
        super(domElement, container, basePath);
        domElement.change(() => this.triggerEvent("change"));
    }
    get val() {
        return this.view.val();
    }
    set val(v) {        
        this.view.val(v);
    }    
}

class ZCompoundComponent extends ZComponent {
    constructor(domElement, container, basePath) {
        super(domElement, container, basePath);
        this._components = {};
    }
    get isCompound() {return true}
    get components() {return this._components}
    get componentList() {return Object.keys(this._components).map(k => this._components[k])}
    describe(indent) {
        if (!indent) indent = "";
        super.describe(indent);
        this.componentList.forEach(c => c.describe(indent + "  "));
    }
    init(options) {
        return new Promise((onOk, onError) => {
            this.searchSubcomponents(this.view)
                .then(() => {
                    let promises = this.componentList.map(c => c.init());
                    Promise.all(promises)
                        .then(() => {
                            super.init(options)
                                .then(() => onOk(this))
                                .catch(error => onError(error));
                        })
                        .catch(error => onError(error));
                })
                .catch(error => onError(error));            
        });
    }
    activate() {
        return new Promise((onOk, onError) => {
            super.activate() 
                .then(() => {
                    let promises = [];
                    this.componentList.forEach(c => promises.push(c.activate()));
                    Promise.all(promises)
                        .then(() => onOk())
                        .catch(error => onError(error));
                })
                .catch(error => onError(error));
        })
    }
    deactivate() {
        return new Promise((onOk, onError) => {
            let promises = [];
            this.componentList.forEach(c => promises.push(c.deactivate()));
            Promise.all(promises)
                .then(() => {
                    super.deactivate() 
                        .then(() => onOk())
                        .catch(error => onError(error));
                    })
                .catch(error => onError(error));
        })
    }
    registerComponent(childComponent, replaceIfExists, forceName) {
        let name = forceName?forceName:childComponent.id;
        this._components[name] = childComponent;
        if (this[name] && !replaceIfExists) {
            this.describe();
            throw "Invalid subcomponent id:'" + name + "'. Already in use in component container '" + this.id + "'";
        }
        this[name] = childComponent;
    }
    cancelSubcomponentSearch() {
        this.view.zDontSearchSubcomponents = true;
    }
    removeAllComponents() {
        Object.keys(this._components).forEach(k => delete this[k]);
        this._components = {};
    }
    searchSubcomponents(fromElement) {
        if (fromElement.zDontSearchSubcomponents) return new Promise(onOk => onOk());
        return new Promise((onOk, onError) => {
            let children = $(fromElement).children();
            // search first in components with id, register them, and then sub-search if they are not compound
            let promises = [];
            for (let i=0; i<children.length; i++) {
                let $e = $(children[i]);                
                if ($e.prop("id")) {
                    promises.push(zFactory($e, this, this._basePath));
                } 
            }
            Promise.all(promises)
                .then(components => {
                    components.forEach(c => {
                        this.registerComponent(c)
                    })
                    let promises = [];
                    for (let i=0; i<children.length; i++) {
                        let $e = $(children[i]);
                        let id = $e.prop("id");
                        if (!id || !this.components[id].isCompound) {
                            promises.push(this.searchSubcomponents($e));
                        } 
                    }
                    Promise.all(promises)
                        .then(() => onOk(null))
                        .catch(error => onError(error));
                })
                .catch(error => onError(error))            
        });
    }
}

class ZCustomComponent extends ZCompoundComponent {
}

class ZAutoLoad extends ZCompoundComponent {
    constructor(domElement, container, basePath) {
        super(domElement, container, basePath);
        this.stack = [];
        domElement.html("<div id='" + this.id + "_cnt' style='overflow:hidden;'></div>");
    }
    _getContainer() {
        return this.view.find("#" + this.id + "_cnt");
    }
    get autoLoadURL() {return this.view.data("z-autoload")}
    get active() {
        let list = this.componentList;
        if (!list.length) return null;
        return list[0];
    }
    
    init(options) {        
        return new Promise((onOk, onError) => {
            this.loadCustomComponent(this.autoLoadURL)
                .then(customComponent => {
                    this.cancelSubcomponentSearch();                    
                    super.init(options)
                        .then(() => {onOk(this)})
                        .catch(error => onError(error));
                })
                .catch(error => onError(error));
        });
    }

    processEvent(component, eventName, args) {        
        if (component == this.active) return this.triggerEvent(eventName, args);
        else return super.processEvent(component, eventName, args);
    }
    load(url, options) {
        this.stack = [];
        this._getContainer().html("");
        return new Promise((onOk, onError) => {
            this.active.deactivate()
                .then(() => {
                    this.loadCustomComponent(url, options)
                    .then(customComponent => {                    
                        customComponent.init(options)
                            .then(() => {
                                customComponent.activate()
                                    .then(() => onOk(customComponent))
                                    .catch(error => onError(error));
                            })
                            .catch(error => onError(error));
                    })
                    .catch(error => onError(error));    
                })
                .catch(error => onError(error));
        });
    }
    loadCustomComponent(url) {
        return new Promise((onOk, onError) => {
            let finalUrl = zComposeURL(url, this._basePath);
            let p = finalUrl.lastIndexOf("/");
            let newBasePath = p >= 0?finalUrl.substring(0,p):"";
            zLoadComponent(finalUrl, this)
                .then(({html, controllerClass}) => {
                    this.removeAllComponents();
                    this._getContainer().html(html);
                    let subview = $(this._getContainer().children()[0]);
                    //if (!subview.prop("id")) subview.prop("id", this.id + "_active");
                    var exports = {};
                    try {
                        eval(controllerClass + "\nexports.customController = CustomController;");
                    } catch(error) {
                        console.error(error);
                        onError(error);
                        return;
                    }
                    if (!exports.customController) {
                        onError("Declared class name in controller must be 'CustomController'");
                        return;
                    }
                    let customComponent = new exports.customController(subview, this, newBasePath);
                    this.registerComponent(customComponent);
                    onOk(customComponent);
                })
                .catch(error => onError(error));
        })
    }
    push(url, options) {
        return new Promise((onOk, onError) => {
            this.active.deactivate()
                .then(() => {
                    let finalUrl = zComposeURL(url, this._basePath);
                    let p = finalUrl.lastIndexOf("/");
                    let newBasePath = p >= 0?finalUrl.substring(0,p):"";
                    let current = this.active;
                    this.stack.push({html:current.view, controller:current});
                    let oldView = current.view;
                    zLoadComponent(finalUrl, this)
                        .then(({html, controllerClass}) => {
                            let newView = $(html);
                            //if (!subview.prop("id")) subview.prop("id", this.id + "_active");
                            var exports = {};
                            try {
                                eval(controllerClass + "\nexports.customController = CustomController;");
                            } catch(error) {
                                console.error(error);
                                onError(error);
                                return;
                            }
                            if (!exports.customController) {
                                onError("Declared class name in controller must be 'CustomController'");
                                return;
                            }
                            this._getContainer().append(newView);
                            newView = $(this._getContainer().children()[this.stack.length]);
                            let customComponent = new exports.customController(newView, this, newBasePath);
                            this.removeAllComponents();
                            this.registerComponent(customComponent);
                            customComponent.init(options)
                                .then(() => {
                                    let width = oldView.width();
                                    let height = oldView.outerHeight(true);
                                    oldView.css({"margin-left":0, width:width});
                                    newView.css({"margin-top":-height, "margin-left": width, width:width});                                    
                                    oldView.animate({"margin-left":-width}, {duration:300});
                                    newView.animate({"margin-left":0}, {duration:300, complete:() => {                                        
                                        oldView.css({"margin-left":"", width:""});
                                        oldView.hide();                                            
                                        newView.css({"margin-left":"", "margin-top":"", width:""});
                                        customComponent.activate()
                                        .then(() => {
                                            onOk(customComponent);
                                        })
                                        .catch(error => onError(error));                                        
                                    }});                                    
                                })
                                .catch(error => onError(error));
                        })
                        .catch(error => onError(error));
                    })
                    .catch(error => onError(error));
        });
    }
    pop(steps = 1) {
        return new Promise((onOk, onError) => {
            this.active.deactivate()
                .then(() => {
                    while (steps > 1) {
                        $(this._getContainer().children()[this.stack.length]).remove();
                        this.stack.splice(this.stack.length - 1, 1);
                        steps--;
                    }
                    let popped = this.stack[this.stack.length - 1];
                    this.stack.splice(this.stack.length - 1, 1);
                    let oldView = this.active.view;
                    let newView = popped.html;
                    let width = oldView.width();
                    let height = newView.outerHeight(true);
                    newView.show();
                    newView.css({"margin-left":-width, width:width});
                    oldView.css({"margin-left":0, "margin-top":-height, width:width});

                    oldView.animate({"margin-left":width}, {duration:300});
                    newView.animate({"margin-left":0}, {duration:300, complete:() => {                                        
                        oldView.remove();
                        newView.css({"margin-left":"", "margin-top":"", width:""});
                        this.removeAllComponents();
                        this.registerComponent(popped.controller);
                        popped.controller.activate()
                        .then(() => {
                            onOk(popped.controller);
                        })
                        .catch(error => onError(error));                                        
                    }});
                })
                .catch(error => onError(error));
        })
    }
}


zRegisterDOMFactory("DIV", (e, container, basePath) => {
    if ($(e).data("z-autoload")) return new ZAutoLoad($(e), container, basePath);
    return null;
})
zRegisterDOMFactory("INPUT", (e, container, basePath) => {
    return new ZInput($(e), container, basePath);    
})
zRegisterDOMFactory("TEXTAREA", (e, container, basePath) => {
    return new ZTextArea($(e), container, basePath);    
})
zRegisterDOMFactory("BUTTON", (e, container, basePath) => {
    return new ZButton($(e), container, basePath);    
})
zRegisterDOMFactory("A", (e, container, basePath) => {
    return new ZButton($(e), container, basePath);    
})
zRegisterDOMFactory("SELECT", (e, container, basePath) => {
    if ($(e).data("z-id-field") && $(e).data("z-label-field")) return new ZSelect($(e), container, basePath);
    else return new ZBasicSelect($(e), container, basePath);
})