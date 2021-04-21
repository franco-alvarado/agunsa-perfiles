class MDInput extends ZInput {
    clearValidation() {
        let p = this.view.parent();
        p.removeClass("has-danger has-success");
    }
    setValidationError() {
        this.view.parent().addClass("has-danger");
    }
    setValidationSucess() {
        this.view.parent().addClass("has-sucess");
    }
}
zRegisterDOMFactory("INPUT", (e, container, basePath) => {
    return new MDInput($(e), container, basePath);    
})
