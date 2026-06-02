<template>
  <div class="esg-dashboard" :dir="$i18n.locale === 'fa' ? 'rtl' : 'ltr'">
    <!-- Header -->
    <div class="db-header">
      <div>
        <h1 class="db-title">{{ sectionName }}</h1>
        <p class="db-subtitle">
          {{ $t('esg.source') }}: {{ sectionName }} {{ $t('esg.module') }} · {{ sectionData.summary.total_kpis }} KPIs · {{ sectionData.domains.length }} {{ $t('esg.domains') }} · {{ $t('esg.lastUpdated') }}: {{ lastUpdated }}
        </p>
      </div>
      <span class="badge badge-gray">{{ $t('esg.reportingPeriod') }}: {{ reportingPeriod }}</span>
    </div>

    <!-- Summary KPI Cards -->
    <div class="kpi-cards-grid">
      <div class="kpi-card">
        <div class="kpi-label">{{ $t('esg.totalKpis') }}</div>
        <div class="kpi-value">{{ sectionData.summary.total_kpis }} <span class="kpi-unit">{{ $t('esg.kpis') }}</span></div>
        <span class="badge badge-info">{{ sectionData.domains.length }} {{ $t('esg.domains') }}</span>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">{{ $t('esg.answeredMetrics') }}</div>
        <div class="kpi-value">{{ sectionData.summary.answered }} <span class="kpi-unit">/ {{ sectionData.summary.total_kpis }}</span></div>
        <span class="badge badge-ok">{{ sectionData.summary.completion.toFixed(1) }}% {{ $t('esg.complete') }}</span>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">{{ $t('esg.unanswered') }}</div>
        <div class="kpi-value">{{ sectionData.summary.unanswered }} <span class="kpi-unit">{{ $t('esg.metric') }}</span></div>
        <span v-if="sectionData.summary.unanswered > 0" class="badge badge-danger">{{ unansweredCodes }}</span>
        <span v-else class="badge badge-ok">{{ $t('esg.allAnswered') }}</span>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">{{ $t('esg.avgScore') }}</div>
        <div class="kpi-value">{{ sectionData.summary.avg_score.toFixed(1) }} <span class="kpi-unit">%</span></div>
        <span class="badge badge-info">{{ $t('esg.fromData') }}</span>
      </div>
    </div>

    <!-- KPI Heatmap -->
    <div class="card">
      <div class="section-title">
        <i class="ti ti-layout-grid"></i>{{ $t('esg.heatmap') }}
      </div>
      <div class="heatmap-wrapper">
        <table class="heatmap-table">
          <thead>
            <tr>
              <th class="heat-header-domain">{{ $t('esg.kpiCode') }}</th>
              <th v-for="domain in sectionData.domains" :key="domain.code" class="heat-header">
                <span :title="domain.title">{{ domain.code }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(kpi, idx) in sectionData.all_kpis" :key="`hm-${idx}`">
              <td class="heat-label">{{ kpi.code }}</td>
              <td
                v-for="domain in sectionData.domains"
                :key="`hm-${idx}-${domain.code}`"
                class="heat-cell"
                :style="{ backgroundColor: getHeatmapColor(kpi, domain) }"
                :title="`${kpi.code}: ${kpi.value} ${kpi.unit}`"
              >
                <span class="heat-value">{{ formatHeatmapValue(kpi) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="data-note">
        <i class="ti ti-info-circle"></i>
        {{ $t('esg.heatmapNote') }}
      </div>
    </div>

    <!-- Charts Row 1: Radar + Donut + Pie -->
    <div class="charts-grid charts-grid-2">
      <!-- Radar Chart -->
      <div class="card">
        <div class="section-title">
          <i class="ti ti-radar"></i>{{ $t('esg.radarChart') }}
        </div>
        <v-chart class="chart-container" :option="radarChartOption" autoresize />
        <div class="data-note">
          <i class="ti ti-info-circle"></i>
          {{ $t('esg.radarNote') }}
        </div>
      </div>

      <!-- Donut + Pie Combined -->
      <div class="card">
        <div class="section-title">
          <i class="ti ti-chart-pie"></i>{{ $t('esg.answerStatus') }}
        </div>
        <div class="pie-legend">
          <span class="pie-legend-item">
            <span class="pie-legend-box" style="background: #1D9E75"></span>
            {{ $t('esg.answered') }} — {{ sectionData.summary.answered }}
          </span>
          <span class="pie-legend-item">
            <span class="pie-legend-box" style="background: #E24B4A"></span>
            {{ $t('esg.unanswered') }} — {{ sectionData.summary.unanswered }}
          </span>
        </div>
        <v-chart class="chart-container" :option="donutChartOption" autoresize />

        <div style="margin-top: 1.5rem">
          <div class="section-title" style="margin-bottom: 0.5rem">
            <i class="ti ti-chart-pie-2"></i>{{ $t('esg.answerTypeDistribution') }}
          </div>
          <div class="pie-legend">
            <span v-for="type in answerTypeDistribution" :key="type.type" class="pie-legend-item">
              <span class="pie-legend-box" :style="{ background: getAnswerTypeColor(type.type) }"></span>
              {{ type.type }} — {{ type.count }}
            </span>
          </div>
          <v-chart class="chart-container" :option="pieChartOption" autoresize />
        </div>
      </div>
    </div>

    <!-- Charts Row 2: Bar Charts -->
    <div class="charts-grid charts-grid-2">
      <!-- Percentage Bar Chart -->
      <div class="card">
        <div class="section-title">
          <i class="ti ti-chart-bar"></i>{{ $t('esg.percentageKpisByDomain') }}
        </div>
        <v-chart class="chart-container-tall" :option="percentageBarChartOption" autoresize />
      </div>

      <!-- Count Bar Chart -->
      <div class="card">
        <div class="section-title">
          <i class="ti ti-chart-bar"></i>{{ $t('esg.countKpisByDomain') }}
        </div>
        <v-chart class="chart-container-tall" :option="countBarChartOption" autoresize />
      </div>
    </div>

    <!-- Framework Coverage (Governance only) -->
    <div v-if="section === 'governance'" class="card">
      <div class="section-title">
        <i class="ti ti-building-skyscraper"></i>{{ $t('esg.frameworkCoverage') }}
      </div>
      <div class="pie-legend">
        <span v-for="fw in sectionData.framework_coverage" :key="fw.name" class="pie-legend-item">
          <span class="pie-legend-box" :style="{ background: getFrameworkColor(fw.name) }"></span>
          {{ fw.name }} — {{ fw.count }}
        </span>
      </div>
      <v-chart class="chart-container" :option="frameworkChartOption" autoresize />
      <div class="data-note">
        <i class="ti ti-info-circle"></i>
        {{ $t('esg.frameworkNote') }}
      </div>
    </div>

    <!-- Data Table -->
    <div class="card">
      <div class="section-title">
        <i class="ti ti-list-details"></i>{{ $t('esg.allKpisTable') }}
      </div>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ $t('esg.code') }}</th>
              <th>{{ $t('esg.title') }}</th>
              <th>{{ $t('esg.domain') }}</th>
              <th>{{ $t('esg.value') }}</th>
              <th>{{ $t('esg.unit') }}</th>
              <th>{{ $t('esg.status') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="kpi in sectionData.all_kpis" :key="kpi.code">
              <td class="code-col">{{ kpi.code }}</td>
              <td class="title-col">{{ kpi.title }}</td>
              <td class="domain-col">{{ kpi.domain }}</td>
              <td class="value-col">{{ kpi.value }}</td>
              <td class="unit-col">{{ kpi.unit }}</td>
              <td class="status-col">
                <span :class="['badge', kpi.status === 'answered' ? 'badge-ok' : 'badge-danger']">
                  {{ kpi.status === 'answered' ? $t('esg.answered') : $t('esg.unanswered') }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Domain Detail Cards -->
    <div class="detail-cards-grid">
      <div v-for="domain in sectionData.detailed_sections" :key="domain.code" class="card">
        <div class="detail-card-header">
          <div>
            <h3 class="detail-card-title">{{ domain.title }}</h3>
            <p class="detail-card-meta">{{ domain.kpi_count }} KPIs · {{ domain.answered }} {{ $t('esg.answered') }}</p>
          </div>
          <div class="detail-card-score" :style="{ color: getScoreColor(domain.avg_score) }}>
            {{ domain.avg_score.toFixed(0) }}%
          </div>
        </div>

        <div class="detail-kpis">
          <div v-for="(kpi, idx) in domain.kpis.slice(0, 6)" :key="`${domain.code}-${idx}`" class="detail-kpi-row">
            <span class="detail-kpi-label">{{ kpi.code }}</span>
            <div class="detail-kpi-bar">
              <div
                v-if="kpi.type === 'percentage' || kpi.unit === 'percent'"
                class="bar-fill"
                :style="{ width: `${Math.min(100, Number(kpi.value))}%`, background: getScoreColor(Number(kpi.value)) }"
              ></div>
              <div v-else class="bar-fill" style="width: 100%; background: #9ca3af"></div>
            </div>
            <span class="detail-kpi-value">{{ kpi.value }} {{ kpi.unit }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, useCssModule } from 'vue';
import VChart from 'vue-echarts';
import * as echarts from 'echarts';
import type {
  ESGDashboardData,
  ESGDashboardProps,
  ESGSectionData,
  AnswerTypeData,
} from '@/types/esg-dashboard.interface';
import { useI18n } from 'vue-i18n';

const props = withDefaults(
  defineProps<Partial<ESGDashboardProps>>(),
  {
    section: 'governance',
  }
);

const { t: $t, locale: $locale } = useI18n();

const section = computed(() => props.section as 'governance' | 'social' | 'environmental');
const dashboardData = computed(() => props.dashboardData as ESGDashboardData);
const sectionData = computed(() => dashboardData.value?.[section.value] as ESGSectionData);

const sectionName = computed(() => {
  const names = {
    governance: $t('esg.governance'),
    social: $t('esg.social'),
    environmental: $t('esg.environmental'),
  };
  return names[section.value] || section.value;
});

const reportingPeriod = computed(() => props.dashboardData?.reporting_period || '2024 Annual');
const lastUpdated = computed(() => {
  const date = new Date(props.dashboardData?.last_updated || new Date());
  return date.toISOString().split('T')[0];
});

const unansweredCodes = computed(() => {
  const unanswered = sectionData.value?.all_kpis.filter((kpi) => kpi.status === 'unanswered');
  return unanswered?.map((k) => k.code).join(', ') || 'None';
});

// Calculate answer type distribution
const answerTypeDistribution = computed(() => {
  const distribution: Record<string, number> = {};
  sectionData.value?.all_kpis.forEach((kpi) => {
    const type = kpi.type || 'unknown';
    distribution[type] = (distribution[type] || 0) + 1;
  });
  return Object.entries(distribution).map(([type, count]) => ({ type, count }));
});

// Color mapping functions
const getHeatmapColor = (kpi: any, domain: any): string => {
  if (kpi.status === 'unanswered') return '#f3f4f6'; // grey for unanswered

  const value = Number(kpi.value);
  if (kpi.type === 'percentage' || kpi.unit === 'percent') {
    if (value >= 80) return '#d1fae5'; // light green
    if (value >= 50) return '#fef3c7'; // light amber
    return '#fee2e2'; // light red
  }
  return '#f3f4f6'; // grey for count/currency
};

const formatHeatmapValue = (kpi: any): string => {
  if (kpi.status === 'unanswered') return '—';
  const value = Number(kpi.value);
  return value > 99 ? Math.round(value).toString() : value.toFixed(1);
};

const getScoreColor = (score: number): string => {
  if (score >= 80) return '#0F6E56'; // dark green
  if (score >= 50) return '#854F0B'; // dark amber
  return '#A32D2D'; // dark red
};

const getAnswerTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    percentage: '#378ADD',
    'number/count': '#534AB7',
    count: '#534AB7',
    currency: '#D85A30',
    'person count': '#1D9E75',
    person: '#1D9E75',
  };
  return colors[type] || '#9ca3af';
};

const getFrameworkColor = (name: string): string => {
  const colors: Record<string, string> = {
    'GRI Standards': '#378ADD',
    ISSB: '#1D9E75',
    'COSO ERM': '#534AB7',
    EcoVadis: '#D85A30',
    TCFD: '#BA7517',
  };
  return colors[name] || '#9ca3af';
};

// Chart options
const radarChartOption = computed(() => ({
  tooltip: { trigger: 'item' },
  legend: { data: [sectionName.value] },
  radar: {
    indicator: sectionData.value?.domains.map((d) => ({
      name: d.code,
      max: 100,
    })),
  },
  series: [
    {
      name: sectionName.value,
      type: 'radar',
      data: [
        {
          value: sectionData.value?.domains.map((d) => d.avg_score) || [],
          name: sectionName.value,
        },
      ],
      areaStyle: { color: 'rgba(29, 158, 117, 0.3)' },
      lineStyle: { color: '#1D9E75' },
      symbolSize: 6,
    },
  ],
}));

const donutChartOption = computed(() => ({
  tooltip: { trigger: 'item' },
  series: [
    {
      type: 'pie',
      radius: ['40%', '70%'],
      data: [
        { value: sectionData.value?.summary.answered || 0, name: $t('esg.answered'), itemStyle: { color: '#1D9E75' } },
        { value: sectionData.value?.summary.unanswered || 0, name: $t('esg.unanswered'), itemStyle: { color: '#E24B4A' } },
      ],
    },
  ],
}));

const pieChartOption = computed(() => ({
  tooltip: { trigger: 'item' },
  series: [
    {
      type: 'pie',
      radius: '50%',
      data: answerTypeDistribution.value.map((item) => ({
        value: item.count,
        name: item.type,
        itemStyle: { color: getAnswerTypeColor(item.type) },
      })),
    },
  ],
}));

const percentageBarChartOption = computed(() => ({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  grid: { left: '20%', right: '5%', bottom: '5%', top: '10%', containLabel: true },
  xAxis: { type: 'value', max: 100 },
  yAxis: {
    type: 'category',
    data: sectionData.value?.domains.map((d) => d.code) || [],
  },
  series: [
    {
      type: 'bar',
      data: sectionData.value?.domains.map((d) => d.avg_score) || [],
      itemStyle: { color: '#378ADD' },
      label: { show: true, position: 'right', formatter: '{c}%' },
    },
  ],
}));

const countBarChartOption = computed(() => {
  const countData = sectionData.value?.domains.map((d) => {
    const countKpis = d.kpis.filter((k) => k.unit === 'count');
    const total = countKpis.reduce((sum, k) => sum + Number(k.value), 0);
    return total;
  }) || [];

  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '20%', right: '5%', bottom: '5%', top: '10%', containLabel: true },
    xAxis: { type: 'value' },
    yAxis: {
      type: 'category',
      data: sectionData.value?.domains.map((d) => d.code) || [],
    },
    series: [
      {
        type: 'bar',
        data: countData,
        itemStyle: { color: '#534AB7' },
        label: { show: true, position: 'right', formatter: '{c}' },
      },
    ],
  };
});

