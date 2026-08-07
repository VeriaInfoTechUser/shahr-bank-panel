export const CAPABILITY_FILTER_PARAM_ORDER = [
  'title',
  'capitalSlug',
  'domainSlug',
  'componentSlug',
] as const;

export type CapabilityFilterParamKey = (typeof CAPABILITY_FILTER_PARAM_ORDER)[number];

export const CAPABILITY_FILTER_PARAM_LABEL_KEYS: Record<CapabilityFilterParamKey, string> = {
  title: 'sustainability-capability-page.filter-field-title',
  capitalSlug: 'sustainability-capability-page.col-capital',
  domainSlug: 'sustainability-capability-page.col-domain',
  componentSlug: 'sustainability-capability-page.col-component',
};

export function isCapabilityFilterValueSet(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'number') return !Number.isNaN(value);
  return false;
}

export function getActiveCapabilityFilterKeys(
  filters: Record<string, unknown>
): CapabilityFilterParamKey[] {
  return CAPABILITY_FILTER_PARAM_ORDER.filter(
    (k) => k in filters && isCapabilityFilterValueSet(filters[k])
  );
}
