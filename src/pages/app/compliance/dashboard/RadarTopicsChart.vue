<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { Bar } from 'vue-chartjs';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface RadarTopicItem {
  parentTitle: string;
  title: string;
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
}

const props = defineProps<{
  items: RadarTopicItem[];
}>();

const { t } = useI18n();

const chartData = computed(() => ({
  labels: props.items.map((item) => item.title),
  datasets: [
    {
      label: t('compliance-dashboard.total-items'),
      data: props.items.map((item) => item.total),
      backgroundColor: '#3b82f6',
      borderRadius: 8,
      borderSkipped: false,
    },
  ],
}));

const chartOptions = computed(() => ({
  indexAxis: 'y' as const,
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      callbacks: {
        afterLabel(context: { dataIndex: number }) {
          const item = props.items[context.dataIndex];
          return `${t('compliance-dashboard.parent-domain-label')}: ${item.parentTitle}`;
        },
      },
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
        drawBorder: false,
      },
      ticks: {
        color: '#9ca3af',
        font: { size: 11 },
      },
    },
    y: {
      grid: {
        display: false,
        drawBorder: false,
      },
      ticks: {
        color: '#6b7280',
        font: { size: 11, weight: '500' as const },
      },
    },
  },
}));
</script>

<template>
  <div class="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-darkmode-600 dark:bg-darkmode-800">
    <div class="mb-6">
      <h3 class="text-base font-semibold text-slate-900 dark:text-slate-50">
        {{ t('compliance-dashboard.radar-topics-title') }}
      </h3>
      <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {{ t('compliance-dashboard.radar-topics-subtitle') }}
      </p>
    </div>
    <div class="h-[340px]">
      <Bar :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>
