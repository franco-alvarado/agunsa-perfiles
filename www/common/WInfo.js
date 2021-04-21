class CustomController extends ZCustomComponent {
	onThis_init(options) {		
		if (options.title) this.title.view.text(options.title);
		this.msg.view.html(options.message);
		this.view.bootstrapMaterialDesign();
	}
}