const frameworkChartOption = computed(() => ({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  grid: { left: '20%', right: '5%', bottom: '5%', top: '10%', containLabel: true },
  xAxis: { type: 'value' },
  yAxis: {
    type: 'category',
    data: sectionData.value?.framework_coverage.map((f) => f.name) || [],
  },
  series: [
    {
      type: 'bar',
      data: sectionData.value?.framework_coverage.map((f) => f.count) || [],
      itemStyle: {
        color: (params: any) => getFrameworkColor(sectionData.value?.framework_coverage[params.dataIndex].name || ''),
      },
      label: { show: true, position: 'right', formatter: '{c}' },
    },
  ],
}));
</script>

<style scoped lang="postcss">
.esg-dashboard {
  @apply px-4 py-6 space-y-6;
}

/* Header */
.db-header {
  @apply flex items-start justify-between gap-4 mb-6;
}

.db-title {
  @apply text-2xl font-bold text-gray-900;
}

.db-subtitle {
  @apply text-sm text-gray-600 mt-1;
}

/* Badges */
.badge {
  @apply inline-block px-3 py-1 text-xs font-medium rounded-md;
}

.badge-ok {
  @apply bg-green-100 text-green-800;
}

.badge-warn {
  @apply bg-amber-100 text-amber-800;
}

