<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Lucide from '@/base-components/Lucide/Lucide.vue';
import { grcRepo } from '@/core/repositories/grcRepo';
import { reportRepo } from '@/core/repositories/reportRepo';
import { useNumberFormat } from '@/composables/useNumberFormat';
import { theme } from '@/config/theme';
import BarChart from '@/components/dashboard/BarChart.vue';

const { t, locale } = useI18n();
const { formatNumber } = useNumberFormat();
const router = useRouter();

/* ---------------- state ---------------- */
const loading = ref(true);
const error = ref<string | null>(null);

const sustainability = ref<any>(null);
const riskSummary = ref<any>(null);
const riskActivity = ref<any[]>([]);
const complianceData = ref<any>(null);
const complianceActivity = ref<any[]>([]);

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (reason) => {
        clearTimeout(timer);
        reject(reason);
      }
    );
  });
}

async function loadDashboard() {
  loading.value = true;
  error.value = null;
  const [sustRes, riskRes, compRes] = await Promise.allSettled([
    withTimeout(reportRepo.getSustainabilityDashboardOverview({}), 8000),
    withTimeout(grcRepo.riskDashboard(), 8000),
    withTimeout(grcRepo.complianceDashboard(), 8000),
  ]);

  if (sustRes.status === 'fulfilled' && sustRes.value?.result && sustRes.value?.data) {
    sustainability.value = sustRes.value.data ?? null;
  }
  if (riskRes.status === 'fulfilled' && riskRes.value?.result) {
    const data: any = riskRes.value.data;
    riskSummary.value = data?.summary ?? null;
    riskActivity.value = Array.isArray(data?.recentActivity) ? data.recentActivity : [];
  }
  if (compRes.status === 'fulfilled' && compRes.value?.result) {
    complianceData.value = compRes.value.data ?? null;
    complianceActivity.value = Array.isArray(complianceData.value?.recentActivity)
      ? complianceData.value.recentActivity
      : [];
  }

  const failed = [sustRes, riskRes, compRes].filter((r) => r.status === 'rejected');
  if (failed.length > 0 && failed.length === 3) {
    error.value = t('dashboard-page.load-error');
  } else if (failed.length > 0) {
    // partial failure: still render, but inform the user
    error.value = t('dashboard-page.load-partial');
  }
  loading.value = false;
}

onMounted(loadDashboard);

/* ---------------- compliance derived values (real API) ---------------- */
const complianceScore = computed<number | null>(() => {
  const s = complianceData.value?.summary?.overallScore;
  return typeof s === 'number' ? s : null;
});
const complianceRate = computed<number | null>(() => {
  const c = complianceData.value?.summary?.completionRate;
  return typeof c === 'number' ? c : null;
});
const frameworkBars = computed<{ title: string; score: number }[]>(() => {
  const fws = complianceData.value?.frameworkCompliance;
  if (!Array.isArray(fws)) return [];
  return fws
    .map((f: any) => ({
      title: f?.frameworkTitle ?? '',
      score: typeof f?.avgScore === 'number' ? f.avgScore : NaN,
    }))
    .filter((f) => !Number.isNaN(f.score) && f.title);
});

/* ---------------- sustainability derived values (real API) ---------------- */
const sustCapitals = computed<{ title: string; score: number }[]>(() => {
  const caps = sustainability.value?.capitals;
  if (!Array.isArray(caps)) return [];
  return caps
    .map((c: any) => ({
      title: c?.title ?? '',
      score: typeof c?.score === 'number' ? c.score : NaN,
    }))
    .filter((c) => !Number.isNaN(c.score) && c.title);
});
const sustSummary = computed(() => sustainability.value?.summary ?? null);
const sustAvgScore = computed<number | null>(() => {
  const s = sustSummary.value?.avgScore;
  if (typeof s === 'number') return s;
  if (sustCapitals.value.length > 0) {
    return sustCapitals.value.reduce((a, c) => a + c.score, 0) / sustCapitals.value.length;
  }
  return null;
});
const sustCompletion = computed<number | null>(() => {
  const c = sustSummary.value?.dataCompletion;
  if (typeof c === 'number') return c;
  const wd = sustSummary.value?.indicatorsWithData;
  const ind = sustSummary.value?.indicators;
  if (typeof wd === 'number' && typeof ind === 'number' && ind > 0) {
    return Math.round((wd / ind) * 1000) / 10;
  }
  return null;
});
const sustCapitalsCount = computed<number>(() => {
  const c = sustSummary.value?.capitals;
  return typeof c === 'number' ? c : sustCapitals.value.length;
});
const sustIndicatorsCount = computed<number | null>(() => {
  const i = sustSummary.value?.indicators;
  return typeof i === 'number' ? i : null;
});

