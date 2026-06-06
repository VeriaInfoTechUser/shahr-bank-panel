<script setup lang="ts">
import { computed, ref } from 'vue';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { RadarChart, BarChart, PieChart, LineChart } from 'echarts/charts';
import {
  TitleComponent, TooltipComponent, LegendComponent,
  GridComponent, DataZoomComponent,
} from 'echarts/components';

use([CanvasRenderer, RadarChart, BarChart, PieChart, LineChart,
  TitleComponent, TooltipComponent, LegendComponent, GridComponent, DataZoomComponent]);

// ─── Section color palette ──────────────────────────────────────────────────
const COLORS = {
  env:  { main: '#1D9E75', light: '#E1F5EE', text: '#0F6E56', ring: 'rgba(29,158,117,0.15)' },
  soc:  { main: '#378ADD', light: '#E6F1FB', text: '#185FA5', ring: 'rgba(55,138,221,0.15)' },
  gov:  { main: '#534AB7', light: '#EEECFB', text: '#352D8A', ring: 'rgba(83,74,183,0.15)' },
  ok:   '#1D9E75', warn: '#BA7517', danger: '#E24B4A', gray: '#94a3b8',
  blue: '#378ADD', purple: '#534AB7', orange: '#D85A30',
};

// ─── Props ──────────────────────────────────────────────────────────────────
interface KpiItem { code: string; title: string; value: number | null; unit: string; status: string; domain?: string }
interface DomainItem { code: string; title: string; kpi_count: number; answered: number; avg_score: number; kpis?: KpiItem[] }
interface SectionSummary { total_kpis: number; answered: number; unanswered?: number; completion: number; avg_score: number }
interface ESGSection { summary: SectionSummary; domains: DomainItem[]; all_kpis: KpiItem[] }

interface Props {
  dashboardData: {
    governance?: ESGSection;
    social?: ESGSection;
    environmental?: ESGSection;
    reporting_period?: string;
    last_updated?: string;
    total_kpis?: number;
  };
}

const props = defineProps<Props>();

// ─── Helpers ────────────────────────────────────────────────────────────────
const sc = (v: number | null) => {
  if (v === null) return COLORS.gray;
  if (v >= 80) return COLORS.ok; if (v >= 50) return COLORS.warn; return COLORS.danger;
};
const sb = (v: number | null) => {
  if (v === null) return 'badge-gray';
  if (v >= 80) return 'badge-ok'; if (v >= 50) return 'badge-warn'; return 'badge-danger';
};
const slabel = (v: number | null) =>
    v === null ? '—' : v >= 80 ? 'عالی' : v >= 70 ? 'خوب' : v >= 50 ? 'متوسط' : 'ضعیف';

// ─── Overall aggregates ──────────────────────────────────────────────────────
const gov  = computed(() => props.dashboardData.governance);
const soc  = computed(() => props.dashboardData.social);
const env  = computed(() => props.dashboardData.environmental);

const totalKpis = computed(() =>
    (gov.value?.summary.total_kpis ?? 0) +
    (soc.value?.summary.total_kpis ?? 0) +
    (env.value?.summary.total_kpis ?? 0));

const totalAnswered = computed(() =>
    (gov.value?.summary.answered ?? 0) +
    (soc.value?.summary.answered ?? 0) +
    (env.value?.summary.answered ?? 0));

const overallCompletion = computed(() =>
    totalKpis.value > 0 ? (totalAnswered.value / totalKpis.value) * 100 : 0);

const overallScore = computed(() => {
  const scores = [gov.value?.summary.avg_score, soc.value?.summary.avg_score, env.value?.summary.avg_score]
      .filter(s => s !== undefined) as number[];
  return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
});

// ─── Score Cards ─────────────────────────────────────────────────────────────
const scoreCards = computed(() => [
  { label: 'امتیاز کلی ESG', score: overallScore.value, icon: 'ti-leaf', color: '#378ADD', yoy: '+5.2' },
  { label: 'محیط‌زیست', score: env.value?.summary.avg_score ?? 0, icon: 'ti-plant-2', color: COLORS.env.main, yoy: '+6.5' },
  { label: 'اجتماعی', score: soc.value?.summary.avg_score ?? 0, icon: 'ti-users', color: COLORS.soc.main, yoy: '+4.3' },
  { label: 'حاکمیت', score: gov.value?.summary.avg_score ?? 0, icon: 'ti-building-bank', color: COLORS.gov.main, yoy: '+8.1' },
]);

