<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import StatCard from '@/components/dashboard/StatCard.vue';
import DashboardCard from '@/components/dashboard/DashboardCard.vue';
import BarChart, { type BarSeries } from '@/components/dashboard/BarChart.vue';
import Lucide from '@/base-components/Lucide';
import { maturityRepo } from '@/core/repositories/maturityRepo';
import { useQuery } from '@/core/composables/useQuery';
import { toFa } from '@/components/dashboard/helpers';
import { levelColor, levelLabelKey } from '../../levels';
import {
  IconArrowRight,
  IconGauge,
  IconTrendingUp,
  IconTarget,
  IconAlertTriangle,
  IconHistory,
  IconListCheck,
  IconFileCheck,
  IconShield,
} from '@tabler/icons-vue';

interface CapabilityDetail {
  capabilitySlug?: string;
  capabilityTitle?: string;
  capitalTitle?: string;
  domainTitle?: string;
  componentTitle?: string;
  currentMaturityLevel?: number;
  currentScore?: number;
  previousMaturityLevel?: number;
  improvementTrend?: string;
  targetLevel?: number;
  maturityGap?: number;
  maturityStatus?: string;
  historical?: { period: string; maturityLevel: number; score: number }[];
  indicators?: { slug: string; title: string; score: number; status: string; contribution: number }[];
  claims?: { slug: string; title: string; status: string }[];
  weakAreas?: string[];
  relatedRisks?: string[];
}

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const slug = String(route.params.slug ?? '');

const { data, isLoading, error, refetch } = useQuery<{ result: boolean; data: CapabilityDetail }>(
  ['maturity-capability-detail', slug],
  () => maturityRepo.capabilityDetail(slug),
  { staleTime: 60000 },
);

const detail = computed<CapabilityDetail | null>(() => data.value?.data ?? null);
const loading = computed(() => isLoading.value && !data.value);

const accentScore = '#0f766e';
const accentLevel = '#0ea5e9';
const accentTarget = '#8b5cf6';
const accentGap = '#dc2626';

