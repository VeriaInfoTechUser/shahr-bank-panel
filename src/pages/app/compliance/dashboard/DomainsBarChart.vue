<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { Bar } from 'vue-chartjs';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface DomainStats {
  title: string;
  '0'?: number | null;
  '50'?: number | null;
  '100'?: number | null;
}

const props = defineProps<{
  domains: DomainStats[];
  maxItems?: number;
}>();

const { t } = useI18n();

const topDomains = computed(() => {
  const items = props.domains || [];
  return items.slice(0, props.maxItems || 8);
});

const chartData = computed(() => {
  return {
    labels: topDomains.value.map(d => d.title),
    datasets: [
      {
        label: t('compliance-dashboard.chart-completed'),
        data: topDomains.value.map(d => d['100'] || 0),
        backgroundColor: '#10b981',
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: t('compliance-dashboard.chart-in-progress'),
        data: topDomains.value.map(d => d['50'] || 0),
        backgroundColor: '#f59e0b',
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: t('compliance-dashboard.chart-not-started'),
        data: topDomains.value.map(d => d['0'] || 0),
        backgroundColor: '#ef4444',
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };
});

const chartOptions = {
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        usePointStyle: true,
        padding: 16,
        font: { size: 12, weight: '500' },
        color: '#6b7280',
      },
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 12,
      titleFont: { size: 13, weight: 'bold' },
      bodyFont: { size: 12 },
      borderRadius: 8,
    },
  },
  scales: {
    x: {
      stacked: true,
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
      stacked: true,
      grid: {
        display: false,
        drawBorder: false,
      },
      ticks: {
        color: '#6b7280',
        font: { size: 11, weight: '500' },
      },
    },
  },
};
</script>

<template>
  <div class="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-darkmode-600 dark:bg-darkmode-800">
    <div class="mb-6">
      <h3 class="text-base font-semibold text-slate-900 dark:text-slate-50">
        {{ t('compliance-dashboard.domains-overview-title') }}
      </h3>
      <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {{ t('compliance-dashboard.domains-overview-subtitle') }}
      </p>
    </div>
    <div style="height: 400px">
      <Bar :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>
