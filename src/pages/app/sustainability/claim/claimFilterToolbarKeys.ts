export const CLAIM_FILTER_PARAM_ORDER = ['title', 'status'] as const;

export type ClaimFilterParamKey = (typeof CLAIM_FILTER_PARAM_ORDER)[number];

export const CLAIM_FILTER_PARAM_LABEL_KEYS: Record<ClaimFilterParamKey, string> = {
  title: 'sustainability-claim-page.filter-field-title',
  status: 'sustainability-claim-page.filter-field-status',
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
