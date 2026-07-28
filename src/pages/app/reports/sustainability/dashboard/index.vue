<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  BarController,
  DoughnutController,
} from 'chart.js';
import { Radar, Bar, Doughnut } from 'vue-chartjs';
import Lucide from '@/base-components/Lucide';
import { reportRepo } from '@/core/repositories/reportRepo';

ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
    BarElement,
    CategoryScale,
    LinearScale,
    ArcElement,
    BarController,
    DoughnutController,
);

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const slug = ref((route.params.slug as string) || '');

// ---------- types (mirror the API response exactly) ----------
interface MaturityLevel {
  level: number;
  name: string;
  label: string;
  labelFa: string;
  min: number;
  max: number;
  color: string;
  emoji: string;
  status: string;
}
interface IndicatorNode {
  slug: string;
  title: string;
  titleEn?: string;
  unit: string;
  direction: string;
  minValue?: number;
  maxValue?: number;
  hasData: boolean;
  rawValue?: number | null;
  rawScore?: number | null;
  finalScore?: number | null;
}
interface CapabilityNode {
  slug: string;
  title: string;
  titleEn?: string;
  score: number;
  maturity: MaturityLevel;
  requiredMaturity?: number | null;
  meetsTarget?: boolean | null;
  indicators: IndicatorNode[];
}
interface ComponentNode {
  slug: string;
  title: string;
  titleEn?: string;
  score: number;
  maturity: MaturityLevel;
  capabilities: CapabilityNode[];
}
interface DomainNode {
  slug: string;
  title: string;
  titleEn?: string;
  score: number;
  maturity: MaturityLevel;
  components: ComponentNode[];
}
interface CapitalNode {
  slug: string;
  title: string;
  titleEn?: string;
  capitalType?: string;
  score: number;
  maturity: MaturityLevel;
  domains: DomainNode[];
}
interface DashboardResponse {
  date_from: string;
  date_to: string;
  period_type: string;
  capitals: CapitalNode[];
}

// ---------- state ----------
const loading = ref(true);
const loadError = ref(false);
const dashboardData = ref<DashboardResponse | null>(null);
const activeTab = ref<string>('');
const openDomains = reactive<Set<string>>(new Set());
// NEW: which capability rows have their indicator table expanded
const openCapabilities = reactive<Set<string>>(new Set());

const OVERVIEW_TAB = '__overview__';

const capitals = computed<CapitalNode[]>(() => dashboardData.value?.capitals ?? []);
const activeCapital = computed<CapitalNode | undefined>(() =>
    capitals.value.find((c) => c.slug === activeTab.value),
);
const isOverview = computed(() => activeTab.value === OVERVIEW_TAB);

const CAPITAL_ICON: Record<string, string> = {
  NAT: 'Leaf',
  HUM: 'Users',
  SOC: 'Handshake',
  INS: 'Landmark',
  TEC: 'Cpu',
  FEC: 'Coins',
};
function capitalIcon(type?: string) {
  return (type && CAPITAL_ICON[type]) || 'CircleDot';
}

// NEW: a distinct brand color per capital type, independent from the
// per-node maturity color (mirrors the env/soc/gov palette of the legacy dashboard)
const CAPITAL_THEME: Record<string, { main: string; light: string }> = {
  NAT: { main: '#16A34A', light: '#ECFDF5' },
  HUM: { main: '#2563EB', light: '#EFF6FF' },
  SOC: { main: '#DB2777', light: '#FDF2F8' },
  INS: { main: '#7C3AED', light: '#F5F3FF' },
  TEC: { main: '#0891B2', light: '#ECFEFF' },
  FEC: { main: '#CA8A04', light: '#FFFBEB' },
};
function capitalTheme(type?: string) {
  return (type && CAPITAL_THEME[type]) || { main: '#64748b', light: '#f1f5f9' };
}

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
function round1(n: number) {
  return Math.round(n * 10) / 10;
}

// ---------- fetch ----------
async function loadDashboard() {
  loading.value = true;
  loadError.value = false;
  try {
    const response = await reportRepo.getSustainabilityDashboard({
      date_from: '2024-01-01',
      date_to: '2024-12-31',
      period_type: 'YEARLY',
    });
    if (response.data) {
      dashboardData.value = response.data;
      if (dashboardData.value?.capitals?.length) {
        activeTab.value = dashboardData.value.capitals[0].slug;
      }
    } else {
      loadError.value = true;
    }
  } catch (error) {
    console.error('Failed to load sustainability dashboard:', error);
    loadError.value = true;
  } finally {
    loading.value = false;
  }
}
onMounted(loadDashboard);

