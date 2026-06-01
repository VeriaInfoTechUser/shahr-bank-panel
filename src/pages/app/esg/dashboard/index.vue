<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useQuery } from "@core/composables";
import { esgRepo } from "@core/repositories/esgRepo";
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useChartRegistry, getChartComponent } from "./composables/useChartRegistry";

const { t } = useI18n();

// TypeScript Interfaces for complete type safety
interface DashboardMeta {
  version: string;
  generated_at: string;
  chart_library: string;
  rtl: boolean;
}

interface PillarScore {
  score: number;
  i18n_key: string;
  color_theme: string;
  color_hex: string;
  icon: string;
  completion_pct: number;
}

interface ChartSeries {
  i18n_key?: string;
  value?: number;
  color?: string;
  key?: string;
  score?: number;
  [key: string]: unknown;
}

interface DashboardChart {
  chart_type: string;
  component_name: string;
  series: ChartSeries[];
  echarts_config?: Record<string, unknown>;
  indicators_i18n?: string[];
  title?: string;
  i18n_key?: string;
  [key: string]: unknown;
}

interface KPIMetric {
  id: string;
  i18n_key: string;
  value: number | string;
  unit?: string;
  target?: number;
  color?: string;
  icon?: string;
  trend?: "up" | "down" | "stable";
  trend_value?: number;
  metric_code?: string;
  dashboard_usage?: boolean;
}

interface Domain {
  key: string;
  i18n_key: string;
  controlled_count?: number;
  unanswered_count?: number;
  answered_count?: number;
  total_controls?: number;
  metric_code?: string;
  dashboard_usage?: boolean;
}

interface DashboardSummary {
  overall_score: number;
  overall_completion: number;
  total_domains: number;
  total_controls: number;
  answered_controls: number;
  unanswered_controls: number;
  pillar_scores: Record<string, PillarScore>;
  completion_chart?: DashboardChart;
  pillar_compare_chart?: DashboardChart;
  top_kpis?: DashboardChart[] | KPIMetric[];
  trend_charts?: DashboardChart[];
  [key: string]: unknown;
}

interface Pillar {
  key: string;
  i18n_key: string;
  icon: string;
  color_hex: string;
  color_theme: string;
  order: number;
  stats: Record<string, unknown>;
  domains: Domain[];
  radar_chart?: DashboardChart;
  charts?: DashboardChart[];
  top_metrics?: KPIMetric[] | DashboardChart[];
  key_charts?: DashboardChart[];
  domain_breakdown?: DashboardChart;
}

interface DashboardResponse {
  result: boolean;
  data: {
    meta: DashboardMeta;
    summary: DashboardSummary;
    pillars: Pillar[];
  };
  error: unknown[];
}

// API Query Hook
const {
  data: dashboardData,
  isLoading,
  error,
  refetch,
  invalidate,
} = useQuery(
  ["esg-dashboard"],
  () => esgRepo.dashboard(),
  {
    enabled: true,
    staleTime: 300000,
    refetchOnMount: true,
  }
);

// Computed properties for reactive data access
const dashboardContent = computed(() => {
  return dashboardData.value?.data;
});

const summary = computed(() => {
  return dashboardContent.value?.summary;
});

const pillars = computed(() => {
  return dashboardContent.value?.pillars || [];
});

const meta = computed(() => {
  return dashboardContent.value?.meta;
});

// Computed top KPIs - extract from summary.top_kpis
const topKPIs = computed((): KPIMetric[] => {
  const kpis = summary.value?.top_kpis;
  if (!kpis) return [];
  
  // If top_kpis contains DashboardChart objects, extract data from series
  if (Array.isArray(kpis)) {
    return kpis.map((item: any, idx: number) => ({
      id: `kpi-${idx}`,
      i18n_key: item.i18n_key || `esg.kpi-${idx}`,
      value: item.value ?? item.series?.[0]?.value ?? 0,
      unit: item.unit || "",
      target: item.target,
      color: item.color || item.series?.[0]?.color,
      icon: item.icon,
      trend: item.trend,
      trend_value: item.trend_value,
      metric_code: item.metric_code,
      dashboard_usage: item.dashboard_usage,
    }));
  }
  return [];
});

