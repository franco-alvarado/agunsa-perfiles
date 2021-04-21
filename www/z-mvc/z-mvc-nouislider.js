class ZNOUISlider extends ZComponent {
    constructor(domElement, container, basePath) {
        super(domElement, container, basePath);
        this.min = parseInt(domElement.data("z-slider-min"));
        this.max = parseInt(domElement.data("z-slider-max"));
        this.step = parseInt(domElement.data("z-slider-step"));
        if (isNaN(this.step) || !this.step) this.step = 1;

        noUiSlider.create(this.view[0], {
            start:0,
            step:this.step,
            connect: [true,false],
            range:{min:this.min, max:this.max}
        });
        this.view[0].noUiSlider.on("slide", () => {this.triggerEvent("slide", [this.val])})
        this.view[0].noUiSlider.on("change", () => {this.triggerEvent("change", [this.val])})
    }
    set val(v) {
        this.view[0].noUiSlider.set(v);
    }
    get val() {
        return parseFloat(this.view[0].noUiSlider.get());
    }
}

zRegisterDOMFactory("DIV", (e, container, basePath) => {
    if (e.data("z-slider-min") !== undefined && e.data("z-slider-max") !== undefined) return new ZNOUISlider(e, container, basePath);
    return null;
})