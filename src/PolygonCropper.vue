<template>
    <canvas
            height="1684"
            ref="canvas"
            style="position:relative;margin-left:0px;margin-top:0px;cursor:crosshair"
            v-on:mousedown="mouseDown"
            v-on:mousemove="mouseMove"
            v-on:mouseup="mouseUp"
            v-show="condition"
            width="1190"
    ></canvas>
</template>
<script>
	export default {
		name: "SimpleAlert",
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
				canvas: null,
				ctx: null,
				imageCanvas: null
			};
		},
		mounted() {
			this._initialize();
		},
		methods: {
			_initialize() {
				this.imageCanvas = document.getElementById("myCanvas");
				this.ctx = this.imageCanvas.getContext("2d");
				let img = new Image();
				img.onload = () => {
					// console.log(img.width, img.height);
					// ctx.canvas.width  = img.width;
					// ctx.canvas.height = img.height;
					this.ctx.drawImage(img, 0, 0, img.width, img.height);
				};
				img.src = this.imageSource;
				this.imageObj = img;
			},
			mouseUp(e) {

			},
			mouseDown(e) {
				if (this.condition === 1) {
					let pointer = $('<span class="spot">').css({
						'background-color': '#fff',
						'border': 'solid 1px #000',
						'filter': 'alpha(opacity=50)',
						'opacity': '0.5',
						'position': 'absolute',
						// 'background-color': '#000',
						'width': '5px',
						'height': '5px',
						'top': e.pageY,
						'left': e.pageX
					});
					if (e.which === 1) {
						//store the points on mousedown
						this.points.push(e.pageX, e.pageY);
						// this.ctx.globalCompositeOperation = 'destination-out';

						if (this.oldPositionX !== '') {
							this.ctx.beginPath();
							this.ctx.moveTo(this.oldPositionX, this.oldPositionY);
							this.ctx.lineTo(this.positionX, this.positionY);
							this.ctx.strokeStyle = "#F63E02";
							this.ctx.lineWidth = 2;
							this.ctx.setLineDash([1, 1]);
							this.ctx.stroke();
						}
						this.oldPositionX = e.offsetX;
						this.oldPositionY = e.offsetY;
					}
					$(window.document.body).append(pointer);
					this.positionX = e.offsetX;
					this.positionY = e.offsetY;
				}
			},
			mouseMove(e) {
				// console.log(this.condition)
				if (this.condition === 1) {
					// let canvas = this.$refs.imgCanv
					// let ctx = canvas.getContext('2d');
					// ctx.beginPath();
					this.positionX = e.offsetX;
					this.positionY = e.offsetY;
				}
			},
		}
	};
</script>
