<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import StatCard from '@/components/dashboard/StatCard.vue';
import DashboardCard from '@/components/dashboard/DashboardCard.vue';
import BarChart, { type BarSeries } from '@/components/dashboard/BarChart.vue';
import DonutChart from '@/components/dashboard/DonutChart.vue';
import PeriodSelectPanel from '@/components/PeriodSelectPanel.vue';
import { maturityRepo } from '@/core/repositories/maturityRepo';
import { useQuery } from '@/core/composables/useQuery';
import { toFa } from '@/components/dashboard/helpers';
import { levelColor, levelLabelKey } from '../levels';
import {
  IconGauge,
  IconTrendingUp,
  IconCircleCheck,
  IconBuildingBank,
  IconRefresh,
  IconArrowUpRight,
  IconArrowDownRight,
  IconAlertTriangle,
} from '@tabler/icons-vue';

interface DashboardData {
  kpis?: {
    overallMaturityLevel?: number;
    overallScore?: number;
    assessedCapabilities?: number;
    evaluatedCapitals?: number;
    improvementTrend?: string;
    trendDelta?: number;
  };
  capitalMaturity?: { capitalSlug: string; capitalTitle: string; level: number; score: number }[];
  domainMaturity?: { domainSlug: string; domainTitle: string; level: number; score: number }[];
  distribution?: { level: number; count: number }[];
  trend?: { period: string; score: number; maturityLevel: number }[];
  improvementOpportunities?: {
    capabilitySlug: string;
    capabilityTitle: string;
    currentLevel: number;
    targetLevel: number;
    gap: number;
    priority: string;
  }[];
  capabilityRanking?: {
    capabilitySlug: string;
    capabilityTitle: string;
    capitalSlug: string;
    domainSlug: string;
    score: number;
    maturityLevel: number;
    trend: string;
  }[];
  periodSummary?: { period: string; score: number; maturityLevel: number }[];
}

const { t } = useI18n();

const period = ref<{ type: string; startDate: string; endDate: string } | null>(null);

const { data, isLoading, error, refetch, invalidate } = useQuery<{ result: boolean; data: DashboardData }>(
  ['maturity-dashboard', period.value?.type, period.value?.startDate, period.value?.endDate],
  () =>
    maturityRepo.dashboard({
      period_type: period.value?.type ?? 'YEARLY',
      date_from: period.value?.startDate ?? undefined,
      date_to: period.value?.endDate ?? undefined,
    }),
  { staleTime: 60000 },
);

watch(
  period,
  () => {
    invalidate();
    refetch();
  },
  { deep: true },
);

const d = computed<DashboardData | null>(() => data.value?.data ?? null);
const kpis = computed(() => d.value?.kpis ?? {});
const loading = computed(() => isLoading.value && !data.value);

// ---------- KPI accents (brand palette) ----------
const accentScore = '#0f766e';
const accentLevel = '#0ea5e9';
const accentCapabilities = '#8b5cf6';
const accentCapitals = '#f59e0b';

// ---------- Capital maturity (horizontal bar) ----------
const capitalBars = computed<{ labels: string[]; series: BarSeries[] }>(() => {
  const list = [...(d.value?.capitalMaturity ?? [])].sort((a, b) => a.score - b.score);
  return {
    labels: list.map((c) => c.capitalTitle),
    series: [
      {
        name: t('maturity.score'),
        values: list.map((c) => c.score),
        color: list.map((c) => levelColor(c.level)),
        valueLabels: true,
      },
    ],
  };
});

// ---------- Domain maturity (vertical bar) ----------
const domainBars = computed<{ labels: string[]; series: BarSeries[] }>(() => {
  const list = [...(d.value?.domainMaturity ?? [])].sort((a, b) => b.score - a.score);
  return {
    labels: list.map((x) => x.domainTitle),
    series: [
      {
        name: t('maturity.score'),
        values: list.map((x) => x.score),
        color: list.map((x) => levelColor(x.level)),
        valueLabels: true,
      },
    ],
  };
});

// ---------- Level distribution (donut) ----------
const distLabels = computed<Record<string, string>>(() =>
  Object.fromEntries([1, 2, 3, 4, 5].map((l) => [String(l), t(levelLabelKey(l))])),
);
const distColors = computed<Record<string, string>>(() =>
  Object.fromEntries([1, 2, 3, 4, 5].map((l) => [String(l), levelColor(l)])),
);
const distributionDonut = computed(() =>
  (d.value?.distribution ?? []).map((x) => ({ key: String(x.level), count: x.count })),
);

