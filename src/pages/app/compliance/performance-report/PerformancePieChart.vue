<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'vue-chartjs';

ChartJS.register(ArcElement, Tooltip, Legend);

interface PieItem {
  title: string;
  value: string;
  count: number;
  color?: string;
}

const props = defineProps<{
  items: PieItem[];
}>();

const { t } = useI18n();

const palette: Record<string, string> = {
  waiting: '#94a3b8',
  todo: '#60a5fa',
  doing: '#f59e0b',
  done: '#10b981',
  approve: '#22c55e',
  reject: '#ef4444',
};

const chartData = computed(() => ({
  labels: props.items.map((item) => item.title),
  datasets: [
    {
      data: props.items.map((item) => item.count || 0),
      backgroundColor: props.items.map((item) => item.color || palette[item.value] || '#cbd5e1'),
      borderWidth: 0,
    },
  ],
}));

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '68%',
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        usePointStyle: true,
        padding: 14,
        font: { size: 12, weight: '500' as const },
        color: '#6b7280',
      },
    },
  },
};
</script>

<template>
  <div class="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-darkmode-600 dark:bg-darkmode-800">
    <div class="mb-6">
      <h3 class="text-base font-semibold text-slate-900 dark:text-slate-50">
        {{ t('compliance-performance.status-distribution-title') }}
      </h3>
      <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {{ t('compliance-performance.status-distribution-subtitle') }}
      </p>
    </div>
    <div class="h-[320px]">
      <Doughnut :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>