const orgUpdatedAt = computed<string | null>(() => {
  const gen = sustainability.value?.date_to;
  if (!gen) return null;
  // parse date-only strings as local midnight to avoid UTC day-shift
  const d = /^\d{4}-\d{2}-\d{2}$/.test(gen) ? new Date(`${gen}T00:00:00`) : new Date(gen);
  if (Number.isNaN(d.getTime())) return null;
  try {
    const opt: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const fmt =
      locale.value === 'fa'
        ? new Intl.DateTimeFormat('fa-IR-u-ca-persian', opt)
        : new Intl.DateTimeFormat(locale.value, opt);
    return fmt.format(d);
  } catch {
    return gen.slice(0, 10);
  }
});

/* ---------------- risk derived values ---------------- */
const openRisks = computed<number | null>(() => {
  const byState = riskSummary.value?.byState ?? [];
  const total = riskSummary.value?.total;
  if (typeof total === 'number') {
    const closed = byState
      .filter((s: any) => s.state === 'closed' || s.state === 'archived')
      .reduce((a: number, s: any) => a + (s.count ?? 0), 0);
    return Math.max(total - closed, 0);
  }
  const sum = byState.reduce((a: number, s: any) => a + (s.count ?? 0), 0);
  return sum > 0 ? sum : null;
});

const highRiskCount = computed<number | null>(() => {
  if (riskSummary.value === null) return null;
  const byLevel = riskSummary.value?.byLevel ?? [];
  return byLevel
    .filter((s: any) => s.level === 'critical' || s.level === 'high')
    .reduce((a: number, s: any) => a + (s.count ?? 0), 0);
});

const riskSparkPoints = computed<string | null>(() => {
  const counts = (riskSummary.value?.byState ?? []).map((s: any) => s.count ?? 0);
  if (counts.length < 2) return null;
  const max = Math.max(...counts, 1);
  const W = 98;
  const H = 24;
  return counts
    .map((c: number, i: number) => `${(i * W) / (counts.length - 1)},${H - 2 - (c / max) * (H - 6)}`)
    .join(' ');
});

/* ---------------- compliance derived values ---------------- */
const tasksByState = computed(() => complianceData.value?.summary?.tasksByState ?? []);
const countByState = (states: string[]) =>
  tasksByState.value
    .filter((s: any) => states.includes(s.state))
    .reduce((a: number, s: any) => a + (s.count ?? 0), 0);

const pendingTaskCount = computed(() => {
  if (complianceData.value === null) return null;
  return countByState(['todo', 'in_progress']);
});
const todoTaskCount = computed(() => countByState(['todo']));
const inProgressTaskCount = computed(() => countByState(['in_progress']));
const overdueTaskCount = computed(() =>
  Array.isArray(complianceData.value?.overdueTasks) ? complianceData.value.overdueTasks.length : 0
);

/* ---------------- stat cards ---------------- */
const complianceBars = computed(() => frameworkBars.value.map((f) => f.score));

