<script setup lang="ts">
import { ref, computed, reactive, nextTick, onBeforeUnmount, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useElementBounding, onClickOutside, useEventListener } from '@vueuse/core';
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
import PeriodSelectPanel from '@/components/PeriodSelectPanel.vue';
import { reportRepo } from '@/core/repositories/reportRepo';
import { theme } from '@/config/theme';

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

/**
 * Custom plugin: draws the value at the end of each horizontal bar
 * (like the risk dashboard's StateBar) — RTL-aware.
 */
const barValueLabelsPlugin = {
  id: 'barValueLabels',
  afterDatasetsDraw(chart: any) {
    const { ctx } = chart;
    const isDark = document.documentElement.classList.contains('dark');
    const labelColor = isDark ? '#cbd5e1' : '#475569';
    ctx.save();
    chart.data.datasets.forEach((dataset: any, di: number) => {
      if (dataset.barValueLabels === false) return;
      const meta = chart.getDatasetMeta(di);
      if (!meta.data || meta.type !== 'bar') return;
      meta.data.forEach((bar: any, i: number) => {
        const value = dataset.data[i];
        if (value == null || value === 0) return;
        ctx.font = "600 10px 'Vazirmatn Variable', Vazirmatn, sans-serif";
        ctx.fillStyle = labelColor;
        ctx.textBaseline = 'middle';
        if (bar.x > bar.base) {
          ctx.textAlign = 'left';
          ctx.fillText(String(value), bar.x + 5, bar.y);
        } else {
          ctx.textAlign = 'right';
          ctx.fillText(String(value), bar.x - 5, bar.y);
        }
      });
    });
    ctx.restore();
  },
};
ChartJS.register(barValueLabelsPlugin);

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

/** Fallback maturity for periods without data (API may return `maturity: null`). */
const DEFAULT_MATURITY: MaturityLevel = {
  level: 0,
  name: 'unknown',
  label: 'No data',
  labelFa: 'بدون داده',
  min: 0,
  max: 0,
  color: '#94a3b8',
  emoji: '❔',
  status: 'no-data',
};

function normalizeMaturity<T extends { maturity?: MaturityLevel | null }>(node: T): T & { maturity: MaturityLevel } {
  if (!node.maturity) {
    (node as { maturity: MaturityLevel }).maturity = { ...DEFAULT_MATURITY };
  }
  return node as T & { maturity: MaturityLevel };
}

/** Fills a fallback `maturity` on a single capital and all its descendants. */
function normalizeCapital(cap: CapitalNode): CapitalNode {
  normalizeMaturity(cap);
  if (!Array.isArray(cap.domains)) cap.domains = [];
  for (const dom of cap.domains) {
    normalizeMaturity(dom);
    if (!Array.isArray(dom.components)) dom.components = [];
    for (const comp of dom.components) {
      normalizeMaturity(comp);
      if (!Array.isArray(comp.capabilities)) comp.capabilities = [];
      for (const capa of comp.capabilities) {
        normalizeMaturity(capa);
        if (!Array.isArray(capa.indicators)) capa.indicators = [];
        if (!capa.risks) capa.risks = defaultCapabilityRisks();
      }
    }
  }
  return cap;
}

/** Fills a fallback `maturity` on every capital/domain/component/capability node. */
function normalizeDashboardData(data: DashboardResponse): DashboardResponse {
  (data.capitals ?? []).forEach(normalizeCapital);
  if (!data.risks) {
    data.risks = { total: 0, active: 0, archived: 0, byState: {}, byLevel: {}, byCapital: {} };
  }
  return data;
}
interface PeriodInfo {
  type: string;
  year: number;
}
interface ComparisonValue {
  value: number | null;
  period: PeriodInfo;
}
// ---------- risk DTOs (appended data — never affects scoring) ----------
interface DashboardRiskDto {
  total: number;
  active: number;
  archived: number;
  byState: Record<string, number>;
  byLevel: Record<string, number>;
  byCapital: Record<string, number>;
}
interface RiskSummaryDto {
  total: number;
  byState: Record<string, number>;
  byLevel: Record<string, number>;
}
interface RiskInfoDto {
  slug: string;
  title: string;
  state: string | null;
  level: string | null;
  score: number | null;
  impact: number | null;
  likelihood: number | null;
  riskType: string | null;
  treatmentStrategy: string | null;
  deadline: string | null;
  ownerId: string | null;
}
interface CapabilityRisksDto {
  summary: RiskSummaryDto;
  risks: RiskInfoDto[];
}
interface DashboardSummary {
  capitals: number;
  domains: number;
  components: number;
  capabilities: number;
  indicators: number;
  indicatorsWithData: number;
  avgScore: number;
  dataCompletion: number;
  targetsTotal: number;
  targetsMet: number;
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
  period: PeriodInfo;
  comparison?: ComparisonValue | null;
  comparisonValue?: number | null;
}
interface CapabilityNode {
  slug: string;
  title: string;
  titleEn?: string;
  score: number;
  maturity: MaturityLevel;
  requiredMaturity?: number | null;
  meetsTarget?: boolean | null;
  indicatorCount?: number;
  indicatorsWithData?: number;
  indicators: IndicatorNode[];
  risks?: CapabilityRisksDto;
  period: PeriodInfo;
  comparison?: ComparisonValue | null;
}
interface ComponentNode {
  slug: string;
  title: string;
  titleEn?: string;
  score: number;
  maturity: MaturityLevel;
  capabilities: CapabilityNode[];
  period: PeriodInfo;
  comparison?: ComparisonValue | null;
}
interface DomainNode {
  slug: string;
  title: string;
  titleEn?: string;
  score: number;
  maturity: MaturityLevel;
  components: ComponentNode[];
  period: PeriodInfo;
  comparison?: ComparisonValue | null;
}
interface CapitalNode {
  slug: string;
  title: string;
  titleEn?: string;
  capitalType?: string;
  score: number;
  maturity: MaturityLevel;
  indicatorCount?: number;
  indicatorsWithData?: number;
  domains: DomainNode[];
  period: PeriodInfo;
  comparison?: ComparisonValue | null;
}
interface DashboardResponse {
  date_from: string;
  date_to: string;
  period_type: string;
  period: PeriodInfo;
  comparison_period?: PeriodInfo | null;
  summary?: DashboardSummary;
  risks?: DashboardRiskDto;
  capitals: CapitalNode[];
}

interface SelectedPeriod {
  type: string;
  startDate: string;
  endDate: string;
}

// ---------- state ----------
const loading = ref(true);
const loadError = ref(false);
const dashboardData = ref<DashboardResponse | null>(null);
const activeTab = ref<string>('');
const hasLoaded = ref(false);
const openDomains = reactive<Set<string>>(new Set());
const openCapabilities = reactive<Set<string>>(new Set());

// period + comparison
const selectedPeriod = ref<SelectedPeriod | null>(null);
const compareEnabled = ref(false);
const comparePeriod = ref<SelectedPeriod | null>(null);
// lazy capital indicator cache
const loadedCapitals = reactive<Record<string, CapitalNode>>({});
const loadingCapitalSlug = ref<string | null>(null);

// suppress reload while adopting the backend-resolved default period
let suppressReload = false;

const OVERVIEW_TAB = '__overview__';

const capitals = computed<CapitalNode[]>(() => dashboardData.value?.capitals ?? []);
const activeCapital = computed<CapitalNode | undefined>(() =>
    capitals.value.find((c) => c.slug === activeTab.value),
);
const isOverview = computed(() => activeTab.value === OVERVIEW_TAB);
const hasComparison = computed(() => !!dashboardData.value?.comparison_period);

// section title shown under the tabs (ESG-dashboard style)
const sectionIcon = computed(() =>
    isOverview.value ? 'Radar' : capitalIcon(activeCapital.value?.capitalType),
);
const sectionColor = computed(() =>
    isOverview.value ? theme.colors.light.primary : capitalTheme(activeCapital.value?.capitalType).main,
);
const sectionTitle = computed(() =>
    isOverview.value ? t('reports.all-capitals-overview') : (activeCapital.value?.title ?? ''),
);
const sectionSubtitle = computed(() => {
  if (isOverview.value) {
    return `${globalStats.value.capitals} ${t('reports.capitals')} · ${globalStats.value.indicators} ${t('reports.indicators')} · ${round1(globalStats.value.completion)}% ${t('reports.data-completion')}`;
  }
  const cap = activeCapital.value;
  if (!cap) return '';
  return cap.titleEn ?? '';
});

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
function round1(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return 0;
  return Math.round(n * 10) / 10;
}

// ---------- risk helpers (appended data, does not affect scoring) ----------
const RISK_LEVELS = ['critical', 'high', 'medium', 'low', 'unknown'];
const RISK_STATES = ['draft', 'registered', 'analysis', 'response', 'monitoring', 'closed', 'archived', 'unknown'];

/** رنگ‌های ریسک — از تم مرکزی (src/config/theme.ts) */
const RISK_LEVEL_COLOR: Record<string, string> = {
  critical: theme.status.critical,
  high: theme.status.high,
  medium: theme.status.medium,
  low: theme.status.low,
  unknown: theme.status.draft,
};
const RISK_STATE_COLOR: Record<string, string> = {
  draft: theme.status.draft,
  registered: theme.status.registered,
  analysis: theme.status.analysis,
  response: theme.status.response,
  monitoring: theme.status.monitoring,
  closed: theme.status.closed,
  archived: theme.status.archived,
  unknown: theme.status.draft,
};

function riskLevelColor(level: string | null | undefined): string {
  return RISK_LEVEL_COLOR[level ?? 'unknown'] ?? '#94a3b8';
}

function riskLevelLabel(level: string | null | undefined): string {
  const map: Record<string, string> = {
    critical: 'reports.risk-level-critical',
    high: 'reports.risk-level-high',
    medium: 'reports.risk-level-medium',
    low: 'reports.risk-level-low',
    unknown: 'reports.risk-unknown',
  };
  return t(map[level ?? 'unknown'] ?? 'reports.risk-unknown');
}

function riskStateLabel(state: string | null | undefined): string {
  const map: Record<string, string> = {
    draft: 'reports.risk-state-draft',
    registered: 'reports.risk-state-registered',
    analysis: 'reports.risk-state-analysis',
    response: 'reports.risk-state-response',
    monitoring: 'reports.risk-state-monitoring',
    closed: 'reports.risk-state-closed',
    archived: 'reports.risk-state-archived',
    unknown: 'reports.risk-unknown',
  };
  return t(map[state ?? 'unknown'] ?? 'reports.risk-unknown');
}

function riskTypeLabel(type: string | null | undefined): string {
  if (type === 'threat') return t('reports.risk-type-threat');
  if (type === 'opportunity') return t('reports.risk-type-opportunity');
  return '—';
}

function strategyLabel(strategy: string | null | undefined): string {
  const map: Record<string, string> = {
    reduce: 'reports.risk-strategy-reduce',
    accept: 'reports.risk-strategy-accept',
    transfer: 'reports.risk-strategy-transfer',
    avoid: 'reports.risk-strategy-avoid',
    exploit: 'reports.risk-strategy-exploit',
    share: 'reports.risk-strategy-share',
    enhance: 'reports.risk-strategy-enhance',
  };
  return strategy && map[strategy] ? t(map[strategy]) : '—';
}

function defaultCapabilityRisks(): CapabilityRisksDto {
  return { summary: { total: 0, byState: {}, byLevel: {} }, risks: [] };
}

interface RiskHeatRow {
  key: string;
  label: string;
  counts: Record<string, number>;
  total: number;
}

function emptyHeatRow(key: string, label: string): RiskHeatRow {
  return { key, label, counts: { critical: 0, high: 0, medium: 0, low: 0, unknown: 0 }, total: 0 };
}

function addRiskLevelCounts(row: RiskHeatRow, byLevel?: Record<string, number> | null) {
  if (!byLevel) return;
  for (const [lvl, n] of Object.entries(byLevel)) {
    const k = RISK_LEVELS.includes(lvl) ? lvl : 'unknown';
    row.counts[k] += n;
    row.total += n;
  }
}

