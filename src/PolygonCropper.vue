<template>
    <div :class="wrapperClass">
        <canvas
                :class="canvasClass"
                ref="canvas"
                v-on:mousedown="mouseDown"
                v-on:mousemove="mouseMove"
                v-show="showCanvas"
                width="1190"
        ></canvas>
        <span :class="`vue-crop-pointer ${pointerClass}`" :style="{top:point.y, left:point.x}"
              v-for="point in current_pointer" v-show="showPointer"></span>
    </div>
</template>
<script>
	export default {
		name: "PolygonCrop",
		props: {
			canvasClass: {
				type: String,
				default: ""
			},
			wrapperClass: {
				type: String,
				default: ""
			},
			pointerClass: {
				type: String,
				default: ""
			},
			imageSource: {
				type: String,
				default: ""
			},
			showCanvas: {
				type: Boolean,
				default: true
			},
			showPointer: {
				type: Boolean,
				default: true
			}
		},
		data() {
			return {
				editing: 1,
				points: [],
				imageObj: null,
				positionX: '',
				positionY: '',
				oldPositionX: '',
				oldPositionY: '',
				height: '',
				width: '',
				ctx: null,
				imageCanvas: null,
				redo_list: [],
				undo_list: [],
				redo_pointer: [],
				undo_pointer: [],
				current_pointer: [],
				resultImage: null
			};
		},
		mounted() {
			this._initialize();
		},
		methods: {
			_initialize: function () {
				this.imageCanvas = this.$refs.canvas;
				this.ctx = this.imageCanvas.getContext("2d");
				let img = new Image();
				img.onload = () => {
					this.width = img.width;
					this.height = img.height;
					this.ctx.canvas.width = img.width;
					this.ctx.canvas.height = img.height;
					this.ctx.drawImage(img, 0, 0);
				};
				img.src = this.imageSource;
				this.imageObj = img;
			},
			reset() {
				this.points = [];
				this.redo_list = [];
				this.undo_list = [];
				this.redo_pointer = [];
				this.undo_pointer = [];
				this.current_pointer = [];
				this.imageObj = null;
				this.resultImage = null;
				this.editing = 1;
				this._initialize();

			},
			savePointer: function (point) {
				this.redo_pointer = [];
				this.current_pointer.push(point);
				this.undo_pointer.push(point);
			},
			restorePointer: function (pop, push, undo) {
				if (pop.length > 0) {
					let item = pop.pop();
					push.push(item);
					if (undo) {
						this.oldPositionX = item.positionX;
						this.oldPositionY = item.positionY;
						this.current_pointer.pop();
					} else {
						if (this.redo_pointer.length > 0) {
							this.oldPositionX = this.redo_pointer[this.redo_pointer.length - 1]['positionX'];
							this.oldPositionY = this.redo_pointer[this.redo_pointer.length - 1]['positionY'];
						}
						this.current_pointer.push(item);
					}
				}
			},
			saveState: function (canvas, list, keep_redo) {
				keep_redo = keep_redo || false;
				if (!keep_redo) {
					this.redo_list = [];
				}
				(list || this.undo_list).push(canvas.toDataURL());
			},
			restoreState: function (pop, push) {
				if (pop.length) {
					this.saveState(this.imageCanvas, push, true);
					let restore_state = pop.pop();
					let img = new Image();
					img.src = restore_state;
					img.onload = () => {
						this.ctx.clearRect(0, 0, this.width, this.height);
						this.ctx.drawImage(img, 0, 0);
					};
				}
			},
			undo: function () {
				if (this.editing) {
					this.editing = 0;
					this.restoreState(this.undo_list, this.redo_list);
					this.restorePointer(this.undo_pointer, this.redo_pointer, true);
					this.editing = 1;
				}
			},
			redo: function () {
				if (this.editing) {
					this.editing = 0;
					this.restoreState(this.redo_list, this.undo_list);
					this.restorePointer(this.redo_pointer, this.undo_pointer, false);
					this.editing = 1;
				}
			},
			crop: function () {
				if (this.editing) {
					this.current_pointer = [];
					this.ctx.clearRect(0, 0, this.width, this.height);
					this.ctx.beginPath();
					this.ctx.globalCompositeOperation = 'destination-over';
					let left = this.imageCanvas.offsetLeft;
					let top = this.imageCanvas.offsetTop;
					for (let i = 0; i < this.points.length; i += 2) {
						let x = this.points[i];
						let y = this.points[i + 1];
						if (i === 0) {
							this.ctx.moveTo(x - left, y - top);
						} else {
							this.ctx.lineTo(x - left, y - top);
						}
					}
					this.ctx.fillStyle = this.ctx.createPattern(this.imageObj, "repeat");
					this.ctx.fill();
					let trimmedCanvas = this.trimEmptyPixel(this.imageCanvas, this.ctx);
					let dataUrl = trimmedCanvas.toDataURL("image/png");
					this.resultImage = dataUrl;
					this.editing = 0;
					let img = new Image();
					img.onload = () => {
						this.width = img.width;
						this.height = img.height;
						this.ctx.canvas.width = img.width;
						this.ctx.canvas.height = img.height;
						this.ctx.drawImage(img, 0, 0);
					};
					img.src = dataUrl;
				}

			},
			mouseDown: function (e) {
				if (this.editing === 1) {
					if (e.which === 1) {
						//store the points if mousedown
						this.points.push(e.pageX, e.pageY);
						if (this.oldPositionX !== '' && this.undo_list.length > 0) {
							this.ctx.beginPath();
							this.ctx.moveTo(this.oldPositionX, this.oldPositionY);
							this.ctx.lineTo(this.positionX, this.positionY);
							this.ctx.strokeStyle = "#F63E02";
							this.ctx.lineWidth = 2;
							this.ctx.setLineDash([1, 1]);
							this.ctx.stroke();
						}
						this.saveState(this.imageCanvas);
						this.savePointer({
							x: e.pageX + 'px',
							y: e.pageY + 'px',
							positionX: e.offsetX,
							positionY: e.offsetY
						});

						this.oldPositionX = e.offsetX;
						this.oldPositionY = e.offsetY;
					}
					this.positionX = e.offsetX;
					this.positionY = e.offsetY;
				}
			},
			mouseMove: function (e) {
				if (this.editing === 1) {
					this.positionX = e.offsetX;
					this.positionY = e.offsetY;
				}
			},
			trimEmptyPixel: function (c, ctx) {
				let copy = document.createElement('canvas').getContext('2d'),
					pixels = ctx.getImageData(0, 0, c.width, c.height),
					l = pixels.data.length,
					i,
					bound = {
						top: null,
						left: null,
						right: null,
						bottom: null
					},
					x, y;
				for (i = 0; i < l; i += 4) {
					if (pixels.data[i + 3] !== 0) {
						x = (i / 4) % c.width;
						y = ~~((i / 4) / c.width);

						if (bound.top === null) {
							bound.top = y;
						}

						if (bound.left === null) {
							bound.left = x;
						} else if (x < bound.left) {
							bound.left = x;
						}

						if (bound.right === null) {
							bound.right = x;
						} else if (bound.right < x) {
							bound.right = x;
						}

						if (bound.bottom === null) {
							bound.bottom = y;
						} else if (bound.bottom < y) {
							bound.bottom = y;
						}
					}
				}

				// Calculate the height and width of the content
				let trimHeight = bound.bottom - bound.top,
					trimWidth = bound.right - bound.left,
					trimmed = ctx.getImageData(bound.left, bound.top, trimWidth, trimHeight);

				copy.canvas.width = trimWidth;
				copy.canvas.height = trimHeight;
				copy.putImageData(trimmed, 0, 0);
				return copy.canvas;
			},
		}
	};
</script>
<style>
    .vue-crop-pointer {
        border: solid 1px #000;
        filter: alpha(opacity=50);
        opacity: 0.5;
        position: absolute;
        width: 5px;
        height: 5px;
    }

    canvas {
        position: relative;
        margin-left: 0px;
        margin-top: 0px;
        cursor: crosshair
    }
</style>