// ---------- radar: domains under the active capital ----------
const domainRadarData = computed(() => {
  const cap = activeCapital.value;
  if (!cap) return null;
  return {
    labels: cap.domains.map((d) => d.title),
    datasets: [
      {
        label: t('reports.sustainability-score'),
        data: cap.domains.map((d) => d.score),
        backgroundColor: hexToRgba(cap.maturity.color, 0.12),
        borderColor: cap.maturity.color,
        borderWidth: 2,
        pointBackgroundColor: cap.domains.map((d) => d.maturity.color),
        pointBorderColor: '#fff',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };
});

// ---------- radar: all capitals, overview tab ----------
const capitalRadarData = computed(() => {
  if (!capitals.value.length) return null;
  return {
    labels: capitals.value.map((c) => c.title),
    datasets: [
      {
        label: t('reports.sustainability-score'),
        data: capitals.value.map((c) => c.score),
        backgroundColor: 'rgba(99, 102, 241, 0.12)',
        borderColor: '#6366f1',
        borderWidth: 2,
        pointBackgroundColor: capitals.value.map((c) => c.maturity.color),
        pointBorderColor: '#fff',
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };
});

const radarOptions = {
  maintainAspectRatio: false,
  scales: {
    r: {
      min: 0,
      max: 100,
      ticks: { display: false, stepSize: 20 },
      grid: { color: 'rgba(148, 163, 184, 0.25)' },
      angleLines: { color: 'rgba(148, 163, 184, 0.25)' },
      pointLabels: { font: { size: 11 } },
    },
  },
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: (ctx: any) => ` ${round1(ctx.raw)} / 100` } },
  },
};

// ============================================================
// NEW — global (all-capitals) aggregates for the top KPI strip
// ============================================================
const globalStats = computed(() => {
  let domains = 0;
  let components = 0;
  let capabilities = 0;
  let indicators = 0;
  let withData = 0;
  let hasTarget = 0;
  let meetsTarget = 0;

  for (const cap of capitals.value) {
    domains += cap.domains.length;
    for (const d of cap.domains) {
      components += d.components.length;
      for (const comp of d.components) {
        capabilities += comp.capabilities.length;
        for (const capa of comp.capabilities) {
          indicators += capa.indicators.length;
          withData += capa.indicators.filter((i) => i.hasData).length;
          if (capa.meetsTarget !== null && capa.meetsTarget !== undefined) {
            hasTarget += 1;
            if (capa.meetsTarget) meetsTarget += 1;
          }
        }
      }
    }
  }

  const avgScore = capitals.value.length
      ? capitals.value.reduce((s, c) => s + c.score, 0) / capitals.value.length
      : 0;
  const completion = indicators ? (withData / indicators) * 100 : 0;
  const targetRate = hasTarget ? (meetsTarget / hasTarget) * 100 : 0;

  return { domains, components, capabilities, indicators, withData, avgScore, completion, hasTarget, meetsTarget, targetRate };
});

// ---------- maturity bucket helper (reused for global + per-capital donuts) ----------
interface MaturityBucket { level: number; labelFa: string; color: string; count: number }
function buildMaturityBuckets(domains: DomainNode[]): MaturityBucket[] {
  const map = new Map<number, MaturityBucket>();
  for (const d of domains) {
    const lvl = d.maturity.level;
    if (!map.has(lvl)) {
      map.set(lvl, { level: lvl, labelFa: d.maturity.labelFa, color: d.maturity.color, count: 0 });
    }
    map.get(lvl)!.count += 1;
  }
  return [...map.values()].sort((a, b) => a.level - b.level);
}
function maturityDonutChartData(buckets: MaturityBucket[]) {
  return {
    labels: buckets.map((b) => b.labelFa),
    datasets: [
      {
        data: buckets.map((b) => b.count),
        backgroundColor: buckets.map((b) => b.color),
        borderColor: '#fff',
        borderWidth: 2,
      },
    ],
  };
}
const donutOptions = {
  maintainAspectRatio: false,
  cutout: '62%',
  plugins: {
    legend: { position: 'bottom' as const, labels: { boxWidth: 10, font: { size: 10 }, padding: 12 } },
    tooltip: { callbacks: { label: (ctx: any) => ` ${ctx.label}: ${ctx.raw} دامنه` } },
  },
};

const globalMaturityBuckets = computed(() => buildMaturityBuckets(capitals.value.flatMap((c) => c.domains)));
const globalMaturityDonutData = computed(() => maturityDonutChartData(globalMaturityBuckets.value));

// ---------- capital comparison bar (overview tab) ----------
const capitalBarData = computed(() => ({
  labels: capitals.value.map((c) => c.title),
  datasets: [
    {
      label: t('reports.sustainability-score'),
      data: capitals.value.map((c) => round1(c.score)),
      backgroundColor: capitals.value.map((c) => c.maturity.color),
      borderRadius: 6,
      barThickness: 20,
    },
  ],
}));
const barOptionsHorizontal = {
  indexAxis: 'y' as const,
  maintainAspectRatio: false,
  scales: {
    x: { min: 0, max: 100, grid: { color: 'rgba(148, 163, 184, 0.15)' }, ticks: { font: { size: 10 } } },
    y: { grid: { display: false }, ticks: { font: { size: 11 } } },
  },
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: (ctx: any) => ` ${round1(ctx.raw)} / 100` } },
  },
};

