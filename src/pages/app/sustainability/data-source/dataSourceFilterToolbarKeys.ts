export const DATA_SOURCE_FILTER_PARAM_ORDER = [
  'title',
  'capitalSlug',
  'domainSlug',
  'componentSlug',
  'capabilitySlug',
  'claimSlug',
  'indicatorSlug',
  'dataSourceType',
  'source',
  'status',
] as const;

export type DataSourceFilterParamKey = (typeof DATA_SOURCE_FILTER_PARAM_ORDER)[number];

export const DATA_SOURCE_FILTER_PARAM_LABEL_KEYS: Record<DataSourceFilterParamKey, string> = {
  title: 'sustainability-data-source-page.filter-field-title',
  capitalSlug: 'sustainability-data-source-page.col-capital',
  domainSlug: 'sustainability-data-source-page.col-domain',
  componentSlug: 'sustainability-data-source-page.col-component',
  capabilitySlug: 'sustainability-data-source-page.col-capability',
  claimSlug: 'sustainability-data-source-page.col-claim',
  indicatorSlug: 'sustainability-data-source-page.col-indicator',
  dataSourceType: 'sustainability-data-source-page.col-data-source-type',
  source: 'sustainability-data-source-page.col-source',
  status: 'sustainability-data-source-page.col-status',
};

export function isDataSourceFilterValueSet(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'number') return !Number.isNaN(value);
  return false;
}

export function getActiveDataSourceFilterKeys(
  filters: Record<string, unknown>
): DataSourceFilterParamKey[] {
  return DATA_SOURCE_FILTER_PARAM_ORDER.filter(
    (k) => k in filters && isDataSourceFilterValueSet(filters[k])
  );
}
