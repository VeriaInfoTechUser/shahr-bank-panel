<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuery } from '@/core/composables/useQuery';
import { ermRepo } from '@/core/repositories/ermRepo';
import Lucide from '@/base-components/Lucide/Lucide.vue';
import Button from '@/base-components/Button';
import RiskHeatmap from './RiskHeatmap.vue';
import RiskSpiderRadar from './RiskSpiderRadar.vue';
import RiskDashboardFilterToolbar from './RiskDashboardFilterToolbar.vue';
import { useBreadcrumbSlot } from '@/composables/useBreadcrumb';

const { t } = useI18n();
const { setContent: setBreadcrumbSlot } = useBreadcrumbSlot();

// Initialize filters from a stable source
const filters = ref<Record<string, unknown>>({});
const isInitialized = ref(false);

// Track filter changes and refetch the dashboard when filters update
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

interface HeatmapBand {
  name: string;
  color: string;
  from: number;
  to: number;
  section_id?: number[] | null;
  [key: string]: unknown;
}

interface HeatmapRow {
  title: string;
  slug: string;
  section_id?: number[] | null;
  [key: string]: unknown;
}

interface RadarChild {
  id: number;
  title: string;
  slug: string;
  risk_count?: number;
  risk_data?: number;
  x?: number;
  y?: number;
}

interface RadarDomain {
  title: string;
  slug: string;
  children?: RadarChild[];
}

interface RiskDashboardResponse {
  heatmap?: Record<string, HeatmapRow>;
  heatmap_dynamic?: HeatmapRow[];
  radar?: RadarDomain[];
}

function toNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function getBandTotal(band?: HeatmapBand): number {
  if (!band) return 0;
  return Object.entries(band).reduce((sum, [key, value]) => {
    if (/^\d+$/.test(key) && typeof value === 'number') return sum + value;
    return sum;
  }, 0);
}

const {
  data: dashboardData,
  isLoading,
  error,
  refetch,
  invalidate,
} = useQuery(
  ['risk-dashboard', filters],
  () => ermRepo.riskDashboard(filters.value) as Promise<RiskDashboardResponse>,
  {
    enabled: true,
    staleTime: 300000,
    refetchOnMount: true,
  }
);

const bandKeys = computed(() => {
  const totalRow = dashboardData.value?.heatmap?.total;
  if (!totalRow) return ['0-5', '5-10', '10-15', '15-20', '20-25'];

  return Object.keys(totalRow).filter((key) => /^\d+-\d+$/.test(key));
});

const heatmapRows = computed(() => {
  const rows = dashboardData.value?.heatmap_dynamic || [];
  return rows.filter((row) => row && row.slug && row.title);
});

const totalHeatmapRow = computed(() =>
  heatmapRows.value.find((row) => row.slug === 'total')
);

const domainHeatmapRows = computed(() =>
  heatmapRows.value.filter((row) => row.slug !== 'total')
);

const totalRiskCount = computed(() =>
  bandKeys.value.reduce((sum, key) => sum + getBandTotal((totalHeatmapRow.value?.[key] as HeatmapBand | undefined)), 0)
);

const activeRiskBand = computed(() => {
  if (!totalHeatmapRow.value) return null;

  return bandKeys.value
    .map((key) => {
      const band = totalHeatmapRow.value?.[key] as HeatmapBand | undefined;
      return {
        key,
        label: band?.name || key,
        count: getBandTotal(band),
      };
    })
    .sort((a, b) => b.count - a.count)[0];
});

const nonEmptyDomains = computed(() =>
  domainHeatmapRows.value.filter((row) =>
    bandKeys.value.some((key) => getBandTotal(row[key] as HeatmapBand | undefined) > 0)
  ).length
);

const radarPoints = computed(() => {
  return (dashboardData.value?.radar || [])
    .flatMap((domain) =>
      (domain.children || []).map((child) => ({
        parentTitle: domain.title,
        title: child.title,
        riskCount: toNumber(child.risk_count),
        riskData: toNumber(child.risk_data),
        score: toNumber(child.risk_data) + toNumber(child.risk_count),
      }))
    )
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
});

