<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import Lucide from '@/base-components/Lucide';
import Button from '@/base-components/Button';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const slug = ref(String(route.params.slug ?? ''));
</script>

<template>
  <div class="grid grid-cols-12 gap-2 p-2">
    <div class="col-span-12 rounded-xl border border-slate-200/60 bg-white shadow-sm dark:border-darkmode-700/60 dark:bg-darkmode-800">
      <div class="flex items-center gap-3 border-b border-slate-100 px-6 py-4 dark:border-darkmode-700">
        <button
          type="button"
          class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-800 dark:border-darkmode-600 dark:bg-darkmode-800 dark:text-slate-300 dark:hover:bg-darkmode-700"
          @click="router.push({ name: 'app-reports-baseline' })"
        >
          <Lucide icon="ArrowRight" class="h-4 w-4" />
        </button>
        <div>
          <h1 class="text-base font-semibold text-slate-800 dark:text-slate-100">
            {{ t('reports.baseline-report') }}
          </h1>
          <p class="text-xs text-slate-400 dark:text-slate-500">
            {{ slug }}
          </p>
        </div>
      </div>
      <div class="p-6">
        <p class="text-sm text-slate-400 dark:text-slate-500">
          {{ t('general.no-data') }}
        </p>
      </div>
    </div>
  </div>
</template>
