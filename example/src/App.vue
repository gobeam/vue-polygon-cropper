<template>
    <div id="app">


        <polygon-crop :imageSource="'/demo.png'" ref="canvas"></polygon-crop>
        <button @click.prevent="crop">Crop</button>
        <button @click.prevent="undo">Undo</button>
        <button @click.prevent="redo">Redo</button>
        <button @click.prevent="reset">Reset</button>

    </div>
</template>
<script>

	export default {
		name: 'App',
		methods: {
			crop: function () {
				this.$refs.canvas.crop();
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