const statCards = computed(() => [
  {
    key: 'compliance',
    icon: 'ShieldCheck',
    accent: theme.status.done,
    title: t('dashboard-page.compliance-score'),
    value: complianceScore.value === null ? '—' : `${formatNumber(Math.round(complianceScore.value))}/100`,
    delta:
      complianceRate.value === null
        ? '—'
        : t('dashboard-page.completion-rate', { pct: formatNumber(Math.round(complianceRate.value)) }),
  },
  {
    key: 'sustainability',
    icon: 'Leaf',
    accent: theme.status.opportunity,
    title: t('dashboard-page.sustainability-maturity'),
    value: sustAvgScore.value === null ? '—' : formatNumber(Math.round(sustAvgScore.value)),
    delta:
      sustAvgScore.value === null
        ? '—'
        : t('dashboard-page.sustainability-capitals', {
            count: formatNumber(sustCapitalsCount.value),
            indicators: sustIndicatorsCount.value === null ? '—' : formatNumber(sustIndicatorsCount.value),
          }),
  },
  {
    key: 'risks',
    icon: 'AlertTriangle',
    accent: theme.status.high,
    title: t('dashboard-page.open-risks'),
    value: openRisks.value === null ? '—' : formatNumber(openRisks.value),
    delta:
      highRiskCount.value === null
        ? '—'
        : t('dashboard-page.risk-high-count', { count: formatNumber(highRiskCount.value) }),
  },
  {
    key: 'requests',
    icon: 'ClipboardList',
    accent: theme.status['in-progress'],
    title: t('dashboard-page.pending-requests'),
    value: pendingTaskCount.value === null ? '—' : formatNumber(pendingTaskCount.value),
    delta:
      overdueTaskCount.value > 0
        ? t('dashboard-page.pending-overdue', { count: formatNumber(overdueTaskCount.value) })
        : '—',
  },
]);

/* ---------------- bar chart (real fundamental-capital scores) ---------------- */
/** رنگ هر میله بر اساس امتیاز (رنگ فقط برای داده) — از تم مرکزی */
function scoreColor(score: number): string {
  if (score >= 75) return theme.status.low;
  if (score >= 50) return theme.status.medium;
  return theme.status.high;
}

function shortLabel(title: string): string {
  return title.length > 14 ? `${title.slice(0, 14)}…` : title;
}

/** سری میله‌ای امتیاز سرمایه‌های بنیادین — برای کامپوننت مشترک BarChart */
const homeBarSeries = computed(() => [
  {
    values: sustCapitals.value.map((c) => c.score),
    color: sustCapitals.value.map((c) => scoreColor(c.score)),
  },
]);
const homeLabelColors = computed(() => sustCapitals.value.map((c) => scoreColor(c.score)));

const scoreLegend = computed(() => [
  { label: t('dashboard-page.score-band-excellent'), color: theme.status.low },
  { label: t('dashboard-page.score-band-good'), color: theme.status.medium },
  { label: t('dashboard-page.score-band-poor'), color: theme.status.high },
]);

/* ---------------- quick access ---------------- */
const quickAccess = computed(() => [
  {
    route: 'app-data-entry',
    icon: 'Database',
    title: t('dashboard-page.qa-source-data'),
    desc: t('dashboard-page.qa-source-data-desc'),
  },
  {
    route: 'app-reports-baseline',
    icon: 'FileBarChart',
    title: t('dashboard-page.qa-report'),
    desc: t('dashboard-page.qa-report-desc'),
  },
  {
    route: 'app-base-info-control',
    icon: 'ShieldCheck',
    title: t('dashboard-page.qa-controls'),
    desc:
      pendingTaskCount.value === null
        ? t('dashboard-page.qa-controls-fallback')
        : t('dashboard-page.qa-controls-desc', { count: formatNumber(pendingTaskCount.value) }),
  },
]);

const suggestionText = computed(() => {
  if (sustCapitals.value.length === 0) return t('dashboard-page.suggestion-fallback');
  const weakest = sustCapitals.value.reduce((min, c) => (c.score < min.score ? c : min));
  return t('dashboard-page.suggestion-text', { pillar: weakest.title });
});

/* ---------------- recent activities (real sources) ---------------- */
interface ActivityRow {
  icon: string;
  iconBg: string;
  title: string;
  sub: string;
  status: string;
  statusClass: string;
  cat: string;
  time: string;
  ts: number;
}

