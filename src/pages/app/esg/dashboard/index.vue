<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useQuery } from "@core/composables";
import { esgRepo } from "@core/repositories/esgRepo";
import { computed, onMounted, onUnmounted } from "vue";
import { useChartRegistry, getChartComponent } from "./composables/useChartRegistry";

const { t } = useI18n();

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
  [key: string]: unknown;
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
  domains: unknown[];
  radar_chart?: DashboardChart;
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

const chartRegistry = useChartRegistry();

const getComponentForChart = (chart: DashboardChart) => {
  if (!chart?.component_name) return null;
  return getChartComponent(chart.component_name, chartRegistry);
};

onMounted(() => {
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
        <svg
          class="w-5 h-5 mt-0.5 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clip-rule="evenodd"
          />
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
      <svg
        class="w-16 h-16 mx-auto mb-4 text-slate-400 dark:text-slate-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
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

      <!-- Summary Cards -->
      <div v-if="summary" class="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Overall Score -->
        <div class="rounded-xl border border-slate-200/80 dark:border-white/8 bg-white dark:bg-darkmode-800 p-6">
          <p class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">{{ t("esg.overall-score") }}</p>
          <div class="flex items-end gap-2">
            <span class="text-3xl font-bold text-slate-900 dark:text-slate-100">{{ summary.overall_score }}</span>
            <span class="text-sm text-slate-400 dark:text-slate-500">/100</span>
          </div>
        </div>

        <!-- Overall Completion -->
        <div class="rounded-xl border border-slate-200/80 dark:border-white/8 bg-white dark:bg-darkmode-800 p-6">
          <p class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">{{ t("esg.overall-completion") }}</p>
          <div class="flex items-end gap-2">
            <span class="text-3xl font-bold text-slate-900 dark:text-slate-100">{{ summary.overall_completion }}</span>
            <span class="text-sm text-slate-400 dark:text-slate-500">%</span>
          </div>
        </div>

        <!-- Answered Controls -->
        <div class="rounded-xl border border-slate-200/80 dark:border-white/8 bg-white dark:bg-darkmode-800 p-6">
          <p class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">{{ t("esg.answered-controls") }}</p>
          <div class="flex items-end gap-2">
            <span class="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{{ summary.answered_controls }}</span>
            <span class="text-sm text-slate-400 dark:text-slate-500">/ {{ summary.total_controls }}</span>
          </div>
        </div>

        <!-- Total Domains -->
        <div class="rounded-xl border border-slate-200/80 dark:border-white/8 bg-white dark:bg-darkmode-800 p-6">
          <p class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">{{ t("esg.total-domains") }}</p>
          <div class="flex items-end gap-2">
            <span class="text-3xl font-bold text-blue-600 dark:text-blue-400">{{ summary.total_domains }}</span>
          </div>
        </div>
      </div>

      <!-- Pillar Scores -->
      <div v-if="summary?.pillar_scores" class="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          v-for="(pillar, key) in summary.pillar_scores"
          :key="key"
          class="rounded-xl border border-slate-200/80 dark:border-white/8 bg-white dark:bg-darkmode-800 p-6"
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

      <!-- Charts Section -->
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

      <!-- Pillars Details -->
      <div v-if="pillars.length > 0" class="space-y-6">
        <div
          v-for="pillar in pillars"
          :key="pillar.key"
          class="rounded-xl border border-slate-200/80 dark:border-white/8 bg-white dark:bg-darkmode-800 p-6"
        >
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 rounded-lg flex items-center justify-center" :style="`background-color: ${pillar.color_hex}20`">
              <i :class="`ti ti-${pillar.icon} text-xl`" :style="`color: ${pillar.color_hex}`" aria-hidden="true"></i>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">{{ t(pillar.i18n_key) }}</h3>
              <p class="text-sm text-slate-500 dark:text-slate-400">{{ pillar.domains?.length || 0 }} {{ t("esg.domains") }}</p>
            </div>
          </div>

          <!-- Pillar Stats -->
          <div v-if="pillar.stats" class="mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
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

          <!-- Pillar Radar Chart -->
          <div v-if="pillar.radar_chart" class="mt-4">
            <h4 class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">{{ t("esg.domain-breakdown") }}</h4>
            <div class="h-80">
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
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* Add CSS for chart placeholders or custom styles */
</style>
