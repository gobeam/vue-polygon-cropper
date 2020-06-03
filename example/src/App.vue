<template>
    <div id="app">
        <div>
            <b-img :src="resultImage" alt="Responsive image" fluid></b-img>
        </div>
        <div>
            <polygonCrop :canvasClass="'img-fluid'" :imageSource="imgSrc" :showCanvas="show" :showPointer="showPointer"
                         ref="canvas"></polygonCrop>
        </div>
        <b-row>
            <b-col>
                <b-form-file
                        :state="Boolean(file)"
                        @change="setImage"
                        drop-placeholder="Drop file here..."
                        placeholder="Choose a file or drop it here..."
                        v-model="file"
                ></b-form-file>
                <div class="mt-3">Selected file: {{ file ? file.name : '' }}</div>
            </b-col>
            <b-col>
                <b-button @click.prevent="crop" variant="success">Crop</b-button>
                <b-button @click.prevent="undo" variant="warning">Undo</b-button>
                <b-button @click.prevent="redo" variant="primary">Redo</b-button>
                <b-button @click.prevent="reset" variant="danger">Reset</b-button>
            </b-col>
        </b-row>
    </div>
</template>
<script>
	import polygonCrop from '../../dist/PolygonCropper.umd';
	// import polygonCrop from 'vue-polygon-cropper';

	export default {
		name: 'App',
		data() {
			return {
				imgSrc: '/demo.png',
				file: null,
				show: true,
				showPointer: true,
				resultImage: ""
			};
		},
		components: {
			polygonCrop
		},

		methods: {
			setImage(e) {
				const file = e.target.files[0];
				if (file.type.indexOf('image/') === -1) {
					alert('Please select an image file');
					return;
				}
				if (typeof FileReader === 'function') {
					const reader = new FileReader();
					reader.onload = (event) => {
						this.imgSrc = event.target.result;
					};
					reader.readAsDataURL(file);
				} else {
					alert('Sorry, FileReader API not supported');
				}
			},
			crop: function () {
				this.$refs.canvas.crop();
				this.resultImage = this.$refs.canvas.resultImage;
			},
			undo: function () {
				this.$refs.canvas.undo();
			},
			redo: function () {
				this.$refs.canvas.redo();
			},
			reset: function () {
				this.$refs.canvas.reset();
			}
		}
	};
</script>

<style>
    #app {
        font-family: Avenir, Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-align: center;
        color: #2c3e50;
        margin-top: 60px;
    }
</style>
