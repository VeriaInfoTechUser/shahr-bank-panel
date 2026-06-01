<script setup lang="ts">
import { computed, onMounted, shallowRef, ref } from 'vue';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart, PieChart, RadarChart } from 'echarts/charts';
import {
  GridComponent,
  LegendComponent,
  RadarComponent,
  TooltipComponent,
} from 'echarts/components';
import { useI18n } from 'vue-i18n';
import { userRepo } from '@/core/repositories/userRepo';
import type {
  EsgDashboardControl,
  EsgDashboardDomain,
  EsgDashboardPayload,
  EsgDashboardPillar,
} from '@/core/repositories/userRepo';

use([
  CanvasRenderer,
  BarChart,
  PieChart,
  RadarChart,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  RadarComponent,
]);

const { t } = useI18n();

const dashboardPayload = shallowRef<EsgDashboardPayload | null>(null);
const dashboardLoading = ref(true);
const dashboardError = ref('');
const activePillarKey = ref<string>('environmental');

const pillarFallbackColors: Record<string, string> = {
  environmental: '#6BCB77',
  social: '#4D96FF',
  governance: '#9B59B6',
};

const unitLabels: Record<string, string> = {
  percent: '%',
  kWh: 'kWh',
  kwh: 'kWh',
  m3: 'm3',
  liter: 'لیتر',
  ton: 'تن',
  tco2e: 'tCO2e',
  kg: 'کیلوگرم',
  hectare: 'هکتار',
  hour: 'ساعت',
  day: 'روز',
  count: 'عدد',
  person: 'نفر',
  employee: 'کارمند',
  rate: 'نرخ',
  ratio: 'نسبت',
  currency: 'ریال',
  kwh_per_employee: 'kWh/کارمند',
  m3_per_unit: 'm3/واحد',
  tco2e_per_unit: 'tCO2e/واحد',
  ton_per_unit: 'تن/واحد',
  hour_per_week: 'ساعت/هفته',
  hour_per_employee: 'ساعت/کارمند',
};

const summary = computed(() => dashboardPayload.value?.summary ?? null);
const pillars = computed(() => dashboardPayload.value?.pillars ?? []);
const activePillar = computed(() => (
  pillars.value.find((pillar) => pillar.key === activePillarKey.value) ?? pillars.value[0] ?? null
));

const summaryKpis = computed(() => {
  const currentSummary = summary.value;
  return [
    {
      key: 'overall_score',
      title: 'امتیاز کل',
      value: formatNumber(currentSummary?.overall_score),
      caption: '/100',
      color: '#2563eb',
    },
    {
      key: 'total_domains',
      title: 'دامنه‌ها',
      value: formatNumber(currentSummary?.total_domains),
      caption: 'دامنه',
      color: '#7c3aed',
    },
    {
      key: 'total_controls',
      title: 'کنترل‌ها',
      value: formatNumber(currentSummary?.total_controls),
      caption: 'کنترل',
      color: '#059669',
    },
  ];
});

function displayText(value?: string, fallback = '-') {
  if (!value) return fallback;
  return value.startsWith('esg.') ? t(value) : value;
}

function formatNumber(value: unknown, maximumFractionDigits = 1) {
  if (value === null || value === undefined || value === '') return '-';
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return String(value);

  return new Intl.NumberFormat('fa-IR', {
    maximumFractionDigits,
  }).format(numericValue);
}

function normalizePercent(value: unknown) {
  const numericValue = Number(value ?? 0);
  if (!Number.isFinite(numericValue)) return 0;
  return Math.min(Math.max(numericValue, 0), 100);
}

function formatControlValue(control: EsgDashboardControl) {
  const value = control.answer;
  const unit = control.answer_unit ?? '';

  if (value === null || value === undefined || value === '') return 'بدون پاسخ';
  if (typeof value === 'boolean') return value ? 'بله' : 'خیر';

  if (unit === 'percent' || control.answer_type === 'percentage') {
    return `${formatNumber(value)}%`;
  }

  if (unit === 'currency') {
    return `${formatNumber(value, 0)} ریال`;
  }

  const label = unitLabels[unit] ?? unit;
  return label ? `${formatNumber(value)} ${label}` : formatNumber(value);
}

function pillarColor(pillar: EsgDashboardPillar) {
  return pillar.color_hex || pillarFallbackColors[pillar.key] || '#64748b';
}

function domainTitle(domain: EsgDashboardDomain) {
  return displayText(domain.title || domain.i18n_key);
}

function domainKey(domain: EsgDashboardDomain) {
  return domain.id ?? domain.slug ?? domain.code ?? domain.title;
}

function domainCompletion(domain: EsgDashboardDomain) {
  return normalizePercent(domain.stats?.completion_score ?? domain.stats?.completion_pct);
}

