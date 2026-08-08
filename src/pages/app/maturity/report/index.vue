<script setup lang="ts">
import { computed, ref } from 'vue';
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
  IconFileReport,
  IconGauge,
  IconTrendingUp,
  IconRefresh,
  IconCircleCheck,
  IconAlertTriangle,
  IconTarget,
} from '@tabler/icons-vue';

interface ReportData {
  reportType?: string;
  date_from?: string;
  date_to?: string;
  period_type?: string;
  overallMaturityLevel?: number;
  overallScore?: number;
  keyStrengths?: string[];
  majorGaps?: string[];
  improvementPriorities?: string[];
  capabilitySummary?: {
    capabilitySlug: string;
    capabilityTitle: string;
    domainSlug: string;
    score: number;
    maturityLevel: number;
    gap: number;
  }[];
  improvementPriority?: {
    capabilitySlug: string;
    capabilityTitle: string;
    gap: number;
    priority: string;
    recommendation: string;
  }[];
  distribution?: { level: number; count: number }[];
  trend?: { period: string; score: number; maturityLevel: number }[];
}

const { t } = useI18n();

const reportTypes = ['executive', 'capital', 'domain', 'capability', 'comparison'] as const;
const type = ref<(typeof reportTypes)[number]>('executive');
const period = ref<{ type: string; startDate: string; endDate: string } | null>(null);
const requested = ref(false);

const { data, isLoading, refetch } = useQuery<{ result: boolean; data: ReportData }>(
  ['maturity-report', type.value, period.value?.startDate, period.value?.endDate, requested.value],
  () =>
    maturityRepo.report(type.value, {
      period_type: period.value?.type ?? 'YEARLY',
      date_from: period.value?.startDate ?? undefined,
      date_to: period.value?.endDate ?? undefined,
    }),
  { enabled: requested.value, staleTime: 0 },
);

function generate() {
  requested.value = true;
  refetch();
}

function typeKey(tp: string): string {
  return `maturity.type-${tp}`;
}

const report = computed<ReportData | null>(() => data.value?.data ?? null);
const loading = computed(() => isLoading.value);

const accentScore = '#0f766e';
const accentLevel = '#0ea5e9';

const distLabels = computed<Record<string, string>>(() =>
  Object.fromEntries([1, 2, 3, 4, 5].map((l) => [String(l), t(levelLabelKey(l))])),
);
const distColors = computed<Record<string, string>>(() =>
  Object.fromEntries([1, 2, 3, 4, 5].map((l) => [String(l), levelColor(l)])),
);
const distributionDonut = computed(() =>
  (report.value?.distribution ?? []).map((x) => ({ key: String(x.level), count: x.count })),
);

