class ZBootstrapDatetimePicker extends ZComponent {
    constructor(domElement, container, basePath) {
        super(domElement, container, basePath);
        this.format = domElement.data("z-format");
        this.locale = domElement.data("z-locale");
        this.view.datetimepicker({
            locale:this.locale?this.locale:"es",
            format:this.format?this.format:"DD/MMM/YYYY",
            keepInvalid:false,
            icons: {
                time: "fa fa-clock-o",
                date: "fa fa-calendar",
                up: "fa fa-chevron-up",
                down: "fa fa-chevron-down",
                previous: 'fa fa-chevron-left',
                next: 'fa fa-chevron-right',
                today: 'fa fa-screenshot',
                clear: 'fa fa-trash',
                close: 'fa fa-remove'
            }
        });
        this.view.on("dp.change", () => {this.triggerEvent("change", [this.val])})
    }
    set val(dt) {
        this.view.data("DateTimePicker").date(dt);
    }
    get val() {
        let dt = this.view.data("DateTimePicker").date();
        return dt.toDate();
    }
}

zRegisterDOMFactory("INPUT", (e, container, basePath) => {
    if (e.hasClass("datetimepicker")) return new ZBootstrapDatetimePicker(e, container, basePath);
    return null;
})