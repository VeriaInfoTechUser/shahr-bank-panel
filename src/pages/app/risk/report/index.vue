<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
  <div class="mx-auto max-w-7xl px-1 pb-12 pt-2 md:px-2">
    <header class="mb-8">
      <div class="flex items-center gap-4">
        <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
        </div>
        <div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-50">
            {{ t('menu.report') }}
          </h1>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            {{ t('general.no-data') }}
          </p>
        </div>
      </div>
    </header>

    <div class="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-darkmode-600 dark:bg-darkmode-800">
      <p class="text-sm text-slate-600 dark:text-slate-300">
        {{ t('general.no-data') }}
      </p>
    </div>
  </div>
</template>
