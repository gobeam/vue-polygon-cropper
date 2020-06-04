<template>
    <div id="app">
        <h1 class="mb-4 mt-2 alert-success" >Vue Image Cropper</h1>
        <div>
            <b-img :src="resultImage" alt="Responsive image" fluid v-show="showResult"></b-img>
        </div>
        <div>
            <polygonCrop :canvasClass="'some-class'" :height="600" :imageSource="imgSrc" :showCanvas="show"
                         :showPointer="showPointer" :width="800"
                         ref="canvas"></polygonCrop>
        </div>
        <b-row>
            <b-col>
                <b-form-group>
                    <b-form-file
                            :state="Boolean(file)"
                            @change="setImage"
                            accept="image/*"
                            class="col-sm-6 mt-2"
                            drop-placeholder="Drop file here..."
                            placeholder="Choose a file or drop it here..."
                            size="lg"
                            v-model="file"
                    ></b-form-file>
                    <div class="mt-3">Selected file: {{ file ? file.name : '' }}</div>
                </b-form-group>

                <b-button @click.prevent="crop" variant="success">Crop</b-button>
                <b-button @click.prevent="undo" variant="warning">Undo</b-button>
                <b-button @click.prevent="redo" variant="primary">Redo</b-button>
                <b-button @click.prevent="reset" variant="danger">Reset</b-button>
            </b-col>
        </b-row>
    </div>
</template>
<script>
	import polygonCrop from 'vue-polygon-cropper';

	export default {
		name: 'App',
		data() {
			return {
				imgSrc: '/demo.png',
				file: null,
				show: false,
				showResult: false,
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
				if (!file && file.type.indexOf('image/') === -1) {
					alert('Please select an image file');
					return;
				}
				if (typeof FileReader === 'function') {
					const reader = new FileReader();
					reader.onload = (event) => {
						this.imgSrc = event.target.result;
						this.show = true
					};
					reader.readAsDataURL(file);
				} else {
					alert('Sorry, FileReader API not supported');
				}
			},
			crop: function () {
				this.$refs.canvas.crop();
				this.resultImage = this.$refs.canvas.resultImage;
				this.show = false;
				this.showResult = true;
			},
			undo: function () {
				this.$refs.canvas.undo();
			},
			redo: function () {
				this.$refs.canvas.redo();
			},
			reset: function () {
				this.show = true;
				this.showResult = false;
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
    .some-class {
        border: 1px solid #2c3e50;
    }
</style>