function formatRelativeTime(iso?: string): { label: string; ts: number } {
  const ts = iso ? Date.parse(iso) : NaN;
  if (Number.isNaN(ts)) return { label: '—', ts: -Infinity };
  const diffMin = Math.floor((Date.now() - ts) / 60000);
  if (diffMin < 1) return { label: t('dashboard-page.time-now'), ts };
  if (diffMin < 60) return { label: t('dashboard-page.time-minutes', { n: formatNumber(diffMin) }), ts };
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return { label: t('dashboard-page.time-hours', { n: formatNumber(diffH) }), ts };
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return { label: t('dashboard-page.time-yesterday'), ts };
  return { label: t('dashboard-page.time-days', { n: formatNumber(diffD) }), ts };
}

function mapRiskRow(item: any): ActivityRow | null {
  const title = item?.title;
  if (!title) return null;
  const state: string | undefined = item?.state;
  let status = t('dashboard-page.status-in-progress');
  let statusClass = 'bg-info-muted text-info';
  if (state === 'closed' || state === 'archived') {
    status = t('dashboard-page.status-completed');
    statusClass = 'bg-success/10 text-success';
  } else if (state === 'draft') {
    status = t('dashboard-page.status-todo');
    statusClass = 'bg-neutral-muted text-text-secondary';
  }
  const rel = formatRelativeTime(item?.updatedAt);
  return {
    icon: 'AlertTriangle',
    iconBg: 'bg-warning-muted text-warning',
    title: String(title),
    sub: item?.categoryTitle ?? item?.level ?? '',
    status,
    statusClass,
    cat: t('dashboard-page.cat-risk'),
    time: rel.label,
    ts: rel.ts,
  };
}

function mapComplianceRow(item: any): ActivityRow | null {
  const title = item?.title;
  if (!title) return null;
  const state: string | undefined = item?.state;
  const answer: string | null | undefined = item?.answer;
  let status = t('dashboard-page.status-in-progress');
  let statusClass = 'bg-info-muted text-info';
  if (answer === 'compliant' || state === 'approved' || state === 'done') {
    status = t('dashboard-page.status-completed');
    statusClass = 'bg-success/10 text-success';
  } else if (answer === 'non_compliant' || state === 'rejected') {
    status = t('dashboard-page.status-rejected');
    statusClass = 'bg-error-muted text-error';
  } else if (state === 'todo') {
    status = t('dashboard-page.status-todo');
    statusClass = 'bg-neutral-muted text-text-secondary';
  }
  const rel = formatRelativeTime(item?.updatedAt);
  return {
    icon: 'ShieldCheck',
    iconBg: 'bg-info-muted text-info',
    title: String(title),
    sub: item?.frameworkTitle ?? item?.domainTitle ?? '',
    status,
    statusClass,
    cat: t('dashboard-page.cat-compliance'),
    time: rel.label,
    ts: rel.ts,
  };
}

const activities = computed<ActivityRow[]>(() => {
  const rows: ActivityRow[] = [];
  riskActivity.value.forEach((item) => {
    const r = mapRiskRow(item);
    if (r) rows.push(r);
  });
  complianceActivity.value.forEach((item) => {
    const r = mapComplianceRow(item);
    if (r) rows.push(r);
  });
  return rows.sort((a, b) => b.ts - a.ts).slice(0, 6);
});

function go(name: string) {
  router.push({ name });
}
</script>