function controlLabel(control: EsgDashboardControl) {
  return displayText(control.summary || control.title || control.i18n_key);
}

async function loadDashboard() {
  dashboardLoading.value = true;
  dashboardError.value = '';

  try {
    const response = await userRepo.getEsgDashboard();

    if (!response?.result || !response.data) {
      throw new Error('داده‌ای برای داشبورد ESG دریافت نشد.');
    }

    dashboardPayload.value = response.data;
    activePillarKey.value = response.data.pillars?.[0]?.key ?? 'environmental';
  } catch (error) {
    dashboardError.value = error instanceof Error ? error.message : 'خطا در دریافت داشبورد ESG';
  } finally {
    dashboardLoading.value = false;
  }
}

onMounted(loadDashboard);
</script>

<template>
  <div dir="rtl" class="mx-auto max-w-7xl px-1 pb-12 pt-2 md:px-2">
    <section v-if="dashboardLoading" class="space-y-6">
      <div class="grid gap-4 md:grid-cols-3">
        <div
          v-for="item in 3"
          :key="item"
          class="h-32 animate-pulse rounded-lg border border-slate-200/80 bg-white p-5 shadow-sm dark:border-darkmode-600 dark:bg-darkmode-800"
        >
          <div class="mb-5 h-4 w-1/3 rounded bg-slate-200 dark:bg-darkmode-600" />
          <div class="h-8 w-1/2 rounded bg-slate-100 dark:bg-darkmode-700" />
        </div>
      </div>
      <div class="grid gap-5 lg:grid-cols-2">
        <div class="h-[240px] animate-pulse rounded-lg bg-slate-200 dark:bg-darkmode-700" />
        <div class="h-[240px] animate-pulse rounded-lg bg-slate-200 dark:bg-darkmode-700" />
      </div>
      <div class="h-[420px] animate-pulse rounded-lg bg-slate-200 dark:bg-darkmode-700" />
    </section>

    <section
      v-else-if="dashboardError"
      class="rounded-lg border border-danger/25 bg-danger/5 p-5 text-sm font-medium text-danger dark:border-danger/40 dark:bg-danger/10"
    >
      {{ dashboardError }}
    </section>

    <section
      v-else-if="!dashboardPayload"
      class="rounded-lg border border-slate-200/80 bg-white p-10 text-center text-sm text-slate-500 shadow-sm dark:border-darkmode-600 dark:bg-darkmode-800 dark:text-slate-400"
    >
      داده‌ای برای داشبورد ESG یافت نشد.
    </section>

    <template v-else>
      <header class="mb-6 rounded-lg border border-slate-200/80 bg-white p-5 shadow-sm dark:border-darkmode-600 dark:bg-darkmode-800">
        <div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p class="text-sm font-semibold text-primary">{{ t('menu.esg') }}</p>
            <h1 class="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50">
              {{ t('menu.esg-dashboard') }}
            </h1>
          </div>
          <p
            v-if="dashboardPayload.meta?.generated_at"
            class="text-xs text-slate-400 dark:text-slate-500"
          >
            آخرین بروزرسانی: {{ new Date(dashboardPayload.meta.generated_at).toLocaleString('fa-IR') }}
          </p>
        </div>
      </header>

      <section v-if="summary" class="mb-6 space-y-5">
        <div class="grid gap-4 md:grid-cols-3">
          <article
            v-for="kpi in summaryKpis"
            :key="kpi.key"
            class="rounded-lg border border-slate-200/80 bg-white p-5 shadow-sm dark:border-darkmode-600 dark:bg-darkmode-800"
          >
            <p class="text-sm font-medium text-slate-500 dark:text-slate-400">
              {{ kpi.title }}
            </p>
            <div class="mt-4 flex items-end gap-2">
              <strong class="text-3xl font-semibold leading-none" :style="{ color: kpi.color }">
                {{ kpi.value }}
              </strong>
              <span class="text-xs text-slate-400 dark:text-slate-500">{{ kpi.caption }}</span>
            </div>
          </article>
        </div>

        <div class="grid gap-5 lg:grid-cols-2">
          <article class="rounded-lg border border-slate-200/80 bg-white p-5 shadow-sm dark:border-darkmode-600 dark:bg-darkmode-800">
            <h2 class="mb-4 text-base font-semibold text-slate-900 dark:text-slate-50">
              وضعیت تکمیل
            </h2>
            <VChart
              v-if="summary.completion_chart?.echarts_config"
              :option="summary.completion_chart.echarts_config"
              autoresize
              class="h-[200px] w-full"
            />
          </article>

          <article class="rounded-lg border border-slate-200/80 bg-white p-5 shadow-sm dark:border-darkmode-600 dark:bg-darkmode-800">
            <h2 class="mb-4 text-base font-semibold text-slate-900 dark:text-slate-50">
              مقایسه ستون‌های ESG
            </h2>
            <VChart
              v-if="summary.pillar_compare_chart?.echarts_config"
              :option="summary.pillar_compare_chart.echarts_config"
              autoresize
              class="h-[200px] w-full"
            />
          </article>
        </div>
      </section>

      <section v-if="pillars.length" class="space-y-6">
        <div class="overflow-x-auto border-b border-slate-200/80 pb-3 dark:border-darkmode-600">
          <div class="flex min-w-max gap-2">
            <button
              v-for="pillar in pillars"
              :key="pillar.key"
              type="button"
              class="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition"
              :class="activePillarKey === pillar.key
                ? 'border-transparent bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-950'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-darkmode-600 dark:bg-darkmode-800 dark:text-slate-300'"
              @click="activePillarKey = pillar.key"
            >
              <span
                class="h-2.5 w-2.5 rounded-full"
                :style="{ backgroundColor: pillarColor(pillar) }"
              />
              {{ displayText(pillar.i18n_key, pillar.key) }}
            </button>
          </div>
        </div>

        <article
          v-if="activePillar"
          :key="activePillar.key"
          class="rounded-lg border border-slate-200/80 bg-white shadow-sm dark:border-darkmode-600 dark:bg-darkmode-800"
        >
          <div class="flex flex-col gap-4 border-b border-slate-200/70 p-5 dark:border-darkmode-600 md:flex-row md:items-center md:justify-between">
            <div>
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400">
                ستون ESG
              </p>
              <h2 class="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-50">
                {{ displayText(activePillar.i18n_key, activePillar.key) }}
              </h2>
            </div>
            <div
              class="inline-flex w-fit items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold"
              :style="{
                color: pillarColor(activePillar),
                backgroundColor: `${pillarColor(activePillar)}20`,
              }"
            >
              <span>{{ formatNumber(activePillar.stats?.completion_score ?? summary?.pillar_scores?.[activePillar.key]?.score) }}</span>
              <span>/100</span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-5 p-5">
            <div class="col-span-2 rounded-lg border border-slate-200/70 bg-slate-50 p-4 dark:border-darkmode-600 dark:bg-darkmode-700/30">
              <h3 class="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-50">
                امتیاز دامنه‌ها
              </h3>
              <VChart
                v-if="activePillar.radar_chart?.echarts_config"
                :option="activePillar.radar_chart.echarts_config"
                autoresize
                class="h-[280px] w-full"
              />
            </div>

            <article
              v-for="domain in activePillar.domains"
              :key="domainKey(domain)"
              v-memo="[domain.id, domain.slug, domain.stats?.completion_score, domain.chart?.echarts_config]"
              class="rounded-lg border border-slate-200/80 bg-white p-4 shadow-sm dark:border-darkmode-600 dark:bg-darkmode-800"
            >
              <div class="mb-4 flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <h3 class="text-sm font-semibold leading-6 text-slate-900 dark:text-slate-50">
                    {{ domainTitle(domain) }}
                  </h3>
                  <p class="mt-1 text-xs font-medium text-slate-400 dark:text-slate-500" dir="ltr">
                    {{ domain.code }}
                  </p>
                </div>
                <span
                  class="shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold"
                  :style="{
                    color: pillarColor(activePillar),
                    backgroundColor: `${pillarColor(activePillar)}1f`,
                  }"
                >
                  {{ formatNumber(domainCompletion(domain)) }}%
                </span>
              </div>

              <div class="mb-4">
                <div class="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-darkmode-700">
                  <div
                    class="h-full rounded-full"
                    :style="{
                      width: `${domainCompletion(domain)}%`,
                      backgroundColor: pillarColor(activePillar),
                    }"
                  />
                </div>
              </div>

              <VChart
                v-if="domain.chart?.echarts_config"
                :option="domain.chart.echarts_config"
                autoresize
                class="h-[220px] w-full"
              />

              <div class="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-100 dark:divide-darkmode-600 dark:border-darkmode-600">
                <div
                  v-for="control in domain.controls"
                  :key="control.id ?? control.slug ?? control.metric_code"
                  class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-2 text-xs"
                >
                  <span class="min-w-0 truncate text-slate-600 dark:text-slate-300">
                    {{ controlLabel(control) }}
                  </span>
                  <span class="whitespace-nowrap font-semibold text-slate-900 dark:text-slate-50">
                    {{ formatControlValue(control) }}
                  </span>
                </div>
              </div>
            </article>
          </div>
        </article>
      </section>
    </template>
  </div>
</template>
