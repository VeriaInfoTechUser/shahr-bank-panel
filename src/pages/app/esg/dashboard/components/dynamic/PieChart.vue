<script setup lang="ts">
import { computed } from 'vue';
import { Pie } from 'vue-chartjs';
import {
  ArcElement,
  Chart as ChartJS,
  Legend,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from 'chart.js';
import type { ChartDatum, DashboardSection } from '../../types';
import { formatNumber, resolveText } from '../../dashboardUtils';

ChartJS.register(ArcElement, Tooltip, Legend);

const props = defineProps<{
  section: DashboardSection;
  translate?: (key: string) => string;
}>();

const palette = [
  '#10b981',
  '#2563eb',
  '#7c3aed',
  '#f59e0b',
  '#ef4444',
  '#14b8a6',
  '#ec4899',
  '#64748b',
  '#84cc16',
  '#f97316',
  '#06b6d4',
  '#8b5cf6',
];

const rows = computed(() => (props.section.data ?? []) as ChartDatum[]);
const chartData = computed<ChartData<'pie'>>(() => ({
  labels: rows.value.map((item) => resolveText(item.label || item.name, props.translate)),
  datasets: [
    {
      data: rows.value.map((item) => Number(item.value ?? 0)),
      backgroundColor: rows.value.map((item, index) => item.color || palette[index % palette.length]),
      borderColor: '#ffffff',
      borderWidth: 2,
    },
  ],
}));

const chartOptions: ChartOptions<'pie'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        boxWidth: 10,
        boxHeight: 10,
        usePointStyle: true,
        font: { family: 'inherit', size: 11 },
      },
    },
    tooltip: {
      callbacks: {
        label(context) {
          return `${context.label}: ${formatNumber(context.parsed)}%`;
        },
      },
    },
  },
};
</script>

<template>
  <section class="rounded-lg border border-slate-200/80 bg-white p-5 shadow-sm dark:border-darkmode-600 dark:bg-darkmode-800">
    <h2 class="text-base font-semibold text-slate-900 dark:text-slate-50">
      {{ resolveText(section.title, translate) }}
    </h2>

    <div class="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
      <div class="h-[320px] min-w-0">
        <Pie :data="chartData" :options="chartOptions" />
      </div>

      <div class="max-h-[320px] space-y-2 overflow-y-auto pr-1">
        <div
          v-for="(item, index) in rows"
          :key="item.label || item.name || index"
          class="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-darkmode-700/50"
        >
          <span class="min-w-0 truncate text-slate-600 dark:text-slate-300">
            <span
              class="me-2 inline-block h-2.5 w-2.5 rounded-full"
              :style="{ backgroundColor: item.color || palette[index % palette.length] }"
            />
            {{ resolveText(item.label || item.name, translate) }}
          </span>
          <strong class="shrink-0 text-slate-900 dark:text-slate-50">
            {{ formatNumber(item.value) }}%
          </strong>
        </div>
      </div>
    </div>
  </section>
</template>