// ─── Ring chart factory ───────────────────────────────────────────────────────
const ringOpt = (score: number, color: string) => ({
  backgroundColor: 'transparent',
  series: [{
    type: 'pie', radius: ['62%', '82%'],
    label: { show: true, position: 'center',
      formatter: `{val|${Math.round(score)}%}`,
      rich: { val: { fontSize: 15, fontWeight: 600, color: '#1e293b' } } },
    emphasis: { scale: false },
    data: [
      { value: score, itemStyle: { color } },
      { value: 100 - score, itemStyle: { color: '#f1f5f9' } },
    ],
  }],
});

// ─── ESG Score Trend (simulated from actual section scores) ─────────────────
const trendYears = ['2020', '2021', '2022', '2023', '2024'];
const govTrend  = [52, 58, 65, 74, gov.value?.summary.avg_score  ?? 81];
const socTrend  = [48, 54, 58, 62, soc.value?.summary.avg_score  ?? 65];
const envTrend  = [38, 44, 48, 51, env.value?.summary.avg_score  ?? 54];
const overTrend = trendYears.map((_, i) => ((govTrend[i] + socTrend[i] + envTrend[i]) / 3));

const trendOpt = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
  legend: {
    data: ['کلی', 'محیط‌زیست', 'اجتماعی', 'حاکمیت'],
    bottom: 0, textStyle: { fontSize: 10, color: '#64748b' },
  },
  grid: { left: 10, right: 10, top: 16, bottom: 36, containLabel: true },
  xAxis: { type: 'category', data: trendYears, axisLabel: { fontSize: 10, color: '#94a3b8' }, axisLine: { lineStyle: { color: '#e2e8f0' } }, axisTick: { show: false } },
  yAxis: { type: 'value', min: 30, max: 100, axisLabel: { fontSize: 10, color: '#94a3b8', formatter: '{value}%' }, splitLine: { lineStyle: { color: '#f1f5f9' } }, axisLine: { show: false }, axisTick: { show: false } },
  series: [
    { name: 'کلی', type: 'line', data: overTrend, symbol: 'circle', symbolSize: 5, smooth: true, lineStyle: { color: '#378ADD', width: 2 }, itemStyle: { color: '#378ADD' } },
    { name: 'محیط‌زیست', type: 'line', data: envTrend, symbol: 'emptyRect', symbolSize: 5, smooth: true, lineStyle: { color: COLORS.env.main, width: 2, type: 'dashed' }, itemStyle: { color: COLORS.env.main } },
    { name: 'اجتماعی', type: 'line', data: socTrend, symbol: 'triangle', symbolSize: 5, smooth: true, lineStyle: { color: COLORS.soc.main, width: 2, type: 'dashed' }, itemStyle: { color: COLORS.soc.main } },
    { name: 'حاکمیت', type: 'line', data: govTrend, symbol: 'cross', symbolSize: 5, smooth: true, lineStyle: { color: COLORS.gov.main, width: 2, type: 'dashed' }, itemStyle: { color: COLORS.gov.main } },
  ],
}));

// ─── ESG Breakdown Donut ─────────────────────────────────────────────────────
const breakdownOpt = computed(() => {
  const g = gov.value?.summary.total_kpis ?? 0;
  const s = soc.value?.summary.total_kpis ?? 0;
  const e = env.value?.summary.total_kpis ?? 0;
  const total = g + s + e;
  const gp = total ? ((g / total) * 100).toFixed(0) : 0;
  const sp = total ? ((s / total) * 100).toFixed(0) : 0;
  const ep = total ? ((e / total) * 100).toFixed(0) : 0;
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', formatter: '{b}: {c} KPI ({d}%)' },
    series: [{
      type: 'pie', radius: ['42%', '68%'], center: ['50%', '55%'],
      label: { fontSize: 10, color: '#64748b', formatter: '{b}\n{d}%' },
      labelLine: { length: 8, length2: 6 },
      data: [
        { name: `محیط‌زیست ${ep}%`, value: e, itemStyle: { color: COLORS.env.main } },
        { name: `اجتماعی ${sp}%`, value: s, itemStyle: { color: COLORS.soc.main } },
        { name: `حاکمیت ${gp}%`, value: g, itemStyle: { color: COLORS.gov.main } },
      ],
    }],
  };
});