// ---------- Trend (bar) ----------
const trendBars = computed<{ labels: string[]; series: BarSeries[] }>(() => {
  const list = d.value?.trend ?? [];
  return {
    labels: list.map((p) => toFa(p.period)),
    series: [
      {
        name: t('maturity.score'),
        values: list.map((p) => p.score),
        color: list.map((p) => levelColor(p.maturityLevel)),
        valueLabels: true,
      },
    ],
  };
});

// ---------- Ranking (top 10) ----------
const ranking = computed(() => (d.value?.capabilityRanking ?? []).slice(0, 10));

const trendIcon = computed(() =>
  kpis.value.improvementTrend === 'up' ? IconArrowUpRight : IconArrowDownRight,
);
const trendTone = computed(() =>
  kpis.value.improvementTrend === 'up' ? 'text-success' : 'text-danger',
);

function priorityKey(p: string): string {
  return p === 'high' ? 'maturity.priority-high' : p === 'medium' ? 'maturity.priority-medium' : 'maturity.priority-low';
}
function priorityTone(p: string): string {
  return p === 'high'
    ? 'bg-danger/15 text-danger border-danger/30'
    : p === 'medium'
      ? 'bg-warning/15 text-warning border-warning/30'
      : 'bg-success/15 text-success border-success/30';
}
function trendKey(tr: string): string {
  return tr === 'up' ? 'maturity.trend-up' : tr === 'down' ? 'maturity.trend-down' : 'maturity.trend-flat';
}
</script>

