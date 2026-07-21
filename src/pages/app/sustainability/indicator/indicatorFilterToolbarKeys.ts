export const INDICATOR_FILTER_PARAM_ORDER = ['title', 'status'] as const;

export type IndicatorFilterParamKey = (typeof INDICATOR_FILTER_PARAM_ORDER)[number];

export const INDICATOR_FILTER_PARAM_LABEL_KEYS: Record<IndicatorFilterParamKey, string> = {
  title: 'sustainability-indicator-page.filter-field-title',
  status: 'sustainability-indicator-page.filter-field-status',
};

export function isIndicatorFilterValueSet(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'number') return !Number.isNaN(value);
  return false;
}

export function getActiveIndicatorFilterKeys(
  filters: Record<string, unknown>
): IndicatorFilterParamKey[] {
  return INDICATOR_FILTER_PARAM_ORDER.filter(
    (k) => k in filters && isIndicatorFilterValueSet(filters[k])
  );
}
