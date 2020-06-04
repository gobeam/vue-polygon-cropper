<template>
    <div :class="wrapperClass">
        <canvas
                :class="canvasClass"
                ref="canvas"
                v-on:mousedown="mouseDown"
                v-on:mousemove="mouseMove"
                v-show="showCanvas"
        ></canvas>
        <span :class="`vue-crop-pointer ${pointerClass}`" :style="{top:point.y, left:point.x}"
              v-for="point in currentPointer" v-show="showPointer"></span>
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
			width: {
				type: Number,
				default: 0
			},
			height: {
				type: Number,
				default: 0
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
				imageObj: null,
				positionX: '',
				positionY: '',
				oldPositionX: '',
				oldPositionY: '',
				ctx: null,
				imageCanvas: null,
				redoMarks: [],
				undoMarks: [],
				currentMarks: [],
				redoList: [],
				undoList: [],
				redoPointer: [],
				undoPointer: [],
				currentPointer: [],
				resultImage: null,
				imgWidth: 0,
				imgHeight: 0
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
					this.imgWidth = this.width > 0 ? this.width : img.width;
					this.imgHeight = this.height > 0 ? this.height : img.height;
					this.ctx.canvas.width = this.imgWidth;
					this.ctx.canvas.height = this.imgHeight;
					this.ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, this.imgWidth, this.imgHeight);

					let canvasImg = new Image();
					canvasImg.src = this.imageCanvas.toDataURL();
					canvasImg.onload = () => {
						this.imageObj = canvasImg;
					};
				};
				img.src = this.imageSource;

			},
			empty: function () {
				this.redoList = [];
				this.undoList = [];
				this.redoPointer = [];
				this.undoPointer = [];
				this.currentPointer = [];
				this.redoMarks = [];
				this.undoMarks = [];
				this.currentMarks = [];
			},
			reset: function () {
				this.empty();
				this.imageObj = null;
				this.resultImage = null;
				this.editing = 1;
				this._initialize();
			},
			savePointer: function (point) {
				this.redoPointer = [];
				this.currentPointer.push(point);
				this.undoPointer.push(point);
			},
			restorePointer: function (pop, push, undo) {
				if (pop.length > 0) {
					let item = pop.pop();
					push.push(item);
					if (undo) {
						this.oldPositionX = item.positionX;
						this.oldPositionY = item.positionY;
						this.currentPointer.pop();
					} else {
						if (this.redoPointer.length > 0) {
							this.oldPositionX = this.redoPointer[this.redoPointer.length - 1]['positionX'];
							this.oldPositionY = this.redoPointer[this.redoPointer.length - 1]['positionY'];
						}
						this.currentPointer.push(item);
					}
				}
			},
			restoreMarks: function (pop, push, undo) {
				if (pop.length > 1) {
					let item = pop.splice(pop.length - 2, 2);
					push.push(...item);
					if (undo) {
						this.currentMarks.splice(pop.length - 2, 2);
					} else {
						this.currentMarks.push(...item);
					}
				}
			},
			saveState: function (canvas, list, keepRedo) {
				keepRedo = keepRedo || false;
				if (!keepRedo) {
					this.redoList = [];
				}
				(list || this.undoList).push(canvas.toDataURL());
			},
			restoreState: function (pop, push) {
				if (pop.length) {
					this.saveState(this.imageCanvas, push, true);
					let restoreState = pop.pop();
					let img = new Image();
					img.src = restoreState;
					img.onload = () => {
						this.ctx.clearRect(0, 0, this.imgWidth, this.imgHeight);
						this.ctx.drawImage(img, 0, 0);
					};
				}
			},
			undo: function () {
				if (this.editing) {
					this.editing = 0;
					this.restoreState(this.undoList, this.redoList);
					this.restorePointer(this.undoPointer, this.redoPointer, true);
					this.restoreMarks(this.undoMarks, this.redoMarks, true);
					this.editing = 1;
				}
			},
			redo: function () {
				if (this.editing) {
					this.editing = 0;
					this.restoreState(this.redoList, this.undoList);
					this.restorePointer(this.redoPointer, this.undoPointer, false);
					this.restoreMarks(this.redoMarks, this.undoMarks, false);
					this.editing = 1;
				}
			},
			crop: function () {
				if (this.editing) {
					this.currentPointer = [];
					this.ctx.clearRect(0, 0, this.imgWidth, this.imgHeight);
					this.ctx.beginPath();
					this.ctx.globalCompositeOperation = 'destination-over';
					let left = this.imageCanvas.offsetLeft;
					let top = this.imageCanvas.offsetTop;
					for (let i = 0; i < this.currentMarks.length; i += 2) {
						let x = this.currentMarks[i];
						let y = this.currentMarks[i + 1];
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
						this.ctx.canvas.width = img.width;
						this.ctx.canvas.height = img.height;
						this.ctx.drawImage(img, 0, 0);
					};
					img.src = dataUrl;
					this.empty();
				}

			},
			mouseDown: function (e) {
				if (this.editing === 1) {
					if (e.which === 1) {
						//store the points if mousedown
						if (this.oldPositionX !== '' && this.undoList.length > 0) {
							this.ctx.beginPath();
							this.ctx.moveTo(this.oldPositionX, this.oldPositionY);
							this.ctx.lineTo(this.positionX, this.positionY);
							this.ctx.strokeStyle = "#F63E02";
							this.ctx.lineWidth = 2;
							this.ctx.setLineDash([1, 1]);
							this.ctx.stroke();
						}
						this.redoMarks = [];
						this.currentMarks.push(e.pageX, e.pageY);
						this.undoMarks.push(e.pageX, e.pageY);
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
		},
		watch: {
			imageSource: function (val) {
				this.empty();
				this._initialize();
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
