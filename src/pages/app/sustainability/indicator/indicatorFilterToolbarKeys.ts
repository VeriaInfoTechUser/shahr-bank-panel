export const INDICATOR_FILTER_PARAM_ORDER = [
  'title',
  'capitalSlug',
  'domainSlug',
  'componentSlug',
  'capabilitySlug',
  'claimSlug',
  'indicatorType',
] as const;

export type IndicatorFilterParamKey = (typeof INDICATOR_FILTER_PARAM_ORDER)[number];

export const INDICATOR_FILTER_PARAM_LABEL_KEYS: Record<IndicatorFilterParamKey, string> = {
  title: 'sustainability-indicator-page.filter-field-title',
  capitalSlug: 'sustainability-indicator-page.col-capital',
  domainSlug: 'sustainability-indicator-page.col-domain',
  componentSlug: 'sustainability-indicator-page.col-component',
  capabilitySlug: 'sustainability-indicator-page.col-capability',
  claimSlug: 'sustainability-indicator-page.col-claim',
  indicatorType: 'sustainability-indicator-page.col-indicator-type',
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
