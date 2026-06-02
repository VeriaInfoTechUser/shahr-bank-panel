<script setup lang="ts">
import { computed } from 'vue';
import type { Component } from 'vue';
import ActivityFeed from './ActivityFeed.vue';
import DataTable from './DataTable.vue';
import LineChart from './LineChart.vue';
import MetricGrid from './MetricGrid.vue';
import PieChart from './PieChart.vue';
import ProgressBars from './ProgressBars.vue';
import ScoreCards from './ScoreCards.vue';
import StatCards from './StatCards.vue';
import type { DashboardResponse, DashboardSectionType } from '../../types';
import { formatNumber, resolveText } from '../../dashboardUtils';

const props = defineProps<{
  dashboard: DashboardResponse;
  translate?: (key: string) => string;
}>();

const sectionComponents: Record<DashboardSectionType, Component> = {
  score_cards: ScoreCards,
  pie_chart: PieChart,
  line_chart: LineChart,
  progress_bars: ProgressBars,
  metric_grid: MetricGrid,
  data_table: DataTable,
  stat_cards: StatCards,
  activity_feed: ActivityFeed,
};

const supportedSections = computed(() => props.dashboard.sections.filter((section) => sectionComponents[section.type]));
const periodLabel = computed(() => props.dashboard.reportingPeriod || props.dashboard.section);
</script>

<template>
  <div class="space-y-5">
    <header class="rounded-lg border border-slate-200/80 bg-white p-5 shadow-sm dark:border-darkmode-600 dark:bg-darkmode-800">
      <div class="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p class="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            ESG
          </p>
          <h1 class="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50">
            {{ resolveText(`menu.esg-${dashboard.section}`, translate, dashboard.section) }}
          </h1>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {{ periodLabel }}
            <span v-if="dashboard.lastUpdated">
              · {{ dashboard.lastUpdated }}
            </span>
          </p>
        </div>

        <div class="grid gap-3 sm:grid-cols-3 lg:min-w-[520px]">
          <div class="rounded-lg bg-emerald-50 px-4 py-3 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            <p class="text-xs font-medium opacity-75">امتیاز</p>
            <strong class="mt-1 block text-xl font-semibold">
              {{ formatNumber(dashboard.summary.overallGovernanceScore) }}/100
            </strong>
          </div>
          <div class="rounded-lg bg-blue-50 px-4 py-3 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
            <p class="text-xs font-medium opacity-75">تغییر</p>
            <strong class="mt-1 block text-xl font-semibold">
              {{ dashboard.summary.scoreChange }}
            </strong>
          </div>
          <div class="rounded-lg bg-violet-50 px-4 py-3 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
            <p class="text-xs font-medium opacity-75">تکمیل داده</p>
            <strong class="mt-1 block text-xl font-semibold">
              {{ formatNumber(dashboard.summary.dataCompleteness) }}%
            </strong>
          </div>
        </div>
      </div>
    </header>

    <component
      :is="sectionComponents[section.type]"
      v-for="section in supportedSections"
      :key="section.id"
      :section="section"
      :translate="translate"
    />
  </div>
</template>
