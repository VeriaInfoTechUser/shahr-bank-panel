<script setup>
import { getDirection } from "@/utils/index.js";
import { onBeforeMount, watch } from "vue";
import { useI18n } from "vue-i18n";
import GlobalModalHost from "@/core/ui/global/GlobalModalHost.vue";
import PersianDigitsDomProvider from "@/core/ui/global/PersianDigitsDomProvider.vue";
import LoginHistoryModal from "@/components/LoginHistoryModal.vue";
import { useUserStore } from "@/stores/user.js";

const { t, locale } = useI18n();
const userStore = useUserStore();

onBeforeMount(() => {
  document.querySelector('html').style.direction = getDirection().direction

  if (getDirection().isRtl) {
    document.body.classList.add("rtl");
    document.body.classList.add('font-rtl')
    document.dir = "rtl";
    document.body.classList.remove("ltr");
    document.body.classList.remove("font-ltr");
  } else {
    document.body.classList.add("ltr");
    document.body.classList.add('font-ltr')
    document.dir = "ltr";
    document.body.classList.remove("rtl");
    document.body.classList.remove("font-rtl");

  }
  
  // Set initial title
  document.title = t('title.web-title');
})

// Update title when locale changes
watch(locale, () => {
  document.title = t('title.web-title');
})

function handleCloseLoginHistoryModal() {
  userStore.setShowLoginHistoryModal(false);
}
</script>
<template>
  <PersianDigitsDomProvider>
    <RouterView />
    <GlobalModalHost />
    <LoginHistoryModal
      :open="userStore.showLoginHistoryModal"
      @close="handleCloseLoginHistoryModal"
    />
  </PersianDigitsDomProvider>
</template>
