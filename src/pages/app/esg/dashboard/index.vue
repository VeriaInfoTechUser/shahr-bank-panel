<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { esgRepo } from '@/core/repositories/esgRepo';
import ESGDashboardNew from './ESGDashboardNew.vue';
import type { ESGSectionData } from '@/types/esg-dashboard.interface';

const { t } = useI18n();

const dashboardData = ref<{
  governance?: ESGSectionData;
  social?: ESGSectionData;
  environmental?: ESGSectionData;
  reporting_period?: string;
  last_updated?: string;
} | null>(null);

const activeSection = ref<'governance' | 'social' | 'environmental'>('governance');
const dashboardLoading = ref(true);
const dashboardError = ref('');

async function loadDashboard() {
  dashboardLoading.value = true;
  dashboardError.value = '';

  try {
    const response = await esgRepo.dashboard({});

    if (!response || typeof response !== 'object') {
      throw new Error('داده‌ای برای داشبورد دریافت نشد.');
    }

    // Handle API envelope format
    const data = (response as any).data ?? (response as any).result ?? response;

    if (!data || typeof data !== 'object') {
      console.error('Invalid response format:', response);
      throw new Error('فرمت پاسخ نامعتبر است.');
    }

    // Verify we have at least one section
    if (!data.governance && !data.social && !data.environmental) {
      console.error('No ESG sections found in response:', data);
      throw new Error('هیچ بخش ESG در پاسخ یافت نشد.');
    }

    dashboardData.value = {
      governance: data.governance,
      social: data.social,
      environmental: data.environmental,
      reporting_period: data.reporting_period,
      last_updated: data.last_updated,
    };

    // Set active section to first available section
    if (data.governance) activeSection.value = 'governance';
    else if (data.social) activeSection.value = 'social';
    else if (data.environmental) activeSection.value = 'environmental';
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
    <!-- Loading State -->
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

    <!-- Error State -->
    <section
      v-else-if="dashboardError"
      class="rounded-lg border border-danger/25 bg-danger/5 p-5 text-sm font-medium text-danger dark:border-danger/40 dark:bg-danger/10"
    >
      {{ dashboardError }}
    </section>

    <!-- Empty State -->
    <section
      v-else-if="!dashboardData"
      class="rounded-lg border border-slate-200/80 bg-white p-10 text-center text-sm text-slate-500 shadow-sm dark:border-darkmode-600 dark:bg-darkmode-800 dark:text-slate-400"
    >
      داده‌ای برای داشبورد ESG یافت نشد.
    </section>

    <!-- Dashboard Content -->
    <section v-else class="space-y-5">
      <!-- Section Tabs -->
      <div class="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        <button
          v-for="section in (['governance', 'social', 'environmental'] as const)"
          :key="section"
          v-show="dashboardData[section]"
          @click="activeSection = section"
          :class="{
            'border-b-2 border-blue-600 px-4 py-2 font-medium text-blue-600 dark:text-blue-400': activeSection === section,
            'px-4 py-2 text-slate-600 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white': activeSection !== section,
          }"
        >
          {{ t(`esg.sections.${section}`) }}
        </button>
      </div>

      <!-- Active Dashboard -->
      <ESGDashboardNew
        v-if="dashboardData[activeSection]"
        :key="`${activeSection}-${dashboardData.last_updated}`"
        :section="activeSection"
        :dashboard-data="dashboardData"
      />
    </section>
  </div>
</template>
