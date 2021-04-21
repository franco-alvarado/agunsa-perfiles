class CustomController extends ZCustomComponent {
    validEmail(email) {
        var filter = /^\s*[\w\-\+_]+(\.[\w\-\+_]+)*\@[\w\-\+_]+\.[\w\-\+_]+(\.[\w\-\+_]+)*\s*$/;
        return String(email).search (filter) != -1;
    }
    onEdEmail_change() {
        this.edEmail.setValidation(this.validEmail(this.edEmail.val));
    }
    onEdAge_change() {
        let age = parseFloat(this.edAge.val);
        if (isNaN(age) || age != parseInt(age) || age < 0 || age > 150) {
            this.edAge.setValidation(false);
            return;
        }
        this.lblAgeValidationMessage.text = age < 18?"Minor":"Adult";
        this.edAge.setValidation(true);
    }
}