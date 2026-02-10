import {createI18n} from 'vue-i18n';
import {getCurrentLanguage} from "@/utils/index.js";

import en from '../locales/en.json'
import fa from '../locales/fa.json'
import ar from '../locales/ar.json'


const messages = { en: en,fa: fa,ar:ar};
const locale = getCurrentLanguage();
const i18n = createI18n({
    // something vue-i18n options here ...
    locale: locale,
    fallbackLocale: 'fa',
    messages,
    legacy:false
})

export default i18n;
