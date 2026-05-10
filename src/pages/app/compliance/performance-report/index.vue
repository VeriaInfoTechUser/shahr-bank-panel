<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuery } from '@/core/composables/useQuery';
import { ermRepo } from '@/core/repositories/ermRepo';
import Lucide from '@/base-components/Lucide/Lucide.vue';
import Button from '@/base-components/Button';
import PerformancePieChart from './PerformancePieChart.vue';
import DailyPerformanceChart from './DailyPerformanceChart.vue';
import ComplianceFilterToolbar from '../dashboard/ComplianceFilterToolbar.vue';
import { useBreadcrumbSlot } from '@/composables/useBreadcrumb';

const { t } = useI18n();
const { setContent: setBreadcrumbSlot } = useBreadcrumbSlot();

// Initialize filters from a stable source
const filters = ref<Record<string, unknown>>({});
const isInitialized = ref(false);

// Track filter changes and refetch the performance report when filters update
watch(
  filters,
  (newFilters, oldFilters) => {
    if (!isInitialized.value) return;
    if (JSON.stringify(newFilters) === JSON.stringify(oldFilters)) return;

    invalidate();
    refetch?.();
  },
  { deep: true }
);

interface PerformanceMetric {
  title: string;
  description: string;
  total: number;
  count: number;
  percent: string;
}

interface PieItem {
  title: string;
  value: string;
  count: number;
  color?: string;
}

interface DailyItem {
  title: string;
  todo: number;
  approve: number;
}

interface DailyData {
  title: string;
  count: number;
  list: DailyItem[];
}

interface CompliancePerformanceResponse {
  done?: PerformanceMetric;
  reject?: PerformanceMetric;
  approve?: PerformanceMetric;
  pie?: PieItem[];
  daily?: DailyData;
}

const {
  data: performanceData,
  isLoading,
  error,
  refetch,
  invalidate,
} = useQuery(
  ['compliance-performance-report', filters],
  () => ermRepo.compliancePerformance(filters.value) as Promise<CompliancePerformanceResponse>,
  {
    enabled: true,
    staleTime: 300000,
    refetchOnMount: true,
  }
);

const summaryCards = computed(() => {
  const data = performanceData.value;
  if (!data) return [];

  return [
    {
      key: 'done',
      icon: 'ClipboardCheck',
      accent: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-500/15',
      metric: data.done,
    },
    {
      key: 'approve',
      icon: 'BadgeCheck',
      accent: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-100 dark:bg-green-500/15',
      metric: data.approve,
    },
    {
      key: 'reject',
      icon: 'ShieldX',
      accent: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-100 dark:bg-red-500/15',
      metric: data.reject,
    },
  ].filter((item) => item.metric);
});

const pieItems = computed(() => performanceData.value?.pie || []);
const daily = computed(() => performanceData.value?.daily);

const totalTracked = computed(() =>
  summaryCards.value[0]?.metric?.total || pieItems.value.reduce((sum, item) => sum + (item.count || 0), 0)
);

const totalApproved = computed(() => performanceData.value?.approve?.count || 0);
const totalDone = computed(() => performanceData.value?.done?.count || 0);
const totalRejected = computed(() => performanceData.value?.reject?.count || 0);

const approvalRate = computed(() => performanceData.value?.approve?.percent || '0.00');

const busiestStatus = computed(() =>
  [...pieItems.value].sort((a, b) => (b.count || 0) - (a.count || 0))[0]
);

const insights = computed(() => [
  {
    icon: 'Layers3',
    label: t('compliance-performance.total-workload'),
    value: t('compliance-performance.items-count', { count: totalTracked.value }),
  },
  {
    icon: 'TrendingUp',
    label: t('compliance-performance.approval-rate'),
    value: t('compliance-performance.percent-value', { percent: approvalRate.value }),
  },
  {
    icon: 'Timer',
    label: t('compliance-performance.current-bottleneck'),
    value: busiestStatus.value?.title || '-',
  },
  {
    icon: 'CheckCheck',
    label: t('compliance-performance.finalized-items'),
    value: t('compliance-performance.items-count', { count: totalDone.value + totalApproved.value + totalRejected.value }),
  },
]);

function handleRetry() {
  refetch?.();
}

function replaceFilters(newFilters: Record<string, unknown>) {
  filters.value = newFilters;
  isInitialized.value = true;
}

function clearFilters() {
  filters.value = {};
  isInitialized.value = true;
}

onMounted(() => {
  isInitialized.value = true;
  setBreadcrumbSlot(null);
});

onUnmounted(() => {
  // Reset filters and invalidate cache when navigating away
  filters.value = {};
  isInitialized.value = false;
  invalidate();
});
</script>