// ---------- global leaderboard: best/worst domains across all capitals ----------
interface DomainWithCapital extends DomainNode { capitalTitle: string }
const allDomainsFlat = computed<DomainWithCapital[]>(() =>
    capitals.value.flatMap((c) => c.domains.map((d) => ({ ...d, capitalTitle: c.title }))),
);
const topDomains = computed(() => [...allDomainsFlat.value].sort((a, b) => b.score - a.score).slice(0, 6));
const bottomDomains = computed(() => [...allDomainsFlat.value].sort((a, b) => a.score - b.score).slice(0, 6));

// ============================================================
// NEW — per-capital aggregates & charts (capital tab)
// ============================================================
const capitalStats = computed(() => {
  const cap = activeCapital.value;
  if (!cap) return null;
  let components = 0;
  let capabilities = 0;
  let indicators = 0;
  let withData = 0;
  let hasTarget = 0;
  let meetsTarget = 0;

  for (const d of cap.domains) {
    components += d.components.length;
    for (const comp of d.components) {
      capabilities += comp.capabilities.length;
      for (const capa of comp.capabilities) {
        indicators += capa.indicators.length;
        withData += capa.indicators.filter((i) => i.hasData).length;
        if (capa.meetsTarget !== null && capa.meetsTarget !== undefined) {
          hasTarget += 1;
          if (capa.meetsTarget) meetsTarget += 1;
        }
      }
    }
  }
  const completion = indicators ? (withData / indicators) * 100 : 0;
  return { components, capabilities, indicators, withData, completion, hasTarget, meetsTarget };
});

const capitalMaturityBuckets = computed(() => (activeCapital.value ? buildMaturityBuckets(activeCapital.value.domains) : []));
const capitalMaturityDonutData = computed(() => maturityDonutChartData(capitalMaturityBuckets.value));

interface ComponentWithDomain extends ComponentNode { domainTitle: string }
const componentsInCapital = computed<ComponentWithDomain[]>(() => {
  const cap = activeCapital.value;
  if (!cap) return [];
  const list: ComponentWithDomain[] = [];
  cap.domains.forEach((d) => d.components.forEach((c) => list.push({ ...c, domainTitle: d.title })));
  return list.sort((a, b) => b.score - a.score);
});
const componentBarData = computed(() => {
  const list = componentsInCapital.value.slice(0, 12);
  return {
    labels: list.map((c) => (c.title.length > 22 ? c.title.slice(0, 22) + '…' : c.title)),
    datasets: [
      {
        label: t('reports.sustainability-score'),
        data: list.map((c) => round1(c.score)),
        backgroundColor: list.map((c) => c.maturity.color),
        borderRadius: 6,
        barThickness: 14,
      },
    ],
  };
});

// ---------- gap analysis: capabilities not meeting their required maturity ----------
interface GapCapability extends CapabilityNode { domainTitle: string; componentTitle: string; gap: number }
const gapCapabilities = computed<GapCapability[]>(() => {
  const cap = activeCapital.value;
  if (!cap) return [];
  const list: GapCapability[] = [];
  cap.domains.forEach((d) =>
      d.components.forEach((comp) =>
          comp.capabilities.forEach((capa) => {
            if (capa.meetsTarget === false) {
              list.push({
                ...capa,
                domainTitle: d.title,
                componentTitle: comp.title,
                gap: (capa.requiredMaturity ?? 0) - capa.maturity.level,
              });
            }
          }),
      ),
  );
  return list.sort((a, b) => b.gap - a.gap);
});

// ---------- domain drill-down ----------
const sortedDomains = computed(() => {
  const cap = activeCapital.value;
  if (!cap) return [];
  return [...cap.domains].sort((a, b) => a.score - b.score);
});
function toggleDomain(domainSlug: string) {
  if (openDomains.has(domainSlug)) openDomains.delete(domainSlug);
  else openDomains.add(domainSlug);
}
function toggleCapability(capabilitySlug: string) {
  if (openCapabilities.has(capabilitySlug)) openCapabilities.delete(capabilitySlug);
  else openCapabilities.add(capabilitySlug);
}
</script>

