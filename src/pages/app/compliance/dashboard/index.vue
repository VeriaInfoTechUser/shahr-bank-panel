<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuery } from '@/core/composables/useQuery';
import { ermRepo } from '@/core/repositories/ermRepo';
import Lucide from '@/base-components/Lucide/Lucide.vue';
import Button from '@/base-components/Button';
import DomainCard from './DomainCard.vue';
import ProgressDoughnut from './ProgressDoughnut.vue';
import DomainsBarChart from './DomainsBarChart.vue';
import FinancialBreakdownChart from './FinancialBreakdownChart.vue';
import RadarTopicsChart from './RadarTopicsChart.vue';
import ComplianceFilterToolbar from './ComplianceFilterToolbar.vue';
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

interface FinancialBucketData {
  total_count?: number | null;
  title?: string | null;
  slug?: string | null;
  '0'?: number | null;
  '50'?: number | null;
  '100'?: number | null;
  average?: number | string | null;
  in_progress_count?: number | null;
}

interface DomainData {
  title: string;
  slug: string;
  total_count: number;
  '0'?: number | null;
  '50'?: number | null;
  '100'?: number | null;
  average?: number | string | null;
  in_progress_count?: number | null;
  financial?: {
    [key: string]: FinancialBucketData;
  };
}

interface RadarChild {
  slug: string;
  title: string;
  total_count?: number | null;
  '0'?: number | null;
  '50'?: number | null;
  '100'?: number | null;
  in_progress_count?: number | null;
}

interface RadarDomain {
  slug: string;
  title: string;
  children?: RadarChild[];
}

interface DashboardResponse {
  domains?: DomainData[];
  radar?: RadarDomain[];
  [key: string]: any; // For domain objects like "organizational-behavior"
}

interface DomainInsight extends DomainData {
  completedCount: number;
  inProgressCount: number;
  notStartedCount: number;
  completionPercent: number;
  hasMeasuredProgress: boolean;
}