<template>
  <div class="mx-auto max-w-7xl px-1 pb-12 pt-2 md:px-2">
    <header class="mb-8 md:mb-10">
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div
            class="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 shadow-sm ring-1 ring-primary/20 dark:from-primary/25 dark:via-primary/15 dark:ring-primary/30"
          >
            <Lucide icon="BarChart3" class="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-50">
              {{ t('menu.performance-report') }}
            </h1>
            <p class="text-sm text-slate-500 dark:text-slate-400">
              {{ t('compliance-performance.subtitle') }}
            </p>
          </div>
        </div>
        <ComplianceFilterToolbar
          :table="{
            replaceFilters,
            clearFilters,
            filters
          }"
        />
      </div>
    </header>

    <div v-if="isLoading" class="space-y-6">
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div
          v-for="i in 3"
          :key="`summary-skeleton-${i}`"
          class="animate-pulse rounded-2xl border border-slate-200/90 bg-slate-50/80 p-6 dark:border-darkmode-600 dark:bg-darkmode-800/80"
        >
          <div class="mb-4 h-10 w-10 rounded-2xl bg-slate-200 dark:bg-darkmode-600" />
          <div class="mb-3 h-4 w-32 rounded bg-slate-200 dark:bg-darkmode-600" />
          <div class="mb-2 h-8 w-20 rounded bg-slate-300 dark:bg-darkmode-600" />
          <div class="h-3 w-full rounded bg-slate-200 dark:bg-darkmode-600" />
        </div>
      </div>
      <div class="grid gap-6 xl:grid-cols-2">
        <div
          v-for="i in 2"
          :key="`chart-skeleton-${i}`"
          class="animate-pulse rounded-2xl border border-slate-200/90 bg-slate-50/80 p-6 dark:border-darkmode-600 dark:bg-darkmode-800/80"
        >
          <div class="mb-4 h-6 w-40 rounded bg-slate-200 dark:bg-darkmode-600" />
          <div class="h-72 rounded bg-slate-200 dark:bg-darkmode-600" />
        </div>
      </div>
    </div>

    <div
      v-else-if="error"
      class="rounded-2xl border border-danger/25 bg-danger/5 p-6 text-center dark:border-danger/40 dark:bg-danger/10"
    >
      <div class="mb-4 flex justify-center">
        <Lucide icon="AlertTriangle" class="h-8 w-8 text-danger" />
      </div>
      <h2 class="mb-2 font-semibold text-danger">
        {{ t('compliance-performance.error-title') }}
      </h2>
      <p class="mb-6 text-sm text-slate-600 dark:text-slate-300">
        {{ error.message || t('compliance-performance.error-message') }}
      </p>
      <Button variant="secondary" size="sm" @click="handleRetry">
        <template #icon>
          <Lucide icon="RotateCw" class="h-4 w-4" />
        </template>
        {{ t('general.retry') }}
      </Button>
    </div>

    <div v-else-if="performanceData" class="space-y-6">
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div
          v-for="insight in insights"
          :key="insight.label"
          class="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-darkmode-600 dark:bg-darkmode-800"
        >
          <div class="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-darkmode-700 dark:text-slate-200">
            <Lucide :icon="insight.icon" class="h-5 w-5" />
          </div>
          <p class="text-xs font-medium text-slate-500 dark:text-slate-400">
            {{ insight.label }}
          </p>
          <p class="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-50">
            {{ insight.value }}
          </p>
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div
          v-for="card in summaryCards"
          :key="card.key"
          class="group stat relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md dark:border-darkmode-600 dark:bg-darkmode-800 dark:hover:border-darkmode-500"
        >
          <div class="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-50/0 to-slate-50/80 opacity-0 transition group-hover:opacity-100 dark:from-transparent dark:to-darkmode-900/40" />
          <div :class="['stat-figure relative', card.accent]">
            <div :class="['flex h-12 w-12 items-center justify-center rounded-2xl', card.bg]">
              <Lucide :icon="card.icon" class="h-5 w-5" />
            </div>
          </div>
          <div class="stat-title relative text-sm font-medium text-slate-600 dark:text-slate-400">
            {{ card.metric?.title }}
          </div>
          <div class="stat-value relative mt-2 text-3xl font-bold text-slate-900 dark:text-slate-50">
            {{ card.metric?.count ?? 0 }}
          </div>
          <div class="stat-desc relative mt-2 text-xs text-slate-500 dark:text-slate-400">
            {{ card.metric?.description }}
          </div>
          <div class="relative mt-3 flex items-center justify-between px-6 pb-6 text-sm">
            <span class="font-medium text-slate-500 dark:text-slate-400">
              {{ t('compliance-performance.percent-label') }}
            </span>
            <span class="font-semibold text-slate-900 dark:text-slate-50">
              {{ card.metric?.percent || '0.00' }}%
            </span>
          </div>
        </div>
      </div>

      <div class="grid gap-6 xl:grid-cols-2">
        <PerformancePieChart :items="pieItems" />
        <DailyPerformanceChart :title="daily?.title" :items="daily?.list || []" />
      </div>

      <div class="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-darkmode-600 dark:bg-darkmode-800">
        <div class="mb-5">
          <h2 class="text-base font-semibold text-slate-900 dark:text-slate-50">
            {{ t('compliance-performance.status-list-title') }}
          </h2>
          <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {{ t('compliance-performance.status-list-subtitle') }}
          </p>
        </div>
        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <div
            v-for="item in pieItems"
            :key="item.value"
            class="rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-darkmode-700 dark:bg-darkmode-900/40"
          >
            <div class="flex items-center justify-between gap-3">
              <p class="text-sm font-medium text-slate-700 dark:text-slate-200">
                {{ item.title }}
              </p>
              <span class="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm dark:bg-darkmode-700 dark:text-slate-200">
                {{ item.count }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-else
      class="rounded-2xl border border-slate-200/90 bg-white p-12 text-center shadow-sm dark:border-darkmode-600 dark:bg-darkmode-800"
    >
      <Lucide icon="Inbox" class="mx-auto mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" />
      <h2 class="mb-2 font-semibold text-slate-900 dark:text-slate-50">
        {{ t('compliance-performance.no-data-title') }}
      </h2>
      <p class="text-sm text-slate-500 dark:text-slate-400">
        {{ t('compliance-performance.no-data-message') }}
      </p>
    </div>
  </div>
</template>
