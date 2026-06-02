<script setup lang="ts">
import { computed, ref, onMounted, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { RadarChart, BarChart, PieChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components';
import type { ESGSectionData } from '@/types/esg-dashboard.interface';

use([CanvasRenderer, RadarChart, BarChart, PieChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent]);

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  section: 'governance' | 'social' | 'environmental';
  dashboardData: {
    governance?: ESGSectionData;
    social?: ESGSectionData;
    environmental?: ESGSectionData;
    reporting_period?: string;
    last_updated?: string;
  };
}

const props = withDefaults(defineProps<Props>(), { section: 'governance' });
const { t } = useI18n();

// ─── Section Data ──────────────────────────────────────────────────────────────
const sectionData = computed(() => props.dashboardData[props.section]);

// ─── Score helpers ─────────────────────────────────────────────────────────────
const scoreColor = (v: number | null) => {
  if (v === null) return '#94a3b8';
  if (v >= 80) return '#10b981';
  if (v >= 50) return '#f59e0b';
  return '#ef4444';
};
const scoreClass = (v: number | null) => {
  if (v === null) return 'badge-gray';
  if (v >= 80) return 'badge-ok';
  if (v >= 50) return 'badge-warn';
  return 'badge-danger';
};
const scoreBg = (v: number | null) => {
  if (v === null) return 'bg-slate-100 dark:bg-slate-700';
  if (v >= 80) return 'bg-emerald-50 dark:bg-emerald-900/20';
  if (v >= 50) return 'bg-amber-50 dark:bg-amber-900/20';
  return 'bg-red-50 dark:bg-red-900/20';
};

const fmt = (v: number | null, unit?: string) => {
  if (v === null || v === undefined) return '—';
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  const formatted = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 1 }).format(n);
  if (unit === 'percent') return `${formatted}%`;
  if (unit === 'currency') return `${formatted} ريال`;
  return formatted;
};

// ─── Summary Stats ─────────────────────────────────────────────────────────────
const summary = computed(() => sectionData.value?.summary);

const avgPercentScore = computed(() => {
  const pctKpis = sectionData.value?.all_kpis?.filter(k => k.unit === 'percent' && k.value !== null) ?? [];
  if (!pctKpis.length) return summary.value?.avg_score ?? 0;
  return pctKpis.reduce((s, k) => s + Number(k.value), 0) / pctKpis.length;
});

// ─── KPI type distribution ─────────────────────────────────────────────────────
const typeDistribution = computed(() => {
  const dist: Record<string, number> = {};
  sectionData.value?.all_kpis?.forEach(kpi => {
    const u = kpi.unit || 'other';
    dist[u] = (dist[u] || 0) + 1;
  });
  return dist;
});

const typeChartOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
  legend: { show: false },
  series: [{
    type: 'pie',
    radius: ['50%', '75%'],
    avoidLabelOverlap: false,
    label: { show: false },
    emphasis: { label: { show: true, fontSize: 12, fontWeight: 'bold' } },
    data: Object.entries(typeDistribution.value).map(([name, value], i) => ({
      name,
      value,
      itemStyle: { color: ['#378ADD', '#534AB7', '#D85A30', '#1D9E75', '#BA7517', '#94a3b8'][i % 6] },
    })),
  }],
}));

// ─── Answer Status Chart (Donut) ───────────────────────────────────────────────
const statusChartOption = computed(() => {
  const answered = summary.value?.answered ?? 0;
  const unanswered = summary.value?.unanswered ?? 0;
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', formatter: '{b}: {c}' },
    legend: { show: false },
    series: [{
      type: 'pie',
      radius: ['55%', '78%'],
      label: {
        show: true,
        position: 'center',
        formatter: () => `{val|${summary.value?.completion.toFixed(0)}%}\n{sub|تکمیل}`,
        rich: {
          val: { fontSize: 22, fontWeight: 'bold', color: '#1e293b', lineHeight: 28 },
          sub: { fontSize: 11, color: '#94a3b8', lineHeight: 18 },
        },
      },
      emphasis: { scale: false },
      data: [
        { value: answered, name: 'پاسخ‌داده‌شده', itemStyle: { color: '#1D9E75' } },
        { value: unanswered, name: 'بدون‌پاسخ', itemStyle: { color: '#ef4444' } },
      ],
    }],
  };
});

