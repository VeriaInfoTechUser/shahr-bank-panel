<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import Lucide from '@/base-components/Lucide';

const { t } = useI18n();
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50/80 to-primary-muted/10 p-6 dark:from-darkmode-900 dark:via-darkmode-800 dark:to-primary-muted/5">
    <div class="mx-auto max-w-5xl">
      <div class="overflow-hidden rounded-2xl border border-white/60 bg-white shadow-lg shadow-primary/5 dark:border-darkmode-700/40 dark:bg-darkmode-800 dark:shadow-black/10">
        <div class="border-b border-slate-100 bg-gradient-to-r from-primary/5 via-transparent to-primary-muted/10 px-6 py-4 dark:border-darkmode-700/50 dark:from-primary/10 dark:to-primary-muted/5">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 dark:bg-primary/20">
              <Lucide icon="BarChart3" class="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 class="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {{ t('menu.capital-indicator') }}
              </h1>
            </div>
          </div>
        </div>
        <div class="flex flex-col items-center justify-center py-16">
          <p class="text-sm text-slate-500 dark:text-slate-400">
            {{ t('general.no-data') }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
