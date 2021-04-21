class CustomController extends ZCustomComponent {   
    onThis_init() {
        this.view.bootstrapMaterialDesign();
        /*
        this.view.find(".nav-link").mouseenter(e => {
            let item = $(e.currentTarget);
            this.view.find(".nav-link").removeClass("border");
            item.addClass("border");
        });
        */
    } 
}