const insights = computed(() => [
  {
    icon: 'ShieldAlert',
    label: t('risk-dashboard.total-risks'),
    value: t('risk-dashboard.items-count', { count: totalRiskCount.value }),
  },
  {
    icon: 'Thermometer',
    label: t('risk-dashboard.active-band'),
    value: activeRiskBand.value?.label || '-',
  },
  {
    icon: 'LayoutGrid',
    label: t('risk-dashboard.active-domains'),
    value: t('risk-dashboard.items-count', { count: nonEmptyDomains.value }),
  },
  {
    icon: 'Radar',
    label: t('risk-dashboard.radar-topics'),
    value: t('risk-dashboard.items-count', { count: radarPoints.value.length }),
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
  // Mark as initialized after first render
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
            <Lucide icon="ShieldAlert" class="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-50">
              {{ t('menu.risk') }}
            </h1>
            <p class="text-sm text-slate-500 dark:text-slate-400">
              {{ t('risk-dashboard.subtitle') }}
            </p>
          </div>
        </div>
        <RiskDashboardFilterToolbar
          :table="{
            replaceFilters,
            clearFilters,
            filters
          }"
        />
      </div>
    </header>

    <div v-if="isLoading" class="space-y-6">
      <div class="grid gap-4 sm:grid-cols-4">
        <div
          v-for="i in 4"
          :key="`insight-skeleton-${i}`"
          class="animate-pulse rounded-2xl border border-slate-200/90 bg-slate-50/80 p-6 dark:border-darkmode-600 dark:bg-darkmode-800/80"
        >
          <div class="mb-4 h-10 w-10 rounded-2xl bg-slate-200 dark:bg-darkmode-600" />
          <div class="mb-3 h-4 w-32 rounded bg-slate-200 dark:bg-darkmode-600" />
          <div class="h-8 w-24 rounded bg-slate-300 dark:bg-darkmode-600" />
        </div>
      </div>
      <div class="grid gap-6 xl:grid-cols-2">
        <div
          v-for="i in 2"
          :key="`chart-skeleton-${i}`"
          class="animate-pulse rounded-2xl border border-slate-200/90 bg-slate-50/80 p-6 dark:border-darkmode-600 dark:bg-darkmode-800/80"
        >
          <div class="mb-4 h-6 w-40 rounded bg-slate-200 dark:bg-darkmode-600" />
          <div class="h-80 rounded bg-slate-200 dark:bg-darkmode-600" />
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
        {{ t('risk-dashboard.error-title') }}
      </h2>
      <p class="mb-6 text-sm text-slate-600 dark:text-slate-300">
        {{ error.message || t('risk-dashboard.error-message') }}
      </p>
      <Button variant="secondary" size="sm" @click="handleRetry">
        <template #icon>
          <Lucide icon="RotateCw" class="h-4 w-4" />
        </template>
        {{ t('general.retry') }}
      </Button>
    </div>

    <div v-else-if="dashboardData" class="space-y-6">
      <div class="grid gap-4 sm:grid-cols-4">
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

      <RiskHeatmap :rows="heatmapRows" :band-keys="bandKeys" :total-row="totalHeatmapRow" />

      <RiskSpiderRadar v-if="radarPoints.length > 0" :items="radarPoints" />

      <div
        v-else
        class="rounded-2xl border border-slate-200/90 bg-white p-8 text-center shadow-sm dark:border-darkmode-600 dark:bg-darkmode-800"
      >
        <Lucide icon="Radar" class="mx-auto mb-4 h-10 w-10 text-slate-300 dark:text-slate-600" />
        <h2 class="mb-2 font-semibold text-slate-900 dark:text-slate-50">
          {{ t('risk-dashboard.radar-empty-title') }}
        </h2>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          {{ t('risk-dashboard.radar-empty-message') }}
        </p>
      </div>
    </div>

    <div
      v-else
      class="rounded-2xl border border-slate-200/90 bg-white p-12 text-center shadow-sm dark:border-darkmode-600 dark:bg-darkmode-800"
    >
      <Lucide icon="Inbox" class="mx-auto mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" />
      <h2 class="mb-2 font-semibold text-slate-900 dark:text-slate-50">
        {{ t('risk-dashboard.no-data-title') }}
      </h2>
      <p class="text-sm text-slate-500 dark:text-slate-400">
        {{ t('risk-dashboard.no-data-message') }}
      </p>
    </div>
  </div>
</template>
