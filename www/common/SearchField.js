class CustomController extends ZCustomComponent {
    get val() {return this.edSearch.val}
    set val(txt) {this.edSearch.val = txt}
    onEdSearch_change() {
        let v = this.edSearch.val;
        this.triggerEvent("change", v);
        if (v) {
            this.iconSearch.view.removeClass("fa-search").addClass("fa-times");
        } else {
            this.iconSearch.view.removeClass("fa-times").addClass("fa-search");
        }
    }
    clear() {
        this.edSearch.val = "";
        this.iconSearch.view.removeClass("fa-times").addClass("fa-search");
        this.triggerEvent("change", "");
    }
    onIconSearch_click() {
        if (this.edSearch.val) {
            this.clear();
        }
    }    
}