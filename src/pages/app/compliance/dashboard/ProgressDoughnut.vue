<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'vue-chartjs';

ChartJS.register(ArcElement, Tooltip, Legend);

interface ProgressData {
  completed?: number | null;
  partial?: number | null;
  notStarted?: number | null;
}

const props = defineProps<{
  data: ProgressData;
  title?: string;
  height?: number;
}>();

const { t } = useI18n();

const chartData = computed(() => {
  const completed = props.data.completed || 0;
  const partial = props.data.partial || 0;
  const notStarted = props.data.notStarted || 0;

  return {
    labels: [
      t('compliance-dashboard.completed'),
      t('compliance-dashboard.in-progress'),
      t('compliance-dashboard.not-started'),
    ],
    datasets: [
      {
        data: [completed, partial, notStarted],
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
        borderColor: ['#10b98144', '#f59e0b44', '#ef444444'],
        borderWidth: 2,
      },
    ],
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        usePointStyle: true,
        padding: 16,
        font: { size: 12, weight: '500' as const },
        color: '#6b7280',
      },
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 12,
      titleFont: { size: 13, weight: 'bold' as const },
      bodyFont: { size: 12 },
      borderRadius: 8,
    },
  },
};
</script>

<template>
  <div class="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-darkmode-600 dark:bg-darkmode-800">
    <div v-if="title" class="mb-6">
      <h3 class="text-base font-semibold text-slate-900 dark:text-slate-50">
        {{ title }}
      </h3>
    </div>
    <div :style="{ height: `${height || 300}px` }">
      <Doughnut :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>
