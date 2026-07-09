export const COMPARATIVE_FILTER_PARAM_ORDER = ['title', 'frameworkSlug', 'dateType', 'periodType'] as const;

export type ComparativeFilterParamKey = (typeof COMPARATIVE_FILTER_PARAM_ORDER)[number];

export const COMPARATIVE_FILTER_PARAM_LABEL_KEYS: Record<ComparativeFilterParamKey, string> = {
  title: 'reports.col-title',
  frameworkSlug: 'reports.col-framework',
  dateType: 'reports.col-date-type',
  periodType: 'reports.col-period',
};

export function isComparativeFilterValueSet(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'number') return !Number.isNaN(value);
  return false;
}

export function getActiveComparativeFilterKeys(
  filters: Record<string, unknown>
): ComparativeFilterParamKey[] {
  return COMPARATIVE_FILTER_PARAM_ORDER.filter(
    (k) => k in filters && isComparativeFilterValueSet(filters[k])
  );
}
