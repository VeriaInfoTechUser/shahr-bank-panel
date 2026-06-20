<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { Radar } from 'vue-chartjs';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface RadarPoint {
  parentTitle: string;
  title: string;
  riskCount: number;
  riskData: number;
}

const props = defineProps<{
  items: RadarPoint[];
}>();

const { t } = useI18n();

function wrapLabel(label: string): string[] {
  const words = label.split(' ');
  const lines: string[] = [];

  for (let i = 0; i < words.length; i += 2) {
    lines.push(words.slice(i, i + 2).join(' '));
  }

  return lines;
}

const chartData = computed(() => ({
  labels: props.items.map((item) => wrapLabel(item.title)),
  datasets: [
    {
      label: t('risk-dashboard.radar-dataset-impact'),
      data: props.items.map((item) => item.riskData),
      backgroundColor: 'rgba(37, 99, 235, 0.18)',
      borderColor: '#3b82f6',
      borderWidth: 2.5,
      pointRadius: 3,
      pointHoverRadius: 5,
      pointBackgroundColor: '#3b82f6',
      pointBorderColor: '#ffffff',
      pointHoverBackgroundColor: '#ffffff',
      pointHoverBorderColor: '#3b82f6',
    },
    {
      label: t('risk-dashboard.radar-dataset-count'),
      data: props.items.map((item) => item.riskCount),
      backgroundColor: 'rgba(245, 158, 11, 0.16)',
      borderColor: '#f59e0b',
      borderWidth: 2.5,
      pointRadius: 3,
      pointHoverRadius: 5,
      pointBackgroundColor: '#f59e0b',
      pointBorderColor: '#ffffff',
      pointHoverBackgroundColor: '#ffffff',
      pointHoverBorderColor: '#f59e0b',
    },
  ],
}));

const chartOptions = computed(() => ({
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
    tooltip: {
      displayColors: true,
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      padding: 12,
      titleFont: { size: 13, weight: '700' as const },
      bodyFont: { size: 12 },
      cornerRadius: 10,
      callbacks: {
        afterBody: (items: Array<{ dataIndex: number }>) => {
          const point = props.items[items[0]?.dataIndex];
          return point ? `${t('risk-dashboard.parent-domain')}: ${point.parentTitle}` : '';
        },
      },
    },
  },
  scales: {
    r: {
      angleLines: { color: 'rgba(148, 163, 184, 0.18)' },
      grid: { color: 'rgba(148, 163, 184, 0.22)', circular: true },
      pointLabels: {
        color: '#475569',
        font: { size: 11, weight: '600' as const },
        centerPointLabels: true,
      },
      ticks: {
        backdropColor: 'transparent',
        color: '#94a3b8',
        showLabelBackdrop: false,
        stepSize: 2,
      },
      beginAtZero: true,
      suggestedMin: 0,
    },
  },
}));
</script>

<template>
  <div class="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-darkmode-600 dark:bg-darkmode-800">
    <div class="mb-5">
      <h3 class="text-base font-semibold text-slate-900 dark:text-slate-50">
        {{ t('risk-dashboard.radar-title') }}
      </h3>
      <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {{ t('risk-dashboard.radar-subtitle') }}
      </p>
    </div>
    <div class="h-[440px]">
      <Radar :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>
