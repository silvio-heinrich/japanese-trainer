// JavaScript Document

function Table() {
	this.gen = function(container, cellStyle, w, h, cellData) {
		var div       = $(container);
		var firstRow  = $('<div></div>');
		var cellBegin = '<div class="' + cellStyle + '">';
		var cellEnd   = '</div>'
		
		for(var i=0; i<h; i++) {
			var row = $('<div></div>');
			
			for(var j=0; j<w; j++) {
				row.append(cellBegin + cellData(i, j) + cellEnd);
			}
			row.append('<div class="clear"></div>');
			div.append(row);
		}
	}
}