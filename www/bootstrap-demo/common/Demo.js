class CustomController extends ZCustomComponent {
    startDemo(previewPath, files, editorHeight=200) {
        this.thisId = "demo-" + parseInt(1000000 * Math.random());
        // dynamic monaco editor container id
        this.editorId = "ed-" + this.thisId;
        this.editorContainer.html = '<div id="' + this.editorId + '" class="ml-2 border rounded" style="height: 100%;"></div>'
        this.editorDiv = this.editorContainer.view.find("#" + this.editorId);
        this.editorDiv.css({height:editorHeight});
        // dynamic ids for tab. This component can be repeated in page
        this.preview.view.attr("href", "#previewTab-" + this.thisId);
        this.previewTab.view.attr("id", "previewTab-" + this.thisId);
        this.files.view.attr("href", "#filesTab-" + this.thisId);
        this.filesTab.view.attr("id", "filesTab-" + this.thisId);

        this.previewLoader.load(previewPath);
        require(['vs/editor/editor.main'], () => {
            this.editor = monaco.editor.create(this.editorDiv[0], {
                minimap: { enabled: false },
                automaticLayout: true,
                scrollBeyondLastLine: false,
                readOnly: true
            });
            this.edFile.setRows(files);
            this.onEdFile_change();
        });
    }
    onEdFile_change() {
        let file = this.edFile.getSelectedRow();
        let p = file.path.lastIndexOf(".");
        let type = file.path.substring(p+1);
        if (type == "js") type = "javascript";
        $.ajax({
            url: file.path,
            data: null,
            cache:false,
            success: content => {
                this.editor.setValue(content);
                monaco.editor.setModelLanguage(this.editor.getModel(), type);
            },
            error: (xhr, errorText, errorThrown) => console.error(errorThrown),
            dataType:"text"
        });
    }
}