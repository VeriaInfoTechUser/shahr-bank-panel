import type { DashboardApiEnvelope, DashboardResponse, MetricStatus } from './types';

export function unwrapDashboardResponse(payload: unknown, section = 'governance'): DashboardResponse | null {
  if (!payload || typeof payload !== 'object') return null;

  const envelope = payload as DashboardApiEnvelope;
  const data = envelope.data ?? payload;

  if (isDashboardResponse(data)) return data;

  if (data && typeof data === 'object') {
    const sectionPayload = (data as Record<string, unknown>)[section];
    if (isDashboardResponse(sectionPayload)) return sectionPayload;
  }

  return null;
}

export function isDashboardResponse(value: unknown): value is DashboardResponse {
  return Boolean(
    value
      && typeof value === 'object'
      && Array.isArray((value as DashboardResponse).sections)
      && typeof (value as DashboardResponse).summary === 'object',
  );
}

export function resolveText(value?: string | null, translate?: (key: string) => string, fallback = '-') {
  if (!value) return fallback;

  if (translate && value.includes('.')) {
    const translated = translate(value);
    return translated === value ? value : translated;
  }

  return value;
}

export function formatNumber(value: unknown, locale = 'fa-IR', maximumFractionDigits = 1) {
  if (value === null || value === undefined || value === '') return '-';

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return String(value);

  return new Intl.NumberFormat(locale, { maximumFractionDigits }).format(numericValue);
}

export function normalizePercent(value: unknown) {
  const numericValue = Number(value ?? 0);
  if (!Number.isFinite(numericValue)) return 0;
  return Math.min(Math.max(numericValue, 0), 100);
}

export function unitLabel(unit?: string | null) {
  const units: Record<string, string> = {
    percent: '%',
    percentage: '%',
    count: 'عدد',
    person: 'نفر',
    currency: 'ریال',
  };

  if (!unit) return '';
  return units[unit] ?? unit;
}

export function formatValueWithUnit(value: unknown, unit?: string | null, answerType?: string | null) {
  if (value === null || value === undefined || value === '') return '-';

  if (unit === '%' || unit === 'percent' || unit === 'percentage' || answerType === 'percentage') {
    return `${formatNumber(value)}%`;
  }

  const label = unitLabel(unit);
  return label ? `${formatNumber(value)} ${label}` : formatNumber(value);
}

export function statusFromValue(value: unknown, explicitStatus?: string | null): MetricStatus {
  if (explicitStatus === 'strong' || explicitStatus === 'completed' || explicitStatus === 'done') {
    return 'good';
  }

  if (explicitStatus === 'needs_attention' || explicitStatus === 'pending') {
    return 'warning';
  }

  if (explicitStatus === 'critical' || explicitStatus === 'high') {
    return 'danger';
  }

  if (explicitStatus === 'good' || explicitStatus === 'warning' || explicitStatus === 'danger') {
    return explicitStatus;
  }

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return 'muted';
  if (numericValue >= 80) return 'good';
  if (numericValue >= 50) return 'warning';
  return 'danger';
}

export function statusClasses(status: MetricStatus) {
  const classes: Record<MetricStatus, string> = {
    good: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300',
    warning: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300',
    danger: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300',
    strong: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300',
    muted: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-darkmode-600 dark:bg-darkmode-700 dark:text-slate-300',
  };

  return classes[status] ?? classes.muted;
}
