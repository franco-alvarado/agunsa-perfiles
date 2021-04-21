class CustomController extends ZCustomComponent {
    onThis_init(){
                
        this.refresca();
       
    }
    
    refresca() {
        
        this.listaUsuarios.refresh();
    }

    prepararFila(row){
        delete row._rowClass;
        return row;
    }

    getDatos(){
        return [{
            id: "0",
            name:"name1",
            lastname: "lastname1",
            email: "email@ejemplo.cl"
        },
        {
            id: "1",
            name: "name1",
            lastname: "lastname2",
            email: "email2@ejemplo.com"
        }
        ];
    }

     onListaUsuarios_getRows(cb) {
        cb(this.getDatos());
     }
    
    onListaUsuarios_afterPaint() {
       
    }
    
  
    onListaUsuarios_deleteRequest(idx, row) {
        
    } 
    onListaUsuarios_editRequest(idx, row) {
        
        this.showDialog("./Edit",  {record:row}, usuario => {
            this.tablePrueba.updateRow(idx, this.prepararFila(usuario));
        });
    }

    
}