// ─── Radar Chart ───────────────────────────────────────────────────────────────
const radarChartOption = computed(() => {
  const domains = sectionData.value?.domains ?? [];
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item' },
    radar: {
      shape: 'polygon',
      indicator: domains.map(d => ({ name: d.title.length > 12 ? d.title.slice(0, 12) + '…' : d.title, max: 100 })),
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      splitLine: { lineStyle: { color: '#e2e8f0' } },
      splitArea: { areaStyle: { color: ['rgba(148,163,184,0.04)', 'transparent'] } },
      name: { textStyle: { color: '#64748b', fontSize: 10 }, rich: {} },
    },
    series: [{
      type: 'radar',
      data: [{
        value: domains.map(d => d.avg_score),
        name: 'میانگین امتیاز',
        areaStyle: { color: 'rgba(55,138,221,0.15)' },
        lineStyle: { color: '#378ADD', width: 2 },
        itemStyle: { color: '#378ADD' },
        symbol: 'circle',
        symbolSize: 5,
      }],
    }],
  };
});

// ─── Domain Horizontal Bar Chart ──────────────────────────────────────────────
const domainBarOption = computed(() => {
  const domains = [...(sectionData.value?.domains ?? [])].sort((a, b) => a.avg_score - b.avg_score);
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', formatter: (p: any) => `${p[0].name}: ${p[0].value.toFixed(1)}%` },
    grid: { left: 10, right: 55, top: 8, bottom: 8, containLabel: true },
    xAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%', fontSize: 10, color: '#94a3b8' }, splitLine: { lineStyle: { color: '#f1f5f9' } }, axisLine: { show: false }, axisTick: { show: false } },
    yAxis: {
      type: 'category',
      data: domains.map(d => d.title.length > 16 ? d.title.slice(0, 16) + '…' : d.title),
      axisLabel: { fontSize: 10, color: '#64748b' },
      axisLine: { show: false }, axisTick: { show: false },
    },
    series: [{
      type: 'bar',
      barMaxWidth: 14,
      data: domains.map(d => ({
        value: d.avg_score,
        itemStyle: {
          color: d.avg_score >= 80 ? '#10b981' : d.avg_score >= 50 ? '#f59e0b' : '#ef4444',
          borderRadius: [0, 4, 4, 0],
        },
      })),
      label: { show: true, position: 'right', formatter: (p: any) => `${p.value.toFixed(0)}%`, fontSize: 10, color: '#475569' },
    }],
  };
});

// ─── Framework Coverage Bar ────────────────────────────────────────────────────
const frameworkCoverageData = computed(() => sectionData.value?.framework_coverage ?? []);

const frameworkBarOption = computed(() => {
  const fw = frameworkCoverageData.value;
  const colors = ['#378ADD', '#1D9E75', '#534AB7', '#D85A30', '#BA7517'];
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    grid: { left: 10, right: 30, top: 10, bottom: 8, containLabel: true },
    xAxis: { type: 'category', data: fw.map(f => f.name), axisLabel: { fontSize: 10, color: '#64748b' }, axisLine: { lineStyle: { color: '#e2e8f0' } }, axisTick: { show: false } },
    yAxis: { type: 'value', axisLabel: { fontSize: 10, color: '#94a3b8' }, splitLine: { lineStyle: { color: '#f1f5f9' } }, axisLine: { show: false }, axisTick: { show: false } },
    series: [{
      type: 'bar',
      barMaxWidth: 40,
      data: fw.map((f, i) => ({
        value: f.count,
        itemStyle: { color: colors[i % colors.length], borderRadius: [4, 4, 0, 0] },
      })),
      label: { show: true, position: 'top', fontSize: 10, color: '#475569' },
    }],
  };
});