function toNumber(value: number | string | null | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function getCompletedCount(item: Pick<DomainData, '100'>): number {
  return toNumber(item['100']);
}

function getPartialCount(item: Pick<DomainData, '50'>): number {
  return toNumber(item['50']);
}

function getInProgressCount(item: Pick<DomainData, '50' | 'in_progress_count'>): number {
  return getPartialCount(item) + toNumber(item.in_progress_count);
}

function getNotStartedCount(item: Pick<DomainData, '0'>): number {
  return toNumber(item['0']);
}

function getCompletionPercent(item: Pick<DomainData, '100' | 'total_count'>): number {
  const total = toNumber(item.total_count);
  if (total <= 0) return 0;
  return Math.round((getCompletedCount(item) / total) * 100);
}

function hasMeasuredProgress(item: Pick<DomainData, '0' | '50' | '100' | 'in_progress_count'>): boolean {
  return (
    getCompletedCount(item) > 0 ||
    getPartialCount(item) > 0 ||
    getNotStartedCount(item) > 0 ||
    toNumber(item.in_progress_count) > 0
  );
}

/** Fetch compliance dashboard data with caching */
const {
  data: dashboardData,
  isLoading,
  error,
  refetch,
  invalidate,
} = useQuery(
  ['compliance-dashboard', filters],
  () => ermRepo.complianceDashboard(filters.value) as Promise<DashboardResponse>,
  {
    enabled: true,
    staleTime: 300000, // 5 minutes
    refetchOnMount: true,
  }
);

/** Extract domains from response */
const domains = computed(() => {
  const responseData = dashboardData.value;
  if (!responseData) return [];
  
  // Use the domains array from the response
  if (Array.isArray(responseData.domains)) {
    return responseData.domains.filter((d: DomainData) => 
      d && typeof d === 'object' && d.total_count && d.total_count > 0
    );
  }
  
  // Fallback: convert object properties to array (excluding 'domains' and 'radar')
  const domainKeys = Object.keys(responseData).filter(key => 
    key !== 'domains' && key !== 'radar' && 
    typeof responseData[key] === 'object' && 
    responseData[key] !== null &&
    'total_count' in responseData[key]
  );
  
  return domainKeys.map(key => ({
    ...responseData[key],
    slug: key
  })).filter((d: DomainData) => d.total_count && d.total_count > 0);
});

const radarDomains = computed(() => dashboardData.value?.radar || []);

const domainInsights = computed<DomainInsight[]>(() =>
  domains.value.map((domain) => ({
    ...domain,
    completedCount: getCompletedCount(domain),
    inProgressCount: getInProgressCount(domain),
    notStartedCount: getNotStartedCount(domain),
    completionPercent: getCompletionPercent(domain),
    hasMeasuredProgress: hasMeasuredProgress(domain),
  }))
);

const measurableDomains = computed(() =>
  domainInsights.value.filter((domain) => domain.hasMeasuredProgress)
);

/** Calculate overall statistics */
const overallStats = computed(() => {
  const allDomains = domainInsights.value;
  if (allDomains.length === 0) {
    return {
      totalItems: 0,
      completed: 0,
      inProgress: 0,
      notStarted: 0,
      completionPercent: 0,
      measurableDomains: 0,
    };
  }

  const totalItems = allDomains.reduce((sum, d) => sum + (d.total_count || 0), 0);
  const completed = allDomains.reduce((sum, d) => sum + d.completedCount, 0);
  const inProgress = allDomains.reduce((sum, d) => sum + d.inProgressCount, 0);
  const notStarted = allDomains.reduce((sum, d) => sum + d.notStartedCount, 0);
  const completionPercent = totalItems > 0 ? Math.round((completed / totalItems) * 100) : 0;

  return {
    totalItems,
    completed,
    inProgress,
    notStarted,
    completionPercent,
    measurableDomains: measurableDomains.value.length,
  };
});

/** Get top domains by completion */
const topDomains = computed(() => {
  const pool = measurableDomains.value.length > 0 ? measurableDomains.value : domainInsights.value;

  return [...pool]
    .sort((a, b) => {
      if (b.completionPercent !== a.completionPercent) return b.completionPercent - a.completionPercent;
      return b.total_count - a.total_count;
    })
    .slice(0, 3);
});

const rankedDomains = computed(() => {
  const topDomainSlugs = new Set(topDomains.value.map((domain) => domain.slug));
  const prioritizedDomains = [
    ...topDomains.value,
    ...domains.value.filter((domain) => !topDomainSlugs.has(domain.slug)),
  ];

  return prioritizedDomains.map((domain) => ({
    domain,
    cardType: topDomainSlugs.has(domain.slug) ? 'top-performing' : 'standard',
  }));
});

const biggestDomain = computed(() =>
  [...domainInsights.value].sort((a, b) => b.total_count - a.total_count)[0]
);

const mostBackloggedDomain = computed(() =>
  [...domainInsights.value].sort((a, b) => b.notStartedCount - a.notStartedCount || b.total_count - a.total_count)[0]
);

const mostActiveDomain = computed(() =>
  [...domainInsights.value].sort((a, b) => b.inProgressCount - a.inProgressCount || b.total_count - a.total_count)[0]
);

const bestPerformingDomain = computed(() =>
  [...topDomains.value].sort((a, b) => b.completionPercent - a.completionPercent || b.completedCount - a.completedCount)[0]
);

const financialBreakdown = computed(() => {
  const buckets = new Map<string, {
    slug: string;
    title: string;
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
  }>();

  domains.value.forEach((domain) => {
    Object.entries(domain.financial || {}).forEach(([slug, bucket]) => {
      const total = toNumber(bucket.total_count);
      if (total <= 0) return;

      const current = buckets.get(slug) || {
        slug,
        title: bucket.title || slug,
        total: 0,
        completed: 0,
        inProgress: 0,
        notStarted: 0,
      };

      current.total += total;
      current.completed += getCompletedCount(bucket);
      current.inProgress += getInProgressCount(bucket);
      current.notStarted += getNotStartedCount(bucket);

      buckets.set(slug, current);
    });
  });

  return [...buckets.values()].sort((a, b) => b.total - a.total);
});

const radarTopics = computed(() => {
  return radarDomains.value
    .flatMap((domain) =>
      (domain.children || [])
        .filter((child) => toNumber(child.total_count) > 0)
        .map((child) => ({
          parentTitle: domain.title,
          title: child.title,
          total: toNumber(child.total_count),
          completed: getCompletedCount(child),
          inProgress: getInProgressCount(child),
          notStarted: getNotStartedCount(child),
        }))
    )
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);
});