// ─── Top ESG Indicators: pick top % KPIs across all sections ─────────────────
const topIndicators = computed(() => {
  const all: Array<{ title: string; code: string; value: number; unit: string; section: string }> = [];
  const push = (kpis: KpiItem[] | undefined, sec: string) => {
    kpis?.filter(k => k.unit === 'percent' && k.value !== null)
        .forEach(k => all.push({ title: k.title, code: k.code, value: Number(k.value), unit: k.unit, section: sec }));
  };
  push(env.value?.all_kpis, 'env');
  push(soc.value?.all_kpis, 'soc');
  push(gov.value?.all_kpis, 'gov');
  // Top 5 by value desc
  return all.sort((a, b) => b.value - a.value).slice(0, 8);
});

// ─── Data Completeness by category (horizontal bars) ─────────────────────────
const completenessData = computed(() => [
  { label: 'محیط‌زیست', value: env.value?.summary.completion ?? 0, color: COLORS.env.main },
  { label: 'اجتماعی', value: soc.value?.summary.completion ?? 0, color: COLORS.soc.main },
  { label: 'حاکمیت', value: gov.value?.summary.completion ?? 0, color: COLORS.gov.main },
  // sub-domains from governance as example
  ...((gov.value?.domains ?? []).slice(0, 4).map((d, i) => ({
    label: d.title.length > 18 ? d.title.slice(0, 18) + '…' : d.title,
    value: (d.answered / d.kpi_count) * 100,
    color: ['#94a3b8', '#b0b8c4', '#c4cbd5', '#d4dae2'][i],
  }))),
]);

// ─── Approval Workflow Donut ─────────────────────────────────────────────────
const workflowOpt = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'item', formatter: '{b}: {d}%' },
  series: [{
    type: 'pie', radius: ['50%', '72%'], center: ['38%', '52%'],
    label: {
      show: true, position: 'center',
      formatter: '{main|68%}\n{sub|پیشرفت}',
      rich: { main: { fontSize: 18, fontWeight: 600, color: '#1e293b', lineHeight: 24 }, sub: { fontSize: 10, color: '#94a3b8', lineHeight: 16 } },
    },
    emphasis: { scale: false },
    data: [
      { value: 68, name: 'تکمیل‌شده', itemStyle: { color: COLORS.ok } },
      { value: 18, name: 'در بررسی', itemStyle: { color: COLORS.blue } },
      { value: 10, name: 'در انتظار', itemStyle: { color: '#94a3b8' } },
      { value: 4,  name: 'رد‌شده', itemStyle: { color: COLORS.danger } },
    ],
  }],
}));

// ─── Unit Progress Bars ──────────────────────────────────────────────────────
const unitProgress = [
  { label: 'مالی', value: 85, color: COLORS.gov.main },
  { label: 'HSE', value: 60, color: COLORS.env.main },
  { label: 'منابع انسانی', value: 90, color: COLORS.soc.main },
  { label: 'حقوقی', value: 75, color: '#D85A30' },
  { label: 'تدارکات', value: 65, color: '#BA7517' },
];

// ─── GHG Scope Bar Chart ─────────────────────────────────────────────────────
const ghgOpt = computed(() => {
  const ghg1 = env.value?.all_kpis?.find(k => k.code === 'ENV-GHG-001')?.value ?? 1200;
  const ghg2 = env.value?.all_kpis?.find(k => k.code === 'ENV-GHG-002')?.value ?? 2500;
  const ghg3 = env.value?.all_kpis?.find(k => k.code === 'ENV-GHG-003')?.value ?? 8000;
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', formatter: (p: any) => `${p[0].name}: ${Number(p[0].value).toLocaleString()} tCO₂e` },
    grid: { left: 8, right: 16, top: 10, bottom: 8, containLabel: true },
    xAxis: { type: 'category', data: ['Scope 1', 'Scope 2', 'Scope 3'], axisLabel: { fontSize: 10, color: '#64748b' }, axisLine: { lineStyle: { color: '#e2e8f0' } }, axisTick: { show: false } },
    yAxis: { type: 'value', axisLabel: { fontSize: 9, color: '#94a3b8', formatter: (v: number) => v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v }, splitLine: { lineStyle: { color: '#f1f5f9' } }, axisLine: { show: false }, axisTick: { show: false } },
    series: [{
      type: 'bar', barMaxWidth: 44,
      data: [
        { value: ghg1, itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] } },
        { value: ghg2, itemStyle: { color: '#f59e0b', borderRadius: [4, 4, 0, 0] } },
        { value: ghg3, itemStyle: { color: '#ef4444', borderRadius: [4, 4, 0, 0] } },
      ],
      label: { show: true, position: 'top', fontSize: 9, color: '#475569', formatter: (p: any) => Number(p.value).toLocaleString() },
    }],
  };
});

