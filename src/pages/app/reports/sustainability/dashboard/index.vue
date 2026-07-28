<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { Radar } from 'vue-chartjs';
import Lucide from '@/base-components/Lucide';
import { reportRepo } from '@/core/repositories/reportRepo';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

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
</script>

<template>
  <div class="grid grid-cols-12 gap-2 p-2">
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
              <Lucide :icon="capitalIcon(cap.capitalType)" class="h-4 w-4" />
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
          <div v-if="isOverview && capitalRadarData" class="rounded-xl border border-slate-100 p-5 dark:border-darkmode-700">
            <h2 class="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {{ t('reports.all-capitals-overview') }}
            </h2>
            <div class="mt-4 h-[420px]">
              <Radar :data="capitalRadarData" :options="radarOptions" />
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
                    <div
                        v-for="cap2 in comp.capabilities"
                        :key="cap2.slug"
                        class="flex items-center gap-2 border-t border-slate-50 py-1.5 text-xs dark:border-darkmode-800"
                    >
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