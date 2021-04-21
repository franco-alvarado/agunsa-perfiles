class ZFontAwsome extends ZComponent {
    startSpin() {this.dynamicView.addClass("fa-spin")}
    stopSpin() {this.dynamicView.removeClass("fa-spin")}
    isSpinning() {return this.dynamicView.hasClass("fa-spin")?true:false}
}

zRegisterDOMFactory("I", (e, container, basePath) => {
    if (e.hasClass("fa") || e.hasClass("fas") || e.hasClass("far")) return new ZFontAwsome(e, container, basePath);
    return null;
})