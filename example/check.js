(function($) {
	var tool;
	var canvas = $('paint');
	var ctx = canvas.getContext('2d');
	
	var history = {
		redo_list: [],
		undo_list: [],
		saveState: function(canvas, list, keep_redo) {
			keep_redo = keep_redo || false;
			if(!keep_redo) {
				this.redo_list = [];
			}
			
			(list || this.undo_list).push(canvas.toDataURL());
		},
		undo: function(canvas, ctx) {
			this.restoreState(canvas, ctx, this.undo_list, this.redo_list);
		},
		redo: function(canvas, ctx) {
			this.restoreState(canvas, ctx, this.redo_list, this.undo_list);
		},
		restoreState: function(canvas, ctx,  pop, push) {
			if(pop.length) {
				this.saveState(canvas, push, true);
				var restore_state = pop.pop();
				var img = new Element('img', {'src':restore_state});
				img.onload = function() {
					ctx.clearRect(0, 0, 600, 400);
					ctx.drawImage(img, 0, 0, 600, 400, 0, 0, 600, 400);
				}
			}
		}
	}
	
	var pencil = {
		options: {
			stroke_color: ['00', '00', '00'],
			dim: 4
		},
		init: function(canvas, ctx) {
			this.canvas = canvas;
			this.canvas_coords = this.canvas.getCoordinates();
			this.ctx = ctx;
			this.ctx.strokeColor = this.options.stroke_color;
			this.drawing = false;
			this.addCanvasEvents();
		},
		addCanvasEvents: function() {
			this.canvas.addEvent('mousedown', this.start.bind(this));
			this.canvas.addEvent('mousemove', this.stroke.bind(this));
			this.canvas.addEvent('mouseup', this.stop.bind(this));
			this.canvas.addEvent('mouseout', this.stop.bind(this));
		},
		start: function(evt) {
			var x = evt.page.x - this.canvas_coords.left;
			var y = evt.page.y - this.canvas_coords.top;
			this.ctx.beginPath();
			this.ctx.moveTo(x, y);
			history.saveState(this.canvas);
			this.drawing = true;
		},
		stroke: function(evt) {
			if(this.drawing) {
				var x = evt.page.x - this.canvas_coords.left;
				var y = evt.page.y - this.canvas_coords.top;
				this.ctx.lineTo(x, y);
				this.ctx.stroke();
				
			}
		},
		stop: function(evt) {
			if(this.drawing) this.drawing = false;
		}
	};
	
	$('pencil').addEvent('click', function() {
		pencil.init(canvas, ctx);
	});
	
	$('undo').addEvent('click', function() {
		history.undo(canvas, ctx);
	});
	
	$('redo').addEvent('click', function() {
		history.redo(canvas, ctx);
	});
	
	
})(document.id)
