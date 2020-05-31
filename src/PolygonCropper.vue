<template>
    <div ref="wrapper" class="wrapper">
        <canvas
                ref="canvas"
                style="position:relative;margin-left:0px;margin-top:0px;cursor:crosshair"
                v-on:mousedown="mouseDown"
                v-on:mousemove="mouseMove"
                v-on:mouseup="mouseUp"
                v-show="condition"
                width="1190"
        ></canvas>
        <span class="crop-pointer" v-for="point in current_pointer" :style="{top:point.y, left:point.x}"></span>
        <!--          <i>HERE APPEARS THE UPLOADED IMAGE</i>-->
        <div ref="resultImage"></div>

        <button @click.prevent="crop">Crop</button>
        <button @click.prevent="undo">Undo</button>
        <button @click.prevent="redo">Redo</button>

    </div>
</template>
<script>
	export default {
		name: "PolygonCrop",
		props: {
			imageSource: {
				type: String,
				default: ""
			},
			timeout: {
				type: Number,
				default: 0
			}
		},
		data() {
			return {
				condition: 1,
				points: [],
				imageObj: null,
				positionX: '',
				positionY: '',
				oldPositionX: '',
				oldPositionY: '',
				height: '',
				width: '',
				canvas: null,
				ctx: null,
				imageCanvas: null,
				redo_list: [],
				undo_list: [],
                redo_pointer: [],
                undo_pointer: [],
                current_pointer: [],
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
					// this.ctx.drawImage(img, 0, 0, img.width, img.height);
					this.ctx.drawImage(img, 0, 0);
				};
				// img.crossOrigin = "Anonymous";
				img.src = this.imageSource;
				this.imageObj = img;
			},
            savePointer: function(point, redo) {
	            redo = redo || false;
	            if (!redo) {
	            	this.redo_pointer = []
                }
	            this.current_pointer.push(point);
	            this.undo_pointer.push(point);
            },
            restorePointer: function() {

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
				this.restoreState(this.undo_list, this.redo_list);
			},
			redo: function () {
				this.restoreState(this.redo_list, this.undo_list);
			},
			crop: function () {
				this.condition = 0;
				let wrapper = this.$refs.wrapper;
				let pointers = wrapper.querySelectorAll(`[class*="vue-crop-pointer"]`);
				pointers.forEach((span) => {
					span.parentNode.removeChild(span);
				});

				this.ctx.clearRect(0, 0, this.width, this.height);
				this.ctx.beginPath();
				// this.ctx.width = this.width;
				// this.ctx.height = this.height;
				this.ctx.globalCompositeOperation = 'destination-over';
				//draw the polygon

				let left = this.imageCanvas.offsetLeft;
				let top = this.imageCanvas.offsetTop;
				// let offset = $('#myCanvas').offset();


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
				let trimmedCanvas = this.trimCanvas(this.imageCanvas, this.ctx);
				let dataUrl = trimmedCanvas.toDataURL("image/png");
				this.$refs.resultImage.innerHTML = `<img src="${dataUrl}"/>`;
			},
			mouseUp: function (e) {

			},
			mouseDown: function (e) {
				if (this.condition === 1) {
					let wrapperRef = this.$refs.wrapper;
					// let pointer = document.createElement("span");
					// pointer.classList.add("vue-crop-pointer");
					// pointer.style.border = 'solid 1px #000';
					// pointer.style.filter = 'alpha(opacity=50)';
					// pointer.style.opacity = '0.5';
					// pointer.style.position = 'absolute';
					// pointer.style.width = '5px';
					// pointer.style.height = '5px';
					// pointer.style.top = e.pageY + 'px';
					// pointer.style.left = e.pageX + 'px';
					this.savePointer({x: e.pageX + 'px', y: e.pageY + 'px'});
					if (e.which === 1) {
						//store the points on mousedown
						this.points.push(e.pageX, e.pageY);
						// this.ctx.globalCompositeOperation = 'destination-out';

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
						this.oldPositionX = e.offsetX;
						this.oldPositionY = e.offsetY;
					}
					// wrapperRef.append(pointer);
					this.positionX = e.offsetX;
					this.positionY = e.offsetY;
				}
			},
			mouseMove: function (e) {
				if (this.condition === 1) {
					this.positionX = e.offsetX;
					this.positionY = e.offsetY;
				}
			},
			trimCanvas: function (c, ctx) {
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

				// Iterate over every pixel to find the highest
				// and where it ends on every axis ()
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

				// Return trimmed canvas
				return copy.canvas;
			},
		}
	};
</script>
<style>
    .wrapper {
        /*margin: auto;*/
        /*width: 100vh;*/
        /*max-width: 100vw;*/
        /*min-width: 500px;*/
    }
    .crop-pointer {
        border : solid 1px #000;
        filter : alpha(opacity=50);
        opacity : 0.5;
        position : absolute;
        width : 5px;
        height : 5px;
    }
</style>