const historicalBars = computed<{ labels: string[]; series: BarSeries[] }>(() => {
  const list = detail.value?.historical ?? [];
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

function trendKey(tr?: string): string {
  return tr === 'up' ? 'maturity.trend-up' : tr === 'down' ? 'maturity.trend-down' : 'maturity.trend-flat';
}
</script>

<template>
  <div class="mx-auto max-w-[1400px]">
    <!-- ===== Header ===== -->
    <header class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-100"
          :title="t('maturity.back-to-list')"
          @click="router.push({ name: 'app-maturity-capabilities' })"
        >
          <IconArrowRight :size="18" />
        </button>
        <div class="min-w-0">
          <h1 class="truncate text-xl font-extrabold text-slate-900">{{ detail?.capabilityTitle ?? t('maturity.detail-title') }}</h1>
          <p class="mt-0.5 text-xs text-slate-500">
            {{ [detail?.capitalTitle, detail?.domainTitle, detail?.componentTitle].filter(Boolean).join(' · ') || t('maturity.detail-title') }}
          </p>
        </div>
      </div>
      <span
        v-if="detail"
        class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
        :class="detail.maturityStatus === 'assessed' ? 'bg-success/15 text-success border border-success/30' : 'bg-slate-100 text-slate-500 border border-slate-200'"
      >
        <span class="relative flex h-2 w-2">
          <span
            class="absolute inline-flex h-full w-full animate-ping rounded-full"
            :class="detail.maturityStatus === 'assessed' ? 'bg-success opacity-60' : 'bg-slate-400 opacity-60'"
          ></span>
          <span class="relative inline-flex h-2 w-2 rounded-full" :class="detail.maturityStatus === 'assessed' ? 'bg-success' : 'bg-slate-400'"></span>
        </span>
        {{ detail.maturityStatus === 'assessed' ? t('maturity.status-assessed') : t('maturity.status-not-assessed') }}
      </span>
    </header>

    <!-- ===== Loading skeleton ===== -->
    <template v-if="loading">
      <section class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div v-for="i in 4" :key="i" class="h-28 animate-pulse rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm"></div>
      </section>
      <div class="mt-4 h-72 animate-pulse rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm"></div>
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
          {{ t('dashboard-page.retry') }}
        </button>
      </div>
    </template>

    <template v-else-if="detail">
      <!-- ===== KPIs ===== -->
      <section class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          :label="t('maturity.current-score')"
          :value="detail.currentScore ?? 0"
          suffix="٪"
          :icon="IconGauge"
          :accent="accentScore"
          :hint="detail.improvementTrend ? t(trendKey(detail.improvementTrend)) : ''"
        />
        <StatCard
          :label="t('maturity.current-level')"
          :value="detail.currentMaturityLevel ?? 0"
          :icon="IconTrendingUp"
          :accent="accentLevel"
          :hint="t(levelLabelKey(detail.currentMaturityLevel ?? 0))"
        />
        <StatCard
          :label="t('maturity.previous-level')"
          :value="detail.previousMaturityLevel ?? 0"
          :icon="IconHistory"
          :accent="accentTarget"
        />
        <StatCard
          :label="t('maturity.target-level')"
          :value="detail.targetLevel ?? 0"
          :icon="IconTarget"
          :accent="accentGap"
          :hint="`${t('maturity.maturity-gap')}: ${toFa(detail.maturityGap ?? 0)}`"
        />
      </section>

      <section class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <!-- Historical trend -->
        <DashboardCard :title="t('maturity.historical')" :subtitle="t('maturity.historical-sub')" :icon="IconHistory" class="lg:col-span-2">
          <BarChart
            v-if="historicalBars.labels.length"
            :labels="historicalBars.labels"
            :series="historicalBars.series"
            show-legend
            :max="100"
            tooltip-suffix=" / 100"
          />
          <p v-else class="py-10 text-center text-sm text-slate-400">{{ t('maturity.no-data') }}</p>
        </DashboardCard>

        <!-- Weak areas -->
        <DashboardCard :title="t('maturity.weak-areas')" :icon="IconAlertTriangle">
          <ul v-if="(detail.weakAreas ?? []).length" class="space-y-2">
            <li
              v-for="(w, i) in detail.weakAreas"
              :key="i"
              class="flex items-start gap-2 rounded-lg bg-danger/10 p-2.5 text-xs text-danger"
            >
              <IconAlertTriangle :size="14" class="mt-0.5 shrink-0" />
              <span>{{ w }}</span>
            </li>
          </ul>
          <p v-else class="py-10 text-center text-sm text-slate-400">{{ t('maturity.no-data') }}</p>
        </DashboardCard>

        <!-- Indicators -->
        <DashboardCard :title="t('maturity.indicators')" :subtitle="t('maturity.indicators-sub')" :icon="IconListCheck" class="lg:col-span-2">
          <ul v-if="(detail.indicators ?? []).length" class="space-y-3">
            <li v-for="ind in detail.indicators" :key="ind.slug">
              <div class="flex items-center justify-between gap-3">
                <p class="truncate text-sm font-medium text-slate-700">{{ ind.title }}</p>
                <span class="shrink-0 text-sm font-extrabold" :class="ind.status === 'contributing' ? 'text-slate-800' : 'text-slate-400'">
                  {{ toFa(ind.score) }}٪
                </span>
              </div>
              <div class="mt-1.5 flex items-center gap-2">
                <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    class="h-full rounded-full transition-all"
                    :style="{
                      width: `${Math.min(100, ind.score)}%`,
                      backgroundColor: ind.status === 'contributing' ? '#0f766e' : '#cbd5e1',
                    }"
                  ></div>
                </div>
                <span class="w-14 shrink-0 text-right text-[10px] text-slate-400">
                  {{ t('maturity.contribution') }} {{ toFa(Math.round((ind.contribution ?? 0) * 100)) }}٪
                </span>
              </div>
            </li>
          </ul>
          <p v-else class="py-10 text-center text-sm text-slate-400">{{ t('maturity.no-data') }}</p>
        </DashboardCard>

        <!-- Claims + risks -->
        <DashboardCard :title="t('maturity.claims')" :subtitle="t('maturity.claims-sub')" :icon="IconFileCheck">
          <ul v-if="(detail.claims ?? []).length" class="space-y-2">
            <li v-for="c in detail.claims" :key="c.slug" class="flex items-start gap-2 text-sm text-slate-700">
              <IconFileCheck :size="15" class="mt-0.5 shrink-0 text-primary" />
              <span>{{ c.title }}</span>
            </li>
          </ul>
          <p v-else class="py-8 text-center text-sm text-slate-400">{{ t('maturity.no-data') }}</p>

          <div v-if="(detail.relatedRisks ?? []).length" class="mt-4 border-t border-slate-100 pt-3">
            <p class="mb-2 text-xs font-semibold text-slate-500">{{ t('maturity.related-risks') }}</p>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="r in detail.relatedRisks"
                :key="r"
                class="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600"
              >
                <IconShield :size="12" class="text-slate-400" />
                {{ r }}
              </span>
            </div>
          </div>
        </DashboardCard>
      </section>
    </template>
  </div>
</template>