// ─── Domain radar per section ─────────────────────────────────────────────────
const sectionRadarOpt = (section: ESGSection | undefined, color: string) => {
  if (!section) return {};
  const domains = section.domains.slice(0, 8);
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item' },
    radar: {
      shape: 'polygon',
      indicator: domains.map(d => ({ name: d.title.length > 10 ? d.title.slice(0, 10) + '…' : d.title, max: 100 })),
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      splitLine: { lineStyle: { color: '#e2e8f0' } },
      splitArea: { areaStyle: { color: ['rgba(148,163,184,0.04)', 'transparent'] } },
      name: { textStyle: { color: '#64748b', fontSize: 9 } },
    },
    series: [{
      type: 'radar',
      data: [{ value: domains.map(d => d.avg_score), name: 'امتیاز',
        areaStyle: { color: color.replace(')', ',0.15)').replace('rgb', 'rgba') },
        lineStyle: { color, width: 2 }, itemStyle: { color }, symbol: 'circle', symbolSize: 4 }],
    }],
  };
};

// ─── Recent Activities (static sample - replace with API when available) ─────
const activities = [
  { text: 'دپارتمان HSE داده‌های محیطی را ثبت کرد', time: '۲ساعت پیش', color: COLORS.env.main },
  { text: 'منابع انسانی شاخص‌های اجتماعی را به‌روز کرد', time: '۴ساعت پیش', color: COLORS.soc.main },
  { text: 'حسابرسی داخلی داده‌های حاکمیت را تأیید کرد', time: '۶ساعت پیش', color: COLORS.gov.main },
  { text: 'رخداد جدید ثبت شد: ایمنی محل کار', time: '۱روز پیش', color: COLORS.danger },
];

// ─── Incomplete items ─────────────────────────────────────────────────────────
const incompleteItems = computed(() => [
  { label: 'شاخص‌های ناقص', value: (gov.value?.summary.unanswered ?? 0) + (soc.value?.summary.unanswered ?? 0) + (env.value?.summary.unanswered ?? 0), icon: 'ti-chart-bar', color: COLORS.danger },
  { label: 'مدارک ناقص', value: 5, icon: 'ti-file-x', color: COLORS.warn },
  { label: 'موارد تأییدنشده', value: 12, icon: 'ti-alert-triangle', color: COLORS.orange },
]);

// ─── Data Sources ─────────────────────────────────────────────────────────────
const dataSources = [
  { label: 'سیستم داخلی', icon: 'ti-server', connected: true },
  { label: 'API Integration', icon: 'ti-api', connected: true },
  { label: 'Database View', icon: 'ti-database', connected: true },
  { label: 'n8n Workflow', icon: 'ti-network', connected: true },
  { label: 'Excel Upload', icon: 'ti-file-spreadsheet', connected: false },
];
</script>

<template>
  <div v-if="dashboardData" dir="rtl" class="esg-overall space-y-5 pb-10">

    <!-- ══════════════ HEADER ══════════════ -->
    <div class="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
      <div>
        <h1 class="text-xl font-semibold text-slate-900 dark:text-white">داشبورد کلی ESG</h1>
        <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
          <span class="inline-flex items-center gap-1"><i class="ti ti-database-import" />{{ totalKpis }} شاخص · {{ (gov?.domains?.length ?? 0) + (soc?.domains?.length ?? 0) + (env?.domains?.length ?? 0) }} دامنه</span>
          <span v-if="dashboardData.last_updated" class="mx-2">·</span>
          <span v-if="dashboardData.last_updated">آخرین بروزرسانی {{ dashboardData.last_updated }}</span>
        </p>
      </div>
      <div class="flex items-center gap-2">
