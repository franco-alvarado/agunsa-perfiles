class ZTable extends ZComponent {
    constructor(e, container, basePath) {
        super(e, container, basePath);
        this.build(e);
    }
    build() {
        this.rows = [];
        this.cols = [];
        this.hiddenCols = {};
	    this.editableCols = {};
        this.clickableCols = {};
        this.cellClasses = {};
        var thisComponent = this;
        this.editColHeaderClass = this.view.data("z-edit-header-class")?this.view.data("z-edit-header-class"):null; 
        this.editColCellClass = this.view.data("z-edit-cell-class")?this.view.data("z-edit-cell-class"):null; 
        this.view.find("th").each(function() {
            var th = $(this);
            if (th.data("z-col")) {
                thisComponent.cols.push(th.data("z-col"));
                if (th.data("z-editable")) thisComponent.editableCols[thisComponent.cols.length - 1] = true;
                if (th.data("z-clickable")) thisComponent.clickableCols[thisComponent.cols.length - 1] = true;
                if (th.data("z-cell-class")) thisComponent.cellClasses[thisComponent.cols.length - 1] = th.data("z-cell-class");
            } else {
                console.log("th", th);
                console.error("No data-z-col in <th> for table '" + thisComponent.view.prop("id") + "'");
            }
        });
        if (this.view.data("z-edit")) {
            this.cols.push("-edit-");
            this.view.find("thead").find("tr").append("<th class='text-right " + (this.editColHeaderClass?this.editColHeaderClass:"") + "'></th>");            
        }        
        if (this.getPagerComponent()) {
            var paginator = this.getPagerComponent();
            this.pagination = paginator.data("z-pagination")?paginator.data("z-pagination"):"local";
            if (this.pagination != "local" && this.pagination != "server") $.error("data-z-pagination in " + paginator.prop("id") + " must be 'local' or 'server'");
            var nRows = parseInt(paginator.data("z-n-rows"));
            nRows = isNaN(nRows)?20:nRows;
            var nPages = parseInt(paginator.data("z-n-pages"));
            nPages = isNaN(nPages)?10:nPages;
            this.pagNRows = nRows;
            this.pagNPages = nPages;
        } else {
            this.pagination = false;
        }   
        var selectableRowClass = this.view.data("z-selectable-row-class");
        if (!selectableRowClass) this.selectableRowClass = false;
        else this.selectableRowClass = selectableRowClass;
        this.selectedRowIndex = -1; 
    }
    getDetailsComponent() {
        var id = this.view.data("z-page-details");
		if (id == null) return null;
		return this.container.view.find("#" + id);
    }
    getPagerComponent() {
		var id = this.view.data("z-pager");
		if (id == null) return null;
		return this.container.view.find("#" + id);
    }
    clearTable() {
		this.view.find("tbody").empty();
		if (this.getDetailsComponent()) this.getDetailsComponent().html("");
		if (this.getPagerComponent()) {
			this.getPagerComponent().html("");
			this.getPagerComponent().hide();
		}
    }
    setWorking() {
		if (this.getDetailsComponent()) {
			this.getDetailsComponent().html("<i class='fas fa-spinner fa-spin fa-2x'></i>");
		}
    }
    refresh(keepSelection, onReady) {
		this.rows = [];		
		this.clearTable();
		this.setWorking();
		this.nRows = 0;
		this.nPages = 0;
		if (!keepSelection) {
			this.currentPage = 0;
			this.startPage = 0;
			this.selectedRowIndex = -1;
		}
		if (!this.pagination || this.pagination == "local") {
			this.triggerEvent("getRows", rows => {
				this.rows = rows;
				if (!rows || !rows.length) {
					this.nPages = 0;
					this.nRows = 0;
					this.currentPage = 0;
				} else {
					this.nRows = rows.length;
					if (this.pagination) {
						var nPages = rows.length / this.pagNRows;
						if (parseInt(nPages) != nPages) nPages = parseInt(nPages) + 1;
						this.nPages = nPages;
						if (this.currentPage > this.nPages  -1) this.currentPage = this.nPages - 1;
						if (this.startPage > this.nPages  -1) this.startPage = this.nPages - 1;
					}
				}
				this.paint();
				if (onReady) onReady();
			});
		} else {
			this.triggerEvent("countRows", n => {
				this.nRows = n;
				var nPages = n / this.pagNRows;
				if (parseInt(nPages) != nPages) nPages = parseInt(nPages) + 1;
				this.nPages = nPages;
				if (this.currentPage > this.nPages  -1) this.currentPage = this.nPages - 1;
				if (this.startPage > this.nPages  -1) this.startPage = this.nPages - 1;
				this.refreshPage(onReady);
			});
		}		
    }
    update() {
		this.refresh(true);
    }
    refreshPage(onReady) {
		this.setWorking();
		if (!this.nRows) {
			this.paint();
			if (onReady) onReady();
			return;
		}
		var startRow = this.currentPage * this.pagNRows;
		var count = this.pagNRows;
		if (startRow + count > this.nRows) count = this.nRows - startRow;
		this.triggerEvent("getPage", [startRow, count, rows => {
			this.rows = rows;
			this.paint();
			if (onReady) onReady();
		}]);
    }
    updateRow(rowIndex, row) {
		this.rows[rowIndex] = row;
		this.clearTable();
		this.paint();
    }
    updateAllRows(rows) {
	    this.rows = rows;
	    this.clearTable();
	    this.paint();
    }
    deleteRow(rowIndex) {
		this.rows.splice(rowIndex, 1);
		this.nRows = this.rows.length;
		if (this.pagination) {
			var rows = this.rows;
			if (!rows || !rows.length) {
				this.nPages = 0;
				this.currentPage = 0;
				this.startPage = 0;
				this.selectedRowIndex = -1;
			} else {
				var nPages = rows.length / this.pagNRows;
				if (parseInt(nPages) != nPages) nPages = parseInt(nPages) + 1;
				this.nPages = nPages;
				if (this.currentPage > this.nPages  -1) this.currentPage = this.nPages - 1;
				if (this.startPage > this.nPages  -1) this.startPage = this.nPages - 1;
				if (this.selectedRowIndex > this.nRows - 1) this.selectedRowIndex--;
			}
		}
		this.clearTable();
		this.paint();
    }
    getSelectedRowIndex() {
		return this.selectedRowIndex;
    }
    getSelectedRow() {
		var row = null;
		if (this.selectedRowIndex < 0 || this.selectedRowIndex > (this.nRows - 1)) return null;
		if (!this.pagination || this.pagination == "local") {
			row = this.rows[this.selectedRowIndex];
		} else {
			if (this.selectedRowIndex >= this.pagNRows * this.currentPage && this.selectedRowIndex < this.pagNRows * (this.currentPage + 1)) {
				row = this.rows[this.selectedRowIndex - this.pagNRows * this.currentPage];
			}
		}
		return row;
    }
    setSelectedRowIndex(rowIndex, fireEvent) {
		if (this.selectedRowIndex >= 0) {
			this.view.find("#r_" + this.selectedRowIndex).removeClass(this.selectableRowClass);
		}
		if (rowIndex >= 0 && rowIndex <= (this.nRows - 1)) {
			this.selectedRowIndex = rowIndex;
			this.view.find("#r_" + this.selectedRowIndex).addClass(this.selectableRowClass);
			if (fireEvent) {
				var row = null;
				if (!this.pagination || this.pagination == "local") {
					row = this.rows[this.selectedRowIndex];
				} else {
					if (this.selectedRowIndex >= this.pagNRows * this.currentPage && this.selectedRowIndex < this.pagNRows * (this.currentPage + 1)) {
						row = this.rows[this.selectedRowIndex - this.pagNRows * this.currentPage];
					}
				}
				this.triggerEvent("rowSelected", [this.selectedRowIndex, row]);
			}
		} else {
			$.error("Invalid rowIndex " + rowIndex + "/" + this.nRows);
		}
    }
    getRowCount() {
		return this.nRows;
    }
    hideColumn(name) {
	    this.hiddenCols[name] = true;
	    this.paint();
    }
    showColumn(name) {
	    this.hiddenCols[name] = false;
	    this.paint();
    }
    paint() {
	    if (!this.rows) return;
		var html = "";
		var startRow = 0;
		var endRow = this.rows.length;
		if (this.pagination == "local") {
			startRow = this.currentPage * this.pagNRows;
			endRow = startRow + this.pagNRows;
			if (endRow > this.rows.length) endRow = this.rows.length;
        }
        var thisComponent = this;
	    // Mostrar esconder columnas en header
		$.each(this.view.find("th"), function (i, th) {
		    var colName = $(th).data("z-col");
		    if (colName) {
		        if (thisComponent.hiddenCols[colName]) $(th).hide();
		        else $(th).show();
		    }
		});

		if (startRow < this.rows.length) {
			for (var i=startRow; i<endRow; i++) {
				var row = this.rows[i];
				html += "<tr id='r_" + i + "' data-index='" + i + "' " + (row._rowClass?"class='" + row._rowClass + "'":"") + ">";
				$.each(this.cols, function (j, col) {
				    if (!thisComponent.hiddenCols[col]) {
				        if (col == "-edit-") {
							html += "<td class='text-right " + (thisComponent.editColCellClass?thisComponent.editColCellClass:"") + "'>";
							html += "<button class='editador btn btn-info btn-round px-2 py-1' data-index='" + i + "' style='cursor: pointer;'><i class='fas fa-edit'></i></button>";
							html += "<button class='eliminador btn btn-danger btn-round px-2 py-1' data-index='" + i + "' style='cursor: pointer;'><i class='fas fa-trash-alt'></i></button>";

				            var extra = row._extraEditControls;
				            if (extra) {
				                $.each(extra, function (k, c) {
									html += "<button class='extra-edit-control btn btn-info btn-round px-2 py-1' data-index='" + i + "' data-name='" + c.name + "' style='cursor: pointer;'><i class='" + c.icon + " ' ></i></button>";
				                });
				            }
				            html += "</td>";
				        } else {
				            var val = row[col] ? row[col] : "";
				            var cellClass = thisComponent.cellClasses[j];
				            if (thisComponent.editableCols[j]) {
				                val = "<a href='#' data-index='" + i + "' class='editador' style='cursor: pointer;'>" + val + "</a>";
				            } else if (thisComponent.clickableCols[j]) {
				                val = "<a href='#' data-index='" + i + "' data-col='" + col + "' class='clickador' style='cursor: pointer;'>" + val + "</a>";
				            }
				            html += "<td" + (cellClass ? " class='" + cellClass + "'" : "") + ">" + val + " </td>";
				        }
				    }
				});
				html += "</tr>";
			}
		}
		this.view.find("tbody").html(html);
		this.view.find("tbody").find(".editador").click(function(e) {
			e.preventDefault();
			var idx = parseInt($(this).data("index"));
			var row = thisComponent.rows[idx];
			thisComponent.triggerEvent("editRequest", [idx, row]);
		});
		this.view.find("tbody").find(".clickador").click(function(e) {
			e.preventDefault();
			var idx = parseInt($(this).data("index"));
			var col = $(this).data("col");
			var row = thisComponent.rows[idx];
			thisComponent.triggerEvent("columnClick", [idx, col, row]);
		});
		if (this.selectableRowClass) {
			this.view.find("tbody").find("tr").click(function() {
				var idx = parseInt($(this).data("index"));
				thisComponent.setSelectedRowIndex(idx, true);
			});
		}
		this.view.find("tbody").find(".extra-edit-control").click(function(e) {
			e.preventDefault();
			var idx = parseInt($(this).data("index"));
			var row = thisComponent.rows[idx];
			var controlName = $(this).data("name");
			thisComponent.triggerEvent("extraEditControlClick", [idx, controlName, row]);
		});
		this.view.find("tbody").find(".eliminador").click(function(e) {
			e.preventDefault();
			var idx = parseInt($(this).data("index"));
			var row = thisComponent.rows[idx];
			thisComponent.triggerEvent("deleteRequest", [idx, row]);
		});
		if (this.selectableRowClass && this.selectedRowIndex >= 0) {
			this.setSelectedRowIndex(this.selectedRowIndex, false);
		}
		// Refrescar detalles
		if (this.getDetailsComponent()) {
			if (!this.pagination) {
				if (this.nRows == 1) {
					this.getDetailsComponent().text("Una fila encontrada");
				} else if (this.nRows > 1) {
					this.getDetailsComponent().text(this.nRows + " filas encontradas");
				} else {
					this.getDetailsComponent().text("No se encontraron resultados");
				}
			} else {
				if (this.nPages <= 1) {
					if (this.nRows == 1) {
						this.getDetailsComponent().text("Una fila encontrada");
					} else if (this.nRows > 1) {
						this.getDetailsComponent().text(this.nRows + " filas encontradas");
					} else {
						this.getDetailsComponent().text("No se encontraron resultados");
					}
				} else {
					var msg = "Página " + (this.currentPage + 1) + "/" + this.nPages;
					if (this.pagination == "local") {
						msg += ", mostrando filas " + (startRow + 1) + " - " + endRow + " de " + this.nRows;
					} else {
					    var nn = ((this.currentPage + 1) * this.pagNRows);
					    if (nn > this.nRows) nn = this.nRows;
						msg += ", mostrando filas " + (this.currentPage * this.pagNRows + 1) + " - " + nn + " de " + this.nRows;
					}
					this.getDetailsComponent().text(msg);					
				}
			}
		}
		// Refrescar paginador
		if (this.pagination) {
			var pager = this.getPagerComponent();
			if (this.nPages <= 1) pager.hide();
			else {
				var page0 = this.startPage;
				var page1 = this.startPage + this.pagNPages;
				if (page1 > this.nPages) page1 = this.nPages;
				var prior = page0 > 0;
				var next = page1 < this.nPages;
				var html = "";
				html += "<li class='page-item " + (prior?"":"disabled") + "' >";
				html += "  <a id='pprev' class='page-link' href='#' aria-label='Anterior'>";
				html += "    <span aria-hidden='true'>&laquo;</span>";
				html += "    <span class='sr-only'>Anterior</span>";
				html += "  </a>";
				html += "</li>";
				for (var pag=page0; pag < page1; pag++) {
					html += "<li class='page-item";
					if (pag == this.currentPage) html += " active";
					html += "'><a href='#' class='page-link inter-page' data-page='" + pag + "'>" + (pag + 1) + "</a></li>";
				}
				html += "<li class='page-item " + (next?"":"disabled") + "' >";
				html += "  <a id='pnext' class='page-link' href='#' aria-label='Siguiente' >";
				html += "    <span aria-hidden='true'>&raquo;</span>";
				html += "    <span class='sr-only'>Siguiente</span>";
				html += "  </a>";
				html += "</li>";
				pager.hide();
				pager.html(html);
				pager.show();
				if (prior) {
					pager.find("#pprev").click(function(e) {
						e.preventDefault();
						thisComponent.startPage -= thisComponent.pagNPages;
						if (thisComponent.startPage < 0) thisComponent.startPage = 0;
						thisComponent.currentPage -= thisComponent.pagNPages;
						if (thisComponent.currentPage < 0) thisComponent.currentPage = 0;
						if (thisComponent.pagination == "local") thisComponent.paint();
						else thisComponent.refreshPage();
					});
				}
				if (next) {
					pager.find("#pnext").click(function(e) {
						e.preventDefault();
						thisComponent.startPage += thisComponent.pagNPages;
						if (thisComponent.startPage > thisComponent.nPages - 1) thisComponent.startPage = thisComponent.nPages - 1;
						thisComponent.currentPage += thisComponent.pagNPages;						
						if (thisComponent.currentPage > thisComponent.nPages - 1) thisComponent.currentPage = thisComponent.nPages - 1;
						if (thisComponent.pagination == "local") thisComponent.paint();
						else thisComponent.refreshPage();
					});
				}
				pager.find(".inter-page").click(function(e) {
					e.preventDefault();
					thisComponent.currentPage = parseInt($(this).data("page"));
					if (thisComponent.pagination == "local") thisComponent.paint();
					else thisComponent.refreshPage();
				});
			}
        }
        this.triggerEvent("afterPaint");
	}
}

zRegisterDOMFactory("TABLE", (e, container, basePath) => {
    if (e.data("z-table")) {
        return new ZTable(e, container, basePath);
    }
    return null;
})