<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
  <div class="grid grid-cols-12 gap-2 p-2">
    <div class="col-span-12 rounded-xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-darkmode-700/60 dark:bg-darkmode-800">
      <h1 class="text-lg font-semibold text-slate-800 dark:text-slate-100">
        {{ t('menu.data-processing') }}
      </h1>
      <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">
        {{ t('general.no-data') }}
      </p>
    </div>
  </div>
</template>
