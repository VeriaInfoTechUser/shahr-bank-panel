import { createI18n } from 'vue-i18n';
import { unref } from 'vue';
import { getCurrentLanguage } from '@/utils/index.js';
import { isPersianDigitLocale, toPersianDigits } from '@/utils/persianDigits';

import en from '../locales/en.json';
import fa from '../locales/fa.json';
import ar from '../locales/ar.json';

const messages = { en, fa, ar };
const locale = getCurrentLanguage();

const i18n = createI18n({
  locale,
  fallbackLocale: 'fa',
  messages,
  legacy: false,
  postTranslation: (str: string) => {
    const loc = String(unref(i18n.global.locale));
    if (isPersianDigitLocale(loc)) return toPersianDigits(str);
    return str;
  },
  numberFormats: {
    fa: {
      decimal: {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 20,
        numberingSystem: 'arabext',
      },
    },
    en: {
      decimal: {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 20,
      },
    },
    ar: {
      decimal: {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 20,
      },
    },
  },
});

export default i18n;