// ─── Domain Cards KPI Chart (per domain minibar) ──────────────────────────────
const domainMiniOption = (kpis: any[]) => {
  const pct = kpis.filter(k => k.unit === 'percent' && k.value !== null);
  if (!pct.length) return null;
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    grid: { left: 0, right: 0, top: 4, bottom: 0, containLabel: true },
    xAxis: { type: 'category', show: false, data: pct.map(k => k.code.split('-').pop()) },
    yAxis: { type: 'value', show: false, max: 100 },
    series: [{
      type: 'bar',
      barMaxWidth: 16,
      data: pct.map(k => ({
        value: k.value,
        itemStyle: {
          color: Number(k.value) >= 80 ? '#10b981' : Number(k.value) >= 50 ? '#f59e0b' : '#ef4444',
          borderRadius: [3, 3, 0, 0],
        },
      })),
    }],
  };
};

// ─── Active domain for detail expand ─────────────────────────────────────────
const activeDomain = ref<string | null>(null);
const toggleDomain = (code: string) => {
  activeDomain.value = activeDomain.value === code ? null : code;
};

// ─── Section label mapping ─────────────────────────────────────────────────────
const sectionLabel: Record<string, string> = {
  governance: 'حاکمیت',
  social: 'اجتماعی',
  environmental: 'محیط‌زیست',
};

// ─── Domain icon mapping ───────────────────────────────────────────────────────
const domainIcon = (code: string) => {
  const icons: Record<string, string> = {
    'GOV-CGS': 'ti-building-community',
    'GOV-ETH': 'ti-scale',
    'GOV-CMP': 'ti-shield-check',
    'GOV-RSK': 'ti-alert-triangle',
    'GOV-DPC': 'ti-lock',
    'GOV-SCG': 'ti-link',
    'GOV-EGR': 'ti-chart-line',
    'GOV-IAC': 'ti-clipboard-check',
    'GOV-FTT': 'ti-coins',
    'GOV-RLC': 'ti-gavel',
    'GOV-AML': 'ti-spy',
    'GOV-DGQ': 'ti-database',
  };
  return icons[code] || 'ti-circle';
};
</script>