<!--        <span class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">-->
<!--          <i class="ti ti-calendar-event" />دوره گزارش: {{ dashboardData.reporting_period || '۲۰۲۴ سالانه' }}-->
<!--        </span>-->
<!--        <button class="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">-->
<!--          <i class="ti ti-download" />دریافت گزارش-->
<!--        </button>-->
      </div>
    </div>

    <!-- ══════════════ TOP SCORE CARDS ══════════════ -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <!-- 4 score cards -->
      <div
        v-for="(card, i) in scoreCards"
        :key="i"
        class="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-700 dark:bg-slate-800"
    >
      <!-- background glow -->
      <div
          class="absolute inset-0 opacity-5"
          :style="{
      background: `radial-gradient(circle at top right, ${card.color}, transparent 70%)`
    }"
      />

        <div class="flex items-center gap-2">
          <div
              class="flex h-8 w-8 items-center justify-center rounded-lg"
              :style="{ backgroundColor: `${card.color}15` }"
          >
            <i
                class="ti text-lg"
                :class="card.icon"
                :style="{ color: card.color }"
            />
          </div>

          <span class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {{ card.label }}
        </span>
        </div>
      <div class="relative flex items-center justify-between gap-4">

        <!-- Left Content -->
        <div class="flex-1 min-w-0">


          <div class="mt-4 flex items-end gap-1">
        <span class="text-4xl font-bold leading-none text-slate-900 dark:text-white">
          {{ Math.round(card.score) }}
        </span>

            <span class="mb-1 text-sm text-slate-400">
          /100
        </span>
          </div>

          <!-- Mini Progress -->
          <div class="mt-4">
            <div class="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
              <div
                  class="h-full rounded-full transition-all duration-700"
                  :style="{
              width: `${card.score}%`,
              backgroundColor: card.color
            }"
              />
            </div>
          </div>

          <!-- Trend -->
