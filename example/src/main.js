import Vue from 'vue';
import App from './App.vue';
import VueCropper from 'vue-polygon-cropper';

Vue.config.productionTip = false;
Vue.use(VueCropper);

new Vue({
	render: h => h(App),
}).$mount('#app');