.badge-danger {
  @apply bg-red-100 text-red-800;
}

.badge-info {
  @apply bg-blue-100 text-blue-800;
}

.badge-gray {
  @apply bg-gray-200 text-gray-800;
}

/* KPI Cards Grid */
.kpi-cards-grid {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4;
}

.kpi-card {
  @apply bg-gray-50 rounded-lg border border-gray-200 p-4;
}

.kpi-label {
  @apply text-xs font-medium text-gray-600 mb-2;
}

.kpi-value {
  @apply text-2xl font-semibold text-gray-900 mb-2;
}

.kpi-unit {
  @apply text-sm font-normal text-gray-600 ml-1;
}

/* Cards */
.card {
  @apply bg-white rounded-lg border border-gray-200 p-6;
}

.section-title {
  @apply text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2;
}

.section-title i {
  @apply text-base text-gray-600;
}

.data-note {
  @apply flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-md p-3 mt-4;
}

/* Heatmap */
.heatmap-wrapper {
  @apply overflow-x-auto mb-4;
}

.heatmap-table {
  @apply w-full border-collapse;
}

.heatmap-table th {
  @apply bg-gray-50 border-b border-gray-200 px-2 py-2 text-xs font-semibold text-gray-700;
}

.heat-header-domain {
  @apply min-w-20 text-left;
}