<!--          <div-->
<!--              v-if="card.yoy"-->
<!--              class="mt-3 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium"-->
<!--              :style="{-->
<!--          color: card.color,-->
<!--          backgroundColor: `${card.color}10`-->
<!--        }"-->
<!--          >-->
<!--            <i class="ti ti-trending-up text-[12px]" />-->
<!--            {{ card.yoy }}%-->
<!--          </div>-->

        </div>

        <!-- Right Ring -->
        <div class="relative flex items-center justify-center">
          <VChart
              :option="ringOpt(card.score, card.color)"
              autoresize
              style="width:130px;height:130px"
          />
        </div>

      </div>
    </div>

      <!-- Data Completion card -->
      <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <p class="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <i class="ti ti-database text-blue-400 text-sm" />تکمیل داده‌ها
        </p>
        <p class="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {{ overallCompletion.toFixed(0) }}<span class="text-base font-normal text-slate-400">%</span>
        </p>
        <div class="mt-3 space-y-1.5">
          <div v-for="c in ['env', 'soc', 'gov']" :key="c" class="flex items-center gap-2">
            <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
              <div class="h-1.5 rounded-full"
                   :style="{
                     width: c === 'env' ? (env?.summary.completion ?? 0) + '%' : c === 'soc' ? (soc?.summary.completion ?? 0) + '%' : (gov?.summary.completion ?? 0) + '%',
                     background: c === 'env' ? COLORS.env.main : c === 'soc' ? COLORS.soc.main : COLORS.gov.main
                   }" />
            </div>
            <span class="w-8 text-right text-[10px] font-medium text-slate-600 dark:text-slate-400">
              {{ (c === 'env' ? env?.summary.completion : c === 'soc' ? soc?.summary.completion : gov?.summary.completion)?.toFixed(0) }}%
            </span>
          </div>
        </div>
        <p class="mt-2 text-[11px] text-slate-400">تکمیل داده‌ها</p>
      </div>
    </div>

    <!-- ══════════════ ROW 2: Trend + Breakdown + Top Indicators + Completeness ══════════════ -->
    <div class="grid gap-5 lg:grid-cols-12">

      <!-- ESG Score Trend -->
      <div class="lg:col-span-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div class="mb-1 flex items-center gap-2">
          <i class="ti ti-chart-line text-slate-400" />
          <h3 class="text-sm font-semibold text-slate-900 dark:text-white">روند امتیاز ESG</h3>
          <span class="mr-auto text-[10px] text-slate-400">۲۰۲۰–۲۰۲۴</span>
        </div>
        <p class="mb-3 text-[11px] text-slate-400">روند امتیازات ESG در طول سال‌ها</p>
        <VChart :option="trendOpt" autoresize style="height:220px;width:100%" />
      </div>

      <!-- ESG Breakdown Donut -->
      <div class="lg:col-span-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div class="mb-1 flex items-center gap-2">
          <i class="ti ti-chart-pie text-slate-400" />
          <h3 class="text-sm font-semibold text-slate-900 dark:text-white">تقسیم‌بندی ESG</h3>
        </div>
        <p class="mb-1 text-[11px] text-slate-400">سهم هر بعد از کل شاخص‌ها</p>
        <VChart :option="breakdownOpt" autoresize style="height:220px;width:100%" />
      </div>

      <!-- Top ESG Indicators -->
      <div class="lg:col-span-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 overflow-hidden">
        <div class="mb-3 flex items-center gap-2">
          <i class="ti ti-stars text-slate-400" />
          <h3 class="text-sm font-semibold text-slate-900 dark:text-white">شاخص‌های برتر ESG</h3>
        </div>
        <div class="space-y-2.5">
          <div v-for="ind in topIndicators" :key="ind.code" class="flex items-center gap-2">
            <div class="h-6 w-6 flex-shrink-0 flex items-center justify-center rounded"
                 :style="{ background: ind.section === 'env' ? COLORS.env.light : ind.section === 'soc' ? COLORS.soc.light : COLORS.gov.light }">
              <i class="ti text-[11px]"
                 :class="ind.section === 'env' ? 'ti-plant-2' : ind.section === 'soc' ? 'ti-users' : 'ti-building-bank'"
                 :style="{ color: ind.section === 'env' ? COLORS.env.main : ind.section === 'soc' ? COLORS.soc.main : COLORS.gov.main }" />
            </div>
            <span class="flex-1 text-[11px] text-slate-600 dark:text-slate-400 truncate" :title="ind.title">{{ ind.title.slice(0, 28) }}…</span>
            <span class="flex-shrink-0 text-[11px] font-semibold" :style="{ color: sc(ind.value) }">
              {{ ind.value.toFixed(1) }}%
            </span>
          </div>
        </div>
      </div>

      <!-- Data Completeness by Category -->
      <div class="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div class="mb-3 flex items-center gap-2">
          <i class="ti ti-chart-bar text-slate-400" />
          <h3 class="text-sm font-semibold text-slate-900 dark:text-white">تکمیل به تفکیک</h3>
        </div>
        <div class="space-y-3">
          <div v-for="item in completenessData.slice(0, 7)" :key="item.label">
            <div class="flex items-center justify-between mb-1">
              <span class="text-[11px] text-slate-600 dark:text-slate-400 truncate">{{ item.label }}</span>
              <span class="text-[11px] font-semibold text-slate-800 dark:text-white ml-2">{{ item.value.toFixed(0) }}%</span>
            </div>
            <div class="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
              <div class="h-1.5 rounded-full transition-all duration-700" :style="{ width: item.value + '%', background: item.color }" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════════ ROW 3: Section Radars ══════════════ -->
    <div class="grid gap-5 lg:grid-cols-3">
      <div v-for="([label, sec, color, icon]) in [
             ['محیط‌زیست', env, COLORS.env.main, 'ti-plant-2'],
             ['اجتماعی', soc, COLORS.soc.main, 'ti-users'],
             ['حاکمیت', gov, COLORS.gov.main, 'ti-building-bank'],
           ]" :key="label"
           class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div class="mb-1 flex items-center gap-2">
          <i class="ti text-sm" :class="icon" :style="{ color }" />
          <h3 class="text-sm font-semibold text-slate-900 dark:text-white">رادار {{ label }}</h3>
          <span class="mr-auto inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold"
                :class="sb(sec?.summary.avg_score ?? null)">
            {{ (sec?.summary.avg_score ?? 0).toFixed(1) }}%
          </span>
        </div>
        <VChart :option="sectionRadarOpt(sec, color)" autoresize style="height:220px;width:100%" />
      </div>
    </div>

    <!-- ══════════════ ROW 4: Workflow + Unit Progress + GHG Scope ══════════════ -->
    <div class="grid gap-5 lg:grid-cols-3">

      <!-- Approval Workflow -->
      <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div class="mb-3 flex items-center gap-2">
          <i class="ti ti-git-merge text-slate-400" />
          <h3 class="text-sm font-semibold text-slate-900 dark:text-white">وضعیت گردش کار تأیید</h3>
        </div>
        <div class="flex items-center gap-4">
          <VChart :option="workflowOpt" autoresize style="height:160px;width:160px;flex-shrink:0" />
          <div class="space-y-3 text-xs flex-1">
            <div v-for="([label, val, color]) in [['تکمیل‌شده', 68, COLORS.ok], ['در بررسی', 18, COLORS.blue], ['در انتظار', 10, COLORS.gray], ['رد‌شده', 4, COLORS.danger]]"
                 :key="label" class="flex items-center justify-between gap-2">
              <span class="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span class="h-2 w-2 rounded-sm flex-shrink-0" :style="{ background: color }" />{{ label }}
              </span>
              <span class="font-semibold text-slate-900 dark:text-white">{{ val }}%</span>
            </div>
          </div>
        </div>
        <p class="mt-3 text-[11px] text-slate-400">پیشرفت کلی گردش کار تأیید</p>
      </div>

      <!-- Unit Progress -->
      <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div class="mb-3 flex items-center gap-2">
          <i class="ti ti-building-community text-slate-400" />
          <h3 class="text-sm font-semibold text-slate-900 dark:text-white">پیشرفت واحدها</h3>
        </div>
        <div class="space-y-4">
          <div v-for="u in unitProgress" :key="u.label">
            <div class="flex items-center justify-between mb-1.5">
              <span class="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                <i class="ti ti-building-bank text-[11px]" :style="{ color: u.color }" />{{ u.label }}
              </span>
              <span class="text-xs font-semibold text-slate-900 dark:text-white">{{ u.value }}%</span>
            </div>
            <div class="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
              <div class="h-2 rounded-full transition-all duration-700" :style="{ width: u.value + '%', background: u.color }" />
            </div>
          </div>
        </div>
        <p class="mt-3 text-[11px] text-slate-400">پیشرفت ثبت داده بر اساس دپارتمان</p>
      </div>

      <!-- GHG Scope Emissions -->
      <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div class="mb-1 flex items-center gap-2">
          <i class="ti ti-cloud text-slate-400" />
          <h3 class="text-sm font-semibold text-slate-900 dark:text-white">انتشار GHG بر اساس Scope</h3>
        </div>
        <p class="mb-3 text-[11px] text-slate-400">واحد: تن CO₂e — دوره گزارش</p>
        <VChart :option="ghgOpt" autoresize style="height:160px;width:100%" />
        <div class="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
          <div class="rounded-md bg-emerald-50 p-2 dark:bg-emerald-900/20">
            <p class="font-semibold text-emerald-700 dark:text-emerald-400">{{ (env?.all_kpis?.find(k => k.code === 'ENV-GHG-001')?.value ?? 1200).toLocaleString() }}</p>
            <p class="text-slate-500">Scope 1</p>
          </div>
          <div class="rounded-md bg-amber-50 p-2 dark:bg-amber-900/20">
            <p class="font-semibold text-amber-700 dark:text-amber-400">{{ (env?.all_kpis?.find(k => k.code === 'ENV-GHG-002')?.value ?? 2500).toLocaleString() }}</p>
            <p class="text-slate-500">Scope 2</p>
          </div>
          <div class="rounded-md bg-red-50 p-2 dark:bg-red-900/20">
            <p class="font-semibold text-red-700 dark:text-red-400">{{ (env?.all_kpis?.find(k => k.code === 'ENV-GHG-003')?.value ?? 8000).toLocaleString() }}</p>
            <p class="text-slate-500">Scope 3</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════════ ROW 5: Data Sources + Incomplete + Activities ══════════════ -->
    <div class="grid gap-5 lg:grid-cols-3">

      <!-- Data Sources Status -->
      <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div class="mb-3 flex items-center gap-2">
          <i class="ti ti-plug text-slate-400" />
          <h3 class="text-sm font-semibold text-slate-900 dark:text-white">وضعیت منابع داده</h3>
        </div>
        <div class="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-3 xl:grid-cols-5">
          <div v-for="ds in dataSources" :key="ds.label"
               class="flex flex-col items-center gap-2 rounded-lg border p-3"
               :class="ds.connected ? 'border-emerald-100 bg-emerald-50 dark:border-emerald-900/30 dark:bg-emerald-900/10' : 'border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'">
            <i class="ti text-xl" :class="ds.icon"
               :style="{ color: ds.connected ? COLORS.ok : COLORS.gray }" />
            <span class="text-center text-[10px] font-medium text-slate-700 dark:text-slate-300 leading-tight">{{ ds.label }}</span>
            <span class="inline-flex items-center gap-0.5 text-[10px] font-medium"
                  :class="ds.connected ? 'text-emerald-600' : 'text-slate-400'">
              <span class="h-1.5 w-1.5 rounded-full" :style="{ background: ds.connected ? COLORS.ok : COLORS.gray }" />
              {{ ds.connected ? 'متصل' : 'قطع' }}
            </span>
          </div>
        </div>
        <p class="mt-3 text-[11px] text-slate-400">وضعیت منابع داده و یکپارچه‌سازی‌ها</p>
      </div>

      <!-- Incomplete Items -->
      <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div class="mb-3 flex items-center gap-2">
          <i class="ti ti-alert-circle text-slate-400" />
          <h3 class="text-sm font-semibold text-slate-900 dark:text-white">موارد ناقص</h3>
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div v-for="item in incompleteItems" :key="item.label"
               class="flex flex-col items-center gap-2 rounded-xl border p-4 text-center"
               :style="{ borderColor: item.color + '30', background: item.color + '08' }">
            <i class="ti text-2xl" :class="item.icon" :style="{ color: item.color }" />
            <p class="text-2xl font-bold" :style="{ color: item.color }">{{ item.value }}</p>
            <p class="text-[11px] leading-tight text-slate-500 dark:text-slate-400">{{ item.label }}</p>
          </div>
        </div>
        <p class="mt-3 text-[11px] text-slate-400">خلاصه موارد ناقص که نیاز به توجه دارند</p>
      </div>

      <!-- Recent Activities -->
      <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div class="mb-3 flex items-center gap-2">
          <i class="ti ti-history text-slate-400" />
          <h3 class="text-sm font-semibold text-slate-900 dark:text-white">فعالیت‌های اخیر</h3>
        </div>
        <div class="space-y-3">
          <div v-for="act in activities" :key="act.text" class="flex items-start gap-3">
            <span class="mt-1 h-2 w-2 flex-shrink-0 rounded-full" :style="{ background: act.color }" />
            <div class="flex-1 min-w-0">
              <p class="text-[12px] leading-snug text-slate-700 dark:text-slate-300">{{ act.text }}</p>
              <p class="mt-0.5 text-[11px] text-slate-400">{{ act.time }}</p>
            </div>
          </div>
        </div>
        <p class="mt-3 text-[11px] text-slate-400">فعالیت‌های اخیر سیستم</p>
      </div>
    </div>

    <!-- ══════════════ ROW 6: Section Summary Cards ══════════════ -->
    <div class="grid gap-5 lg:grid-cols-3">
      <div v-for="([label, sec, color, icon, bgc]) in [
             ['محیط‌زیست', env, COLORS.env.main, 'ti-plant-2', COLORS.env.light],
             ['اجتماعی', soc, COLORS.soc.main, 'ti-users', COLORS.soc.light],
             ['حاکمیت', gov, COLORS.gov.main, 'ti-building-bank', COLORS.gov.light],
           ]" :key="label"
           v-if="sec"
           class="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 overflow-hidden">
        <!-- Card header band -->
        <div class="flex items-center justify-between px-5 py-3" :style="{ background: bgc }">
          <div class="flex items-center gap-2">
            <i class="ti text-lg" :class="icon" :style="{ color }" />
            <h3 class="text-sm font-semibold" :style="{ color }">{{ label }}</h3>
          </div>
          <span class="text-lg font-bold" :style="{ color }">{{ sec.summary.avg_score.toFixed(1) }}%</span>
        </div>
        <!-- Stats row -->
        <div class="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-700 border-b border-slate-100 dark:border-slate-700">
          <div class="p-3 text-center">
            <p class="text-lg font-bold text-slate-900 dark:text-white">{{ sec.summary.total_kpis }}</p>
            <p class="text-[10px] text-slate-400">شاخص کل</p>
          </div>
          <div class="p-3 text-center">
            <p class="text-lg font-bold text-emerald-600">{{ sec.summary.answered }}</p>
            <p class="text-[10px] text-slate-400">پاسخ‌داده</p>
          </div>
          <div class="p-3 text-center">
            <p class="text-lg font-bold text-slate-900 dark:text-white">{{ sec.summary.completion.toFixed(0) }}%</p>
            <p class="text-[10px] text-slate-400">تکمیل</p>
          </div>
        </div>
        <!-- Domain bars -->
        <div class="p-4 space-y-2">
          <div v-for="d in sec.domains.slice(0, 5)" :key="d.code" class="flex items-center gap-2">
            <span class="w-32 truncate text-[11px] text-slate-500 dark:text-slate-400 text-right" :title="d.title">{{ d.title }}</span>
            <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
              <div class="h-1.5 rounded-full" :style="{ width: d.avg_score + '%', background: sc(d.avg_score) }" />
            </div>
            <span class="w-10 text-left text-[11px] font-semibold" :style="{ color: sc(d.avg_score) }">{{ d.avg_score.toFixed(0) }}%</span>
          </div>
          <p v-if="sec.domains.length > 5" class="text-[11px] text-slate-400 text-right">+ {{ sec.domains.length - 5 }} دامنه دیگر</p>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.esg-overall { font-family: inherit; }
.badge-ok    { @apply bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300; }
.badge-warn  { @apply bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300; }
.badge-danger{ @apply bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300; }
.badge-gray  { @apply bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300; }
</style>