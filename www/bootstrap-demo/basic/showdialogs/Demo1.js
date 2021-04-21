class CustomController extends ZCustomComponent {
    onThis_init() {
      
    }
    
    onCmdSuccess_click(){
        this.showDialog("./Dialog", {message:"I am a Success Dialog!", op:"success"});
        
    }

    onCmdDanger_click(){
        this.showDialog("./Dialog", {message:"I am a Danger Dialog!", op:"danger"})
    }

    onCmdInfo_click(){
        this.showDialog("./Dialog", {message:"I am an Informative Dialog!", op:"info"})
    }


    
}

