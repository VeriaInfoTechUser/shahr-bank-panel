<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { Bar } from 'vue-chartjs';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface DailyItem {
  title: string;
  todo: number;
  approve: number;
}

const props = defineProps<{
  title?: string;
  items: DailyItem[];
}>();

const { t } = useI18n();

const visibleItems = computed(() => props.items.slice(-14));

const chartData = computed(() => ({
  labels: visibleItems.value.map((item) => item.title.replace(/^.*\//, '')),
  datasets: [
    {
      label: t('compliance-performance.daily-todo'),
      data: visibleItems.value.map((item) => item.todo || 0),
      backgroundColor: '#60a5fa',
      borderRadius: 8,
      borderSkipped: false,
    },
    {
      label: t('compliance-performance.daily-approve'),
      data: visibleItems.value.map((item) => item.approve || 0),
      backgroundColor: '#22c55e',
      borderRadius: 8,
      borderSkipped: false,
    },
  ],
}));

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        usePointStyle: true,
        padding: 14,
        font: { size: 12, weight: '500' as const },
        color: '#6b7280',
      },
    },
  },
  scales: {
    x: {
      grid: { display: false, drawBorder: false },
      ticks: { color: '#9ca3af', font: { size: 11 } },
    },
    y: {
      grid: { color: '#e5e7eb', drawBorder: false },
      ticks: { color: '#6b7280', font: { size: 11, weight: '500' as const } },
    },
  },
};
</script>

<template>
  <div class="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-darkmode-600 dark:bg-darkmode-800">
    <div class="mb-6">
      <h3 class="text-base font-semibold text-slate-900 dark:text-slate-50">
        {{ title || t('compliance-performance.daily-title') }}
      </h3>
      <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {{ t('compliance-performance.daily-subtitle') }}
      </p>
    </div>
    <div class="h-[320px]">
      <Bar :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>
