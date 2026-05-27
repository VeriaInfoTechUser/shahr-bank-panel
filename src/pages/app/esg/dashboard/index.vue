<script setup lang="ts">
import { useI18n } from "vue-i18n";
const { t } = useI18n();
</script>

<template>
  <div class="mx-auto max-w-7xl px-1 pb-12 pt-2 md:px-2">
    <div class="rounded-xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-darkmode-700/60 dark:bg-darkmode-800">
      <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">
        {{ t('menu.esg') }} - {{ t('menu.esg-dashboard') }}
      </h1>
      <p class="mt-3 text-sm text-slate-500 dark:text-slate-400">
        {{ t('general.no-data') }}
      </p>
    </div>
  </div>
</template>