<template>
  <div class="mx-auto max-w-[1400px]">
    <!-- ===== Header ===== -->
    <header class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-muted text-primary">
          <IconTrendingUp :size="26" />
        </span>
        <div class="min-w-0">
          <h1 class="text-xl font-extrabold text-slate-900">{{ t('maturity.dashboard-title') }}</h1>
          <p class="mt-0.5 text-xs text-slate-500">{{ t('maturity.dashboard-subtitle') }}</p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <div class="w-64 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
          <PeriodSelectPanel
            v-model="period"
            :placeholder="t('maturity.period')"
            :label="period ? `${t('reports.period-type.yearly')} · ${toFa(period.startDate.slice(0, 4))}` : ''"
            :types="['YEARLY']"
          />
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
          :disabled="loading"
          @click="refetch"
        >
          <IconRefresh :size="18" :class="loading ? 'animate-spin' : ''" />
          {{ t('dashboard-page.retry') }}
        </button>
      </div>
    </header>

    <!-- ===== Loading skeleton ===== -->
    <template v-if="loading">
      <section class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div v-for="i in 4" :key="i" class="h-28 animate-pulse rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm"></div>
      </section>
      <section class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div v-for="i in 4" :key="i" class="h-72 animate-pulse rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm"></div>
      </section>
    </template>

    <!-- ===== Error state ===== -->
    <template v-else-if="error">
      <div class="mt-10 rounded-xl border border-danger/30 bg-danger/5 p-10 text-center">
        <IconAlertTriangle :size="36" class="mx-auto mb-3 text-danger" />
        <p class="text-sm font-semibold text-danger">{{ t('dashboard-page.load-error') }}</p>
        <p class="mt-1 text-xs text-slate-500">{{ error?.message }}</p>
        <button
          type="button"
          class="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          @click="refetch"
        >
          <IconRefresh :size="16" />
          {{ t('dashboard-page.retry') }}
        </button>
      </div>
    </template>

    <template v-else-if="d">
      <!-- ===== KPIs ===== -->
      <section class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          :label="t('maturity.overall-score')"
          :value="kpis.overallScore ?? 0"
          suffix="٪"
          :icon="IconGauge"
          :accent="accentScore"
          :hint="t('maturity.overall-level') + ' ' + toFa(kpis.overallMaturityLevel ?? 0)"
        />
        <StatCard
          :label="t('maturity.overall-level')"
          :value="kpis.overallMaturityLevel ?? 0"
          :icon="IconTrendingUp"
          :accent="accentLevel"
          :hint="t(levelLabelKey(kpis.overallMaturityLevel ?? 0))"
        />
        <StatCard
          :label="t('maturity.assessed-capabilities')"
          :value="kpis.assessedCapabilities ?? 0"
          :icon="IconCircleCheck"
          :accent="accentCapabilities"
        />
        <StatCard
          :label="t('maturity.evaluated-capitals')"
          :value="kpis.evaluatedCapitals ?? 0"
          :icon="IconBuildingBank"
          :accent="accentCapitals"
          :hint="kpis.improvementTrend ? `${t(trendKey(kpis.improvementTrend))} ${toFa(kpis.trendDelta ?? 0)}` : ''"
        />
      </section>

      <!-- ===== Charts ===== -->
      <section class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DashboardCard :title="t('maturity.capital-maturity')" :subtitle="t('maturity.capital-maturity-sub')" :icon="IconBuildingBank">
          <BarChart
            v-if="capitalBars.labels.length"
            :labels="capitalBars.labels"
            :series="capitalBars.series"
            horizontal
            show-legend
            :max="100"
            tooltip-suffix=" / 100"
          />
          <p v-else class="py-10 text-center text-sm text-slate-400">{{ t('maturity.no-data') }}</p>
        </DashboardCard>

        <DashboardCard :title="t('maturity.distribution')" :subtitle="t('maturity.distribution-sub')" :icon="IconGauge">
          <DonutChart
            v-if="distributionDonut.length"
            :data="distributionDonut"
            :labels="distLabels"
            :colors="distColors"
            :order="['5', '4', '3', '2', '1']"
            :item-word="t('maturity.col-capability')"
            :center-label="t('maturity.assessed-capabilities')"
          />
          <p v-else class="py-10 text-center text-sm text-slate-400">{{ t('maturity.no-data') }}</p>
        </DashboardCard>

        <DashboardCard :title="t('maturity.domain-maturity')" :subtitle="t('maturity.domain-maturity-sub')" :icon="IconBuildingBank">
          <BarChart
            v-if="domainBars.labels.length"
            :labels="domainBars.labels"
            :series="domainBars.series"
            show-legend
            zoom
            :max="100"
            tooltip-suffix=" / 100"
          />
          <p v-else class="py-10 text-center text-sm text-slate-400">{{ t('maturity.no-data') }}</p>
        </DashboardCard>

        <DashboardCard :title="t('maturity.trend')" :subtitle="t('maturity.trend-sub')" :icon="IconTrendingUp">
          <BarChart
            v-if="trendBars.labels.length"
            :labels="trendBars.labels"
            :series="trendBars.series"
            show-legend
            :max="100"
            tooltip-suffix=" / 100"
          />
          <p v-else class="py-10 text-center text-sm text-slate-400">{{ t('maturity.no-data') }}</p>
        </DashboardCard>
      </section>

      <!-- ===== Tables ===== -->
      <section class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DashboardCard :title="t('maturity.improvement-opportunities')" :subtitle="t('maturity.improvement-opportunities-sub')" :icon="IconTrendingUp">
          <ul v-if="(d.improvementOpportunities ?? []).length" class="divide-y divide-slate-100">
            <li v-for="op in d.improvementOpportunities!.slice(0, 8)" :key="op.capabilitySlug" class="flex items-center justify-between gap-3 py-2.5">
              <div class="min-w-0">
                <p class="truncate text-sm font-medium text-slate-800">{{ op.capabilityTitle }}</p>
                <p class="mt-0.5 text-[11px] text-slate-400">
                  {{ t('maturity.current-level') }} {{ toFa(op.currentLevel) }} ← {{ t('maturity.target') }} {{ toFa(op.targetLevel) }}
                </p>
              </div>
              <div class="flex shrink-0 items-center gap-2">
                <span class="rounded-full px-2.5 py-1 text-[11px] font-semibold" :class="priorityTone(op.priority)">
                  {{ t(priorityKey(op.priority)) }}
                </span>
                <span class="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">-{{ toFa(op.gap) }}</span>
              </div>
            </li>
          </ul>
          <p v-else class="py-10 text-center text-sm text-slate-400">{{ t('maturity.no-data') }}</p>
        </DashboardCard>

        <DashboardCard :title="t('maturity.capability-ranking')" :subtitle="t('maturity.capability-ranking-sub')" :icon="IconBuildingBank">
          <ul v-if="ranking.length" class="divide-y divide-slate-100">
            <li
              v-for="(c, i) in ranking"
              :key="c.capabilitySlug"
              class="flex items-center justify-between gap-3 py-2.5"
            >
              <div class="flex min-w-0 items-center gap-3">
                <span
                  class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold"
                  :style="{ backgroundColor: levelColor(c.maturityLevel) + '1a', color: levelColor(c.maturityLevel) }"
                >{{ toFa(i + 1) }}</span>
                <p class="truncate text-sm font-medium text-slate-800">{{ c.capabilityTitle }}</p>
              </div>
              <div class="flex shrink-0 items-center gap-2">
                <span class="rounded-md px-2 py-1 text-xs font-bold text-white" :style="{ backgroundColor: levelColor(c.maturityLevel) }">
                  L{{ toFa(c.maturityLevel) }}
                </span>
                <span class="text-sm font-extrabold text-slate-700">{{ toFa(c.score) }}</span>
              </div>
            </li>
          </ul>
          <p v-else class="py-10 text-center text-sm text-slate-400">{{ t('maturity.no-data') }}</p>
        </DashboardCard>
      </section>
    </template>
  </div>
</template>