const summaryInsights = computed(() => [
  {
    icon: 'Layers3',
    label: t('compliance-dashboard.insight-largest-domain'),
    title: biggestDomain.value?.title || '-',
    value: biggestDomain.value
      ? t('compliance-dashboard.insight-total-items-value', { count: biggestDomain.value.total_count })
      : '-',
  },
  {
    icon: 'Medal',
    label: t('compliance-dashboard.insight-best-domain'),
    title: bestPerformingDomain.value?.title || '-',
    value: bestPerformingDomain.value
      ? t('compliance-dashboard.insight-percent-value', { percent: bestPerformingDomain.value.completionPercent })
      : t('compliance-dashboard.insight-no-measured-progress'),
  },
  {
    icon: 'AlertOctagon',
    label: t('compliance-dashboard.insight-backlog-domain'),
    title: mostBackloggedDomain.value?.title || '-',
    value: mostBackloggedDomain.value
      ? t('compliance-dashboard.insight-total-items-value', { count: mostBackloggedDomain.value.notStartedCount })
      : '-',
  },
  {
    icon: 'Activity',
    label: t('compliance-dashboard.insight-active-domain'),
    title: mostActiveDomain.value?.title || '-',
    value: mostActiveDomain.value
      ? t('compliance-dashboard.insight-total-items-value', { count: mostActiveDomain.value.inProgressCount })
      : '-',
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

const overallProgressTitle = computed(() =>
  t('compliance-dashboard.overall-progress-title', { count: domains.value.length })
);

const measurableDomainsCaption = computed(() =>
  t('compliance-dashboard.measurable-domains-caption', {
    measured: overallStats.value.measurableDomains,
    total: domains.value.length,
  })
);
</script>

<template>
  <div class="mx-auto max-w-7xl px-1 pb-12 pt-2 md:px-2">
    <!-- Header -->
    <header class="mb-8 md:mb-10">
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div
            class="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 shadow-sm ring-1 ring-primary/20 dark:from-primary/25 dark:via-primary/15 dark:ring-primary/30"
          >
            <Lucide
              icon="ShieldCheck"
              class="h-6 w-6 text-primary"
            />
          </div>
          <div>
            <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-50">
              {{ t('menu.compliance') }}
            </h1>
            <p class="text-sm text-slate-500 dark:text-slate-400">
              {{ t('compliance-dashboard.subtitle') }}
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

    <!-- Loading State -->
    <div v-if="isLoading" class="space-y-6">
      <!-- Skeleton loading -->
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <div
          v-for="i in 5"
          :key="`skeleton-stat-${i}`"
          class="animate-pulse rounded-2xl border border-slate-200/90 bg-slate-50/80 p-6 dark:border-darkmode-600 dark:bg-darkmode-800/80"
        >
          <div class="mb-3 h-4 w-24 rounded bg-slate-200 dark:bg-darkmode-600" />
          <div class="h-8 w-16 rounded bg-slate-300 dark:bg-darkmode-600" />
        </div>
      </div>
      <div class="grid gap-6 lg:grid-cols-2">
        <div
          v-for="i in 2"
          :key="`skeleton-chart-${i}`"
          class="animate-pulse rounded-2xl border border-slate-200/90 bg-slate-50/80 p-6 dark:border-darkmode-600 dark:bg-darkmode-800/80"
        >
          <div class="mb-4 h-6 w-32 rounded bg-slate-200 dark:bg-darkmode-600" />
          <div class="h-64 rounded bg-slate-200 dark:bg-darkmode-600" />
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="rounded-2xl border border-danger/25 bg-danger/5 p-6 text-center dark:border-danger/40 dark:bg-danger/10"
    >
      <div class="mb-4 flex justify-center">
        <Lucide
          icon="AlertTriangle"
          class="h-8 w-8 text-danger"
        />
      </div>
      <h2 class="mb-2 font-semibold text-danger">
        {{ t('compliance-dashboard.error-title') }}
      </h2>
      <p class="mb-6 text-sm text-slate-600 dark:text-slate-300">
        {{ error.message || t('compliance-dashboard.error-message') }}
      </p>
      <Button
        variant="secondary"
        size="sm"
        @click="handleRetry"
      >
        <template #icon>
          <Lucide icon="RotateCw" class="h-4 w-4" />
        </template>
        {{ t('general.retry') }}
      </Button>
    </div>

    <!-- Dashboard Content -->
    <div v-else-if="domains.length > 0" class="space-y-6">
      <!-- Overall KPI Stats -->
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <!-- Total Items -->
        <div
          class="group stat relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md dark:border-darkmode-600 dark:bg-darkmode-800 dark:hover:border-darkmode-500"
        >
          <div
            class="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-50/0 to-slate-50/80 opacity-0 transition group-hover:opacity-100 dark:from-transparent dark:to-darkmode-900/40"
          />
          <div class="stat-figure relative text-blue-600 dark:text-blue-400">
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-500/15">
              <Lucide icon="Boxes" class="h-5 w-5" />
            </div>
          </div>
          <div class="stat-title relative text-sm font-medium text-slate-600 dark:text-slate-400">
              {{ t('compliance-dashboard.total-items') }}
          </div>
          <div class="stat-value relative mt-2 text-3xl font-bold text-slate-900 dark:text-slate-50">
            {{ overallStats.totalItems }}
          </div>
        </div>

        <!-- Completed -->
        <div
          class="group stat relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md dark:border-darkmode-600 dark:bg-darkmode-800 dark:hover:border-darkmode-500"
        >
          <div
            class="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-50/0 to-slate-50/80 opacity-0 transition group-hover:opacity-100 dark:from-transparent dark:to-darkmode-900/40"
          />
          <div class="stat-figure relative text-green-600 dark:text-green-400">
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 dark:bg-green-500/15">
              <Lucide icon="CheckCircle2" class="h-5 w-5" />
            </div>
          </div>
          <div class="stat-title relative text-sm font-medium text-slate-600 dark:text-slate-400">
              {{ t('compliance-dashboard.completed') }}
          </div>
          <div class="stat-value relative mt-2 text-3xl font-bold text-slate-900 dark:text-slate-50">
            {{ overallStats.completed }}
          </div>
        </div>

        <!-- In Progress -->
        <div
          class="group stat relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md dark:border-darkmode-600 dark:bg-darkmode-800 dark:hover:border-darkmode-500"
        >
          <div
            class="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-50/0 to-slate-50/80 opacity-0 transition group-hover:opacity-100 dark:from-transparent dark:to-darkmode-900/40"
          />
          <div class="stat-figure relative text-amber-600 dark:text-amber-400">
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-500/15">
              <Lucide icon="Clock" class="h-5 w-5" />
            </div>
          </div>
          <div class="stat-title relative text-sm font-medium text-slate-600 dark:text-slate-400">
              {{ t('compliance-dashboard.in-progress') }}
          </div>
          <div class="stat-value relative mt-2 text-3xl font-bold text-slate-900 dark:text-slate-50">
            {{ overallStats.inProgress }}
          </div>
        </div>

        <!-- Progress % -->
        <div
          class="group stat relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md dark:border-darkmode-600 dark:bg-darkmode-800 dark:hover:border-darkmode-500"
        >
          <div
            class="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-50/0 to-slate-50/80 opacity-0 transition group-hover:opacity-100 dark:from-transparent dark:to-darkmode-900/40"
          />
          <div class="stat-figure relative text-purple-600 dark:text-purple-400">
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 dark:bg-purple-500/15">
              <Lucide icon="TrendingUp" class="h-5 w-5" />
            </div>
          </div>
          <div class="stat-title relative text-sm font-medium text-slate-600 dark:text-slate-400">
              {{ t('compliance-dashboard.progress') }}
          </div>
          <div class="stat-value relative mt-2 text-3xl font-bold text-slate-900 dark:text-slate-50">
            {{ overallStats.completionPercent }}%
          </div>
        </div>

        <!-- Measured Domains -->
        <div
          class="group stat relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md dark:border-darkmode-600 dark:bg-darkmode-800 dark:hover:border-darkmode-500"
        >
          <div
            class="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-50/0 to-slate-50/80 opacity-0 transition group-hover:opacity-100 dark:from-transparent dark:to-darkmode-900/40"
          />
          <div class="stat-figure relative text-sky-600 dark:text-sky-400">
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 dark:bg-sky-500/15">
              <Lucide icon="ClipboardList" class="h-5 w-5" />
            </div>
          </div>
          <div class="stat-title relative text-sm font-medium text-slate-600 dark:text-slate-400">
              {{ t('compliance-dashboard.measurable-domains') }}
          </div>
          <div class="stat-value relative mt-2 text-3xl font-bold text-slate-900 dark:text-slate-50">
            {{ overallStats.measurableDomains }}
          </div>
          <div class="stat-desc relative mt-2 text-xs text-slate-500 dark:text-slate-400">
            {{ measurableDomainsCaption }}
          </div>
        </div>
      </div>

      <!-- Insights -->
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div
          v-for="insight in summaryInsights"
          :key="insight.label"
          class="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-darkmode-600 dark:bg-darkmode-800"
        >
          <div class="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-darkmode-700 dark:text-slate-200">
            <Lucide :icon="insight.icon" class="h-5 w-5" />
          </div>
          <p class="text-xs font-medium text-slate-500 dark:text-slate-400">
            {{ insight.label }}
          </p>
          <h3 class="mt-2 text-base font-semibold text-slate-900 dark:text-slate-50">
            {{ insight.title }}
          </h3>
          <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {{ insight.value }}
          </p>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="grid gap-6 xl:grid-cols-2">
        <!-- Overall Progress Doughnut -->
        <ProgressDoughnut
          :data="{
            completed: overallStats.completed,
            partial: domainInsights.reduce((sum, d) => sum + getPartialCount(d), 0),
            notStarted: overallStats.notStarted,
          }"
          :title="overallProgressTitle"
          :height="300"
        />

        <!-- Domains Bar Chart -->
        <DomainsBarChart :domains="domainInsights" :max-items="8" />

        <!-- Financial Breakdown -->
        <FinancialBreakdownChart :items="financialBreakdown" />

        <!-- Radar Topics -->
        <RadarTopicsChart :items="radarTopics" />
      </div>

      <!-- Domains Cards -->
      <div>
        <h2 class="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-50">
          {{ t('compliance-dashboard.domains-cards-title') }}
        </h2>
        <div class="grid gap-4 md:grid-cols-2">
          <DomainCard
            v-for="item in rankedDomains"
            :key="item.domain.slug"
            :domain="item.domain"
            :highlight="item.cardType === 'top-performing'"
            :card-type="item.cardType"
          />
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="rounded-2xl border border-slate-200/90 bg-white p-12 text-center shadow-sm dark:border-darkmode-600 dark:bg-darkmode-800"
    >
      <Lucide
        icon="Inbox"
        class="mx-auto mb-4 h-12 w-12 text-slate-300 dark:text-slate-600"
      />
      <h2 class="mb-2 font-semibold text-slate-900 dark:text-slate-50">
        {{ t('compliance-dashboard.no-data-title') }}
      </h2>
      <p class="text-sm text-slate-500 dark:text-slate-400">
        {{ t('compliance-dashboard.no-data-message') }}
      </p>
    </div>
  </div>
</template>
