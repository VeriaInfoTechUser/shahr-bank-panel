/**
 * Adapter to convert new ESG dashboard format to existing DashboardResponse format
 */
import type { ESGDashboardData, ESGSectionData } from '@/types/esg-dashboard.interface';
import type { DashboardResponse, ScoreCard, MetricItem, StatItem } from './types';

/**
 * Convert ESG section data to DashboardResponse format
 */
export function adaptESGToDashboard(
  esgData: ESGDashboardData,
  section: 'governance' | 'social' | 'environmental',
): DashboardResponse | null {
  const sectionData = esgData[section];

  if (!sectionData) {
    return null;
  }

  const scoreCards = createScoreCards(sectionData);
  const statItems = createStatItems(sectionData);
  const metricItems = createMetricItems(sectionData);

  return {
    success: true,
    section,
    reportingPeriod: esgData.reporting_period,
    lastUpdated: esgData.last_updated ? new Date(esgData.last_updated).toLocaleDateString('fa-IR') : undefined,
    summary: {
      overallGovernanceScore: sectionData.summary.avg_score,
      scoreChange: calculateScoreChange(sectionData.summary.avg_score),
      dataCompleteness: sectionData.summary.completion,
    },
    sections: [
      {
        id: 'score_cards',
        type: 'score_cards',
        title: 'خلاصه شاخص‌های کلیدی',
        cards: scoreCards,
      },
      {
        id: 'metric_grid',
        type: 'metric_grid',
        title: 'شاخص‌های عملکردی',
        items: metricItems.slice(0, 12),
      },
      {
        id: 'stat_cards',
        type: 'stat_cards',
        title: 'آمار کلی',
        items: statItems,
      },
      {
        id: 'data_table',
        type: 'data_table',
        title: 'تمام شاخص‌های کلیدی',
        columns: ['code', 'title', 'value', 'domain', 'status'],
        rows: sectionData.all_kpis.map((kpi) => ({
          code: kpi.code,
          title: kpi.title,
          value: `${kpi.value} ${kpi.unit}`,
          domain: kpi.domain || '-',
          status: kpi.status === 'answered' ? 'پاسخ داده شده' : 'بدون پاسخ',
        })),
      },
    ],
  };
}

/**
 * Create score cards for summary metrics
 */
function createScoreCards(sectionData: ESGSectionData): ScoreCard[] {
  return [
    {
      title: 'مجموع شاخص‌های کلیدی',
      value: sectionData.summary.total_kpis,
      unit: 'شاخص',
      change: '',
    },
    {
      title: 'شاخص‌های پاسخ داده شده',
      value: sectionData.summary.answered,
      unit: `از ${sectionData.summary.total_kpis}`,
      change: `${sectionData.summary.completion.toFixed(1)}%`,
    },
    {
      title: 'میانگین امتیاز',
      value: Math.round(sectionData.summary.avg_score),
      unit: '%',
      change: 'از ارزیابی',
    },
  ];
}

/**
 * Create stat items for domain summaries
 */
function createStatItems(sectionData: ESGSectionData): StatItem[] {
  return sectionData.domains.slice(0, 6).map((domain) => ({
    title: domain.title,
    value: domain.avg_score.toFixed(1),
    unit: '%',
    label: `${domain.answered}/${domain.kpi_count}`,
    status: domain.avg_score >= 80 ? 'good' : domain.avg_score >= 50 ? 'warning' : 'danger',
  }));
}

/**
 * Create metric items for all KPIs
 */
function createMetricItems(sectionData: ESGSectionData): MetricItem[] {
  return sectionData.all_kpis.map((kpi) => ({
    metricCode: kpi.code,
    title: kpi.title,
    value: Number(kpi.value),
    unit: kpi.unit,
    domain: kpi.domain || 'نامشخص',
    answerType: kpi.type,
    status:
      kpi.status === 'unanswered'
        ? 'muted'
        : kpi.type === 'percentage'
          ? Number(kpi.value) >= 80
            ? 'good'
            : Number(kpi.value) >= 50
              ? 'warning'
              : 'danger'
          : 'muted',
  }));
}

/**
 * Calculate score change indicator
 */
function calculateScoreChange(score: number): string {
  if (score >= 85) return '↑ عالی';
  if (score >= 70) return '→ خوب';
  if (score >= 50) return '↓ متوسط';
  return '↓↓ نیاز به بهبود';
}

/**
 * Enhanced version of unwrapDashboardResponse that supports both formats
 */
