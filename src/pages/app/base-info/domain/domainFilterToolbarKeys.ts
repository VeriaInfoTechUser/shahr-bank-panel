export const DOMAIN_FILTER_PARAM_ORDER = ['title', 'frameworkSlug'] as const;

export type DomainFilterParamKey = (typeof DOMAIN_FILTER_PARAM_ORDER)[number];

export const DOMAIN_FILTER_PARAM_LABEL_KEYS: Record<DomainFilterParamKey, string> = {
  title: 'domain.filter-field-title',
  frameworkSlug: 'domain.filter-field-framework',
};

export function isDomainFilterValueSet(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'number') return !Number.isNaN(value);
  return false;
}

export function getActiveDomainFilterKeys(
  filters: Record<string, unknown>
): DomainFilterParamKey[] {
  return DOMAIN_FILTER_PARAM_ORDER.filter(
    (k) => k in filters && isDomainFilterValueSet(filters[k])
  );
}
