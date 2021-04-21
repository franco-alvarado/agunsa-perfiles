class CustomController extends ZCustomComponent {
    onThis_init() {
        this.edCars.setRows(getCars());
            
    }
    
    onCmdOk_click() {
        this.output.text = "The value of select is : " + this.edCars.getSelectedRow().name;         
    }
    
}
function getCars() {
    return [{code: "1", name:"Felipe", email:"felipe@zonar.cl"},{code: "2", name:"Juan", email:"zonar@zonar.cl"},{code:"3",name:"Pedro", email:"pedro@zonar.cl"}]
}

  