function heatMax(rows: RiskHeatRow[]): number {
  let m = 0;
  for (const r of rows) for (const lvl of RISK_LEVELS) m = Math.max(m, r.counts[lvl] ?? 0);
  return m || 1;
}

function heatCellStyle(count: number, max: number, level: string) {
  if (count <= 0) return { backgroundColor: 'transparent', color: 'rgba(100,116,139,0.55)', fontWeight: 400 };
  const base = riskLevelColor(level);
  const ratio = max > 0 ? Math.min(count / max, 1) : 0;
  const alpha = 0.14 + ratio * 0.82;
  return {
    backgroundColor: hexToRgba(base, alpha),
    color: alpha > 0.5 ? '#fff' : 'rgba(100,116,139,0.95)',
    fontWeight: 600,
  };
}

// ---------- period helpers ----------
const compareInvalid = computed(() => {
  if (!compareEnabled.value || !comparePeriod.value || !selectedPeriod.value) return false;
  return (
      comparePeriod.value.startDate === selectedPeriod.value.startDate &&
      comparePeriod.value.endDate === selectedPeriod.value.endDate
  );
});

function formatPeriodLabel(p: SelectedPeriod): string {
  const year = p.startDate.slice(0, 4);
  if (p.type === 'YEARLY') return `${t('reports.period-type.yearly')} ${year}`;
  if (p.type === 'QUARTERLY') {
    const q = Math.floor((Number(p.startDate.slice(5, 7)) - 1) / 3) + 1;
    return `${t('reports.quarter')} ${q} ${year}`;
  }
  if (p.type === 'MONTHLY') {
    const month = Number(p.startDate.slice(5, 7));
    return `${t('reports.period-type.monthly')} ${String(month).padStart(2, '0')} ${year}`;
  }
  return `${p.startDate} → ${p.endDate}`;
}

const periodLabel = computed(() => (selectedPeriod.value ? formatPeriodLabel(selectedPeriod.value) : ''));
const comparisonLabel = computed(() => (comparePeriod.value ? formatPeriodLabel(comparePeriod.value) : ''));

// ---------- quick presets ----------
const pad2 = (n: number) => String(n).padStart(2, '0');
const lastDayOfMonth = (year: number, month: number) => new Date(year, month, 0).getDate();

const currentYear = () => new Date().getFullYear();

/** Base year to anchor the scrollable year strip. */
const activeBaseYear = computed<number>(() => {
  const from = dashboardData.value?.date_from;
  return from
      ? Number(from.slice(0, 4))
      : selectedPeriod.value
        ? Number(selectedPeriod.value.startDate.slice(0, 4))
        : currentYear() - 1;
});

/** Scrollable year range (≈ 2015 → next year), so the user can browse any year. */
const yearOptions = computed<number[]>(() => {
  const min = 2015;
  const max = Math.max(currentYear() + 1, activeBaseYear.value);
  const years: number[] = [];
  for (let y = Math.min(min, activeBaseYear.value); y <= max; y++) years.push(y);
  return years;
});

/** Builds a period of the same type for a given year, preserving quarter/month. */
function periodForYear(type: string, year: number): SelectedPeriod {
  const month = selectedPeriod.value ? Number(selectedPeriod.value.startDate.slice(5, 7)) : 1;
  if (type === 'QUARTERLY') {
    const q = Math.floor((month - 1) / 3) + 1;
    const fm = (q - 1) * 3 + 1;
    const lm = q * 3;
    return { type: 'QUARTERLY', startDate: `${year}-${pad2(fm)}-01`, endDate: `${year}-${pad2(lm)}-${pad2(lastDayOfMonth(year, lm))}` };
  }
  if (type === 'MONTHLY') {
    const m = Math.min(month, 12);
    return { type: 'MONTHLY', startDate: `${year}-${pad2(m)}-01`, endDate: `${year}-${pad2(m)}-${pad2(lastDayOfMonth(year, m))}` };
  }
  return { type: 'YEARLY', startDate: `${year}-01-01`, endDate: `${year}-12-31` };
}

function isQuickYearActive(year: number): boolean {
  const p = selectedPeriod.value;
  return !!p && Number(p.startDate.slice(0, 4)) === year;
}

function quickSelectYear(year: number) {
  selectedPeriod.value = periodForYear(selectedPeriod.value?.type ?? 'YEARLY', year);
}

// ---------- scrollable year strip ----------
const yearsStripRef = ref<HTMLElement | null>(null);

function scrollYears(direction: number) {
  yearsStripRef.value?.scrollBy({ left: direction * 220, behavior: 'smooth' });
}

function scrollActiveYearIntoView() {
  void nextTick(() => {
    const el = yearsStripRef.value?.querySelector('[data-active="true"]');
    el?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  });
}

/** The immediately preceding period of the same type (2024 → 2023, Q3 → Q2, Feb → Jan). */
const prevComparePeriod = computed<SelectedPeriod | null>(() => {
  const p = selectedPeriod.value;
  if (!p) return null;
  const year = Number(p.startDate.slice(0, 4));
  const month = Number(p.startDate.slice(5, 7));
  if (p.type === 'YEARLY') {
    const y = year - 1;
    return { type: 'YEARLY', startDate: `${y}-01-01`, endDate: `${y}-12-31` };
  }
  if (p.type === 'QUARTERLY') {
    const q = Math.floor((month - 1) / 3) + 1;
    let y = year;
    let pq = q - 1;
    if (pq === 0) { pq = 4; y -= 1; }
    const fm = (pq - 1) * 3 + 1;
    const lm = pq * 3;
    return { type: 'QUARTERLY', startDate: `${y}-${pad2(fm)}-01`, endDate: `${y}-${pad2(lm)}-${pad2(lastDayOfMonth(y, lm))}` };
  }
  if (p.type === 'MONTHLY') {
    let y = year;
    let m = month - 1;
    if (m === 0) { m = 12; y -= 1; }
    return { type: 'MONTHLY', startDate: `${y}-${pad2(m)}-01`, endDate: `${y}-${pad2(m)}-${pad2(lastDayOfMonth(y, m))}` };
  }
  return null;
});

const isComparingPrevious = computed(() => {
  const prev = prevComparePeriod.value;
  return !!prev && !!comparePeriod.value && comparePeriod.value.startDate === prev.startDate && comparePeriod.value.endDate === prev.endDate;
});

/** Comparison must use the same granularity as the dashboard period (monthly ↔ monthly, …). */
const compareTypes = computed<string[]>(() => (selectedPeriod.value ? [selectedPeriod.value.type] : ['YEARLY']));

const comparisonTypeLabel = computed(() => {
  const tp = compareTypes.value[0];
  if (tp === 'YEARLY') return t('reports.period-type.yearly');
  if (tp === 'QUARTERLY') return t('reports.period-type.quarterly');
  if (tp === 'MONTHLY') return t('reports.period-type.monthly');
  return tp;
});

/** If the main period type changes, drop the now-incompatible comparison selection.
 *  `suppressReload` batches this into the reload already scheduled by the period change,
 *  so clearing the comparison doesn't cause a second fetch. */
watch(
    () => selectedPeriod.value?.type,
    () => {
      if (!compareEnabled.value) return;
      suppressReload = true;
      comparePeriod.value = null;
      suppressReload = false;
    },
);

function compareWithPrevious() {
  if (!prevComparePeriod.value) return;
  comparePeriod.value = prevComparePeriod.value;
  compareEnabled.value = true;
}

// ---------- request params ----------
function buildParams(): Record<string, unknown> {
  const params: Record<string, unknown> = {};
  if (selectedPeriod.value) {
    params.period_type = selectedPeriod.value.type;
    params.date_from = selectedPeriod.value.startDate;
    params.date_to = selectedPeriod.value.endDate;
  }
  if (compareEnabled.value && comparePeriod.value && !compareInvalid.value) {
    params.compare_period_type = comparePeriod.value.type;
    params.compare_date_from = comparePeriod.value.startDate;
    params.compare_date_to = comparePeriod.value.endDate;
  }
  return params;
}

