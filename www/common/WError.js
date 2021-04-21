class CustomController extends ZCustomComponent {
	onThis_init(options) {		
		if (options.title) this.title.view.text(options.title);
		this.msg.view.html(options.message);
		this.view.on("keyup", e => {
            if (e.keyCode == 13) this.cmdClose.view.trigger("click");
        })
		this.view.bootstrapMaterialDesign();
	}
}