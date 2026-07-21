export const CLAIM_FILTER_PARAM_ORDER = [
  'title',
  'capitalSlug',
  'domainSlug',
  'componentSlug',
  'capabilitySlug',
  'claimType',
] as const;

export type ClaimFilterParamKey = (typeof CLAIM_FILTER_PARAM_ORDER)[number];

export const CLAIM_FILTER_PARAM_LABEL_KEYS: Record<ClaimFilterParamKey, string> = {
  title: 'sustainability-claim-page.filter-field-title',
  capitalSlug: 'sustainability-claim-page.col-capital',
  domainSlug: 'sustainability-claim-page.col-domain',
  componentSlug: 'sustainability-claim-page.col-component',
  capabilitySlug: 'sustainability-claim-page.col-capability',
  claimType: 'sustainability-claim-page.col-claim-type',
};

export function isClaimFilterValueSet(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'number') return !Number.isNaN(value);
  return false;
}

export function getActiveClaimFilterKeys(
  filters: Record<string, unknown>
): ClaimFilterParamKey[] {
  return CLAIM_FILTER_PARAM_ORDER.filter(
    (k) => k in filters && isClaimFilterValueSet(filters[k])
  );
}