.heat-header {
  @apply text-center whitespace-nowrap font-mono text-10px;
}

.heat-header span {
  @apply block;
}

.heatmap-table td {
  @apply border-b border-gray-200 px-2 py-2 text-center;
}

.heat-label {
  @apply text-left text-xs font-medium text-gray-700 min-w-20 bg-gray-50;
}

.heat-cell {
  @apply relative min-w-14 text-center text-xs font-semibold rounded-md transition-all;
}

.heat-value {
  @apply block text-gray-900;
}

/* Charts Grid */
.charts-grid {
  @apply grid gap-6;
}

.charts-grid-2 {
  @apply lg:grid-cols-2;
}

.chart-container {
  @apply h-64 mb-4;
}

.chart-container-tall {
  @apply h-80 mb-4;
}

/* Pie Legend */
.pie-legend {
  @apply flex flex-wrap gap-3 mb-4 text-sm;
}

.pie-legend-item {
  @apply flex items-center gap-2;
}

.pie-legend-box {
  @apply w-3 h-3 rounded-sm flex-shrink-0;
}

/* Data Table */
.table-wrapper {
  @apply overflow-x-auto;
}

.data-table {
  @apply w-full text-sm;
}

.data-table th {
  @apply text-left text-xs font-semibold text-gray-700 bg-gray-50 border-b border-gray-200 px-4 py-3;
}