export function unwrapDashboardResponseEnhanced(payload: unknown, section = 'governance'): DashboardResponse | null {
  if (!payload || typeof payload !== 'object') {
    console.warn('[ESG Dashboard] No payload received', payload);
    return null;
  }

  const envelope = payload as any;
  const data = envelope.data ?? envelope.result ?? payload;

  if (!data) {
    console.warn('[ESG Dashboard] No data in envelope', envelope);
    return null;
  }

  // First, try to get DashboardResponse format
  if (isDashboardResponse(data)) {
    console.log('[ESG Dashboard] Found DashboardResponse format');
    return data;
  }

  // Try to get from specific section in envelope (e.g., { governance: {...} })
  if (typeof data === 'object' && section in data) {
    const sectionPayload = (data as Record<string, unknown>)[section];
    if (isDashboardResponse(sectionPayload)) {
      console.log(`[ESG Dashboard] Found DashboardResponse in section: ${section}`);
      return sectionPayload;
    }
  }

  // If not found, try to interpret as ESG format and adapt it
  if (isESGDashboardData(data)) {
    console.log(`[ESG Dashboard] Converting ESG format to DashboardResponse for section: ${section}`);
    return adaptESGToDashboard(data, section as any);
  }

  // Try section-specific ESG format (data[section] is ESGSectionData)
  if (typeof data === 'object' && section in data) {
    const sectionData = (data as Record<string, unknown>)[section];
    if (isSectionData(sectionData)) {
      console.log(`[ESG Dashboard] Converting section data to DashboardResponse for: ${section}`);
      return adaptSectionToDashboard(sectionData, section);
    }
  }

  console.warn('[ESG Dashboard] Unable to parse data format', {
    dataType: typeof data,
    dataKeys: Object.keys(data).slice(0, 5),
    hasSections: 'sections' in data,
    hasGovernance: 'governance' in data,
  });

  return null;
}

/**
 * Check if value is a DashboardResponse
 */
function isDashboardResponse(value: unknown): value is DashboardResponse {
  return Boolean(
    value
      && typeof value === 'object'
      && Array.isArray((value as DashboardResponse).sections)
      && typeof (value as DashboardResponse).summary === 'object',
  );
}

/**
 * Check if value is ESGDashboardData format
 */
function isESGDashboardData(value: unknown): value is ESGDashboardData {
  if (!value || typeof value !== 'object') return false;

  const data = value as any;

  // Check if it has the ESG structure
  if (
    (data.governance || data.social || data.environmental)
    && (typeof data.governance === 'object' || typeof data.social === 'object' || typeof data.environmental === 'object')
  ) {
    const section = data.governance || data.social || data.environmental;
    return (
      section
      && Array.isArray(section.domains)
      && Array.isArray(section.all_kpis)
      && typeof section.summary === 'object'
    );
  }

  return false;
}

/**
 * Check if value is ESGSectionData (single section)
 */
function isSectionData(value: unknown): value is ESGSectionData {
  if (!value || typeof value !== 'object') return false;

  const data = value as any;
  return (
    typeof data.summary === 'object'
    && Array.isArray(data.domains)
    && Array.isArray(data.all_kpis)
  );
}

/**
 * Convert a single ESG section data to DashboardResponse format
 */
function adaptSectionToDashboard(
  sectionData: ESGSectionData,
  section: string,
): DashboardResponse {
  const scoreCards = createScoreCards(sectionData);
  const statItems = createStatItems(sectionData);
  const metricItems = createMetricItems(sectionData);

  return {
    success: true,
    section,
    summary: {
      overallGovernanceScore: sectionData.summary.avg_score,
      scoreChange: calculateScoreChange(sectionData.summary.avg_score),
      dataCompleteness: sectionData.summary.completion,
    },
    sections: [
      {
        id: 'score_cards',
        type: 'score_cards',
        title: 'خلاصه شاخص‌های کلیدی',
        cards: scoreCards,
      },
      {
        id: 'metric_grid',
        type: 'metric_grid',
        title: 'شاخص‌های عملکردی',
        items: metricItems.slice(0, 12),
      },
      {
        id: 'stat_cards',
        type: 'stat_cards',
        title: 'آمار کلی',
        items: statItems,
      },
      {
        id: 'data_table',
        type: 'data_table',
        title: 'تمام شاخص‌های کلیدی',
        columns: ['code', 'title', 'value', 'domain', 'status'],
        rows: sectionData.all_kpis.map((kpi) => ({
          code: kpi.code,
          title: kpi.title,
          value: `${kpi.value} ${kpi.unit}`,
          domain: kpi.domain || '-',
          status: kpi.status === 'answered' ? 'پاسخ داده شده' : 'بدون پاسخ',
        })),
      },
    ],
  };
}