<template>
  <div v-if="sectionData" dir="rtl" class="esg-dashboard space-y-5 pb-10">

    <!-- ═══════════ HEADER ═══════════ -->
    <div class="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
      <div>
        <h1 class="text-xl font-semibold text-slate-900 dark:text-white">
          داشبورد ESG — {{ sectionLabel[section] ?? section }}
        </h1>
        <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
          <span class="inline-flex items-center gap-1">
            <i class="ti ti-database-import text-slate-400" />
            {{ sectionData.summary.total_kpis }} شاخص کلیدی
          </span>
          <span class="mx-2 text-slate-300">·</span>
          <span>{{ sectionData.domains.length }} دامنه</span>
          <span v-if="dashboardData.last_updated" class="mx-2 text-slate-300">·</span>
          <span v-if="dashboardData.last_updated">آخرین بروزرسانی {{ dashboardData.last_updated }}</span>
        </p>
      </div>
      <div class="flex items-center gap-2">
        <span class="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
          <i class="ti ti-calendar-event text-slate-400" />
          دوره گزارش: {{ dashboardData.reporting_period || '۲۰۲۴' }}
        </span>
      </div>
    </div>

    <!-- ═══════════ SUMMARY KPI CARDS ═══════════ -->
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
      <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <p class="text-[11px] font-medium text-slate-500 dark:text-slate-400">مجموع شاخص‌ها</p>
        <p class="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {{ sectionData.summary.total_kpis }}
        </p>
        <span class="mt-2 inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
          <i class="ti ti-layout-grid text-[10px]" />{{ sectionData.domains.length }} دامنه
        </span>
      </div>

      <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <p class="text-[11px] font-medium text-slate-500 dark:text-slate-400">پاسخ‌داده‌شده</p>
        <p class="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {{ sectionData.summary.answered }}
        </p>
        <span class="mt-2 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
          <i class="ti ti-check text-[10px]" />{{ sectionData.summary.completion.toFixed(1) }}% کامل
        </span>
      </div>

      <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <p class="text-[11px] font-medium text-slate-500 dark:text-slate-400">بدون پاسخ</p>
        <p class="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {{ sectionData.summary.unanswered ?? 0 }}
        </p>
        <span v-if="(sectionData.summary.unanswered ?? 0) > 0" class="mt-2 inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300">
          <i class="ti ti-alert-circle text-[10px]" />نیاز به توجه
        </span>
        <span v-else class="mt-2 inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
          <i class="ti ti-circle-check text-[10px]" />کامل
        </span>
      </div>

      <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <p class="text-[11px] font-medium text-slate-500 dark:text-slate-400">میانگین امتیاز</p>
        <p class="mt-2 text-2xl font-bold tracking-tight dark:text-white"
           :class="sectionData.summary.avg_score >= 80 ? 'text-emerald-600' : sectionData.summary.avg_score >= 50 ? 'text-amber-600' : 'text-red-600'">
          {{ sectionData.summary.avg_score.toFixed(1) }}%
        </p>
        <span class="mt-2 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium"
              :class="scoreClass(sectionData.summary.avg_score)">
          {{ sectionData.summary.avg_score >= 80 ? 'عالی' : sectionData.summary.avg_score >= 70 ? 'خوب' : sectionData.summary.avg_score >= 50 ? 'متوسط' : 'نیاز به بهبود' }}
        </span>
      </div>

      <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 col-span-2 sm:col-span-1">
        <p class="text-[11px] font-medium text-slate-500 dark:text-slate-400">نرخ تکمیل</p>
        <div class="mt-3 flex items-center gap-2">
          <div class="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
            <div class="h-2 rounded-full bg-emerald-500 transition-all duration-700"
                 :style="{ width: `${sectionData.summary.completion}%` }" />
          </div>
          <span class="text-sm font-bold text-slate-900 dark:text-white">{{ sectionData.summary.completion.toFixed(0) }}%</span>
        </div>
        <p class="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
          {{ sectionData.summary.answered }} از {{ sectionData.summary.total_kpis }} شاخص
        </p>
      </div>
    </div>

    <!-- ═══════════ CHARTS ROW 1: Radar + Donut + Type Pie ═══════════ -->
    <div class="grid gap-5 lg:grid-cols-5">

      <!-- Radar Chart -->
      <div class="lg:col-span-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div class="mb-1 flex items-center gap-2">
          <i class="ti ti-radar-2 text-slate-400" />
          <h3 class="text-sm font-semibold text-slate-900 dark:text-white">نمودار رادار دامنه‌ها</h3>
        </div>
        <p class="mb-3 text-[11px] text-slate-400">میانگین امتیاز درصدی هر دامنه</p>
        <VChart
            :option="radarChartOption"
            autoresize
            style="height:400px; width: 100%"
        />
      </div>

      <!-- Donut + Type Pie stacked -->
      <div class="lg:col-span-2 flex flex-col gap-5">
        <!-- Answer Status Donut -->
        <div class="flex-1 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div class="mb-1 flex items-center gap-2">
            <i class="ti ti-chart-pie text-slate-400" />
            <h3 class="text-sm font-semibold text-slate-900 dark:text-white">وضعیت پاسخ‌ها</h3>
          </div>
          <div class="flex items-center gap-4">
            <VChart :option="statusChartOption" autoresize style="height: 330px; width: 330px; flex-shrink: 0" />
            <div class="space-y-2 text-xs">
              <div class="flex items-center justify-between gap-4">
                <span class="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <span class="h-2.5 w-2.5 rounded-sm bg-emerald-500 flex-shrink-0" />
                  پاسخ‌داده‌شده
                </span>
                <span class="font-bold text-slate-900 dark:text-white">{{ sectionData.summary.answered }}</span>
              </div>
              <div class="flex items-center justify-between gap-4">
                <span class="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <span class="h-2.5 w-2.5 rounded-sm bg-red-500 flex-shrink-0" />
                  بدون‌پاسخ
                </span>
                <span class="font-bold text-slate-900 dark:text-white">{{ sectionData.summary.unanswered ?? 0 }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- KPI Type Distribution -->
        <div class="flex-1 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div class="mb-1 flex items-center gap-2">
            <i class="ti ti-chart-donut-3 text-slate-400" />
            <h3 class="text-sm font-semibold text-slate-900 dark:text-white">توزیع نوع شاخص</h3>
          </div>
          <div class="flex items-center gap-3">
            <VChart :option="typeChartOption" autoresize style="height: 300px; width: 300px; flex-shrink: 0" />
            <div class="space-y-1.5 text-[11px]">
              <div v-for="([unit, count], i) in Object.entries(typeDistribution)" :key="unit"
                   class="flex items-center justify-between gap-3 text-slate-600 dark:text-slate-400">
                <span class="flex items-center gap-1.5">
                  <span class="h-2 w-2 rounded-sm flex-shrink-0"
                        :style="{ background: ['#378ADD','#534AB7','#D85A30','#1D9E75','#BA7517','#94a3b8'][i % 6] }" />
                  {{ unit }}
                </span>
                <span class="font-semibold text-slate-800 dark:text-white">{{ count }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════ CHARTS ROW 2: Domain Bar + Framework Bar ═══════════ -->
    <div class="grid gap-5 lg:grid-cols-2">

      <!-- Domain Bar Chart -->
      <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div class="mb-1 flex items-center gap-2">
          <i class="ti ti-chart-bar text-slate-400" />
          <h3 class="text-sm font-semibold text-slate-900 dark:text-white">امتیاز میانگین دامنه‌ها</h3>
        </div>
        <p class="mb-3 text-[11px] text-slate-400">میانگین شاخص‌های درصدی هر دامنه (سبز ≥80، عنبری 50-79، قرمز &lt;50)</p>
        <VChart :option="domainBarOption" autoresize style="height: 320px; width: 100%" />
      </div>

      <!-- Framework Coverage -->
      <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div class="mb-1 flex items-center gap-2">
          <i class="ti ti-activity text-slate-400" />
          <h3 class="text-sm font-semibold text-slate-900 dark:text-white">پوشش چارچوب‌های گزارش‌دهی</h3>
        </div>
        <p class="mb-3 text-[11px] text-slate-400">تعداد KPI پوشش‌یافته در هر استاندارد</p>
        <VChart
            v-if="frameworkCoverageData.length"
            :option="frameworkBarOption"
            autoresize
            style="height: 200px; width: 100%"
        />
        <div class="mt-4 flex flex-wrap gap-2">
          <span v-for="(fw, i) in frameworkCoverageData" :key="fw.name"
                class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium text-white"
                :style="{ background: ['#378ADD','#1D9E75','#534AB7','#D85A30','#BA7517'][i % 5] }">
            {{ fw.name }} — {{ fw.count }}
          </span>
        </div>
        <div class="mt-3 rounded-lg bg-slate-50 p-3 text-[11px] text-slate-500 dark:bg-slate-700/50 dark:text-slate-400">
          <i class="ti ti-info-circle ml-1" />
          TCFD فقط برای دامنه مدیریت ریسک اعمال می‌شود.
        </div>
      </div>
    </div>

    <!-- ═══════════ DOMAIN DETAIL CARDS ═══════════ -->
    <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div class="mb-4 flex items-center gap-2">
        <i class="ti ti-cards text-slate-400" />
        <h3 class="text-sm font-semibold text-slate-900 dark:text-white">جزئیات دامنه‌ها</h3>
        <span class="mr-auto text-[11px] text-slate-400">برای مشاهده شاخص‌ها کلیک کنید</span>
      </div>

      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="domain in sectionData.domains" :key="domain.code"
             class="cursor-pointer overflow-hidden rounded-lg border transition-all duration-200 hover:shadow-md"
             :class="activeDomain === domain.code
               ? 'border-sky-300 dark:border-sky-600 shadow-md'
               : 'border-slate-100 dark:border-slate-700'"
             @click="toggleDomain(domain.code)">

          <!-- Card Header -->
          <div class="flex items-start justify-between p-4"
               :class="scoreBg(domain.avg_score)">
            <div class="flex items-start gap-2.5">
              <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                   :style="{ background: scoreColor(domain.avg_score) + '20' }">
                <i class="ti text-base" :class="domainIcon(domain.code)"
                   :style="{ color: scoreColor(domain.avg_score) }" />
              </div>
              <div>
                <h4 class="text-xs font-semibold text-slate-900 dark:text-white leading-snug">{{ domain.title }}</h4>
                <p class="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400 font-mono">{{ domain.code }}</p>
              </div>
            </div>
            <div class="flex flex-col items-end gap-1">
              <span class="text-lg font-bold"
                    :style="{ color: scoreColor(domain.avg_score) }">
                {{ domain.avg_score.toFixed(0) }}%
              </span>
              <span class="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium"
                    :class="scoreClass(domain.avg_score)">
                {{ domain.avg_score >= 80 ? 'عالی' : domain.avg_score >= 50 ? 'متوسط' : 'ضعیف' }}
              </span>
            </div>
          </div>

          <!-- Card Stats -->
          <div class="border-t border-slate-100 px-4 py-3 dark:border-slate-700 bg-white dark:bg-slate-800">
            <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
              <span>{{ domain.answered }}/{{ domain.kpi_count }} شاخص پاسخ‌داده</span>
              <i class="ti" :class="activeDomain === domain.code ? 'ti-chevron-up' : 'ti-chevron-down'" />
            </div>
            <div class="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
              <div class="h-1.5 rounded-full transition-all duration-700"
                   :style="{ width: `${(domain.answered / domain.kpi_count) * 100}%`, background: scoreColor(domain.avg_score) }" />
            </div>

            <!-- Mini chart for percentage KPIs -->
            <div v-if="activeDomain === domain.code && domain.kpis?.length" class="mt-4">
              <VChart
                  v-if="domainMiniOption(domain.kpis)"
                  :option="domainMiniOption(domain.kpis)"
                  autoresize
                  style="height: 60px"
              />
              <div class="mt-3 space-y-1.5">
                <div v-for="kpi in domain.kpis" :key="kpi.code"
                     class="flex items-start justify-between gap-2 rounded-md bg-slate-50 px-2.5 py-2 dark:bg-slate-700/40">
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-[10px] font-mono text-slate-500 dark:text-slate-400">{{ kpi.code }}</p>
                    <p class="mt-0.5 text-[11px] leading-snug text-slate-700 dark:text-slate-300" :title="kpi.title">
                      {{ kpi.title.length > 42 ? kpi.title.slice(0, 42) + '…' : kpi.title }}
                    </p>
                  </div>
                  <div class="flex-shrink-0 text-left">
                    <span v-if="kpi.value !== null"
                          class="inline-block rounded px-1.5 py-0.5 text-[11px] font-semibold"
                          :class="kpi.unit === 'percent' ? scoreClass(Number(kpi.value)) : 'badge-gray'">
                      {{ fmt(kpi.value, kpi.unit) }}
                    </span>
                    <span v-else class="text-[11px] text-slate-400">—</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════ ALL KPIs HEATMAP TABLE ═══════════ -->
    <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div class="mb-3 flex items-center gap-2">
        <i class="ti ti-layout-grid text-slate-400" />
        <h3 class="text-sm font-semibold text-slate-900 dark:text-white">نقشه حرارتی تمام شاخص‌ها</h3>
        <span class="mr-auto rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500 dark:bg-slate-700 dark:text-slate-400">
          {{ sectionData.all_kpis.length }} شاخص
        </span>
      </div>
      <p class="mb-4 text-[11px] text-slate-400">
        <span class="mr-2 inline-flex items-center gap-1"><span class="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500" /> سبز ≥80%</span>
        <span class="mr-2 inline-flex items-center gap-1"><span class="inline-block h-2.5 w-2.5 rounded-sm bg-amber-400" /> عنبری 50-79%</span>
        <span class="mr-2 inline-flex items-center gap-1"><span class="inline-block h-2.5 w-2.5 rounded-sm bg-red-500" /> قرمز &lt;50%</span>
        <span class="inline-flex items-center gap-1"><span class="inline-block h-2.5 w-2.5 rounded-sm bg-slate-300" /> خاکستری = عدد/ارز</span>
      </p>

      <div class="overflow-x-auto">
        <table class="w-full text-[11px]" style="table-layout: fixed">
          <colgroup>
            <col style="width: 108px">
            <col style="width: auto">
            <col style="width: 80px">
            <col style="width: 60px">
            <col style="width: 72px">
          </colgroup>
          <thead>
          <tr class="border-b border-slate-100 dark:border-slate-700">
            <th class="p-2 text-right font-medium text-slate-500 dark:text-slate-400">کد</th>
            <th class="p-2 text-right font-medium text-slate-500 dark:text-slate-400">عنوان</th>
            <th class="p-2 text-center font-medium text-slate-500 dark:text-slate-400">مقدار</th>
            <th class="p-2 text-center font-medium text-slate-500 dark:text-slate-400">واحد</th>
            <th class="p-2 text-center font-medium text-slate-500 dark:text-slate-400">وضعیت</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="kpi in sectionData.all_kpis" :key="kpi.code"
              class="border-b border-slate-50 transition hover:bg-slate-50 dark:border-slate-700/50 dark:hover:bg-slate-700/20">
            <td class="p-2 font-mono text-[10px] text-slate-500 dark:text-slate-400 whitespace-nowrap">{{ kpi.code }}</td>
            <td class="p-2 text-slate-700 dark:text-slate-300 overflow-hidden">
              <span class="line-clamp-2 leading-snug" :title="kpi.title">{{ kpi.title }}</span>
            </td>
            <td class="p-2 text-center">
                <span v-if="kpi.value !== null"
                      class="inline-block rounded px-1.5 py-0.5 font-semibold"
                      :class="kpi.unit === 'percent'
                        ? scoreClass(Number(kpi.value))
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'">
                  {{ fmt(kpi.value, kpi.unit) }}
                </span>
              <span v-else class="text-slate-400">—</span>
            </td>
            <td class="p-2 text-center text-slate-500 dark:text-slate-400">{{ kpi.unit }}</td>
            <td class="p-2 text-center">
                <span class="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium"
                      :class="kpi.status === 'answered'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'">
                  <i class="ti text-[9px]" :class="kpi.status === 'answered' ? 'ti-check' : 'ti-x'" />
                  {{ kpi.status === 'answered' ? 'پاسخ داده' : 'بدون پاسخ' }}
                </span>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>

<style scoped>
.esg-dashboard {
  font-family: inherit;
}

/* Badge variants */
.badge-ok {
  @apply bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300;
}
.badge-warn {
  @apply bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300;
}
.badge-danger {
  @apply bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300;
}
.badge-gray {
  @apply bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300;
}

/* line clamp utility if not in tw */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>