// ---------- fetch ----------
async function loadOverview() {
  loading.value = true;
  loadError.value = false;
  try {
    const response = await reportRepo.getSustainabilityDashboardOverview(buildParams());
    if (response?.data) {
      dashboardData.value = normalizeDashboardData(response.data);
      // Adopt the backend-resolved default period on first load (no explicit dates sent).
      if (!selectedPeriod.value && response.data.period && response.data.date_from && response.data.date_to) {
        selectedPeriod.value = {
          type: response.data.period.type,
          startDate: response.data.date_from,
          endDate: response.data.date_to,
        };
      }
      for (const key of Object.keys(loadedCapitals)) delete loadedCapitals[key];
      openDomains.clear();
      openCapabilities.clear();
      if (dashboardData.value.capitals.length) {
        if (!hasLoaded.value) {
          // first load: land on the capitals overview tab (capital-level data only)
          activeTab.value = OVERVIEW_TAB;
          hasLoaded.value = true;
        } else if (activeTab.value !== OVERVIEW_TAB) {
          const current = activeTab.value;
          if (!dashboardData.value.capitals.some((c) => c.slug === current)) {
            activeTab.value = OVERVIEW_TAB;
          } else {
            // stay on the current capital tab and re-fetch its indicator detail
            void ensureCapitalLoaded(current);
          }
        }
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

async function ensureCapitalLoaded(capitalSlug: string) {
  if (loadedCapitals[capitalSlug] || loadingCapitalSlug.value) return;
  loadingCapitalSlug.value = capitalSlug;
  try {
    const response = await reportRepo.getSustainabilityCapitalIndicators(capitalSlug, buildParams());
    const capital = response?.data?.capitals?.[0];
    if (capital && dashboardData.value) {
      normalizeCapital(capital);
      loadedCapitals[capitalSlug] = capital;
      const index = dashboardData.value.capitals.findIndex((c) => c.slug === capitalSlug);
      if (index >= 0) dashboardData.value.capitals[index] = capital;
    }
  } catch (error) {
    console.error(`Failed to load indicators for capital ${capitalSlug}:`, error);
  } finally {
    loadingCapitalSlug.value = null;
  }
}

function reload() {
  if (suppressReload) return;
  if (!selectedPeriod.value) return;
  loadOverview();
}

watch([selectedPeriod, comparePeriod], reload);
watch(compareEnabled, (enabled) => {
  if (!enabled) {
    comparePeriod.value = null;
  }
});

// ---------- filter panel (popover, baseline-style) ----------
const filterOpen = ref(false);
const hasComparisonChip = computed(() => compareEnabled.value && !!comparePeriod.value);
const showClearFilters = computed(() => hasComparisonChip.value);

/** Remove the optional comparison filter. */
function removeComparison() {
  compareEnabled.value = false;
  comparePeriod.value = null;
}

/** Reset period to the backend-resolved default and disable comparison. */
async function clearFilters() {
  suppressReload = true;
  compareEnabled.value = false;
  comparePeriod.value = null;
  selectedPeriod.value = null;
  await loadOverview();
  suppressReload = false;
}

function toggleFilter() {
  filterOpen.value = !filterOpen.value;
}
function closeFilter() {
  filterOpen.value = false;
}

interface FilterChip {
  key: string;
  label: string;
  ariaKey: string;
  onRemove: () => void;
}

const activeFilterKeys = computed<string[]>(() => {
  const keys: string[] = [];
  if (selectedPeriod.value) keys.push('period');
  if (hasComparisonChip.value) keys.push('comparison');
  return keys;
});

const activeFilterChips = computed<FilterChip[]>(() => {
  const chips: FilterChip[] = [];
  if (selectedPeriod.value) {
    chips.push({
      key: 'period',
      label: periodLabel.value,
      ariaKey: 'reports.clear-period',
      onRemove: () => { void clearFilters(); },
    });
  }
  if (hasComparisonChip.value) {
    chips.push({
      key: 'comparison',
      label: comparisonLabel.value,
      ariaKey: 'reports.disable-compare',
      onRemove: () => { removeComparison(); },
    });
  }
  return chips;
});

const filterBtnRef = ref<HTMLElement | null>(null);
const filterClusterRef = ref<HTMLElement | null>(null);
const popoverRef = ref<HTMLElement | null>(null);

const bound = useElementBounding(filterBtnRef, { windowScroll: true, windowResize: true });

const popoverStyle = computed(() => {
  const margin = 8;
  const maxW = Math.min(36 * 16, window.innerWidth - 2 * margin);
  let leftPos = bound.left.value;
  if (leftPos + maxW > window.innerWidth - margin) {
    leftPos = Math.max(margin, window.innerWidth - margin - maxW);
  }
  if (leftPos < margin) leftPos = margin;
  return {
    position: 'fixed' as const,
    top: `${bound.bottom.value + margin}px`,
    left: `${leftPos}px`,
    width: `${maxW}px`,
    zIndex: 1100,
  };
});

let stopClickOutside: (() => void) | undefined;

watch(filterOpen, (open) => {
  stopClickOutside?.();
  stopClickOutside = undefined;
  if (open) {
    void nextTick(() => {
      bound.update();
      stopClickOutside = onClickOutside(
        popoverRef,
        () => { closeFilter(); },
        {
          ignore: [
            filterClusterRef,
          ],
        }
      );
    });
  }
});

onBeforeUnmount(() => { stopClickOutside?.(); });

useEventListener(document, 'keydown', (e: KeyboardEvent) => {
  if (e.key === 'Escape' && filterOpen.value) closeFilter();
});

function selectCapital(slug: string) {
  activeTab.value = slug;
  ensureCapitalLoaded(slug);
}

function toggleDomain(domainSlug: string) {
  if (openDomains.has(domainSlug)) openDomains.delete(domainSlug);
  else openDomains.add(domainSlug);
}

function toggleCapability(capabilitySlug: string) {
  const cap = activeCapital.value;
  if (cap && !loadedCapitals[cap.slug]) ensureCapitalLoaded(cap.slug);
  if (openCapabilities.has(capabilitySlug)) openCapabilities.delete(capabilitySlug);
  else openCapabilities.add(capabilitySlug);
}

onMounted(async () => {
  suppressReload = true;
  await loadOverview();
  suppressReload = false;
  scrollActiveYearIntoView();
});

watch(selectedPeriod, scrollActiveYearIntoView);

// ---------- radar: domains under the active capital ----------
const domainRadarData = computed(() => {
  const cap = activeCapital.value;
  if (!cap) return null;
  const datasets: any[] = [
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
  ];
  if (hasComparison.value) {
    datasets.push({
      label: t('reports.comparison-score'),
      data: cap.domains.map((d) => (d.comparison?.value != null ? round1(d.comparison.value) : null)),
      backgroundColor: 'transparent',
      borderColor: '#94a3b8',
      borderDash: [5, 5],
      borderWidth: 1.5,
      pointBackgroundColor: '#94a3b8',
      pointBorderColor: '#fff',
      pointRadius: 3,
      pointHoverRadius: 5,
    });
  }
  return {
    labels: cap.domains.map((d) => d.title),
    datasets,
  };
});

// ---------- radar: all capitals, overview tab ----------
const capitalRadarData = computed(() => {
  if (!capitals.value.length) return null;
  const datasets: any[] = [
    {
      label: t('reports.sustainability-score'),
      data: capitals.value.map((c) => c.score),
      backgroundColor: hexToRgba(theme.colors.light.primary, 0.12),
      borderColor: theme.colors.light.primary,
      borderWidth: 2,
      pointBackgroundColor: capitals.value.map((c) => c.maturity.color),
      pointBorderColor: '#fff',
      pointRadius: 5,
      pointHoverRadius: 7,
    },
  ];
  if (hasComparison.value) {
    datasets.push({
      label: t('reports.comparison-score'),
      data: capitals.value.map((c) => (c.comparison?.value != null ? round1(c.comparison.value) : null)),
      backgroundColor: 'transparent',
      borderColor: '#94a3b8',
      borderDash: [5, 5],
      borderWidth: 1.5,
      pointBackgroundColor: '#94a3b8',
      pointBorderColor: '#fff',
      pointRadius: 4,
      pointHoverRadius: 6,
    });
  }
  return {
    labels: capitals.value.map((c) => c.title),
    datasets,
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
    legend: { display: true, position: 'bottom' as const, labels: { boxWidth: 10, font: { size: 10 } } },
    tooltip: { callbacks: { label: (ctx: any) => ` ${ctx.dataset.label}: ${round1(ctx.raw)} / 100` } },
  },
};

// ============================================================
// global (all-capitals) aggregates for the top KPI strip
// ============================================================
const globalStats = computed(() => {
  const summary = dashboardData.value?.summary;
  if (summary) {
    return {
      capitals: summary.capitals,
      domains: summary.domains,
      components: summary.components,
      capabilities: summary.capabilities,
      indicators: summary.indicators,
      withData: summary.indicatorsWithData,
      avgScore: summary.avgScore,
      completion: summary.dataCompletion,
      hasTarget: summary.targetsTotal,
      meetsTarget: summary.targetsMet,
    };
  }

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

  return { capitals: capitals.value.length, domains, components, capabilities, indicators, withData, avgScore, completion, hasTarget, meetsTarget, targetRate };
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

// comparison aggregate used in the KPI strip (frontend mean of capital comparison values)
const globalComparisonAvg = computed<number | null>(() => {
  if (!hasComparison.value) return null;
  const vals = capitals.value
      .map((c) => c.comparison?.value)
      .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  if (!vals.length) return null;
  return round1(vals.reduce((a, b) => a + b, 0) / vals.length);
});

// ---------- capital comparison bar (overview tab), with optional comparison dataset ----------
/**
 * For the “previous period” bars we reuse each item's own color at a lower
 * opacity, so both periods stay in the same color family and read clearly as
 * two periods of the same entity.
 */
function compareFillFor(color: string): string {
  return hexToRgba(color, 0.32);
}

const capitalBarData = computed(() => {
  const comparing = hasComparison.value;
  const datasets: any[] = [
    {
      label: t('reports.sustainability-score'),
      data: capitals.value.map((c) => round1(c.score)),
      backgroundColor: capitals.value.map((c) => c.maturity.color),
      borderRadius: 6,
      barThickness: comparing ? 12 : 18,
      barPercentage: 0.92,
      categoryPercentage: comparing ? 0.72 : 0.9,
      maxBarThickness: 22,
    },
  ];
  if (comparing) {
    datasets.push({
      label: t('reports.comparison-score'),
      data: capitals.value.map((c) => (c.comparison?.value != null ? round1(c.comparison.value) : null)),
      backgroundColor: capitals.value.map((c) => compareFillFor(c.maturity.color)),
      borderColor: capitals.value.map((c) => hexToRgba(c.maturity.color, 0.55)),
      borderWidth: 1.5,
      borderRadius: 6,
      barThickness: 12,
      barPercentage: 0.92,
      categoryPercentage: 0.72,
      maxBarThickness: 22,
      barValueLabels: false,
    });
  }
  return {
    labels: capitals.value.map((c) => c.title),
    datasets,
  };
});
const barOptionsHorizontal = {
  indexAxis: 'y' as const,
  maintainAspectRatio: false,
  layout: { padding: { right: 6 } },
  scales: {
    x: {
      min: 0,
      max: 100,
      grid: { color: 'rgba(148, 163, 184, 0.12)' },
      border: { display: false },
      ticks: { font: { size: 10 }, color: '#94a3b8', padding: 4 },
    },
    y: {
      grid: { display: false },
      border: { display: false },
      ticks: { font: { size: 11 }, color: '#475569' },
    },
  },
  plugins: {
    legend: { display: true, position: 'bottom' as const, labels: { boxWidth: 10, boxHeight: 10, font: { size: 10 }, padding: 14 } },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      padding: 10,
      cornerRadius: 8,
      titleFont: { size: 11 },
      bodyFont: { size: 11 },
      displayColors: false,
      callbacks: { label: (ctx: any) => ` ${ctx.dataset.label}: ${round1(ctx.raw)} / 100` },
    },
  },
};

// risk section chart options (counts, not 0-100 scores)
const riskDonutOptions = {
  maintainAspectRatio: false,
  cutout: '62%',
  plugins: {
    legend: { position: 'bottom' as const, labels: { boxWidth: 10, font: { size: 10 }, padding: 12 } },
    tooltip: { callbacks: { label: (ctx: any) => ` ${ctx.label}: ${ctx.raw}` } },
  },
};
const riskBarOptions = {
  indexAxis: 'y' as const,
  maintainAspectRatio: false,
  layout: { padding: { right: 6 } },
  scales: {
    x: {
      beginAtZero: true,
      grid: { color: 'rgba(148, 163, 184, 0.12)' },
      border: { display: false },
      ticks: { font: { size: 10 }, color: '#94a3b8', padding: 4 },
    },
    y: {
      grid: { display: false },
      border: { display: false },
      ticks: { font: { size: 11 }, color: '#475569' },
    },
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      padding: 10,
      cornerRadius: 8,
      titleFont: { size: 11 },
      bodyFont: { size: 11 },
      displayColors: false,
      callbacks: { label: (ctx: any) => ` ${ctx.dataset.label ?? ctx.label}: ${ctx.raw} ریسک` },
    },
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
// per-capital aggregates & charts (capital tab)
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
        const inds = capa.indicators ?? [];
        indicators += inds.length;
        withData += inds.filter((i) => i.hasData).length;
        if (capa.meetsTarget !== null && capa.meetsTarget !== undefined) {
          hasTarget += 1;
          if (capa.meetsTarget) meetsTarget += 1;
        }
      }
    }
  }
  // In overview mode the capital node carries precomputed counts instead of indicator rows.
  if (indicators === 0 && cap.indicatorCount != null) {
    indicators = cap.indicatorCount;
    withData = cap.indicatorsWithData ?? 0;
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
  const comparing = hasComparison.value;
  const datasets: any[] = [
    {
      label: t('reports.sustainability-score'),
      data: list.map((c) => round1(c.score)),
      backgroundColor: list.map((c) => c.maturity.color),
      borderRadius: 5,
      barThickness: comparing ? 9 : 13,
      barPercentage: 0.92,
      categoryPercentage: comparing ? 0.7 : 0.88,
      maxBarThickness: 16,
    },
  ];
  if (comparing) {
    datasets.push({
      label: t('reports.comparison-score'),
      data: list.map((c) => (c.comparison?.value != null ? round1(c.comparison.value) : null)),
      backgroundColor: list.map((c) => compareFillFor(c.maturity.color)),
      borderColor: list.map((c) => hexToRgba(c.maturity.color, 0.55)),
      borderWidth: 1.5,
      borderRadius: 5,
      barThickness: 9,
      barPercentage: 0.92,
      categoryPercentage: 0.7,
      maxBarThickness: 16,
      barValueLabels: false,
    });
  }
  return {
    labels: list.map((c) => (c.title.length > 22 ? c.title.slice(0, 22) + '…' : c.title)),
    datasets,
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

// ============================================================
// RISK SECTIONS (appended risk data — never affects scoring)
// ============================================================
const portfolioRisks = computed<DashboardRiskDto>(() => dashboardData.value?.risks ?? {
  total: 0,
  active: 0,
  archived: 0,
  byState: {},
  byLevel: {},
  byCapital: {},
});

const portfolioRiskCriticalHigh = computed(() => {
  const by = portfolioRisks.value.byLevel ?? {};
  return (by.critical ?? 0) + (by.high ?? 0);
});
const portfolioRiskCritical = computed(() => portfolioRisks.value.byLevel?.critical ?? 0);

const riskLevelBuckets = computed<[string, number][]>(() =>
    RISK_LEVELS.map((lvl) => [lvl, portfolioRisks.value.byLevel?.[lvl] ?? 0] as [string, number])
        .filter(([, n]) => n > 0),
);
const riskLevelDonutData = computed(() => ({
  labels: riskLevelBuckets.value.map(([lvl]) => riskLevelLabel(lvl)),
  datasets: [{
    data: riskLevelBuckets.value.map(([, n]) => n),
    backgroundColor: riskLevelBuckets.value.map(([lvl]) => riskLevelColor(lvl)),
    borderColor: '#fff',
    borderWidth: 2,
  }],
}));

const riskStateBarData = computed(() => {
  const by = portfolioRisks.value.byState ?? {};
  const entries = RISK_STATES.filter((s) => (by[s] ?? 0) > 0);
  return {
    labels: entries.map((s) => riskStateLabel(s)),
    datasets: [{
      label: t('reports.risks'),
      data: entries.map((s) => by[s] ?? 0),
      backgroundColor: entries.map((s) => RISK_STATE_COLOR[s] ?? '#94a3b8'),
      borderRadius: 6,
      barThickness: 18,
    }],
  };
});

const riskHeatmapByCapital = computed<RiskHeatRow[]>(() => {
  const map = new Map<string, RiskHeatRow>();
  for (const cap of capitals.value) {
    let row = map.get(cap.slug);
    if (!row) {
      row = emptyHeatRow(cap.slug, cap.title);
      map.set(cap.slug, row);
    }
    for (const d of cap.domains) {
      for (const comp of d.components) {
        for (const capa of comp.capabilities) {
          addRiskLevelCounts(row, capa.risks?.summary?.byLevel);
        }
      }
    }
  }
  return [...map.values()].filter((r) => r.total > 0);
});

// per-capital risk aggregates (derived from capability risk summaries)
const capitalRiskSummary = computed<{ total: number; byState: Record<string, number>; byLevel: Record<string, number> } | null>(() => {
  const cap = activeCapital.value;
  if (!cap) return null;
  const byState: Record<string, number> = {};
  const byLevel: Record<string, number> = {};
  let total = 0;
  for (const d of cap.domains) {
    for (const comp of d.components) {
      for (const capa of comp.capabilities) {
        const s = capa.risks?.summary;
        if (!s) continue;
        total += s.total ?? 0;
        for (const [k, v] of Object.entries(s.byState ?? {})) byState[k] = (byState[k] ?? 0) + v;
        for (const [k, v] of Object.entries(s.byLevel ?? {})) byLevel[k] = (byLevel[k] ?? 0) + v;
      }
    }
  }
  return { total, byState, byLevel };
});

const capitalRiskLevelDonutData = computed(() => {
  const by = capitalRiskSummary.value?.byLevel ?? {};
  const entries = RISK_LEVELS.map((lvl) => [lvl, by[lvl] ?? 0] as [string, number]).filter(([, n]) => n > 0);
  return {
    labels: entries.map(([lvl]) => riskLevelLabel(lvl)),
    datasets: [{
      data: entries.map(([, n]) => n),
      backgroundColor: entries.map(([lvl]) => riskLevelColor(lvl)),
      borderColor: '#fff',
      borderWidth: 2,
    }],
  };
});

const capitalRiskStateBarData = computed(() => {
  const by = capitalRiskSummary.value?.byState ?? {};
  const entries = RISK_STATES.filter((s) => (by[s] ?? 0) > 0);
  return {
    labels: entries.map((s) => riskStateLabel(s)),
    datasets: [{
      label: t('reports.risks'),
      data: entries.map((s) => by[s] ?? 0),
      backgroundColor: entries.map((s) => RISK_STATE_COLOR[s] ?? '#94a3b8'),
      borderRadius: 6,
      barThickness: 18,
    }],
  };
});

const riskHeatmapByDomain = computed<RiskHeatRow[]>(() => {
  const cap = activeCapital.value;
  if (!cap) return [];
  return cap.domains
      .map((d) => {
        const row = emptyHeatRow(d.slug, d.title);
        for (const comp of d.components) {
          for (const capa of comp.capabilities) {
            addRiskLevelCounts(row, capa.risks?.summary?.byLevel);
          }
        }
        return row;
      })
      .filter((r) => r.total > 0);
});

// capability-level helpers for badges + drill-down risk table
function capabilityRiskTotal(capa: CapabilityNode): number {
  return capa.risks?.summary?.total ?? 0;
}
function capabilityTopRiskLevel(capa: CapabilityNode): string {
  const by = capa.risks?.summary?.byLevel;
  if (!by) return 'unknown';
  for (const lvl of RISK_LEVELS) if ((by[lvl] ?? 0) > 0) return lvl;
  return 'unknown';
}
function riskBadgeStyle(capa: CapabilityNode) {
  const color = riskLevelColor(capabilityTopRiskLevel(capa));
  return { color, backgroundColor: hexToRgba(color, 0.1) };
}
function goToRisk(slug?: string | null) {
  if (!slug) return;
  router.push({ name: 'app-risk-detail', params: { slug } });
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-1 pb-12 pt-2 md:px-2">
    <!-- dashboard filter popover -->
    <Teleport to="body">
        <Transition name="sustainability-filter-pop">
          <div
              v-if="filterOpen"
              class="fixed inset-0 z-[1099] bg-slate-900/10 dark:bg-black/25"
              aria-hidden="true"
              @click="closeFilter"
          />
        </Transition>
        <Transition name="sustainability-filter-pop">
          <div
              v-if="filterOpen"
              ref="popoverRef"
              class="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xl dark:border-slate-600 dark:bg-slate-800 dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
              :style="popoverStyle"
              role="dialog"
              aria-modal="true"
              @click.stop
          >
            <div class="mb-3 flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5 dark:border-slate-700">
              <div class="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-white">
                <Lucide icon="SlidersHorizontal" class="h-4 w-4 text-slate-400" />
                {{ t('reports.dashboard-settings') }}
              </div>
              <button
                  type="button"
                  class="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                  :aria-label="t('general.close')"
                  :title="t('general.close')"
                  @click="closeFilter"
              >
                <Lucide icon="X" class="h-4 w-4" />
              </button>
            </div>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <!-- period selector -->
              <div class="rounded-lg border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-700/20">
                <div class="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  <Lucide icon="CalendarRange" class="h-3.5 w-3.5" />
                  {{ t('reports.period') }}
                </div>
                <div class="mb-2 flex items-center gap-1">
                  <button
                      type="button"
                      class="inline-flex h-7 w-6 flex-none items-center justify-center rounded-md border border-slate-200 bg-white text-slate-400 shadow-sm transition hover:bg-slate-50 hover:text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                      :aria-label="t('general.previous')"
                      :title="t('general.previous')"
                      @click="scrollYears(-1)"
                  >
                    <Lucide icon="ChevronRight" class="h-3.5 w-3.5" />
                  </button>
                  <div
                      ref="yearsStripRef"
                      class="flex flex-1 items-center gap-1 overflow-x-auto overscroll-contain px-0.5 py-1 [scrollbar-width:thin]"
                  >
                    <button
                        v-for="y in yearOptions"
                        :key="y"
                        type="button"
                        :data-active="isQuickYearActive(y)"
                        class="flex-none rounded-full border px-2.5 py-1 text-[11px] font-medium transition"
                        :class="isQuickYearActive(y)
                          ? 'border-primary/30 bg-primary-muted text-primary dark:border-primary/40 dark:bg-primary/10 dark:text-primary'
                          : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'"
                        @click="quickSelectYear(y)"
                    >{{ y }}</button>
                  </div>
                  <button
                      type="button"
                      class="inline-flex h-7 w-6 flex-none items-center justify-center rounded-md border border-slate-200 bg-white text-slate-400 shadow-sm transition hover:bg-slate-50 hover:text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                      :aria-label="t('general.next')"
                      :title="t('general.next')"
                      @click="scrollYears(1)"
                  >
                    <Lucide icon="ChevronLeft" class="h-3.5 w-3.5" />
                  </button>
                </div>
                <PeriodSelectPanel
                    v-model="selectedPeriod"
                    :label="periodLabel"
                    :placeholder="t('reports.select-period')"
                />
              </div>

              <!-- compare -->
              <div class="rounded-lg border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-700/20">
                <div class="mb-2 flex items-center justify-between">
                  <div class="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    <Lucide icon="GitCompare" class="h-3.5 w-3.5" />
                    {{ t('reports.comparison-period') }}
                  </div>
                  <button
                      type="button"
                      role="switch"
                      :aria-checked="compareEnabled"
                      :aria-label="compareEnabled ? t('reports.disable-compare') : t('reports.enable-compare')"
                      class="relative inline-flex h-5 w-10 flex-none items-center rounded-full transition-colors"
                      :class="compareEnabled ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'"
                      @click="compareEnabled = !compareEnabled"
                  >
                    <span
                        class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
                        :class="compareEnabled ? 'translate-x-5' : 'translate-x-0.5'"
                    />
                  </button>
                </div>

                <button
                    type="button"
                    class="mb-2 inline-flex w-full items-center justify-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition"
                    :class="isComparingPrevious
                      ? 'border-primary/30 bg-primary-muted text-primary dark:border-primary/40 dark:bg-primary/10 dark:text-primary'
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'"
                    @click="compareWithPrevious"
                >
                  <Lucide icon="ArrowLeftRight" class="h-3.5 w-3.5" />
                  {{ t('reports.compare-previous-period') }}
                </button>

                <div v-if="!compareEnabled" class="flex min-h-[110px] items-center justify-center rounded-lg border border-dashed border-slate-200 px-4 text-center text-[11px] leading-5 text-slate-400 dark:border-slate-600 dark:text-slate-500">
                  {{ t('reports.compare-hint') }}
                </div>
                <template v-else>
                  <p class="mb-2 rounded-md border border-primary/20 bg-primary-muted/50 px-2.5 py-1.5 text-[11px] text-slate-500 dark:border-primary/30 dark:bg-primary/10 dark:text-slate-400">
                    <Lucide icon="Lock" class="me-1 inline h-3 w-3 text-primary" />
                    {{ t('reports.comparison-same-type', { type: comparisonTypeLabel }) }}
                  </p>
                  <PeriodSelectPanel
                      v-model="comparePeriod"
                      :label="comparisonLabel"
                      :placeholder="t('reports.select-compare-period')"
                      :types="compareTypes"
                  />
                  <p v-if="compareInvalid" class="mt-2 flex items-center gap-1 text-[11px] text-danger">
                    <Lucide icon="AlertTriangle" class="h-3 w-3 flex-none" />
                    {{ t('reports.comparison-must-differ') }}
                  </p>
                </template>
              </div>

              <!-- selected range summary -->
              <div class="rounded-lg border border-slate-200 bg-slate-50/50 p-4 sm:col-span-2 dark:border-slate-700 dark:bg-slate-700/20">
                <div class="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  <Lucide icon="Info" class="h-3.5 w-3.5" />
                  {{ t('reports.selected-range') }}
                </div>
                <div class="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-600 dark:bg-slate-800">
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-sm font-semibold text-slate-900 dark:text-white">{{ periodLabel }}</span>
                    <span
                        class="rounded-full bg-primary-muted px-2 py-0.5 text-[10px] font-semibold text-primary dark:bg-primary/10 dark:text-primary"
                    >{{ selectedPeriod?.type }}</span>
                  </div>
                  <div v-if="dashboardData" class="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                    <span dir="ltr">{{ dashboardData.date_from }}</span>
                    <Lucide icon="ArrowLeftRight" class="mx-1 h-3 w-3 flex-none text-slate-300" />
                    <span dir="ltr">{{ dashboardData.date_to }}</span>
                  </div>
                  <div v-if="hasComparison" class="mt-3 rounded-md border border-primary/20 bg-primary-muted/50 px-2.5 py-2 text-[11px] leading-5 text-slate-500 dark:border-primary/30 dark:bg-primary/10 dark:text-slate-400">
                    <div class="flex items-center justify-between">
                      <span>{{ t('reports.current-period') }}</span>
                      <b class="text-slate-700 dark:text-white">{{ periodLabel }}</b>
                    </div>
                    <div class="flex items-center justify-between">
                      <span>{{ t('reports.comparison-period') }}</span>
                      <b class="text-slate-700 dark:text-white">{{ comparisonLabel }}</b>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- dashboard stats footer -->
            <div class="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-700">
              <span class="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                <Lucide icon="Layers" class="h-3 w-3" />
                {{ globalStats.capitals }} {{ t('reports.capitals') }}
              </span>
              <span class="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                <Lucide icon="ListChecks" class="h-3 w-3" />
                {{ globalStats.indicators }} {{ t('reports.indicators') }}
              </span>
              <span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                <Lucide icon="Percent" class="h-3 w-3" />
                {{ round1(globalStats.completion) }}% {{ t('reports.data-completion') }}
              </span>
            </div>
          </div>
        </Transition>
    </Teleport>

    <div class="px-1 pt-1">
      <!-- loading -->
        <div v-if="loading" class="space-y-5 py-2">
          <div class="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-700" />
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div v-for="i in 5" :key="i" class="h-28 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-700" />
          </div>
          <div class="h-96 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-700" />
          <div class="h-64 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-700" />
        </div>

        <!-- error -->
        <div v-else-if="loadError" class="py-12 text-center">
          <Lucide icon="AlertTriangle" class="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p class="mt-4 text-sm text-slate-400 dark:text-slate-500">
            {{ t('general.load-failed') }}
          </p>
          <button
              type="button"
              class="mt-4 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              @click="loadOverview"
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
              class="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-900"
          >
            <button
                type="button"
                class="flex flex-1 basis-32 items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-all"
                :class="
                isOverview
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              "
                @click="activeTab = OVERVIEW_TAB"
            >
              <Lucide icon="Radar" class="h-4 w-4" :class="isOverview ? 'text-primary' : ''" />
              {{ t('reports.all-capitals-overview') }}
            </button>
            <button
                v-for="cap in capitals"
                :key="cap.slug"
                type="button"
                class="flex flex-1 basis-32 items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-all"
                :class="
                activeTab === cap.slug
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              "
                :style="activeTab === cap.slug
                  ? { backgroundColor: hexToRgba(capitalTheme(cap.capitalType).main, 0.12) }
                  : undefined"
                @click="selectCapital(cap.slug)"
            >
              <Lucide :icon="capitalIcon(cap.capitalType)" class="h-4 w-4" :style="{ color: capitalTheme(cap.capitalType).main }" />
              {{ cap.title }}
              <span class="h-1.5 w-1.5 rounded-full" :style="{ backgroundColor: cap.maturity.color }" />
            </button>
          </div>

          <!-- section title + filter toolbar -->
          <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-1 pt-1">
            <div class="flex min-w-0 flex-1 items-center gap-3">
              <div
                  class="inline-flex h-10 w-10 flex-none items-center justify-center rounded-xl shadow-sm"
                  :style="{ backgroundColor: hexToRgba(sectionColor, 0.12), color: sectionColor }"
              >
                <Lucide :icon="sectionIcon" class="h-5 w-5" />
              </div>
              <div class="min-w-0">
                <h1 class="text-xl font-semibold text-slate-900 dark:text-white">{{ sectionTitle }}</h1>
                <p class="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{{ sectionSubtitle }}</p>
              </div>
            </div>
            <div class="flex flex-shrink-0 flex-wrap items-center gap-1.5" dir="ltr">
              <!-- filter toolbar cluster -->
              <div
                  ref="filterClusterRef"
                  class="flex max-w-[min(100vw-6rem,36rem)] flex-shrink-0 flex-wrap items-center gap-0.5"
              >
                <div class="flex shrink-0 items-center gap-1">
                  <button
                      ref="filterBtnRef"
                      type="button"
                      class="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border shadow-sm transition"
                      :class="filterOpen
                        ? 'border-primary/30 bg-primary-muted text-primary hover:bg-primary/10 dark:border-primary/40 dark:bg-primary/10 dark:text-primary'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-primary dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-primary'"
                      :aria-expanded="filterOpen"
                      :aria-label="t('reports.dashboard-settings')"
                      :title="t('reports.dashboard-settings')"
                      @click="toggleFilter"
                  >
                    <Lucide icon="Filter" class="h-4 w-4" />
                  </button>
                  <button
                      v-if="showClearFilters"
                      type="button"
                      class="inline-flex h-8 max-w-[min(100%,12rem)] shrink-0 items-center rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-danger dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-danger"
                      :aria-label="t('reports.toolbar-clear-filters')"
                      :title="t('reports.toolbar-clear-filters')"
                      @click="clearFilters"
                  >
                    <span class="truncate">{{ t('reports.toolbar-clear-filters') }}</span>
                  </button>
                </div>

                <div
                    v-if="activeFilterKeys.length > 0"
                    class="mx-1.5 flex min-w-0 flex-wrap items-center gap-1 sm:mx-2"
                >
                  <div class="h-8 w-1 shrink-0 self-center rounded-full bg-slate-500 dark:bg-slate-400" aria-hidden="true" />
                  <div class="flex min-w-0 flex-wrap items-center gap-1">
                    <span
                        v-for="chip in activeFilterChips"
                        :key="chip.key"
                        class="inline-flex max-w-[11rem] items-center gap-0.5 rounded-full border border-slate-200 bg-slate-50 py-0.5 pl-2 pr-0.5 text-[11px] font-medium text-slate-700 shadow-sm dark:border-slate-600 dark:bg-slate-700/80 dark:text-white"
                    >
                      <span class="min-w-0 truncate" :title="chip.label">{{ chip.label }}</span>
                      <button
                          type="button"
                          class="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 dark:hover:bg-slate-600 dark:hover:text-slate-100"
                          :aria-label="t(chip.ariaKey)"
                          :title="t(chip.ariaKey)"
                          @click.stop="chip.onRemove()"
                      >
                        <Lucide icon="X" class="!h-3 !w-3" />
                      </button>
                    </span>
                  </div>
                </div>
              </div>

              <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  @click="loadOverview"
              >
                <Lucide icon="RefreshCw" class="h-3.5 w-3.5" :class="{ 'animate-spin': loading }" />
                {{ t('general.refresh') }}
              </button>
            </div>
          </div>

          <!-- overview tab -->
          <div v-if="isOverview" class="space-y-5">
            <!-- GLOBAL KPI STRIP -->
            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div class="group relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
                <div
                    class="pointer-events-none absolute inset-0 opacity-5 transition-opacity duration-300 group-hover:opacity-10"
                    style="background: radial-gradient(circle at top right, #0f766e, transparent 70%)"
                />
                <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Lucide icon="Layers" class="h-4 w-4 text-primary" />
                  <span class="text-[11px] font-medium">{{ t('reports.average-score') }}</span>
                </div>
                <div class="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{{ round1(globalStats.avgScore) }}</div>
                <div v-if="globalComparisonAvg != null" class="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                  {{ t('reports.vs') }}
                  <b class="text-slate-600 dark:text-slate-300">{{ globalComparisonAvg }}</b>
                  <span
                      class="text-[10px] font-semibold"
                      :class="globalComparisonAvg >= globalStats.avgScore ? 'text-emerald-500' : 'text-rose-500'"
                  >
                    {{ globalComparisonAvg >= globalStats.avgScore ? '▲' : '▼' }}
                    {{ round1(Math.abs(globalComparisonAvg - globalStats.avgScore)) }}
                  </span>
                </div>
                <div class="mt-2 h-2 rounded-full bg-slate-100 dark:bg-slate-700">
                  <div class="h-full rounded-full bg-primary transition-all duration-700" :style="{ width: Math.min(globalStats.avgScore, 100) + '%' }" />
                </div>
              </div>
              <div class="group relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
                <div
                    class="pointer-events-none absolute inset-0 opacity-5 transition-opacity duration-300 group-hover:opacity-10"
                    style="background: radial-gradient(circle at top right, #0f766e, transparent 70%)"
                />
                <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Lucide icon="Grid3x3" class="h-4 w-4 text-primary" />
                  <span class="text-[11px] font-medium">{{ t('reports.domain-count') }}</span>
                </div>
                <div class="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{{ globalStats.domains }}</div>
                <p class="mt-2 text-[11px] text-slate-400">{{ globalStats.components }} {{ t('reports.component-count') }}</p>
              </div>
              <div class="group relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
                <div
                    class="pointer-events-none absolute inset-0 opacity-5 transition-opacity duration-300 group-hover:opacity-10"
                    style="background: radial-gradient(circle at top right, #0f766e, transparent 70%)"
                />
                <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Lucide icon="Target" class="h-4 w-4 text-primary" />
                  <span class="text-[11px] font-medium">{{ t('reports.capability-count') }}</span>
                </div>
                <div class="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{{ globalStats.capabilities }}</div>
                <p class="mt-2 text-[11px] text-slate-400">
                  {{ globalStats.meetsTarget }}/{{ globalStats.hasTarget }} {{ t('reports.meets-target') }}
                </p>
              </div>
              <div class="group relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
                <div
                    class="pointer-events-none absolute inset-0 opacity-5 transition-opacity duration-300 group-hover:opacity-10"
                    style="background: radial-gradient(circle at top right, #0f766e, transparent 70%)"
                />
                <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Lucide icon="Database" class="h-4 w-4 text-primary" />
                  <span class="text-[11px] font-medium">{{ t('reports.indicator-count') }}</span>
                </div>
                <div class="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{{ globalStats.indicators }}</div>
                <p class="mt-2 text-[11px] text-slate-400">{{ globalStats.withData }} {{ t('reports.with-data') }}</p>
              </div>
              <div class="group relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
                <div
                    class="pointer-events-none absolute inset-0 opacity-5 transition-opacity duration-300 group-hover:opacity-10"
                    style="background: radial-gradient(circle at top right, #10b981, transparent 70%)"
                />
                <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Lucide icon="Percent" class="h-4 w-4 text-emerald-500" />
                  <span class="text-[11px] font-medium">{{ t('reports.data-completion') }}</span>
                </div>
                <div class="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{{ round1(globalStats.completion) }}%</div>
                <div class="mt-2 h-2 rounded-full bg-slate-100 dark:bg-slate-700">
                  <div class="h-full rounded-full bg-emerald-500 transition-all duration-700" :style="{ width: Math.min(globalStats.completion, 100) + '%' }" />
                </div>
              </div>
            </div>

          

            <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div class="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
                <h2 class="text-sm font-semibold text-slate-900 dark:text-white">
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
                    {{ cap.title }} — <b class="text-slate-700 dark:text-white">{{ round1(cap.score) }}</b>
                    <span v-if="hasComparison" class="text-slate-400">
                      <Lucide icon="ArrowRightLeft" class="inline h-3 w-3" />
                      {{ cap.comparison?.value != null ? round1(cap.comparison.value) : '—' }}
                    </span>
                  </span>
                </div>
              </div>

              <!-- capital comparison bar (same row as the capitals overview, from md up) -->
              <div class="flex h-full flex-col rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <div class="mb-1 flex items-center gap-2">
                  <Lucide icon="BarChart3" class="h-4 w-4 text-slate-400" />
                  <h3 class="text-sm font-semibold text-slate-900 dark:text-white">{{ t('reports.capital-comparison') }}</h3>
                </div>
                <div class="mt-3 min-h-[220px] flex-1">
                  <Bar :data="capitalBarData" :options="barOptionsHorizontal" />
                </div>
              </div>
              <!-- TODO: maturity distribution donut is temporarily disabled (its labels are maturity labels — decide later)
              <div class="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <div class="mb-1 flex items-center gap-2">
                  <Lucide icon="PieChart" class="h-4 w-4 text-slate-400" />
                  <h3 class="text-sm font-semibold text-slate-900 dark:text-white">{{ t('reports.maturity-distribution') }}</h3>
                </div>
                <p class="mb-2 text-[11px] text-slate-400">{{ t('reports.domains-by-maturity-level') }}</p>
                <div class="h-[260px]">
                  <Doughnut v-if="globalMaturityBuckets.length" :data="globalMaturityDonutData" :options="donutOptions" />
                </div>
              </div>
              -->
            </div>

            <!-- RISK PORTFOLIO OVERVIEW (appended risk data — does not affect scoring) -->
            <div v-if="portfolioRisks.total > 0" class="space-y-4">
              <div class="flex flex-wrap items-center gap-2">
                <span
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    :style="{ backgroundColor: theme.status.critical + '1a', color: theme.status.critical }"
                >
                  <Lucide icon="ShieldAlert" class="h-5 w-5" />
                </span>
                <div>
                  <h2 class="text-sm font-bold text-slate-900 dark:text-white">
                    {{ t('reports.risk-portfolio-overview') }}
                  </h2>
                  <p class="text-xs text-slate-500 dark:text-slate-400">
                    {{ portfolioRisks.total }} {{ t('reports.risks') }}
                  </p>
                </div>
              </div>

              <!-- KPI row (risk-dashboard StatCard style) -->
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div class="relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                  <span class="absolute inset-y-0 right-0 w-0.5" :style="{ backgroundColor: theme.status.done }" aria-hidden="true" />
                  <div class="flex items-center justify-between gap-3">
                    <div class="min-w-0">
                      <p class="truncate text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('reports.total-risks') }}</p>
                      <p class="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">{{ portfolioRisks.total }}</p>
                    </div>
                    <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" :style="{ backgroundColor: theme.status.done + '1a', color: theme.status.done }">
                      <Lucide icon="ListTodo" class="h-5 w-5" />
                    </span>
                  </div>
                </div>
                <div class="relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                  <span class="absolute inset-y-0 right-0 w-0.5" :style="{ backgroundColor: theme.status.monitoring }" aria-hidden="true" />
                  <div class="flex items-center justify-between gap-3">
                    <div class="min-w-0">
                      <p class="truncate text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('reports.active-risks') }}</p>
                      <p class="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">{{ portfolioRisks.active }}</p>
                    </div>
                    <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" :style="{ backgroundColor: theme.status.monitoring + '1a', color: theme.status.monitoring }">
                      <Lucide icon="Activity" class="h-5 w-5" />
                    </span>
                  </div>
                </div>
                <div class="relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                  <span class="absolute inset-y-0 right-0 w-0.5" :style="{ backgroundColor: theme.status.archived }" aria-hidden="true" />
                  <div class="flex items-center justify-between gap-3">
                    <div class="min-w-0">
                      <p class="truncate text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('reports.archived-risks') }}</p>
                      <p class="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">{{ portfolioRisks.archived }}</p>
                    </div>
                    <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" :style="{ backgroundColor: theme.status.archived + '1a', color: theme.status.archived }">
                      <Lucide icon="Archive" class="h-5 w-5" />
                    </span>
                  </div>
                </div>
                <div class="relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                  <span class="absolute inset-y-0 right-0 w-0.5" :style="{ backgroundColor: theme.status.critical }" aria-hidden="true" />
                  <div class="flex items-center justify-between gap-3">
                    <div class="min-w-0">
                      <p class="truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                        {{ t('reports.high-level-risks') }} + {{ t('reports.critical-risks') }}
                      </p>
                      <p class="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">{{ portfolioRiskCriticalHigh }}</p>
                      <p class="mt-1 truncate text-xs text-slate-400">
                        {{ t('reports.risk-level-critical') }}: <b :style="{ color: theme.status.critical }">{{ portfolioRiskCritical }}</b>
                      </p>
                    </div>
                    <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" :style="{ backgroundColor: theme.status.critical + '1a', color: theme.status.critical }">
                      <Lucide icon="ShieldAlert" class="h-5 w-5" />
                    </span>
                  </div>
                </div>
              </div>

              <!-- distributions: level donut + state bar (risk-dashboard DashboardCard style) -->
              <div class="grid grid-cols-1 gap-4 lg:grid-cols-5">
                <section class="flex flex-col rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm lg:col-span-2 dark:border-slate-700 dark:bg-slate-800">
                  <header class="mb-2.5 flex items-start justify-between gap-2">
                    <div class="flex items-center gap-2.5">
                      <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                        <Lucide icon="ChartPie" class="h-4 w-4" />
                      </span>
                      <div>
                        <h3 class="text-sm font-semibold text-slate-900 dark:text-white">{{ t('reports.risks-by-level') }}</h3>
                        <p class="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                          {{ portfolioRisks.total }} {{ t('reports.risks') }}
                        </p>
                      </div>
                    </div>
                  </header>
                  <div class="flex-1">
                    <div v-if="riskLevelBuckets.length" class="relative h-[240px]">
                      <Doughnut :data="riskLevelDonutData" :options="riskDonutOptions" />
                      <div class="pointer-events-none absolute inset-x-0 top-[38%] -translate-y-1/2 text-center">
                        <p class="text-2xl font-extrabold text-slate-900 dark:text-white">{{ portfolioRisks.total }}</p>
                        <p class="text-xs text-slate-500 dark:text-slate-400">{{ t('reports.risks') }}</p>
                      </div>
                    </div>
                    <p v-else class="py-10 text-center text-xs text-slate-400">{{ t('reports.no-risk-data') }}</p>
                  </div>
                </section>
                <section class="flex flex-col rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm lg:col-span-3 dark:border-slate-700 dark:bg-slate-800">
                  <header class="mb-2.5 flex items-start justify-between gap-2">
                    <div class="flex items-center gap-2.5">
                      <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                        <Lucide icon="ChartBar" class="h-4 w-4" />
                      </span>
                      <div>
                        <h3 class="text-sm font-semibold text-slate-900 dark:text-white">{{ t('reports.risks-by-state') }}</h3>
                        <p class="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                          {{ portfolioRisks.total }} {{ t('reports.risks') }}
                        </p>
                      </div>
                    </div>
                  </header>
                  <div class="flex-1" :style="{ height: Math.max(riskStateBarData.labels.length * 30, 160) + 'px' }">
                    <Bar v-if="riskStateBarData.labels.length" :data="riskStateBarData" :options="riskBarOptions" />
                    <p v-else class="py-10 text-center text-xs text-slate-400">{{ t('reports.no-risk-data') }}</p>
                  </div>
                </section>
              </div>

              <!-- risk heatmap: capital × level (table UI, matches the other tabs) -->
              <div v-if="riskHeatmapByCapital.length" class="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
                <div class="mb-3 flex flex-wrap items-center gap-2">
                  <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                    <Lucide icon="Grid3x3" class="h-4 w-4" />
                  </span>
                  <h3 class="text-sm font-semibold text-slate-900 dark:text-white">{{ t('reports.risk-heatmap-by-capital') }}</h3>
                </div>
                <div class="overflow-x-auto">
                  <table class="w-full min-w-[560px] text-xs">
                    <thead>
                    <tr class="border-b border-slate-100 text-right text-[10px] uppercase tracking-wide text-slate-400 dark:border-slate-700">
                      <th class="pb-2 font-medium">{{ t('reports.capitals') }}</th>
                      <th v-for="lvl in RISK_LEVELS" :key="lvl" class="pb-2 text-center font-medium">
                        <span class="inline-flex items-center gap-1">
                          <span class="h-2 w-2 rounded-full" :style="{ backgroundColor: riskLevelColor(lvl) }" />
                          {{ riskLevelLabel(lvl) }}
                        </span>
                      </th>
                      <th class="pb-2 text-center font-medium">{{ t('reports.risks') }}</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr v-for="row in riskHeatmapByCapital" :key="row.key" class="border-b border-slate-50 last:border-0 dark:border-slate-800">
                      <td class="py-2 pr-2 font-medium text-slate-700 dark:text-white">{{ row.label }}</td>
                      <td v-for="lvl in RISK_LEVELS" :key="lvl" class="py-1.5 text-center">
                        <span
                            class="inline-flex h-8 w-14 items-center justify-center rounded-md text-[11px]"
                            :style="heatCellStyle(row.counts[lvl] ?? 0, heatMax(riskHeatmapByCapital), lvl)"
                        >{{ row.counts[lvl] ?? 0 }}</span>
                      </td>
                      <td class="py-2 text-center font-semibold text-slate-700 dark:text-white">{{ row.total }}</td>
                    </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- global leaderboard tables -->
            <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div class="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <div class="flex items-center gap-2 border-b border-slate-100 px-5 py-3 dark:border-slate-700">
                  <Lucide icon="Trophy" class="h-4 w-4 text-emerald-500" />
                  <h3 class="text-sm font-semibold text-slate-900 dark:text-white">{{ t('reports.top-domains') }}</h3>
                </div>
                <table class="w-full text-xs">
                  <tbody>
                  <tr
                      v-for="(d, i) in topDomains"
                      :key="d.slug"
                      class="border-b border-slate-50 last:border-0 dark:border-slate-800"
                  >
                    <td class="w-6 py-2 pr-4 text-center text-[10px] text-slate-300">{{ i + 1 }}</td>
                    <td class="py-2 pr-2">
                      <div class="font-medium text-slate-700 dark:text-white">{{ d.title }}</div>
                      <div class="text-[10px] text-slate-400">{{ d.capitalTitle }}</div>
                    </td>
                    <td class="w-14 py-2 text-left font-semibold" :style="{ color: d.maturity.color }">
                      {{ round1(d.score) }}
                      <span v-if="hasComparison" class="block text-[10px] font-normal text-slate-400">
                        {{ d.comparison?.value != null ? round1(d.comparison.value) : '—' }}
                      </span>
                    </td>
                  </tr>
                  </tbody>
                </table>
              </div>
              <div class="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <div class="flex items-center gap-2 border-b border-slate-100 px-5 py-3 dark:border-slate-700">
                  <Lucide icon="TrendingDown" class="h-4 w-4 text-rose-500" />
                  <h3 class="text-sm font-semibold text-slate-900 dark:text-white">{{ t('reports.bottom-domains') }}</h3>
                </div>
                <table class="w-full text-xs">
                  <tbody>
                  <tr
                      v-for="(d, i) in bottomDomains"
                      :key="d.slug"
                      class="border-b border-slate-50 last:border-0 dark:border-slate-800"
                  >
                    <td class="w-6 py-2 pr-4 text-center text-[10px] text-slate-300">{{ i + 1 }}</td>
                    <td class="py-2 pr-2">
                      <div class="font-medium text-slate-700 dark:text-white">{{ d.title }}</div>
                      <div class="text-[10px] text-slate-400">{{ d.capitalTitle }}</div>
                    </td>
                    <td class="w-14 py-2 text-left font-semibold" :style="{ color: d.maturity.color }">
                      {{ round1(d.score) }}
                      <span v-if="hasComparison" class="block text-[10px] font-normal text-slate-400">
                        {{ d.comparison?.value != null ? round1(d.comparison.value) : '—' }}
                      </span>
                    </td>
                  </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- capital tab -->
          <div v-else-if="activeCapital" class="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <!-- capital KPI strip -->
            <div v-if="capitalStats" class="grid gap-3 sm:grid-cols-2 lg:col-span-12 lg:grid-cols-3 xl:grid-cols-6">
              <div class="group relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
                <div
                    class="pointer-events-none absolute inset-0 opacity-5 transition-opacity duration-300 group-hover:opacity-10"
                    :style="{ background: `radial-gradient(circle at top right, ${activeCapital.maturity.color}, transparent 70%)` }"
                />
                <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Lucide :icon="capitalIcon(activeCapital.capitalType)" class="h-4 w-4" :style="{ color: activeCapital.maturity.color }" />
                  <span class="text-[11px] font-medium">{{ t('reports.capital-score') }}</span>
                </div>
                <div class="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{{ round1(activeCapital.score) }}</div>
                <div class="mt-2 h-2 rounded-full bg-slate-100 dark:bg-slate-700">
                  <div
                      class="h-full rounded-full transition-all duration-700"
                      :style="{ width: Math.min(activeCapital.score, 100) + '%', backgroundColor: activeCapital.maturity.color }"
                  />
                </div>
              </div>

              <div class="group relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
                <div
                    class="pointer-events-none absolute inset-0 opacity-5 transition-opacity duration-300 group-hover:opacity-10"
                    style="background: radial-gradient(circle at top right, #0f766e, transparent 70%)"
                />
                <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Lucide icon="Grid3x3" class="h-4 w-4 text-primary" />
                  <span class="text-[11px] font-medium">{{ t('reports.domain-count') }}</span>
                </div>
                <div class="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{{ activeCapital.domains.length }}</div>
                <p class="mt-2 text-[11px] text-slate-400">{{ activeCapital.titleEn || activeCapital.title }}</p>
              </div>

              <div class="group relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
                <div
                    class="pointer-events-none absolute inset-0 opacity-5 transition-opacity duration-300 group-hover:opacity-10"
                    style="background: radial-gradient(circle at top right, #0f766e, transparent 70%)"
                />
                <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Lucide icon="Boxes" class="h-4 w-4 text-primary" />
                  <span class="text-[11px] font-medium">{{ t('reports.component-count') }}</span>
                </div>
                <div class="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{{ capitalStats.components }}</div>
              </div>

              <div class="group relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
                <div
                    class="pointer-events-none absolute inset-0 opacity-5 transition-opacity duration-300 group-hover:opacity-10"
                    style="background: radial-gradient(circle at top right, #0f766e, transparent 70%)"
                />
                <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Lucide icon="Target" class="h-4 w-4 text-primary" />
                  <span class="text-[11px] font-medium">{{ t('reports.capability-count') }}</span>
                </div>
                <div class="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{{ capitalStats.capabilities }}</div>
                <p class="mt-2 text-[11px] text-slate-400">
                  {{ capitalStats.meetsTarget }}/{{ capitalStats.hasTarget }} {{ t('reports.meets-target') }}
                </p>
              </div>

              <div class="group relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
                <div
                    class="pointer-events-none absolute inset-0 opacity-5 transition-opacity duration-300 group-hover:opacity-10"
                    style="background: radial-gradient(circle at top right, #0f766e, transparent 70%)"
                />
                <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Lucide icon="Database" class="h-4 w-4 text-primary" />
                  <span class="text-[11px] font-medium">{{ t('reports.indicator-count') }}</span>
                </div>
                <div class="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{{ capitalStats.indicators }}</div>
                <p class="mt-2 text-[11px] text-slate-400">{{ capitalStats.withData }} {{ t('reports.with-data') }}</p>
              </div>

              <div class="group relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
                <div
                    class="pointer-events-none absolute inset-0 opacity-5 transition-opacity duration-300 group-hover:opacity-10"
                    style="background: radial-gradient(circle at top right, #10b981, transparent 70%)"
                />
                <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Lucide icon="Percent" class="h-4 w-4 text-emerald-500" />
                  <span class="text-[11px] font-medium">{{ t('reports.data-completion') }}</span>
                </div>
                <div class="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{{ round1(capitalStats.completion) }}%</div>
                <div class="mt-2 h-2 rounded-full bg-slate-100 dark:bg-slate-700">
                  <div class="h-full rounded-full bg-emerald-500 transition-all duration-700" :style="{ width: Math.min(capitalStats.completion, 100) + '%' }" />
                </div>
              </div>
            </div>

            <!-- hero score -->
            <div
                class="group relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-4 text-center shadow-sm transition-shadow hover:shadow-md lg:col-span-4 dark:border-slate-700 dark:bg-slate-800"
            >
              <div class="absolute inset-x-0 top-0 h-1" :style="{ backgroundColor: activeCapital.maturity.color }" />
              <div
                  class="pointer-events-none absolute inset-0 opacity-5 transition-opacity duration-300 group-hover:opacity-10"
                  :style="{ background: `radial-gradient(circle at top right, ${activeCapital.maturity.color}, transparent 70%)` }"
              />
              <div class="mb-3 flex justify-center">
                <div
                    class="inline-flex h-12 w-12 items-center justify-center rounded-xl"
                    :style="{ backgroundColor: hexToRgba(capitalTheme(activeCapital.capitalType).main, 0.12) }"
                >
                  <Lucide
                      :icon="capitalIcon(activeCapital.capitalType)"
                      class="h-6 w-6"
                      :style="{ color: capitalTheme(activeCapital.capitalType).main }"
                  />
                </div>
              </div>
              <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                {{ t('reports.capital-score') }}
              </p>
              <h3 class="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                {{ activeCapital.title }}
              </h3>
              <p class="text-xs text-slate-400 dark:text-slate-500">{{ activeCapital.titleEn }}</p>

              <div class="my-3">
                <div class="text-4xl font-bold leading-none" :style="{ color: activeCapital.maturity.color }">
                  {{ round1(activeCapital.score) }}
                </div>
              </div>

              <div v-if="hasComparison && activeCapital.comparison?.value != null" class="mb-2 text-xs text-slate-500 dark:text-slate-400">
                <Lucide icon="ArrowRightLeft" class="inline h-3 w-3" />
                {{ comparisonLabel }}: <b class="text-slate-700 dark:text-white">{{ round1(activeCapital.comparison.value) }}</b>
                <span
                    class="ms-1 text-[10px] font-semibold"
                    :class="activeCapital.comparison.value >= activeCapital.score ? 'text-emerald-500' : 'text-rose-500'"
                >
                  {{ activeCapital.comparison.value >= activeCapital.score ? '▲' : '▼' }}
                  {{ round1(Math.abs(activeCapital.comparison.value - activeCapital.score)) }}
                </span>
              </div>

              <div v-if="capitalStats" class="mt-3 space-y-2 border-t border-slate-100 pt-3 dark:border-slate-700">
                <div class="flex items-center justify-between gap-2 text-xs">
                  <span class="text-slate-500 dark:text-slate-400">{{ t('reports.domain-count') }}</span>
                  <b class="text-slate-800 dark:text-white">{{ activeCapital.domains.length }}</b>
                </div>
                <div class="flex items-center justify-between gap-2 text-xs">
                  <span class="text-slate-500 dark:text-slate-400">{{ t('reports.capability-count') }}</span>
                  <b class="text-slate-800 dark:text-white">{{ capitalStats.capabilities }}</b>
                </div>
                <div class="flex items-center justify-between gap-2 text-xs">
                  <span class="text-slate-500 dark:text-slate-400">{{ t('reports.meets-target') }}</span>
                  <b class="text-slate-800 dark:text-white">{{ capitalStats.meetsTarget }}/{{ capitalStats.hasTarget }}</b>
                </div>
                <div class="flex items-center justify-between gap-2 text-xs">
                  <span class="text-slate-500 dark:text-slate-400">{{ t('reports.data-completion') }}</span>
                  <b class="text-emerald-600 dark:text-emerald-400">{{ round1(capitalStats.completion) }}%</b>
                </div>
              </div>
            </div>

            <!-- radar -->
            <div class="lg:col-span-8 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <h3 class="text-sm font-semibold text-slate-900 dark:text-white">
                {{ t('reports.domain-distribution') }}
              </h3>
              <div class="mt-3 h-[320px]">
                <Radar v-if="domainRadarData" :data="domainRadarData" :options="radarOptions" />
              </div>
            </div>

            <!-- component comparison bar + capital maturity donut -->
            <div class="lg:col-span-12 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div class="mb-1 flex items-center gap-2">
                <Lucide icon="BarChart3" class="h-4 w-4 text-slate-400" />
                <h3 class="text-sm font-semibold text-slate-900 dark:text-white">{{ t('reports.top-components') }}</h3>
              </div>
              <p class="mb-2 text-[11px] text-slate-400">
                {{ Math.min(componentsInCapital.length, 12) }} / {{ componentsInCapital.length }} {{ t('reports.component-count') }}
              </p>
              <div :style="{ height: Math.max(Math.min(componentsInCapital.length, 12) * 32, 200) + 'px' }">
                <Bar v-if="componentsInCapital.length" :data="componentBarData" :options="barOptionsHorizontal" />
              </div>
            </div>
            <!-- TODO: capital maturity donut is temporarily disabled (its labels are maturity labels — decide later)
            <div class="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div class="mb-1 flex items-center gap-2">
                <Lucide icon="PieChart" class="h-4 w-4 text-slate-400" />
                <h3 class="text-sm font-semibold text-slate-900 dark:text-white">{{ t('reports.maturity-distribution') }}</h3>
              </div>
              <div class="h-[220px]">
                <Doughnut v-if="capitalMaturityBuckets.length" :data="capitalMaturityDonutData" :options="donutOptions" />
              </div>
            </div>
            -->

            <!-- TODO: gap analysis is temporarily disabled (a maturity-based concept — will live in the maturity dashboard)
            <div v-if="gapCapabilities.length" class="lg:col-span-12 rounded-xl border border-rose-100 bg-rose-50/40 p-5 dark:border-rose-900/30 dark:bg-rose-900/10">
              <div class="mb-3 flex items-center gap-2">
                <Lucide icon="AlertOctagon" class="h-4 w-4 text-rose-500" />
                <h3 class="text-sm font-semibold text-slate-900 dark:text-white">{{ t('reports.gap-analysis') }}</h3>
                <span class="mr-auto rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                  {{ gapCapabilities.length }}
                </span>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full min-w-[640px] text-xs">
                  <thead>
                  <tr class="border-b border-rose-100 text-right text-[10px] uppercase tracking-wide text-slate-400 dark:border-rose-900/30">
                    <th class="pb-2 font-medium">{{ t('reports.capability') }}</th>
                    <th class="pb-2 font-medium">{{ t('reports.domain') }} / {{ t('reports.component') }}</th>
                    <th class="pb-2 text-left font-medium">{{ t('reports.score') }}</th>
                    <th v-if="hasComparison" class="pb-2 text-left font-medium">{{ t('reports.comparison-score') }}</th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr v-for="capa in gapCapabilities.slice(0, 10)" :key="capa.slug" class="border-b border-rose-50 last:border-0 dark:border-rose-900/20">
                    <td class="py-2 pr-2 text-slate-700 dark:text-white">{{ capa.title }}</td>
                    <td class="py-2 pr-2 text-slate-400">{{ capa.domainTitle }} / {{ capa.componentTitle }}</td>
                    <td class="py-2 text-left font-semibold" :style="{ color: capa.maturity.color }">{{ round1(capa.score) }}</td>
                    <td v-if="hasComparison" class="py-2 text-left text-slate-400">{{ capa.comparison?.value != null ? round1(capa.comparison.value) : '—' }}</td>
                  </tr>
                  </tbody>
                </table>
                <p v-if="gapCapabilities.length > 10" class="mt-2 text-[11px] text-slate-400">
                  + {{ gapCapabilities.length - 10 }} {{ t('reports.more-items') }}
                </p>
              </div>
            </div>
            -->

            <!-- RISK OVERVIEW (per capital, appended risk data) -->
            <div
                v-if="capitalRiskSummary && capitalRiskSummary.total > 0"
                class="lg:col-span-12 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm dark:border-slate-700 dark:bg-slate-800"
            >
              <div class="mb-3 flex flex-wrap items-center gap-2">
                <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                  <Lucide icon="ShieldAlert" class="h-4 w-4" />
                </span>
                <h3 class="text-sm font-semibold text-slate-900 dark:text-white">{{ t('reports.risk-overview') }}</h3>
                <span
                    class="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    :style="{ backgroundColor: theme.status.critical + '1a', color: theme.status.critical }"
                >
                  {{ capitalRiskSummary.total }}
                </span>
              </div>

              <div class="grid grid-cols-1 gap-5 lg:grid-cols-12">
                <div class="lg:col-span-5">
                  <h4 class="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('reports.risks-by-level') }}</h4>
                  <div class="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                    <div v-if="capitalRiskLevelDonutData.labels.length" class="relative h-[220px]">
                      <Doughnut :data="capitalRiskLevelDonutData" :options="riskDonutOptions" />
                      <div class="pointer-events-none absolute inset-x-0 top-[38%] -translate-y-1/2 text-center">
                        <p class="text-2xl font-extrabold text-slate-900 dark:text-white">{{ capitalRiskSummary.total }}</p>
                        <p class="text-xs text-slate-500 dark:text-slate-400">{{ t('reports.risks') }}</p>
                      </div>
                    </div>
                    <p v-else class="py-10 text-center text-xs text-slate-400">{{ t('reports.no-risk-data') }}</p>
                  </div>
                </div>
                <div class="lg:col-span-7">
                  <h4 class="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">{{ t('reports.risks-by-state') }}</h4>
                  <div class="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                    <div :style="{ height: Math.max(capitalRiskStateBarData.labels.length * 30, 180) + 'px' }">
                      <Bar v-if="capitalRiskStateBarData.labels.length" :data="capitalRiskStateBarData" :options="riskBarOptions" />
                      <p v-else class="py-10 text-center text-xs text-slate-400">{{ t('reports.no-risk-data') }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- risk heatmap: domain × level (table UI) -->
              <div v-if="riskHeatmapByDomain.length" class="mt-4 overflow-x-auto rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <div class="mb-3 flex flex-wrap items-center gap-2">
                  <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                    <Lucide icon="Grid3x3" class="h-4 w-4" />
                  </span>
                  <h4 class="text-xs font-semibold text-slate-700 dark:text-white">{{ t('reports.risk-heatmap-by-domain') }}</h4>
                </div>
                <table class="w-full min-w-[560px] text-xs">
                  <thead>
                  <tr class="border-b border-slate-100 text-right text-[10px] uppercase tracking-wide text-slate-400 dark:border-slate-700">
                    <th class="pb-2 font-medium">{{ t('reports.domain') }}</th>
                    <th v-for="lvl in RISK_LEVELS" :key="lvl" class="pb-2 text-center font-medium">
                      <span class="inline-flex items-center gap-1">
                        <span class="h-2 w-2 rounded-full" :style="{ backgroundColor: riskLevelColor(lvl) }" />
                        {{ riskLevelLabel(lvl) }}
                      </span>
                    </th>
                    <th class="pb-2 text-center font-medium">{{ t('reports.risks') }}</th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr v-for="row in riskHeatmapByDomain" :key="row.key" class="border-b border-slate-50 last:border-0 dark:border-slate-800">
                    <td class="py-2 pr-2 font-medium text-slate-700 dark:text-white">{{ row.label }}</td>
                    <td v-for="lvl in RISK_LEVELS" :key="lvl" class="py-1.5 text-center">
                      <span
                          class="inline-flex h-8 w-14 items-center justify-center rounded-md text-[11px]"
                          :style="heatCellStyle(row.counts[lvl] ?? 0, heatMax(riskHeatmapByDomain), lvl)"
                      >{{ row.counts[lvl] ?? 0 }}</span>
                    </td>
                    <td class="py-2 text-center font-semibold text-slate-700 dark:text-white">{{ row.total }}</td>
                  </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- domain drill-down -->
            <div class="lg:col-span-12 space-y-2">
              <div
                  v-for="dom in sortedDomains"
                  :key="dom.slug"
                  class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
              >
                <button
                    type="button"
                    class="flex w-full items-center gap-3 px-4 py-3 text-right transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/40"
                    @click="toggleDomain(dom.slug)"
                >
                  <Lucide
                      icon="ChevronDown"
                      class="h-4 w-4 flex-none text-slate-400 transition"
                      :class="{ 'rotate-180': openDomains.has(dom.slug) }"
                  />
                  <div class="min-w-0 flex-1">
                    <div class="mb-1 flex items-center justify-between gap-2 text-xs font-semibold text-slate-700 dark:text-white">
                      <span>{{ dom.title }}</span>
                      <span class="font-normal text-slate-400 dark:text-slate-500">{{ dom.titleEn }}</span>
                    </div>
                    <div class="h-2 rounded-full bg-slate-100 dark:bg-slate-700">
                      <div
                          class="h-full rounded-full transition-all duration-700"
                          :style="{ width: Math.max(dom.score, 2) + '%', backgroundColor: dom.maturity.color }"
                      />
                    </div>
                  </div>
                  <div class="w-12 flex-none text-left text-sm font-semibold" :style="{ color: dom.maturity.color }">
                    {{ round1(dom.score) }}
                    <span v-if="hasComparison" class="block text-[10px] font-normal text-slate-400">
                      {{ dom.comparison?.value != null ? round1(dom.comparison.value) : '—' }}
                    </span>
                  </div>
                </button>

                <div v-if="openDomains.has(dom.slug)" class="border-t border-slate-100 px-4 py-3 dark:border-slate-700">
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
                    <div v-for="cap2 in comp.capabilities" :key="cap2.slug" class="border-t border-slate-50 dark:border-slate-800">
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
                        <span v-if="cap2.meetsTarget !== null && cap2.meetsTarget !== undefined" class="flex-none text-[10px]">
                          <Lucide
                              :icon="cap2.meetsTarget ? 'CheckCircle2' : 'XCircle'"
                              class="inline h-3 w-3"
                              :class="cap2.meetsTarget ? 'text-emerald-500' : 'text-rose-500'"
                          />
                        </span>
                        <span
                            v-if="capabilityRiskTotal(cap2) > 0"
                            class="inline-flex flex-none items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                            :style="riskBadgeStyle(cap2)"
                            :title="t('reports.capability-risks')"
                        >
                          <Lucide icon="ShieldAlert" class="h-3 w-3" />
                          {{ capabilityRiskTotal(cap2) }}
                        </span>
                        <span v-if="hasComparison" class="w-8 flex-none text-left text-[10px] text-slate-400">
                          {{ cap2.comparison?.value != null ? round1(cap2.comparison.value) : '—' }}
                        </span>
                        <span class="w-10 flex-none text-left font-semibold" :style="{ color: cap2.maturity.color }">
                          {{ round1(cap2.score) }}
                        </span>
                      </button>

                      <!-- indicator table for this capability -->
                      <div v-if="openCapabilities.has(cap2.slug)" class="mb-2 mr-5 overflow-x-auto rounded-lg bg-slate-50/70 dark:bg-slate-700/30">
                        <div
                            v-if="!loadedCapitals[activeCapital.slug] && loadingCapitalSlug === activeCapital.slug"
                            class="flex items-center gap-2 px-3 py-2 text-[11px] text-slate-400"
                        >
                          <Lucide icon="Loader2" class="h-3.5 w-3.5 animate-spin" />
                          {{ t('general.loading') }}
                        </div>
                        <table v-else-if="cap2.indicators.length" class="w-full min-w-[560px] text-[11px]">
                          <thead>
                          <tr class="border-b border-slate-100 text-right text-[10px] uppercase tracking-wide text-slate-400 dark:border-slate-700">
                            <th class="px-3 py-1.5 font-medium">{{ t('reports.indicator') }}</th>
                            <th class="px-3 py-1.5 font-medium">{{ t('reports.unit') }}</th>
                            <th class="px-3 py-1.5 text-center font-medium">{{ t('reports.raw-value') }}</th>
                            <th class="px-3 py-1.5 text-center font-medium">{{ t('reports.final-score') }}</th>
                            <th v-if="hasComparison" class="px-3 py-1.5 text-center font-medium">{{ t('reports.comparison-score') }}</th>
                            <th class="px-3 py-1.5 text-center font-medium">{{ t('reports.data-status') }}</th>
                          </tr>
                          </thead>
                          <tbody>
                          <tr v-for="ind in cap2.indicators" :key="ind.slug" class="border-b border-slate-100/70 last:border-0 dark:border-slate-800">
                            <td class="px-3 py-1.5 text-slate-600 dark:text-slate-300">{{ ind.title }}</td>
                            <td class="px-3 py-1.5 text-slate-400">{{ ind.unit }}</td>
                            <td class="px-3 py-1.5 text-center text-slate-600 dark:text-slate-300">
                              {{ ind.rawValue ?? '—' }}
                            </td>
                            <td class="px-3 py-1.5 text-center font-semibold text-slate-700 dark:text-white">
                              {{ ind.finalScore != null ? round1(ind.finalScore) : '—' }}
                            </td>
                            <td v-if="hasComparison" class="px-3 py-1.5 text-center text-slate-400">
                              {{ ind.comparison?.value != null ? round1(ind.comparison.value) : '—' }}
                            </td>
                            <td class="px-3 py-1.5 text-center">
                                <span
                                    class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                                    :class="ind.hasData
                                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                      : 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500'"
                                >
                                  {{ ind.hasData ? t('reports.has-data') : t('reports.no-data') }}
                                </span>
                            </td>
                          </tr>
                          </tbody>
                        </table>
                        <p v-else class="px-3 py-2 text-[11px] text-slate-400">{{ t('reports.no-indicator-data') }}</p>

                        <!-- risk list for this capability -->
                        <div v-if="cap2.risks && cap2.risks.risks.length" class="mt-2 overflow-x-auto rounded-lg border border-slate-200/60 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-700/30">
                          <div class="flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                            <Lucide icon="ShieldAlert" class="h-3.5 w-3.5 text-slate-400" />
                            {{ t('reports.capability-risks') }} ({{ cap2.risks.summary.total }})
                          </div>
                          <table class="w-full min-w-[860px] text-[11px]">
                            <thead>
                            <tr class="border-b border-slate-100 text-right text-[10px] uppercase tracking-wide text-slate-400 dark:border-slate-700">
                              <th class="px-3 py-1.5 font-medium">{{ t('reports.risk-title') }}</th>
                              <th class="px-3 py-1.5 font-medium">{{ t('reports.type') }}</th>
                              <th class="px-3 py-1.5 text-center font-medium">{{ t('reports.level') }}</th>
                              <th class="px-3 py-1.5 text-center font-medium">{{ t('reports.score') }}</th>
                              <th class="px-3 py-1.5 text-center font-medium">{{ t('reports.impact') }}</th>
                              <th class="px-3 py-1.5 text-center font-medium">{{ t('reports.likelihood') }}</th>
                              <th class="px-3 py-1.5 font-medium">{{ t('reports.strategy') }}</th>
                              <th class="px-3 py-1.5 font-medium">{{ t('reports.state') }}</th>
                              <th class="px-3 py-1.5 font-medium">{{ t('reports.deadline') }}</th>
                              <th class="px-3 py-1.5 font-medium">{{ t('reports.owner') }}</th>
                            </tr>
                            </thead>
                            <tbody>
                            <tr
                                v-for="risk in cap2.risks.risks"
                                :key="risk.slug"
                                class="border-b border-slate-100/70 last:border-0 dark:border-slate-800"
                            >
                              <td class="px-3 py-1.5">
                                <button
                                    v-if="risk.slug"
                                    type="button"
                                    class="text-right font-medium text-primary hover:underline dark:text-primary"
                                    @click="goToRisk(risk.slug)"
                                >
                                  {{ risk.title || '—' }}
                                </button>
                                <span v-else class="text-slate-600 dark:text-slate-300">{{ risk.title || '—' }}</span>
                              </td>
                              <td class="px-3 py-1.5 text-slate-400">{{ riskTypeLabel(risk.riskType) }}</td>
                              <td class="px-3 py-1.5 text-center">
                                <span
                                    class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                                    :style="{ color: riskLevelColor(risk.level), backgroundColor: hexToRgba(riskLevelColor(risk.level), 0.1) }"
                                >{{ riskLevelLabel(risk.level) }}</span>
                              </td>
                              <td class="px-3 py-1.5 text-center font-semibold text-slate-700 dark:text-white">{{ risk.score ?? '—' }}</td>
                              <td class="px-3 py-1.5 text-center text-slate-500 dark:text-slate-400">{{ risk.impact ?? '—' }}</td>
                              <td class="px-3 py-1.5 text-center text-slate-500 dark:text-slate-400">{{ risk.likelihood ?? '—' }}</td>
                              <td class="px-3 py-1.5 text-slate-400">{{ strategyLabel(risk.treatmentStrategy) }}</td>
                              <td class="px-3 py-1.5 text-slate-500 dark:text-slate-400">{{ riskStateLabel(risk.state) }}</td>
                              <td class="px-3 py-1.5 text-slate-400" dir="ltr">{{ risk.deadline ?? '—' }}</td>
                              <td class="px-3 py-1.5 text-slate-400">{{ risk.ownerId ?? '—' }}</td>
                            </tr>
                            </tbody>
                          </table>
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

<style scoped>
.sustainability-filter-pop-enter-active,
.sustainability-filter-pop-leave-active {
  transition: opacity 0.15s ease;
}
.sustainability-filter-pop-enter-from,
.sustainability-filter-pop-leave-to {
  opacity: 0;
}
</style>
