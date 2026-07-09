export const BASELINE_FILTER_PARAM_ORDER = ['title', 'frameworkSlug', 'dateType', 'periodType'] as const;

export type BaselineFilterParamKey = (typeof BASELINE_FILTER_PARAM_ORDER)[number];

export const BASELINE_FILTER_PARAM_LABEL_KEYS: Record<BaselineFilterParamKey, string> = {
  title: 'reports.col-title',
  frameworkSlug: 'reports.col-framework',
  dateType: 'reports.col-date-type',
  periodType: 'reports.col-period',
};

export function isBaselineFilterValueSet(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'number') return !Number.isNaN(value);
  return false;
}

export function getActiveBaselineFilterKeys(
  filters: Record<string, unknown>
): BaselineFilterParamKey[] {
  return BASELINE_FILTER_PARAM_ORDER.filter(
    (k) => k in filters && isBaselineFilterValueSet(filters[k])
  );
}