<template>
  <div class="mx-auto max-w-7xl grid grid-cols-12 gap-2 p-2">
    <div
        class="col-span-12 rounded-xl border border-slate-200/60 bg-white shadow-sm dark:border-darkmode-700/60 dark:bg-darkmode-800"
    >
      <!-- header -->
      <div
          class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-darkmode-700"
      >
        <div class="flex items-center gap-3">
          <button
              type="button"
              class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-800 dark:border-darkmode-600 dark:bg-darkmode-800 dark:text-slate-300 dark:hover:bg-darkmode-700"
              @click="router.push({ name: 'app-reports-baseline' })"
          >
            <Lucide icon="ArrowRight" class="h-4 w-4" />
          </button>
          <div>
            <h1 class="text-base font-semibold text-slate-800 dark:text-slate-100">
              {{ t('reports.sustainability-dashboard') }}
            </h1>
            <p v-if="dashboardData" class="text-xs text-slate-400 dark:text-slate-500">
              {{ dashboardData.date_from }} → {{ dashboardData.date_to }} · {{ dashboardData.period_type }}
              <span v-if="slug"> · {{ slug }}</span>
            </p>
          </div>
        </div>
        <button
            type="button"
            class="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-darkmode-600 dark:bg-darkmode-800 dark:text-slate-300 dark:hover:bg-darkmode-700"
            @click="loadDashboard"
        >
          <Lucide icon="RefreshCw" class="h-3.5 w-3.5" :class="{ 'animate-spin': loading }" />
          {{ t('general.refresh') }}
        </button>
      </div>

      <div class="p-6">
        <!-- loading -->
        <div v-if="loading" class="flex items-center justify-center py-12">
          <Lucide icon="Loader2" class="h-6 w-6 animate-spin text-slate-400" />
        </div>

        <!-- error -->
        <div v-else-if="loadError" class="py-12 text-center">
          <Lucide icon="AlertTriangle" class="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p class="mt-4 text-sm text-slate-400 dark:text-slate-500">
            {{ t('general.load-failed') }}
          </p>
          <button
              type="button"
              class="mt-4 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-darkmode-600 dark:text-slate-300 dark:hover:bg-darkmode-700"
              @click="loadDashboard"
          >
            {{ t('general.retry') }}
          </button>
        </div>

        <!-- empty -->
        <div v-else-if="!capitals.length" class="py-12 text-center">
          <Lucide icon="FileChartColumnIncreasing" class="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
          <p class="mt-4 text-sm text-slate-400 dark:text-slate-500">
            {{ t('general.no-data') }}
          </p>
        </div>

        <!-- dashboard -->
        <div v-else class="space-y-5">
          <!-- ══════════════ NEW: GLOBAL KPI STRIP ══════════════ -->
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div class="rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-darkmode-700 dark:bg-darkmode-800">
              <div class="flex items-center gap-2 text-slate-400">
                <Lucide icon="Layers" class="h-4 w-4" />
                <span class="text-[11px] font-medium">{{ t('reports.average-score') }}</span>
              </div>
              <div class="mt-2 text-2xl font-bold text-slate-800 dark:text-slate-100">{{ round1(globalStats.avgScore) }}</div>
              <div class="mt-2 h-1.5 rounded-full bg-slate-100 dark:bg-darkmode-700">
                <div class="h-full rounded-full bg-indigo-500" :style="{ width: Math.min(globalStats.avgScore, 100) + '%' }" />
              </div>
            </div>
            <div class="rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-darkmode-700 dark:bg-darkmode-800">
              <div class="flex items-center gap-2 text-slate-400">
                <Lucide icon="Grid3x3" class="h-4 w-4" />
                <span class="text-[11px] font-medium">{{ t('reports.domain-count') }}</span>
              </div>
              <div class="mt-2 text-2xl font-bold text-slate-800 dark:text-slate-100">{{ globalStats.domains }}</div>
              <p class="mt-2 text-[11px] text-slate-400">{{ globalStats.components }} {{ t('reports.component-count') }}</p>
            </div>
            <div class="rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-darkmode-700 dark:bg-darkmode-800">
              <div class="flex items-center gap-2 text-slate-400">
                <Lucide icon="Target" class="h-4 w-4" />
                <span class="text-[11px] font-medium">{{ t('reports.capability-count') }}</span>
              </div>
              <div class="mt-2 text-2xl font-bold text-slate-800 dark:text-slate-100">{{ globalStats.capabilities }}</div>
              <p class="mt-2 text-[11px] text-slate-400">
                {{ globalStats.meetsTarget }}/{{ globalStats.hasTarget }} {{ t('reports.meets-target') }}
              </p>
            </div>
            <div class="rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-darkmode-700 dark:bg-darkmode-800">
              <div class="flex items-center gap-2 text-slate-400">
                <Lucide icon="Database" class="h-4 w-4" />
                <span class="text-[11px] font-medium">{{ t('reports.indicator-count') }}</span>
              </div>
              <div class="mt-2 text-2xl font-bold text-slate-800 dark:text-slate-100">{{ globalStats.indicators }}</div>
              <p class="mt-2 text-[11px] text-slate-400">{{ globalStats.withData }} {{ t('reports.with-data') }}</p>
            </div>
            <div class="rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-darkmode-700 dark:bg-darkmode-800">
              <div class="flex items-center gap-2 text-slate-400">
                <Lucide icon="Percent" class="h-4 w-4" />
                <span class="text-[11px] font-medium">{{ t('reports.data-completion') }}</span>
              </div>
              <div class="mt-2 text-2xl font-bold text-slate-800 dark:text-slate-100">{{ round1(globalStats.completion) }}%</div>
              <div class="mt-2 h-1.5 rounded-full bg-slate-100 dark:bg-darkmode-700">
                <div class="h-full rounded-full bg-emerald-500" :style="{ width: Math.min(globalStats.completion, 100) + '%' }" />
              </div>
            </div>
          </div>

          <!-- tabs -->
          <div
              class="flex flex-wrap gap-1.5 rounded-xl border border-slate-100 bg-slate-50/60 p-1.5 dark:border-darkmode-700 dark:bg-darkmode-700/30"
          >
            <button
                v-for="cap in capitals"
                :key="cap.slug"
                type="button"
                class="flex flex-1 basis-32 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition"
                :class="
                activeTab === cap.slug
                  ? 'bg-white text-slate-800 shadow-sm dark:bg-darkmode-800 dark:text-slate-100'
                  : 'text-slate-500 hover:bg-white/60 dark:text-slate-400 dark:hover:bg-darkmode-800/50'
              "
                @click="activeTab = cap.slug"
            >
              <Lucide :icon="capitalIcon(cap.capitalType)" class="h-4 w-4" :style="{ color: capitalTheme(cap.capitalType).main }" />
              {{ cap.title }}
              <span class="h-1.5 w-1.5 rounded-full" :style="{ backgroundColor: cap.maturity.color }" />
            </button>
            <button
                type="button"
                class="flex flex-1 basis-32 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition"
                :class="
                isOverview
                  ? 'bg-white text-slate-800 shadow-sm dark:bg-darkmode-800 dark:text-slate-100'
                  : 'text-slate-500 hover:bg-white/60 dark:text-slate-400 dark:hover:bg-darkmode-800/50'
              "
                @click="activeTab = OVERVIEW_TAB"
            >
              <Lucide icon="Radar" class="h-4 w-4" />
              {{ t('reports.all-capitals-overview') }}
            </button>
          </div>

          <!-- overview tab -->
          <div v-if="isOverview" class="space-y-5">
            <div class="rounded-xl border border-slate-100 p-5 dark:border-darkmode-700">
              <h2 class="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {{ t('reports.all-capitals-overview') }}
              </h2>
              <div class="mt-4 h-[420px]">
                <Radar v-if="capitalRadarData" :data="capitalRadarData" :options="radarOptions" />
              </div>
              <div class="mt-4 flex flex-wrap gap-3">
                <span
                    v-for="cap in capitals"
                    :key="cap.slug"
                    class="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"
                >
                  <span class="h-2 w-2 rounded-full" :style="{ backgroundColor: cap.maturity.color }" />
                  {{ cap.title }} — <b class="text-slate-700 dark:text-slate-200">{{ round1(cap.score) }}</b>
                </span>
              </div>
            </div>

            <!-- NEW: capital comparison bar + global maturity donut -->
            <div class="grid grid-cols-1 gap-5 lg:grid-cols-12">
              <div class="lg:col-span-7 rounded-xl border border-slate-100 p-5 dark:border-darkmode-700">
                <div class="mb-1 flex items-center gap-2">
                  <Lucide icon="BarChart3" class="h-4 w-4 text-slate-400" />
                  <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ t('reports.capital-comparison') }}</h3>
                </div>
                <div class="mt-3" :style="{ height: Math.max(capitals.length * 46, 220) + 'px' }">
                  <Bar :data="capitalBarData" :options="barOptionsHorizontal" />
                </div>
              </div>
              <div class="lg:col-span-5 rounded-xl border border-slate-100 p-5 dark:border-darkmode-700">
                <div class="mb-1 flex items-center gap-2">
                  <Lucide icon="PieChart" class="h-4 w-4 text-slate-400" />
                  <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ t('reports.maturity-distribution') }}</h3>
                </div>
                <p class="mb-2 text-[11px] text-slate-400">{{ t('reports.domains-by-maturity-level') }}</p>
                <div class="h-[260px]">
                  <Doughnut v-if="globalMaturityBuckets.length" :data="globalMaturityDonutData" :options="donutOptions" />
                </div>
              </div>
            </div>

            <!-- NEW: global leaderboard tables -->
            <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div class="rounded-xl border border-slate-100 dark:border-darkmode-700">
                <div class="flex items-center gap-2 border-b border-slate-100 px-5 py-3 dark:border-darkmode-700">
                  <Lucide icon="Trophy" class="h-4 w-4 text-emerald-500" />
                  <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ t('reports.top-domains') }}</h3>
                </div>
                <table class="w-full text-xs">
                  <tbody>
                  <tr
                      v-for="(d, i) in topDomains"
                      :key="d.slug"
                      class="border-b border-slate-50 last:border-0 dark:border-darkmode-800"
                  >
                    <td class="w-6 py-2 pr-4 text-center text-[10px] text-slate-300">{{ i + 1 }}</td>
                    <td class="py-2 pr-2">
                      <div class="font-medium text-slate-700 dark:text-slate-200">{{ d.title }}</div>
                      <div class="text-[10px] text-slate-400">{{ d.capitalTitle }}</div>
                    </td>
                    <td class="w-14 py-2 text-left font-semibold" :style="{ color: d.maturity.color }">
                      {{ round1(d.score) }}
                    </td>
                  </tr>
                  </tbody>
                </table>
              </div>
              <div class="rounded-xl border border-slate-100 dark:border-darkmode-700">
                <div class="flex items-center gap-2 border-b border-slate-100 px-5 py-3 dark:border-darkmode-700">
                  <Lucide icon="TrendingDown" class="h-4 w-4 text-rose-500" />
                  <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ t('reports.bottom-domains') }}</h3>
                </div>
                <table class="w-full text-xs">
                  <tbody>
                  <tr
                      v-for="(d, i) in bottomDomains"
                      :key="d.slug"
                      class="border-b border-slate-50 last:border-0 dark:border-darkmode-800"
                  >
                    <td class="w-6 py-2 pr-4 text-center text-[10px] text-slate-300">{{ i + 1 }}</td>
                    <td class="py-2 pr-2">
                      <div class="font-medium text-slate-700 dark:text-slate-200">{{ d.title }}</div>
                      <div class="text-[10px] text-slate-400">{{ d.capitalTitle }}</div>
                    </td>
                    <td class="w-14 py-2 text-left font-semibold" :style="{ color: d.maturity.color }">
                      {{ round1(d.score) }}
                    </td>
                  </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- capital tab -->
          <div v-else-if="activeCapital" class="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <!-- hero score -->
            <div
                class="lg:col-span-4 rounded-xl border border-slate-100 p-5 text-center dark:border-darkmode-700"
            >
              <p class="text-[11px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
                {{ t('reports.capital-score') }}
              </p>
              <h3 class="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                {{ activeCapital.title }}
              </h3>
              <p class="text-xs text-slate-400 dark:text-slate-500">{{ activeCapital.titleEn }}</p>
              <div class="mx-auto my-4 text-4xl font-bold" :style="{ color: activeCapital.maturity.color }">
                {{ round1(activeCapital.score) }}
              </div>
              <span
                  class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
                  :style="{
                  color: activeCapital.maturity.color,
                  borderColor: hexToRgba(activeCapital.maturity.color, 0.4),
                  backgroundColor: hexToRgba(activeCapital.maturity.color, 0.08),
                }"
              >
                {{ activeCapital.maturity.emoji }} {{ activeCapital.maturity.labelFa }}
              </span>
              <div class="mt-4 flex justify-between border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-darkmode-700 dark:text-slate-400">
                <span>{{ t('reports.domain-count') }}</span>
                <b class="text-slate-700 dark:text-slate-200">{{ activeCapital.domains.length }}</b>
              </div>
              <!-- NEW: extra capital-level stats -->
              <div v-if="capitalStats" class="mt-2 space-y-2 text-xs text-slate-500 dark:text-slate-400">
                <div class="flex justify-between border-t border-slate-100 pt-2 dark:border-darkmode-700">
                  <span>{{ t('reports.capability-count') }}</span>
                  <b class="text-slate-700 dark:text-slate-200">{{ capitalStats.capabilities }}</b>
                </div>
                <div class="flex justify-between border-t border-slate-100 pt-2 dark:border-darkmode-700">
                  <span>{{ t('reports.meets-target') }}</span>
                  <b class="text-slate-700 dark:text-slate-200">{{ capitalStats.meetsTarget }}/{{ capitalStats.hasTarget }}</b>
                </div>
                <div class="flex justify-between border-t border-slate-100 pt-2 dark:border-darkmode-700">
                  <span>{{ t('reports.data-completion') }}</span>
                  <b class="text-slate-700 dark:text-slate-200">{{ round1(capitalStats.completion) }}%</b>
                </div>
              </div>
            </div>

            <!-- radar -->
            <div class="lg:col-span-8 rounded-xl border border-slate-100 p-5 dark:border-darkmode-700">
              <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {{ t('reports.domain-distribution') }}
              </h3>
              <div class="mt-3 h-[320px]">
                <Radar v-if="domainRadarData" :data="domainRadarData" :options="radarOptions" />
              </div>
            </div>

            <!-- NEW: component comparison bar + capital maturity donut -->
            <div class="lg:col-span-7 rounded-xl border border-slate-100 p-5 dark:border-darkmode-700">
              <div class="mb-1 flex items-center gap-2">
                <Lucide icon="BarChart3" class="h-4 w-4 text-slate-400" />
                <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ t('reports.top-components') }}</h3>
              </div>
              <p class="mb-2 text-[11px] text-slate-400">
                {{ Math.min(componentsInCapital.length, 12) }} / {{ componentsInCapital.length }} {{ t('reports.component-count') }}
              </p>
              <div :style="{ height: Math.max(Math.min(componentsInCapital.length, 12) * 32, 200) + 'px' }">
                <Bar v-if="componentsInCapital.length" :data="componentBarData" :options="barOptionsHorizontal" />
              </div>
            </div>
            <div class="lg:col-span-5 rounded-xl border border-slate-100 p-5 dark:border-darkmode-700">
              <div class="mb-1 flex items-center gap-2">
                <Lucide icon="PieChart" class="h-4 w-4 text-slate-400" />
                <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ t('reports.maturity-distribution') }}</h3>
              </div>
              <div class="h-[220px]">
                <Doughnut v-if="capitalMaturityBuckets.length" :data="capitalMaturityDonutData" :options="donutOptions" />
              </div>
            </div>

            <!-- NEW: gap analysis — capabilities that don't meet their required maturity -->
            <div v-if="gapCapabilities.length" class="lg:col-span-12 rounded-xl border border-rose-100 bg-rose-50/40 p-5 dark:border-rose-900/30 dark:bg-rose-900/10">
              <div class="mb-3 flex items-center gap-2">
                <Lucide icon="AlertOctagon" class="h-4 w-4 text-rose-500" />
                <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ t('reports.gap-analysis') }}</h3>
                <span class="mr-auto rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                  {{ gapCapabilities.length }}
                </span>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full min-w-[640px] text-xs">
                  <thead>
                  <tr class="border-b border-rose-100 text-right text-[10px] uppercase tracking-wide text-slate-400 dark:border-rose-900/30">
                    <th class="pb-2 font-medium">{{ t('reports.capability') }}</th>
                    <th class="pb-2 font-medium">{{ t('reports.domain') }} / {{ t('reports.component') }}</th>
                    <th class="pb-2 text-center font-medium">{{ t('reports.current-maturity') }}</th>
                    <th class="pb-2 text-center font-medium">{{ t('reports.required-maturity') }}</th>
                    <th class="pb-2 text-left font-medium">{{ t('reports.score') }}</th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr v-for="capa in gapCapabilities.slice(0, 10)" :key="capa.slug" class="border-b border-rose-50 last:border-0 dark:border-rose-900/20">
                    <td class="py-2 pr-2 text-slate-700 dark:text-slate-200">{{ capa.title }}</td>
                    <td class="py-2 pr-2 text-slate-400">{{ capa.domainTitle }} / {{ capa.componentTitle }}</td>
                    <td class="py-2 text-center">
                        <span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium" :style="{ color: capa.maturity.color, backgroundColor: hexToRgba(capa.maturity.color, 0.1) }">
                          {{ capa.maturity.emoji }} {{ capa.maturity.labelFa }}
                        </span>
                    </td>
                    <td class="py-2 text-center font-semibold text-slate-600 dark:text-slate-300">{{ capa.requiredMaturity ?? '—' }}</td>
                    <td class="py-2 text-left font-semibold" :style="{ color: capa.maturity.color }">{{ round1(capa.score) }}</td>
                  </tr>
                  </tbody>
                </table>
                <p v-if="gapCapabilities.length > 10" class="mt-2 text-[11px] text-slate-400">
                  + {{ gapCapabilities.length - 10 }} {{ t('reports.more-items') }}
                </p>
              </div>
            </div>

            <!-- domain drill-down -->
            <div class="lg:col-span-12 space-y-2">
              <div
                  v-for="dom in sortedDomains"
                  :key="dom.slug"
                  class="overflow-hidden rounded-xl border border-slate-100 dark:border-darkmode-700"
              >
                <button
                    type="button"
                    class="flex w-full items-center gap-3 px-4 py-3 text-right"
                    @click="toggleDomain(dom.slug)"
                >
                  <Lucide
                      icon="ChevronDown"
                      class="h-4 w-4 flex-none text-slate-400 transition"
                      :class="{ 'rotate-180': openDomains.has(dom.slug) }"
                  />
                  <div class="min-w-0 flex-1">
                    <div class="mb-1 flex items-center justify-between gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                      <span>{{ dom.title }}</span>
                      <span class="font-normal text-slate-400 dark:text-slate-500">{{ dom.titleEn }}</span>
                    </div>
                    <div class="h-1.5 rounded-full bg-slate-100 dark:bg-darkmode-700">
                      <div
                          class="h-full rounded-full"
                          :style="{ width: Math.max(dom.score, 2) + '%', backgroundColor: dom.maturity.color }"
                      />
                    </div>
                  </div>
                  <div class="w-12 flex-none text-left text-sm font-semibold" :style="{ color: dom.maturity.color }">
                    {{ round1(dom.score) }}
                  </div>
                </button>

                <div v-if="openDomains.has(dom.slug)" class="border-t border-slate-100 px-4 py-3 dark:border-darkmode-700">
                  <div v-if="!dom.components.length" class="py-2 text-center text-xs text-slate-400 dark:text-slate-500">
                    {{ t('reports.no-component-data') }}
                  </div>
                  <div v-for="comp in dom.components" :key="comp.slug" class="mb-3 last:mb-0">
                    <div class="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                      <span>{{ comp.title }}</span>
                      <span :style="{ color: comp.maturity.color }">{{ round1(comp.score) }}</span>
                    </div>
                    <div v-if="!comp.capabilities.length" class="py-1.5 text-xs text-slate-400 dark:text-slate-500">
                      {{ t('reports.no-capability-data') }}
                    </div>
                    <div v-for="cap2 in comp.capabilities" :key="cap2.slug" class="border-t border-slate-50 dark:border-darkmode-800">
                      <!-- capability row: now clickable to reveal its indicators -->
                      <button
                          type="button"
                          class="flex w-full items-center gap-2 py-1.5 text-xs text-right"
                          @click="toggleCapability(cap2.slug)"
                      >
                        <Lucide
                            icon="ChevronDown"
                            class="h-3 w-3 flex-none text-slate-300 transition"
                            :class="{ 'rotate-180': openCapabilities.has(cap2.slug) }"
                        />
                        <span class="h-1.5 w-1.5 flex-none rounded-full" :style="{ backgroundColor: cap2.maturity.color }" />
                        <span class="min-w-0 flex-1 truncate text-slate-500 dark:text-slate-400">{{ cap2.title }}</span>
                        <span class="flex-none text-[10px] text-slate-400 dark:text-slate-500">
                          {{ t('reports.required-maturity') }} {{ cap2.requiredMaturity ?? '—' }}
                          <Lucide
                              v-if="cap2.meetsTarget !== null && cap2.meetsTarget !== undefined"
                              :icon="cap2.meetsTarget ? 'CheckCircle2' : 'XCircle'"
                              class="inline h-3 w-3"
                              :class="cap2.meetsTarget ? 'text-emerald-500' : 'text-rose-500'"
                          />
                        </span>
                        <span class="w-10 flex-none text-left font-semibold" :style="{ color: cap2.maturity.color }">
                          {{ round1(cap2.score) }}
                        </span>
                      </button>

                      <!-- NEW: indicator table for this capability -->
                      <div v-if="openCapabilities.has(cap2.slug)" class="mb-2 mr-5 overflow-x-auto rounded-lg bg-slate-50/70 dark:bg-darkmode-700/30">
                        <table v-if="cap2.indicators.length" class="w-full min-w-[520px] text-[11px]">
                          <thead>
                          <tr class="border-b border-slate-100 text-right text-[10px] uppercase tracking-wide text-slate-400 dark:border-darkmode-700">
                            <th class="px-3 py-1.5 font-medium">{{ t('reports.indicator') }}</th>
                            <th class="px-3 py-1.5 font-medium">{{ t('reports.unit') }}</th>
                            <th class="px-3 py-1.5 text-center font-medium">{{ t('reports.raw-value') }}</th>
                            <th class="px-3 py-1.5 text-center font-medium">{{ t('reports.final-score') }}</th>
                            <th class="px-3 py-1.5 text-center font-medium">{{ t('reports.data-status') }}</th>
                          </tr>
                          </thead>
                          <tbody>
                          <tr v-for="ind in cap2.indicators" :key="ind.slug" class="border-b border-slate-100/70 last:border-0 dark:border-darkmode-800">
                            <td class="px-3 py-1.5 text-slate-600 dark:text-slate-300">{{ ind.title }}</td>
                            <td class="px-3 py-1.5 text-slate-400">{{ ind.unit }}</td>
                            <td class="px-3 py-1.5 text-center text-slate-600 dark:text-slate-300">
                              {{ ind.rawValue ?? '—' }}
                            </td>
                            <td class="px-3 py-1.5 text-center font-semibold text-slate-700 dark:text-slate-200">
                              {{ ind.finalScore != null ? round1(ind.finalScore) : '—' }}
                            </td>
                            <td class="px-3 py-1.5 text-center">
                                <span
                                    class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                                    :class="ind.hasData
                                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                                      : 'bg-slate-100 text-slate-400 dark:bg-darkmode-700 dark:text-slate-500'"
                                >
                                  {{ ind.hasData ? t('reports.has-data') : t('reports.no-data') }}
                                </span>
                            </td>
                          </tr>
                          </tbody>
                        </table>
                        <p v-else class="px-3 py-2 text-[11px] text-slate-400">{{ t('reports.no-indicator-data') }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>