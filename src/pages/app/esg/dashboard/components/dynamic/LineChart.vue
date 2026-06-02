<script setup lang="ts">
import { computed } from 'vue';
import { Line } from 'vue-chartjs';
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from 'chart.js';
import type { ChartDatum, DashboardSection } from '../../types';
import { formatNumber, resolveText } from '../../dashboardUtils';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const props = defineProps<{
  section: DashboardSection;
  translate?: (key: string) => string;
}>();

const rows = computed(() => (props.section.data ?? []) as ChartDatum[]);
const chartData = computed<ChartData<'line'>>(() => ({
  labels: rows.value.map((item) => item.year || item.label || item.name || ''),
  datasets: [
    {
      label: resolveText(props.section.title, props.translate),
      data: rows.value.map((item) => Number(item.value ?? 0)),
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.14)',
      pointBackgroundColor: '#047857',
      pointRadius: 4,
      pointHoverRadius: 6,
      borderWidth: 3,
      fill: true,
      tension: 0.35,
    },
  ],
}));

const chartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { intersect: false, mode: 'index' },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { family: 'inherit' } },
    },
    y: {
      beginAtZero: true,
      suggestedMax: 100,
      grid: { color: 'rgba(148, 163, 184, 0.18)' },
      ticks: {
        font: { family: 'inherit' },
        callback(value) {
          return `${formatNumber(value, 'fa-IR', 0)}%`;
        },
      },
    },
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label(context) {
          return `${formatNumber(context.parsed.y)}%`;
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

    <div class="mt-4 h-[300px]">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </section>
</template>
