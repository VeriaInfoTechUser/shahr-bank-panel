<script setup lang="ts">
import { watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { isPersianDigitLocale } from '@/utils/persianDigits';
import { applyPersianDigitsToDocumentBody } from '@/utils/persianDigitsDom';

const { locale } = useI18n();
let observer: MutationObserver | null = null;
let raf = 0;

function scheduleApply() {
  if (!isPersianDigitLocale(locale.value)) return;
  if (raf) cancelAnimationFrame(raf);
  raf = requestAnimationFrame(() => {
    raf = 0;
    nextTick(() => {
      if (isPersianDigitLocale(locale.value)) {
        applyPersianDigitsToDocumentBody();
      }
    });
  });
}

function attachObserver() {
  observer?.disconnect();
  observer = null;
  if (!isPersianDigitLocale(locale.value)) return;
  observer = new MutationObserver(() => scheduleApply());
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
  });
}

onMounted(() => {
  const loc = String(locale.value);
  document.documentElement.lang = isPersianDigitLocale(loc) ? 'fa-IR' : loc;
  scheduleApply();
  attachObserver();
});

watch(locale, (loc) => {
  const s = String(loc);
  document.documentElement.lang = isPersianDigitLocale(s) ? 'fa-IR' : s;
  if (isPersianDigitLocale(s)) {
    nextTick(() => {
      scheduleApply();
      attachObserver();
    });
  } else {
    observer?.disconnect();
    observer = null;
  }
});

onBeforeUnmount(() => {
  if (raf) cancelAnimationFrame(raf);
  observer?.disconnect();
});
</script>

<template>
  <slot />
</template>
