// JavaScript Document
// create offscreen canvas: var offscreen = document.createElement('canvas');

function Letter() {
	this.stroke     = [];
	this.strokeList = [];
	this.strokeRect = { x1:999999, y1:999999, x2:0, y2:0 };

	this.addPoint = function(px, py) {
		if(this.distance(px, py) > 2) {
			this.strokeRect.x1 = Math.min(this.strokeRect.x1, px);
			this.strokeRect.y1 = Math.min(this.strokeRect.y1, py);
			this.strokeRect.x2 = Math.max(this.strokeRect.x2, px);
			this.strokeRect.y2 = Math.max(this.strokeRect.y2, py);
			this.stroke.push({ x:px, y:py });
		}
	}
	this.end = function() {
		this.strokeList.push(this.stroke);
		this.stroke = [];
	}
	this.rect = function() {
		return {
			x: this.strokeRect.x1,
			y: this.strokeRect.y1,
			w: this.strokeRect.x2 - this.strokeRect.x1,
			h: this.strokeRect.y2 - this.strokeRect.y1,
		};
	}
	this.distance = function(px, py) {
		if(this.stroke.length > 0) {
			var last = this.stroke[this.stroke.length-1];
			var dx   = px - last.x;
			var dy   = py - last.y;
			return Math.sqrt(dx*dx + dy*dy);
		}
		return 999999;
	}
}

function Canvas(id) {
	var canvas      = document.getElementById(id);
	var context     = canvas.getContext("2d");
	var strokePos   = 1;
	var stroke      = null;
	var letter      = "";
	var letterData  = null;
	var letterRect  = null;
	var size        = 0;
	var x           = 0;
	var y           = 0;
	var letterFont  = "sans";

	this.reset = function(showLetter) {
		strokePos = 1;
		stroke    = new Letter();
		context.fillStyle = "#cccccc";
		context.fillRect(0, 0, canvas.width, canvas.height);
		context.fill();

		if(showLetter === true) {
			context.putImageData(letterData, x, y);
		}
		else {
			context.fillStyle = "white";
			context.fillRect(x, y, size, size);
			context.fill();
		}
	}
	this.init = function(l, font, showLetter) {
		letter     = l;
		letterFont = font;
		size       = Math.min(canvas.width, canvas.height);
		x          = parseInt((canvas.width-size) / 2);
		y          = parseInt((canvas.height-size) / 2);

		var data = this.genLetterData(size, letter, font, 0.95);
		letterData   = data.d;
		letterRect   = data.r;
		letterRect.x = letterRect.x + x;
		letterRect.y = letterRect.y + y;
		this.reset(showLetter);
	}
	this.genLetterData = function(s, l, font, scale) {
		var offscreenCanvas = document.createElement('canvas');
		offscreenCanvas.width  = s;
		offscreenCanvas.height = s;

		var ctx        = offscreenCanvas.getContext("2d");
		var fontHeight = s * scale;
		var yPos       = (s - fontHeight) / 2;
		ctx.fillStyle = "white";
		ctx.fillRect(0, 0, size, size);
		ctx.fill();
		ctx.textBaseline = "top";
		ctx.font         = fontHeight + "px " + font;
		ctx.textAlign    = "center";
		ctx.fillStyle    = "#cccccc";
		ctx.fillText(letter, size/2, yPos);

		var data = ctx.getImageData(0, 0, s, s);
		var rect = { x:99999, y:99999, w:0, h:0 };

		for(var i=0; i<(size*size); i++) {
			if(data.data[i*4] != 255) {
				var y = parseInt(i / size);
				var x = i - (y * size);
				rect.x = Math.min(rect.x, x);
				rect.y = Math.min(rect.y, y);
				rect.w = Math.max(rect.w, x);
				rect.h = Math.max(rect.h, y);
			}
		}
		rect.w = rect.w - rect.x;
		rect.h = rect.h - rect.y;
		return { d:data, r:rect };
	}
	this.begin = function(px, py) {
		strokePos = 1;
	}
	this.addPoint = function(px, py) {
		stroke.addPoint(px, py);
	}
	this.end = function() {
		stroke.end();
	}
	this.draw = function() {
		//context.globalAlpha = 0;
		context.beginPath();
		context.lineWidth   = 4;
		context.lineCap     = "round";
		context.strokeStyle = "rgba(255, 0, 0, 1.0)";

		for(var i=strokePos; i<stroke.stroke.length; i++) {
			context.moveTo(stroke.stroke[i-1].x, stroke.stroke[i-1].y);
			context.lineTo(stroke.stroke[i].x, stroke.stroke[i].y);
		}
		context.stroke();
		strokePos = stroke.stroke.length;
	}
	this.transformPoint = function(px, py, fromRect, toRect) {
		px = (px - fromRect.x) / fromRect.w;
		py = (py - fromRect.y) / fromRect.h;
		return {
			x:toRect.x + px*toRect.w,
			y:toRect.y + py*toRect.h
		};
	}
	this.drawAll = function() {
		context.putImageData(letterData, x, y);
		context.lineWidth   = 4;
		context.lineCap     = "round";
		context.strokeStyle = "rgba(255, 0, 0, 1.0)";
		context.beginPath();

		var strokeRect = stroke.rect();
		//context.strokeStyle = "red";
		//context.strokeRect(strokeRect.x, strokeRect.y, strokeRect.w, strokeRect.h);
		//context.stroke();
		for(var j=0; j<stroke.strokeList.length; j++) {
			var s = stroke.strokeList[j];

			for(var i=1; i<s.length; i++) {
				var a = this.transformPoint(s[i-1].x, s[i-1].y, strokeRect, letterRect);
				var b = this.transformPoint(s[i].x, s[i].y, strokeRect, letterRect);
				context.moveTo(a.x, a.y);
				context.lineTo(b.x, b.y);
			}
		}
		context.stroke();
	}
}