.data-table td {
  @apply px-4 py-3 border-b border-gray-200;
}

.data-table tbody tr:hover {
  @apply bg-gray-50;
}

.code-col {
  @apply font-mono text-xs text-gray-900 font-medium;
}

.title-col {
  @apply text-gray-700 max-w-xs truncate;
}

.domain-col {
  @apply text-gray-600 text-xs;
}

.value-col {
  @apply font-semibold text-gray-900;
}

.unit-col {
  @apply text-xs text-gray-600;
}

.status-col {
  @apply text-center;
}

/* Detail Cards Grid */
.detail-cards-grid {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4;
}

.detail-card-header {
  @apply flex items-start justify-between mb-4 pb-4 border-b border-gray-200;
}

.detail-card-title {
  @apply text-sm font-semibold text-gray-900;
}

.detail-card-meta {
  @apply text-xs text-gray-600 mt-1;
}

.detail-card-score {
  @apply text-2xl font-bold text-center;
}

.detail-kpis {
  @apply space-y-3;
}

.detail-kpi-row {
  @apply flex items-center gap-3;
}

.detail-kpi-label {
  @apply text-xs font-medium text-gray-700 min-w-16 flex-shrink-0;
}

.detail-kpi-bar {
  @apply flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden;
}

.bar-fill {
  @apply h-full rounded-full transition-all;
}

.detail-kpi-value {
  @apply text-xs font-medium text-gray-900 min-w-12 text-right flex-shrink-0;
}

/* RTL Support */
[dir='rtl'] {
  .db-header {
    @apply flex-row-reverse;
  }

  .section-title {
    @apply flex-row-reverse;
  }

  .data-note {
    @apply flex-row-reverse;
  }

  .pie-legend-item {
    @apply flex-row-reverse;
  }

  .detail-card-header {
    @apply flex-row-reverse;
  }

  .detail-kpi-row {
    @apply flex-row-reverse;
  }

  .detail-kpi-label {
    @apply text-right;
  }

  .detail-kpi-value {
    @apply text-left;
  }
}

/* Responsive */
@media (max-width: 1024px) {
  .charts-grid-2 {
    @apply grid-cols-1;
  }

  .detail-cards-grid {
    @apply grid-cols-1;
  }

  .kpi-cards-grid {
    @apply grid-cols-2;
  }
}

@media (max-width: 640px) {
  .esg-dashboard {
    @apply px-2 py-4 space-y-4;
  }

  .card {
    @apply p-4;
  }

  .kpi-cards-grid {
    @apply grid-cols-1;
  }

  .db-title {
    @apply text-xl;
  }
}
</style>
