<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { grcRepo } from '@/core/repositories/grcRepo';

const { t } = useI18n();
const loading = ref(false);
const dashboardData = ref<Record<string, unknown> | null>(null);
const error = ref<string | null>(null);

async function loadDashboard() {
  loading.value = true;
  error.value = null;
  try {
    const res = await grcRepo.riskDashboard();
    if (res?.result) {
      dashboardData.value = res.data ?? null;
    } else {
      error.value = res?.error?.[0] ?? t('risk.dashboard-load-error');
    }
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : t('risk.dashboard-load-error');
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadDashboard();
});
</script>

<template>
  <div class="grid grid-cols-12 gap-4 p-4">
    <div class="col-span-12">
      <div class="flex items-center justify-between">
        <h1 class="text-lg font-semibold text-slate-800 dark:text-slate-200">
          {{ t('menu.dashboard') }}
        </h1>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-darkmode-600 dark:bg-darkmode-800 dark:text-slate-300 dark:hover:bg-darkmode-700"
          :disabled="loading"
          @click="loadDashboard"
        >
          <svg
            class="h-3.5 w-3.5"
            :class="{ 'animate-spin': loading }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          {{ t('general.refresh') }}
        </button>
      </div>
    </div>

    <div v-if="loading && !dashboardData" class="col-span-12">
      <div class="flex items-center justify-center py-20">
        <div class="text-center">
          <div class="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <span class="text-sm text-slate-500">{{ t('general.loading') }}</span>
        </div>
      </div>
    </div>

    <div v-else-if="error" class="col-span-12">
      <div class="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-900/20">
        <p class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
        <button
          type="button"
          class="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 shadow-sm transition hover:bg-red-50 dark:border-red-800 dark:bg-darkmode-800 dark:text-red-400"
          @click="loadDashboard"
        >
          {{ t('general.retry') }}
        </button>
      </div>
    </div>

    <div v-else-if="dashboardData" class="col-span-12">
      <div class="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-darkmode-600 dark:bg-darkmode-800">
        <h2 class="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
          {{ t('risk.dashboard-api-response') }}
        </h2>
        <pre class="max-h-[60vh] overflow-auto rounded-lg bg-slate-50 p-4 text-xs text-slate-700 dark:bg-darkmode-700 dark:text-slate-300">{{ JSON.stringify(dashboardData, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>