const trendBars = computed<{ labels: string[]; series: BarSeries[] }>(() => {
  const list = report.value?.trend ?? [];
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

function priorityTone(p: string): string {
  return p === 'high'
    ? 'bg-danger/15 text-danger border-danger/30'
    : p === 'medium'
      ? 'bg-warning/15 text-warning border-warning/30'
      : 'bg-success/15 text-success border-success/30';
}
function priorityKey(p: string): string {
  return p === 'high' ? 'maturity.priority-high' : p === 'medium' ? 'maturity.priority-medium' : 'maturity.priority-low';
}
</script>

<template>
  <div class="mx-auto max-w-[1400px]">
    <!-- ===== Header + controls ===== -->
    <header class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-muted text-primary">
          <IconFileReport :size="26" />
        </span>
        <div class="min-w-0">
          <h1 class="text-xl font-extrabold text-slate-900">{{ t('maturity.report-title') }}</h1>
          <p class="mt-0.5 text-xs text-slate-500">{{ t('maturity.report-subtitle') }}</p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
          <label class="text-xs font-medium text-slate-500">{{ t('maturity.report-type') }}</label>
          <select
            v-model="type"
            class="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 outline-none focus:border-primary"
          >
            <option v-for="tp in reportTypes" :key="tp" :value="tp">{{ t(typeKey(tp)) }}</option>
          </select>
        </div>
        <div class="w-56 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
          <PeriodSelectPanel
            v-model="period"
            :placeholder="t('maturity.period')"
            :label="period ? `${t('reports.period-type.yearly')} · ${toFa(period.startDate.slice(0, 4))}` : ''"
            :types="['YEARLY']"
          />
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover disabled:opacity-60"
          :disabled="loading"
          @click="generate"
        >
          <IconRefresh :size="16" :class="loading ? 'animate-spin' : ''" />
          {{ loading ? t('maturity.generating') : t('maturity.generate') }}
        </button>
      </div>
    </header>

    <!-- ===== Result ===== -->
    <template v-if="report">
      <section class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          :label="t('maturity.overall-score')"
          :value="report.overallScore ?? 0"
          suffix="٪"
          :icon="IconGauge"
          :accent="accentScore"
        />
        <StatCard
          :label="t('maturity.overall-level')"
          :value="report.overallMaturityLevel ?? 0"
          :icon="IconTrendingUp"
          :accent="accentLevel"
          :hint="t(levelLabelKey(report.overallMaturityLevel ?? 0))"
        />
      </section>

      <section class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <DashboardCard :title="t('maturity.key-strengths')" :subtitle="t('maturity.key-strengths-sub')" :icon="IconCircleCheck">
          <ul v-if="(report.keyStrengths ?? []).length" class="space-y-2">
            <li v-for="(s, i) in report.keyStrengths" :key="i" class="flex items-start gap-2 text-sm text-slate-700">
              <IconCircleCheck :size="15" class="mt-0.5 shrink-0 text-success" />
              <span>{{ s }}</span>
            </li>
          </ul>
          <p v-else class="py-8 text-center text-sm text-slate-400">{{ t('maturity.no-data') }}</p>
        </DashboardCard>

        <DashboardCard :title="t('maturity.major-gaps')" :subtitle="t('maturity.major-gaps-sub')" :icon="IconAlertTriangle">
          <ul v-if="(report.majorGaps ?? []).length" class="space-y-2">
            <li v-for="(g, i) in report.majorGaps" :key="i" class="flex items-start gap-2 text-sm text-danger">
              <IconAlertTriangle :size="15" class="mt-0.5 shrink-0" />
              <span>{{ g }}</span>
            </li>
          </ul>
          <p v-else class="py-8 text-center text-sm text-slate-400">{{ t('maturity.no-data') }}</p>
        </DashboardCard>

        <DashboardCard :title="t('maturity.improvement-priorities')" :subtitle="t('maturity.improvement-priorities-sub')" :icon="IconTarget">
          <ul v-if="(report.improvementPriorities ?? []).length" class="space-y-2">
            <li v-for="(p, i) in report.improvementPriorities" :key="i" class="flex items-start gap-2 text-sm text-slate-700">
              <IconTarget :size="15" class="mt-0.5 shrink-0 text-warning" />
              <span>{{ p }}</span>
            </li>
          </ul>
          <p v-else class="py-8 text-center text-sm text-slate-400">{{ t('maturity.no-data') }}</p>
        </DashboardCard>
      </section>

      <section class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <!-- Capability summary table -->
        <DashboardCard :title="t('maturity.capability-summary')" :subtitle="t('maturity.capability-summary-sub')" :icon="IconGauge" class="lg:col-span-2">
          <div v-if="(report.capabilitySummary ?? []).length" class="overflow-x-auto">
            <table class="w-full border-collapse text-sm">
              <thead>
                <tr class="border-b border-slate-200 text-right">
                  <th class="px-3 py-2 text-[11px] font-medium text-slate-500">{{ t('maturity.col-capability') }}</th>
                  <th class="px-3 py-2 text-center text-[11px] font-medium text-slate-500">{{ t('maturity.col-score') }}</th>
                  <th class="px-3 py-2 text-center text-[11px] font-medium text-slate-500">{{ t('maturity.col-level') }}</th>
                  <th class="px-3 py-2 text-center text-[11px] font-medium text-slate-500">{{ t('maturity.col-gap') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="c in report.capabilitySummary" :key="c.capabilitySlug">
                  <td class="px-3 py-2 text-slate-700">{{ c.capabilityTitle }}</td>
                  <td class="px-3 py-2 text-center font-bold text-slate-800">{{ toFa(c.score) }}٪</td>
                  <td class="px-3 py-2 text-center">
                    <span
                      class="inline-flex min-w-[2.25rem] items-center justify-center rounded-md px-2 py-0.5 text-xs font-bold text-white"
                      :style="{ backgroundColor: levelColor(c.maturityLevel) }"
                    >L{{ toFa(c.maturityLevel) }}</span>
                  </td>
                  <td class="px-3 py-2 text-center">
                    <span v-if="c.gap > 0" class="font-bold" style="color: #dc2626">-{{ toFa(c.gap) }}</span>
                    <span v-else class="text-slate-300">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="py-8 text-center text-sm text-slate-400">{{ t('maturity.no-data') }}</p>
        </DashboardCard>

        <!-- Distribution + trend -->
        <div class="space-y-4">
          <DashboardCard :title="t('maturity.distribution-title')" :icon="IconGauge">
            <DonutChart
              v-if="distributionDonut.length"
              :data="distributionDonut"
              :labels="distLabels"
              :colors="distColors"
              :order="['5', '4', '3', '2', '1']"
              :item-word="t('maturity.col-capability')"
              :center-label="t('maturity.assessed-capabilities')"
            />
            <p v-else class="py-8 text-center text-sm text-slate-400">{{ t('maturity.no-data') }}</p>
          </DashboardCard>

          <DashboardCard :title="t('maturity.trend')" :icon="IconTrendingUp">
            <BarChart
              v-if="trendBars.labels.length"
              :labels="trendBars.labels"
              :series="trendBars.series"
              show-legend
              :max="100"
              tooltip-suffix=" / 100"
            />
            <p v-else class="py-8 text-center text-sm text-slate-400">{{ t('maturity.no-data') }}</p>
          </DashboardCard>
        </div>
      </section>
    </template>

    <div v-else-if="!loading" class="mt-10 text-center text-sm text-slate-400">
      <IconFileReport :size="32" class="mx-auto mb-2 text-slate-300" />
      {{ t('maturity.report-subtitle') }}
    </div>
  </div>
</template>
