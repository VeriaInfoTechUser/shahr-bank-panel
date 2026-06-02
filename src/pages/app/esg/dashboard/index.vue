<script setup lang="ts">
import { onMounted, shallowRef, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { esgRepo } from '@/core/repositories/esgRepo';
import DashboardRenderer from './components/dynamic/DashboardRenderer.vue';
import type { DashboardResponse } from './types';
import { unwrapDashboardResponse } from './dashboardUtils';

const { t } = useI18n();

const dashboard = shallowRef<DashboardResponse | null>(null);
const dashboardLoading = ref(true);
const dashboardError = ref('');

async function loadDashboard() {
  dashboardLoading.value = true;
  dashboardError.value = '';

  try {
    const response = await esgRepo.dashboard({ section: 'governance' });
    const governanceDashboard = unwrapDashboardResponse(response, 'governance');

    if (!governanceDashboard) {
      throw new Error('داده‌ای برای داشبورد حاکمیت دریافت نشد.');
    }

    dashboard.value = governanceDashboard;
  } catch (error) {
    dashboardError.value = error instanceof Error ? error.message : 'خطا در دریافت داشبورد حاکمیت';
  } finally {
    dashboardLoading.value = false;
  }
}

onMounted(loadDashboard);
</script>

<template>
  <div dir="rtl" class="mx-auto max-w-7xl px-1 pb-12 pt-2 md:px-2">
    <section v-if="dashboardLoading" class="space-y-5">
      <div class="rounded-lg border border-slate-200/80 bg-white p-5 shadow-sm dark:border-darkmode-600 dark:bg-darkmode-800">
        <div class="h-5 w-28 animate-pulse rounded bg-slate-100 dark:bg-darkmode-700" />
        <div class="mt-4 grid gap-3 sm:grid-cols-3">
          <div
            v-for="item in 3"
            :key="item"
            class="h-20 animate-pulse rounded-lg bg-slate-100 dark:bg-darkmode-700"
          />
        </div>
      </div>
      <div class="grid gap-5 lg:grid-cols-2">
        <div class="h-[360px] animate-pulse rounded-lg bg-slate-100 dark:bg-darkmode-700" />
        <div class="h-[360px] animate-pulse rounded-lg bg-slate-100 dark:bg-darkmode-700" />
      </div>
      <div class="h-[420px] animate-pulse rounded-lg bg-slate-100 dark:bg-darkmode-700" />
    </section>

    <section
      v-else-if="dashboardError"
      class="rounded-lg border border-danger/25 bg-danger/5 p-5 text-sm font-medium text-danger dark:border-danger/40 dark:bg-danger/10"
    >
      {{ dashboardError }}
    </section>

    <section
      v-else-if="!dashboard"
      class="rounded-lg border border-slate-200/80 bg-white p-10 text-center text-sm text-slate-500 shadow-sm dark:border-darkmode-600 dark:bg-darkmode-800 dark:text-slate-400"
    >
      داده‌ای برای داشبورد ESG یافت نشد.
    </section>

    <DashboardRenderer
      v-else
      :dashboard="dashboard"
      :translate="t"
    />
  </div>
</template>
