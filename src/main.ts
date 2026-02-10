import { createApp } from 'vue';
import { createPinia } from 'pinia';
import PrimeVue from 'primevue/config';
import App from './App.vue';
import router from './router';
import i18n from './utils/i18n';
import './assets/css/app.css';
import Shimmer from 'vue3-shimmer';
import VueAwesomePaginate from "vue-awesome-paginate";

const app = createApp(App);

const pinia = createPinia();
app.use(pinia);

app.use(PrimeVue, { unstyled: true });
app.use(router);
app.use(i18n);
app.use(Shimmer);
app.use(VueAwesomePaginate);

app.mount('#app');