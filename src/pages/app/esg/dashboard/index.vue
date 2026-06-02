<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { esgRepo } from '@/core/repositories/esgRepo';
import ESGOverallDashboard from './ESGOverallDashboard.vue';
import ESGGovernanceDashboard from './ESGDashboardNew.vue';

const { t } = useI18n();

type SectionKey = 'governance' | 'social' | 'environmental';

const dashboardData = ref<any>(null);
const activeView = ref<'overall' | SectionKey>('overall');
const dashboardLoading = ref(true);
const dashboardError = ref('');

async function loadDashboard() {
  dashboardLoading.value = true;
  dashboardError.value = '';
  try {
    const response = await esgRepo.dashboard({});
    if (!response || typeof response !== 'object') throw new Error('داده‌ای برای داشبورد دریافت نشد.');
    const data = (response as any).data ?? (response as any).result ?? response;
    if (!data || typeof data !== 'object') throw new Error('فرمت پاسخ نامعتبر است.');
    dashboardData.value = {
      governance: data.governance,
      social: data.social,
      environmental: data.environmental,
      reporting_period: data.reporting_period,
      last_updated: data.last_updated,
      total_kpis: data.total_kpis,
    };
  } catch (error) {
    dashboardError.value = error instanceof Error ? error.message : 'خطا در دریافت داشبورد';
    console.error('Dashboard error:', error);
  } finally {
    dashboardLoading.value = false;
  }
}

onMounted(loadDashboard);
</script>

<template>
  <div dir="rtl" class="mx-auto max-w-7xl px-1 pb-12 pt-2 md:px-2">

    <!-- Loading -->
    <section v-if="dashboardLoading" class="space-y-5">
      <div class="grid gap-3 sm:grid-cols-5">
        <div v-for="i in 5" :key="i" class="h-28 animate-pulse rounded-xl bg-slate-100 dark:bg-darkmode-700" />
      </div>
      <div class="grid gap-5 lg:grid-cols-12">
        <div class="lg:col-span-4 h-72 animate-pulse rounded-xl bg-slate-100 dark:bg-darkmode-700" />
        <div class="lg:col-span-3 h-72 animate-pulse rounded-xl bg-slate-100 dark:bg-darkmode-700" />
        <div class="lg:col-span-3 h-72 animate-pulse rounded-xl bg-slate-100 dark:bg-darkmode-700" />
        <div class="lg:col-span-2 h-72 animate-pulse rounded-xl bg-slate-100 dark:bg-darkmode-700" />
      </div>
    </section>

    <!-- Error -->
    <section v-else-if="dashboardError"
             class="rounded-xl border border-danger/25 bg-danger/5 p-5 text-sm font-medium text-danger">
      {{ dashboardError }}
    </section>

    <!-- Empty -->
    <section v-else-if="!dashboardData"
             class="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
      داده‌ای برای داشبورد ESG یافت نشد.
    </section>

    <!-- Dashboard -->
    <section v-else class="space-y-5">

      <!-- View Tabs -->
      <div class="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-900">
        <button
            v-for="(view) in (['overall', 'governance', 'social', 'environmental'] as const)"
            :key="view"
            @click="activeView = view"
            class="flex-1 rounded-lg px-4 py-2 text-xs font-medium transition-all"
            :class="activeView === view
            ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'"
        >
          <span v-if="view === 'overall'">🌐 کلی</span>
          <span v-else-if="view === 'environmental'">🌿 محیط‌زیست</span>
          <span v-else-if="view === 'social'">👥 اجتماعی</span>
          <span v-else-if="view === 'governance'">🏛 حاکمیت</span>
        </button>
      </div>

      <!-- Overall ESG Dashboard -->
      <ESGOverallDashboard
          v-if="activeView === 'overall'"
          :dashboard-data="dashboardData"
      />

      <!-- Section-specific Dashboard -->
      <ESGGovernanceDashboard
          v-else-if="dashboardData[activeView]"
          :key="`${activeView}-${dashboardData.last_updated}`"
          :section="activeView"
          :dashboard-data="dashboardData"
      />

    </section>
  </div>
</template>