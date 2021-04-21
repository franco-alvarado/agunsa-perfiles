class CustomController extends ZCustomComponent {
	onThis_init(options) {		
        if (options.title) this.title.view.text(options.title);
        if(options.op=="success"){
            this.alert.view.text("Successfull");
            this.title.view.text("Success Dialog");
            this.lblAccion.view.text("Successfull");
            // this.alert.className = "alert alert-success";
            document.getElementById("alert").className = "alert alert-success";
            
        }
        if(options.op == "danger"){
            this.alert.view.text("Fail");
            this.title.view.text("Danger Dialog");
            this.lblAccion.view.text("Fail");
            // this.alert.className = "alert alert-danger";
            document.getElementById("alert").className = "alert alert-danger";
            
        }
        if(options.op =="info"){
            this.alert.view.text("Information");
            this.title.view.text("Informative Dialog");
            this.lblAccion.view.text("Info");
            // this.alert.className = "alert alert-danger";
            document.getElementById("alert").className = "alert alert-info";
        } 
        
        this.msg.view.html(options.message);
        
        
    }
    
}