// Computed trend charts
const trendCharts = computed(() => {
  return summary.value?.trend_charts || [];
});

// Active pillar for tabbed navigation (optional)
const activePillarKey = ref<string | null>(null);

const chartRegistry = useChartRegistry();

const getComponentForChart = (chart: DashboardChart | undefined) => {
  if (!chart?.component_name) return null;
  return getChartComponent(chart.component_name, chartRegistry);
};

// Helper: Check if metric is a KPI or Chart object
const isKPIMetric = (item: any): item is KPIMetric => {
  return !item.component_name && (item.value !== undefined || item.metric_code);
};

// Helper: Get pillar color with alpha
const getPillarColorWithAlpha = (color: string, alpha: number) => {
  if (color.startsWith("#")) {
    const hex = color.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
};

// Initialize active pillar
onMounted(() => {
  if (pillars.value.length > 0) {
    activePillarKey.value = pillars.value[0].key;
  }
});

onUnmounted(() => {
  invalidate();
});
</script>

<template>
  <div class="mx-auto max-w-7xl px-1 pb-12 pt-2 md:px-2">
    <!-- Loading State -->
    <div v-if="isLoading" class="space-y-4">
      <div class="animate-pulse">
        <div class="h-40 bg-slate-200 dark:bg-darkmode-700 rounded-xl"></div>
      </div>
      <div class="animate-pulse">
        <div class="h-96 bg-slate-200 dark:bg-darkmode-700 rounded-xl"></div>
      </div>
      <div class="animate-pulse">
        <div class="h-96 bg-slate-200 dark:bg-darkmode-700 rounded-xl"></div>
      </div>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="rounded-xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20 p-4 text-red-700 dark:text-red-400"
    >
      <div class="flex gap-3">
        <svg class="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
        <div>
          <p class="font-medium">{{ t("esg.error-loading") }}</p>
          <p class="text-sm mt-1">{{ t("general.error") }}</p>
        </div>
      </div>
    </div>

    <!-- No Data State -->
    <div
      v-else-if="!dashboardContent"
      class="rounded-xl border border-slate-200/60 bg-white p-12 text-center shadow-sm dark:border-darkmode-700/60 dark:bg-darkmode-800"
    >
      <svg class="w-16 h-16 mx-auto mb-4 text-slate-400 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p class="text-slate-600 dark:text-slate-400">{{ t("general.no-data") }}</p>
    </div>

    <!-- Dashboard Content -->
    <template v-else>
      <!-- Header -->
      <div class="mb-6 rounded-xl border border-slate-200/80 dark:border-white/8 bg-white dark:bg-darkmode-800 p-6">
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
          {{ t("menu.esg") }} - {{ t("menu.esg-dashboard") }}
        </h1>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          {{ meta?.generated_at ? `${t("general.last-updated")}: ${new Date(meta.generated_at).toLocaleString()}` : "" }}
        </p>
      </div>

      <!-- Summary Cards - Key Metrics -->
      <div v-if="summary" class="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Overall Score -->
        <div class="rounded-xl border border-slate-200/80 dark:border-white/8 bg-white dark:bg-darkmode-800 p-6 hover:shadow-md transition-shadow">
          <p class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">{{ t("esg.overall-score") }}</p>
          <div class="flex items-end gap-2">
            <span class="text-3xl font-bold text-blue-600 dark:text-blue-400">{{ summary.overall_score }}</span>
            <span class="text-sm text-slate-400 dark:text-slate-500">/100</span>
          </div>
          <div class="mt-2 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
            <div class="h-full bg-blue-500 rounded-full" :style="`width: ${summary.overall_score}%`"></div>
          </div>
        </div>

        <!-- Overall Completion -->
        <div class="rounded-xl border border-slate-200/80 dark:border-white/8 bg-white dark:bg-darkmode-800 p-6 hover:shadow-md transition-shadow">
          <p class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">{{ t("esg.overall-completion") }}</p>
          <div class="flex items-end gap-2">
            <span class="text-3xl font-bold text-purple-600 dark:text-purple-400">{{ summary.overall_completion }}</span>
            <span class="text-sm text-slate-400 dark:text-slate-500">%</span>
          </div>
          <div class="mt-2 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
            <div class="h-full bg-purple-500 rounded-full" :style="`width: ${summary.overall_completion}%`"></div>
          </div>
        </div>

        <!-- Answered Controls -->
        <div class="rounded-xl border border-slate-200/80 dark:border-white/8 bg-white dark:bg-darkmode-800 p-6 hover:shadow-md transition-shadow">
          <p class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">{{ t("esg.answered-controls") }}</p>
          <div class="flex items-end gap-2">
            <span class="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{{ summary.answered_controls }}</span>
            <span class="text-sm text-slate-400 dark:text-slate-500">/ {{ summary.total_controls }}</span>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-2">
            {{ Math.round((summary.answered_controls / summary.total_controls) * 100) }}% {{ t("esg.completion") }}
          </p>
        </div>

        <!-- Total Domains -->
        <div class="rounded-xl border border-slate-200/80 dark:border-white/8 bg-white dark:bg-darkmode-800 p-6 hover:shadow-md transition-shadow">
          <p class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">{{ t("esg.total-domains") }}</p>
          <div class="flex items-end gap-2">
            <span class="text-3xl font-bold text-orange-600 dark:text-orange-400">{{ summary.total_domains }}</span>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-2">
            {{ summary.unanswered_controls }} {{ t("general.unanswered") }}
          </p>
        </div>
      </div>

      <!-- Pillar Scores -->
      <div v-if="summary?.pillar_scores" class="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          v-for="(pillar, key) in summary.pillar_scores"
          :key="key"
          class="rounded-xl border border-slate-200/80 dark:border-white/8 bg-white dark:bg-darkmode-800 p-6 hover:shadow-md transition-shadow"
        >
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center" :style="`background-color: ${pillar.color_hex}20`">
              <i :class="`ti ti-${pillar.icon} text-lg`" :style="`color: ${pillar.color_hex}`" aria-hidden="true"></i>
            </div>
            <div>
              <p class="text-xs font-medium text-slate-500 dark:text-slate-400">{{ t(pillar.i18n_key) }}</p>
            </div>
          </div>

          <div class="mb-3">
            <div class="flex items-end gap-2 mb-2">
              <span class="text-2xl font-bold text-slate-900 dark:text-slate-100">{{ pillar.score }}</span>
              <span class="text-sm text-slate-400 dark:text-slate-500">/100</span>
            </div>
            <div class="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-500"
                :style="`width: ${pillar.score}%; background-color: ${pillar.color_hex}`"
              />
            </div>
          </div>

          <p class="text-xs text-slate-500 dark:text-slate-400">
            {{ t("esg.completion") }}: {{ pillar.completion_pct }}%
          </p>
        </div>
      </div>

      <!-- Summary Charts Section -->
      <div v-if="summary?.completion_chart || summary?.pillar_compare_chart" class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <!-- Completion Chart -->
        <div v-if="summary?.completion_chart" class="rounded-xl border border-slate-200/80 dark:border-white/8 bg-white dark:bg-darkmode-800 p-6">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            {{ t("esg.completion-status") }}
          </h3>
          <div class="h-64">
            <template v-if="getComponentForChart(summary.completion_chart)">
              <component 
                :is="getComponentForChart(summary.completion_chart)"
                :echarts_config="summary.completion_chart.echarts_config"
                :series="summary.completion_chart.series"
                :rtl="meta?.rtl"
              />
            </template>
          </div>
        </div>

        <!-- Pillar Compare Chart -->
        <div v-if="summary?.pillar_compare_chart" class="rounded-xl border border-slate-200/80 dark:border-white/8 bg-white dark:bg-darkmode-800 p-6">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            {{ t("esg.pillar-comparison") }}
          </h3>
          <div class="h-64">
            <template v-if="getComponentForChart(summary.pillar_compare_chart)">
              <component 
                :is="getComponentForChart(summary.pillar_compare_chart)"
                :echarts_config="summary.pillar_compare_chart.echarts_config"
                :series="summary.pillar_compare_chart.series"
                :rtl="meta?.rtl"
              />
            </template>
          </div>
        </div>
      </div>

      <!-- Top KPIs Section -->
      <div v-if="topKPIs.length > 0" class="mb-6 rounded-xl border border-slate-200/80 dark:border-white/8 bg-white dark:bg-darkmode-800 p-6">
        <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">{{ t("esg.top-kpis") }}</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            v-for="kpi in topKPIs.slice(0, 8)"
            :key="kpi.id"
            class="p-4 bg-slate-50 dark:bg-darkmode-700/50 rounded-lg border border-slate-100 dark:border-white/10 hover:shadow transition-shadow"
          >
            <div class="flex items-start justify-between mb-2">
              <p class="text-xs font-medium text-slate-500 dark:text-slate-400">{{ t(kpi.i18n_key) }}</p>
              <div v-if="kpi.trend" class="flex items-center gap-1">
                <i 
                  :class="`ti ${kpi.trend === 'up' ? 'ti-arrow-up' : kpi.trend === 'down' ? 'ti-arrow-down' : 'ti-minus'} text-xs`"
                  :style="`color: ${kpi.trend === 'up' ? '#10b981' : kpi.trend === 'down' ? '#ef4444' : '#6b7280'}`"
                  aria-hidden="true"
                ></i>
                <span class="text-xs" :style="`color: ${kpi.trend === 'up' ? '#10b981' : kpi.trend === 'down' ? '#ef4444' : '#6b7280'}`">
                  {{ kpi.trend_value }}%
                </span>
              </div>
            </div>
            <div class="flex items-end gap-2 mb-2">
              <span class="text-2xl font-bold text-slate-900 dark:text-slate-100">{{ kpi.value }}</span>
              <span v-if="kpi.unit" class="text-xs text-slate-500 dark:text-slate-400">{{ kpi.unit }}</span>
            </div>
            <div v-if="kpi.target" class="text-xs text-slate-500 dark:text-slate-400">
              Target: {{ kpi.target }}
            </div>
          </div>
        </div>
      </div>

      <!-- Trend Charts Section -->
      <div v-if="trendCharts.length > 0" class="mb-6 space-y-6">
        <div
          v-for="(chart, idx) in trendCharts"
          :key="`trend-${idx}`"
          class="rounded-xl border border-slate-200/80 dark:border-white/8 bg-white dark:bg-darkmode-800 p-6"
        >
          <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            {{ chart.title || t(chart.i18n_key || `esg.trend-${idx}`) }}
          </h3>
          <div class="h-80">
            <template v-if="getComponentForChart(chart)">
              <component 
                :is="getComponentForChart(chart)"
                :echarts_config="chart.echarts_config"
                :series="chart.series"
                :rtl="meta?.rtl"
              />
            </template>
          </div>
        </div>
      </div>

      <!-- Pillars Details with Enhanced Content -->
      <div v-if="pillars.length > 0" class="space-y-6">
        <!-- Tab Navigation for Pillars -->
        <div class="flex gap-2 mb-6 overflow-x-auto pb-2 border-b border-slate-200 dark:border-white/10">
          <button
            v-for="pillar in pillars"
            :key="pillar.key"
            @click="activePillarKey = pillar.key"
            :class="[
              'px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all',
              activePillarKey === pillar.key
                ? 'bg-slate-100 dark:bg-white/15 text-slate-900 dark:text-slate-100 border-b-2'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            ]"
          >
            <i :class="`ti ti-${pillar.icon} mr-2`" aria-hidden="true"></i>
            {{ t(pillar.i18n_key) }}
          </button>
        </div>

        <!-- Pillar Details Content -->
        <div v-for="pillar in pillars" :key="`detail-${pillar.key}`">
          <template v-if="!activePillarKey || activePillarKey === pillar.key">
            <div class="rounded-xl border border-slate-200/80 dark:border-white/8 bg-white dark:bg-darkmode-800 p-6">
              <!-- Pillar Header -->
              <div class="flex items-center justify-between mb-6">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-lg flex items-center justify-center" :style="`background-color: ${pillar.color_hex}20`">
                    <i :class="`ti ti-${pillar.icon} text-xl`" :style="`color: ${pillar.color_hex}`" aria-hidden="true"></i>
                  </div>
                  <div>
                    <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">{{ t(pillar.i18n_key) }}</h3>
                    <p class="text-sm text-slate-500 dark:text-slate-400">{{ pillar.domains?.length || 0 }} {{ t("esg.domains") }}</p>
                  </div>
                </div>
              </div>

              <!-- Pillar Stats Grid -->
              <div v-if="pillar.stats" class="mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div v-if="pillar.stats.domain_count" class="p-3 bg-slate-50 dark:bg-darkmode-700/30 rounded-lg">
                  <p class="text-xs text-slate-500 dark:text-slate-400">{{ t("esg.domain-count") }}</p>
                  <p class="text-lg font-semibold text-slate-900 dark:text-slate-100">{{ pillar.stats.domain_count }}</p>
                </div>
                <div v-if="pillar.stats.total_controls" class="p-3 bg-slate-50 dark:bg-darkmode-700/30 rounded-lg">
                  <p class="text-xs text-slate-500 dark:text-slate-400">{{ t("esg.total-controls") }}</p>
                  <p class="text-lg font-semibold text-slate-900 dark:text-slate-100">{{ pillar.stats.total_controls }}</p>
                </div>
                <div v-if="pillar.stats.answered_controls" class="p-3 bg-slate-50 dark:bg-darkmode-700/30 rounded-lg">
                  <p class="text-xs text-slate-500 dark:text-slate-400">{{ t("esg.answered-controls") }}</p>
                  <p class="text-lg font-semibold text-emerald-600 dark:text-emerald-400">{{ pillar.stats.answered_controls }}</p>
                </div>
                <div v-if="pillar.stats.completion_pct" class="p-3 bg-slate-50 dark:bg-darkmode-700/30 rounded-lg">
                  <p class="text-xs text-slate-500 dark:text-slate-400">{{ t("esg.completion") }}</p>
                  <p class="text-lg font-semibold text-slate-900 dark:text-slate-100">{{ pillar.stats.completion_pct }}%</p>
                </div>
              </div>

              <!-- Per-Pillar Top Metrics -->
              <div v-if="pillar.top_metrics && pillar.top_metrics.length > 0" class="mb-6">
                <h4 class="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">{{ t("esg.top-metrics") }}</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div
                    v-for="(metric, mIdx) in pillar.top_metrics.slice(0, 4)"
                    :key="`metric-${mIdx}`"
                    class="p-3 bg-slate-50 dark:bg-darkmode-700/30 rounded-lg border border-slate-100 dark:border-white/10"
                  >
                    <template v-if="isKPIMetric(metric)">
                      <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">{{ t(metric.i18n_key) }}</p>
                      <p class="text-lg font-semibold text-slate-900 dark:text-slate-100">{{ metric.value }}</p>
                    </template>
                    <template v-else>
                      <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">{{ t(metric.i18n_key) }}</p>
                      <p class="text-xs text-slate-600 dark:text-slate-400">Chart: {{ metric.chart_type }}</p>
                    </template>
                  </div>
                </div>
              </div>

              <!-- Key Charts per Pillar -->
              <div v-if="pillar.key_charts && pillar.key_charts.length > 0" class="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div
                  v-for="(chart, cIdx) in pillar.key_charts.slice(0, 2)"
                  :key="`key-chart-${cIdx}`"
                  class="rounded-lg border border-slate-100 dark:border-white/10 p-4"
                >
                  <h4 class="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
                    {{ chart.title || t(chart.i18n_key || `esg.chart-${cIdx}`) }}
                  </h4>
                  <div class="h-64">
                    <template v-if="getComponentForChart(chart)">
                      <component 
                        :is="getComponentForChart(chart)"
                        :echarts_config="chart.echarts_config"
                        :series="chart.series"
                        :indicators_i18n="chart.indicators_i18n"
                        :rtl="meta?.rtl"
                      />
                    </template>
                  </div>
                </div>
              </div>

              <!-- Pillar Radar Chart - Domain Breakdown -->
              <div v-if="pillar.radar_chart" class="mb-6">
                <h4 class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">{{ t("esg.domain-breakdown") }}</h4>
                <div class="h-96 rounded-lg border border-slate-100 dark:border-white/10 p-4 bg-slate-50 dark:bg-darkmode-700/30">
                  <template v-if="getComponentForChart(pillar.radar_chart)">
                    <component 
                      :is="getComponentForChart(pillar.radar_chart)"
                      :echarts_config="pillar.radar_chart.echarts_config"
                      :indicators_i18n="pillar.radar_chart.indicators_i18n"
                      :rtl="meta?.rtl"
                    />
                  </template>
                </div>
              </div>

              <!-- Domain Breakdown Grid -->
              <div v-if="pillar.domains && pillar.domains.length > 0">
                <h4 class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">{{ t("esg.domains") }}</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div
                    v-for="domain in pillar.domains"
                    :key="domain.key"
                    class="p-4 bg-slate-50 dark:bg-darkmode-700/30 rounded-lg border border-slate-100 dark:border-white/10 hover:shadow transition-shadow"
                  >
                    <h5 class="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">{{ t(domain.i18n_key) }}</h5>
                    <div class="space-y-1 text-xs">
                      <p class="text-slate-600 dark:text-slate-400">
                        <span class="text-slate-500 dark:text-slate-500">Total: </span>
                        <span class="font-semibold">{{ domain.total_controls || 0 }}</span>
                      </p>
                      <p class="text-slate-600 dark:text-slate-400">
                        <span class="text-slate-500 dark:text-slate-500">Answered: </span>
                        <span class="font-semibold text-emerald-600 dark:text-emerald-400">{{ domain.answered_count || 0 }}</span>
                      </p>
                      <p v-if="domain.total_controls" class="text-slate-600 dark:text-slate-400">
                        <span class="text-slate-500 dark:text-slate-500">Progress: </span>
                        <span class="font-semibold">{{ Math.round(((domain.answered_count || 0) / (domain.total_controls || 1)) * 100) }}%</span>
                      </p>
                    </div>
                    <div v-if="domain.total_controls" class="mt-2 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                      <div 
                        class="h-full bg-emerald-500 rounded-full"
                        :style="`width: ${((domain.answered_count || 0) / (domain.total_controls || 1)) * 100}%`"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* Smooth scrolling for tabs */
::-webkit-scrollbar {
  height: 4px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}

::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Dark mode scrollbar */
:global(.dark) ::-webkit-scrollbar-thumb {
  background: #475569;
}

:global(.dark) ::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}

/* Smooth transitions for all interactive elements */
* {
  @apply transition-colors duration-200;
}

button {
  @apply active:scale-95;
}
</style>
