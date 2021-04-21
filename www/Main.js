window.app = {};

class CustomController extends ZCustomComponent {
    onThis_init() {      
        Highcharts.setOptions({
            lang: {
                thousandsSep: '.',
                decimalPoint: ',',
                months: [
                    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
                ],
                shortMonths:["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
                weekdays: [
                    'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
                ],
                shortWeekdays:["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"],
                drillUpText:"Volver",
                loading:"Cargando ...",
                noData:"No hay datos"
            },
            time:{
                useUTC:false
            }
        });  
        $(window).resize(() => {
	        if (window.app.resize) window.app.resize();
        });
        let url = new URL(window.location.href);
        let tokenRecuperacion = url.searchParams.get("recupera");
        if (tokenRecuperacion) {
            this.mainLoader.load("login/PanelRecupera", {tokenRecuperacion:tokenRecuperacion});
        } else {
            this.mainLoader.load("login/Login");
        }
    }
    onMainLoader_login(sesion) {
        console.log("sesion", sesion);
        sesion.tienePrivilegio = codigo => sesion.privilegios.indexOf(codigo) >= 0;
        window.app.sesion = sesion;
        window.zSecurityToken = sesion.token;
        this.mainLoader.load("main/MainMenu");
        
    }
    async onMainLoader_logout() {
        delete window.app.sesion;
        await zPost("logout.seg", {});
        window.zSecurityToken = null;
        this.mainLoader.load("login/Login");
    }
}