<template>
  <div class="mx-auto max-w-[1400px]">
    <!-- ===== Header (risk-dashboard style) ===== -->
    <header class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-muted text-primary">
          <Lucide icon="LayoutDashboard" class="h-6 w-6" />
        </span>
        <div class="min-w-0">
          <h1 class="text-xl font-extrabold text-slate-900">{{ t('dashboard-page.identity-title') }}</h1>
          <p class="mt-0.5 text-xs leading-relaxed text-slate-500">{{ t('dashboard-page.subtitle') }}</p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2.5">
        <span
          v-if="error"
          class="inline-flex items-center gap-1.5 rounded-full border border-error/30 bg-error-muted px-3 py-1.5 text-xs font-medium text-error shadow-sm"
        >
          <Lucide icon="AlertCircle" class="h-3.5 w-3.5" />
          {{ error }}
        </span>
        <span
          class="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500 shadow-sm"
        >
          <span class="relative flex h-2 w-2">
            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60"></span>
            <span class="relative inline-flex h-2 w-2 rounded-full bg-success"></span>
          </span>
          {{ t('dashboard-page.org-status') }}<template v-if="orgUpdatedAt"> · {{ orgUpdatedAt }}</template>
        </span>
        <button
          type="button"
          class="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:opacity-60"
          :disabled="loading"
          @click="loadDashboard"
        >
          <Lucide icon="RefreshCw" class="h-4 w-4" :class="{ 'animate-spin': loading }" />
          {{ t('dashboard-page.retry') }}
        </button>
      </div>
    </header>

    <!-- ===== Loading skeleton ===== -->
    <template v-if="loading">
      <section class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div v-for="i in 4" :key="i" class="h-44 animate-pulse rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm">
          <div class="h-10 w-10 rounded-lg bg-slate-100"></div>
          <div class="mt-4 h-3 w-2/3 rounded bg-slate-100"></div>
          <div class="mt-2 h-6 w-1/2 rounded bg-slate-100"></div>
        </div>
      </section>
      <section class="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div class="h-72 animate-pulse rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm xl:col-span-2"></div>
        <div class="h-72 animate-pulse rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm"></div>
      </section>
      <p class="mt-4 flex items-center justify-center gap-2 text-sm text-slate-400">
        <Lucide icon="Loader2" class="h-4 w-4 animate-spin" />
        {{ t('dashboard-page.loading-dashboard') }}
      </p>
    </template>

    <template v-else>
      <!-- ===== Stat cards (accent edge + colored chip, like risk dashboard) ===== -->
      <section class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div
          v-for="card in statCards"
          :key="card.key"
          class="relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition-shadow hover:shadow-md"
        >
          <span
            class="absolute inset-y-0 right-0 w-0.5"
            :style="{ backgroundColor: card.accent }"
            aria-hidden="true"
          />
          <div class="flex items-start justify-between gap-3">
            <span
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              :style="{ backgroundColor: card.accent + '1a', color: card.accent }"
            >
              <Lucide :icon="card.icon" class="h-5 w-5" />
            </span>
            <Lucide icon="MoreHorizontal" class="h-4 w-4 text-slate-300" aria-hidden="true" />
          </div>
          <p class="mt-3 truncate text-xs font-medium text-slate-500">{{ card.title }}</p>
          <p class="mt-1 text-2xl font-extrabold text-slate-900">{{ card.value }}</p>
          <p class="mt-1 truncate text-[11px] font-medium text-slate-400">{{ card.delta }}</p>

          <!-- mini bars: compliance (real framework avg-scores) -->
          <div v-if="card.key === 'compliance' && complianceBars.length > 1" class="mt-3 flex h-10 items-end gap-1">
            <div
              v-for="(h, i) in complianceBars"
              :key="i"
              class="flex-1 rounded-t-sm transition-colors"
              :class="i === complianceBars.length - 1 ? 'bg-primary' : 'bg-primary/20'"
              :title="frameworkBars[i]?.title"
              :style="{ height: Math.max(h, 4) + '%' }"
            ></div>
          </div>

          <!-- mini progress: sustainability (real data completion) -->
          <div v-else-if="card.key === 'sustainability' && sustCompletion !== null" class="mt-3">
            <div class="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div class="h-full rounded-full bg-info" :style="{ width: sustCompletion + '%' }"></div>
            </div>
            <p class="mt-2 text-[11px] text-slate-400">
              {{ t('dashboard-page.data-completion', { pct: formatNumber(sustCompletion) }) }}
            </p>
          </div>

          <!-- mini sparkline: risks (real by-state counts) -->
          <div v-else-if="card.key === 'risks' && riskSparkPoints" class="mt-3">
            <svg viewBox="0 0 98 24" class="h-9 w-full" preserveAspectRatio="none">
              <polyline
                :points="riskSparkPoints"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="text-warning"
              />
            </svg>
          </div>

          <!-- mini counters: requests (real task states) -->
          <div v-else-if="card.key === 'requests' && complianceData" class="mt-3 flex gap-2">
            <span
              class="inline-flex items-center gap-1 rounded-lg bg-info-muted px-1.5 py-0.5 text-[11px] font-bold text-info"
              :title="t('dashboard-page.status-todo')"
            >
              <Lucide icon="Circle" class="h-2.5 w-2.5" />
              {{ formatNumber(todoTaskCount) }}
            </span>
            <span
              class="inline-flex items-center gap-1 rounded-lg bg-warning-muted px-1.5 py-0.5 text-[11px] font-bold text-warning"
              :title="t('dashboard-page.status-in-progress')"
            >
              <Lucide icon="Clock" class="h-2.5 w-2.5" />
              {{ formatNumber(inProgressTaskCount) }}
            </span>
            <span
              class="inline-flex items-center gap-1 rounded-lg bg-error-muted px-1.5 py-0.5 text-[11px] font-bold text-error"
              :title="t('dashboard-page.status-overdue')"
            >
              <Lucide icon="AlertCircle" class="h-2.5 w-2.5" />
              {{ formatNumber(overdueTaskCount) }}
            </span>
          </div>
        </div>
      </section>

      <!-- ===== Middle: capital scores (bar chart) + quick access ===== -->
      <section class="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <!-- Bar chart card -->
        <div class="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm xl:col-span-2">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-2.5">
              <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <Lucide icon="BarChart3" class="h-4 w-4" />
              </span>
              <div>
                <h2 class="text-sm font-semibold text-slate-900">{{ t('dashboard-page.score-trend') }}</h2>
                <p class="mt-0.5 text-[11px] text-slate-400">{{ t('dashboard-page.score-trend-sub') }}</p>
              </div>
            </div>
            <span
              v-if="sustAvgScore !== null"
              class="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-primary"
            >
              {{ t('dashboard-page.total-score', { score: formatNumber(Math.round(sustAvgScore)) }) }}
            </span>
          </div>

          <div v-if="sustCapitals.length > 0" class="mt-4">
            <BarChart
              :labels="sustCapitals.map((c) => shortLabel(c.title))"
              :series="homeBarSeries"
              :label-colors="homeLabelColors"
              :max="100"
              class="h-64"
            />

            <!-- legend: score bands (color = data) -->
            <div class="mt-2 flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
              <span v-for="item in scoreLegend" :key="item.label" class="flex items-center gap-1.5">
                <span class="inline-block h-2.5 w-2.5 rounded-sm" :style="{ backgroundColor: item.color }"></span>
                {{ item.label }}
              </span>
            </div>
          </div>

          <div
            v-else
            class="mt-4 flex h-52 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center"
          >
            <span class="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              <Lucide icon="BarChart3" class="h-5 w-5" />
            </span>
            <p class="text-sm text-slate-400">{{ t('dashboard-page.trend-empty') }}</p>
          </div>
        </div>

        <!-- Quick access -->
        <div class="flex flex-col gap-4">
          <div class="flex-1 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm">
            <div class="flex items-center gap-2.5">
              <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <Lucide icon="Zap" class="h-4 w-4" />
              </span>
              <div>
                <h2 class="text-sm font-semibold text-slate-900">{{ t('dashboard-page.quick-access') }}</h2>
                <p class="mt-0.5 text-[11px] text-slate-400">{{ t('dashboard-page.quick-access-sub') }}</p>
              </div>
            </div>

            <div class="mt-4 space-y-2">
              <button
                v-for="qa in quickAccess"
                :key="qa.route"
                type="button"
                class="group flex w-full items-center gap-3 rounded-xl border border-transparent p-2.5 text-start transition-colors hover:border-slate-200 hover:bg-slate-50"
                @click="go(qa.route)"
              >
                <span
                  class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition group-hover:bg-primary-muted group-hover:text-primary"
                >
                  <Lucide :icon="qa.icon" class="h-[18px] w-[18px]" />
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block text-[13px] font-bold text-slate-700">{{ qa.title }}</span>
                  <span class="block truncate text-[11px] text-slate-400">{{ qa.desc }}</span>
                </span>
                <Lucide icon="ChevronLeft" class="h-4 w-4 shrink-0 text-slate-300 rtl:rotate-180" />
              </button>
            </div>

            <!-- suggestion banner (derived from weakest pillar) -->
            <div class="mt-3 flex items-center gap-3 rounded-xl border border-success/20 bg-success/5 p-3">
              <span class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success/15 text-success">
                <Lucide icon="Wand2" class="h-4 w-4" />
              </span>
              <p class="text-xs leading-relaxed text-slate-500">
                <span class="font-bold text-slate-700">{{ t('dashboard-page.suggestion-title') }}:</span>
                {{ suggestionText }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- ===== Recent activities ===== -->
      <section class="mt-5 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2.5">
            <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              <Lucide icon="Activity" class="h-4 w-4" />
            </span>
            <div>
              <h2 class="text-sm font-semibold text-slate-900">{{ t('dashboard-page.recent-activities') }}</h2>
              <p class="mt-0.5 text-[11px] text-slate-400">{{ t('dashboard-page.recent-activities-sub') }}</p>
            </div>
          </div>
          <button
            v-if="activities.length > 0"
            type="button"
            class="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-primary/80"
            @click="go('app-risk-dashboard')"
          >
            {{ t('dashboard-page.view-all') }}
            <Lucide icon="ArrowLeft" class="h-3.5 w-3.5 rtl:rotate-180" />
          </button>
        </div>

        <div v-if="activities.length > 0" class="mt-4 overflow-x-auto">
          <table class="w-full min-w-[680px] border-collapse text-sm">
            <thead>
              <tr class="border-b border-slate-100 text-[11px] font-medium text-slate-400">
                <th class="py-2.5 pe-4 text-start font-medium">{{ t('dashboard-page.col-activity') }}</th>
                <th class="py-2.5 pe-4 text-start font-medium">{{ t('dashboard-page.col-status') }}</th>
                <th class="py-2.5 pe-4 text-start font-medium">{{ t('dashboard-page.col-category') }}</th>
                <th class="py-2.5 text-start font-medium">{{ t('dashboard-page.col-time') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, i) in activities"
                :key="i"
                class="group border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50"
              >
                <td class="py-3 pe-4">
                  <div class="flex items-center gap-3">
                    <span class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" :class="row.iconBg">
                      <Lucide :icon="row.icon" class="h-4 w-4" />
                    </span>
                    <div class="min-w-0">
                      <p class="truncate text-[13px] font-bold text-slate-800">{{ row.title }}</p>
                      <p v-if="row.sub" class="truncate text-[11px] text-slate-400">{{ row.sub }}</p>
                    </div>
                  </div>
                </td>
                <td class="py-3 pe-4">
                  <span
                    class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    :class="row.statusClass"
                  >
                    <Lucide v-if="row.statusClass.includes('success')" icon="Check" class="h-3 w-3" />
                    <span>{{ row.status }}</span>
                  </span>
                </td>
                <td class="py-3 pe-4">
                  <span class="rounded-full bg-neutral-muted px-2.5 py-1 text-[11px] font-medium text-slate-500">
                    {{ row.cat }}
                  </span>
                </td>
                <td class="py-3 text-xs text-slate-400">{{ row.time }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          v-else
          class="mt-4 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center"
        >
          <span class="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
            <Lucide icon="Inbox" class="h-5 w-5" />
          </span>
          <p class="text-sm text-slate-400">{{ t('dashboard-page.activity-empty') }}</p>
        </div>
      </section>
    </template>
  </div>
</template>
