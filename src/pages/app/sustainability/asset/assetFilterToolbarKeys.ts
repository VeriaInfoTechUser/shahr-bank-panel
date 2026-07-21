export const ASSET_FILTER_PARAM_ORDER = [
  'title',
  'capitalSlug',
  'domainSlug',
  'componentSlug',
  'capabilitySlug',
  'claimSlug',
  'indicatorSlug',
] as const;

export type AssetFilterParamKey = (typeof ASSET_FILTER_PARAM_ORDER)[number];

export const ASSET_FILTER_PARAM_LABEL_KEYS: Record<AssetFilterParamKey, string> = {
  title: 'sustainability-asset-page.filter-field-title',
  capitalSlug: 'sustainability-asset-page.col-capital',
  domainSlug: 'sustainability-asset-page.col-domain',
  componentSlug: 'sustainability-asset-page.col-component',
  capabilitySlug: 'sustainability-asset-page.col-capability',
  claimSlug: 'sustainability-asset-page.col-claim',
  indicatorSlug: 'sustainability-asset-page.col-indicator',
};

export function isAssetFilterValueSet(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'number') return !Number.isNaN(value);
  return false;
}

export function getActiveAssetFilterKeys(
  filters: Record<string, unknown>
): AssetFilterParamKey[] {
  return ASSET_FILTER_PARAM_ORDER.filter(
    (k) => k in filters && isAssetFilterValueSet(filters[k])
  );
}
