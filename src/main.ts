import { createApp } from 'vue';
import { createPinia } from 'pinia';
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
import './assets/css/primeicons.css';
import App from './App.vue';
import router from './router';
import i18n from './utils/i18n';
import { toPersianDigits } from './utils/persianDigits';
import 'vue3-toastify/dist/index.css';
import './assets/css/app.css';
import './styles/tokens.css';
import './assets/css/primevue-theme.css';
import Shimmer from 'vue3-shimmer';
import VueAwesomePaginate from "vue-awesome-paginate";
import { updateGlobalOptions } from 'vue3-toastify';

// Toast defaults: RTL UI → toasts on the left, follow the app theme.
updateGlobalOptions({
  position: 'top-left',
  rtl: true,
  autoClose: 5000,
  closeOnClick: true,
  pauseOnHover: true,
});

const app = createApp(App);

const pinia = createPinia();
app.use(pinia);

app.use(PrimeVue, {
  ripple: true,
  theme: {
    preset: Aura,
    options: {
      prefix: 'p',
      darkModeSelector: '.dark',
      cssLayer: false,
    },
  },
});
app.use(router);
app.use(i18n);
app.config.globalProperties.pd = toPersianDigits;
app.use(Shimmer);
app.use(VueAwesomePaginate);

app.mount('#app');
