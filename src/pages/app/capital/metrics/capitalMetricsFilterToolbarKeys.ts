export const CAPITAL_METRICS_FILTER_PARAM_ORDER = ['title', 'industries', 'metricRole'] as const;

export type CapitalMetricsFilterParamKey = (typeof CAPITAL_METRICS_FILTER_PARAM_ORDER)[number];

export const CAPITAL_METRICS_FILTER_PARAM_LABEL_KEYS: Record<CapitalMetricsFilterParamKey, string> = {
  title: 'capital-metrics-page.filter-field-title',
  industries: 'capital-metrics-page.col-industries',
  metricRole: 'capital-metrics-page.col-metric-role',
};

export function isCapitalMetricsFilterValueSet(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'number') return !Number.isNaN(value);
  return false;
}

export function getActiveCapitalMetricsFilterKeys(
  filters: Record<string, unknown>
): CapitalMetricsFilterParamKey[] {
  return CAPITAL_METRICS_FILTER_PARAM_ORDER.filter(
    (k) => k in filters && isCapitalMetricsFilterValueSet(filters[k])
  );
}
