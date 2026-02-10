import {defineStore} from "pinia";
import {ref} from "vue";
import {getCurrentLanguage, getDirection, setCurrentLanguage, setDirection} from "@/utils/index.js";
import {useI18n} from "vue-i18n";

export const useLocaleStore = defineStore('locale', () => {
    const currentLang = ref(getCurrentLanguage())
    const direction = ref(getDirection().direction)
    const isRtl = ref(getDirection().isRtl)
    const {locale} = useI18n()

    function changeDirection(payload) {
        direction.value = payload
        isRtl.value = payload === 'rtl'
        setDirection(payload)
        document.querySelector('html').style.direction = payload
        if (isRtl.value) {
            document.body.classList.remove('ltr')
            document.body.classList.add('rtl')
            document.body.classList.add('font-rtl')
            document.body.classList.remove("font-ltr");
        } else {
            document.body.classList.remove('rtl')
            document.body.classList.add('ltr')
            document.body.classList.add('font-ltr')
            document.body.classList.remove("font-rtl");
        }
    }

    function changeLang(payload) {
        locale.value = payload
        currentLang.value = payload
        setCurrentLanguage(payload)
    }

    return {currentLang, changeLang, direction, isRtl, changeDirection}
})