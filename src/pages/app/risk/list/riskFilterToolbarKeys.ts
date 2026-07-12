export const RISK_FILTER_PARAM_ORDER = ['title', 'categorySlug', 'subCategorySlug', 'riskType', 'riskLevel', 'impact', 'likelihood', 'minScore', 'maxScore', 'state'] as const;

export type RiskFilterParamKey = (typeof RISK_FILTER_PARAM_ORDER)[number];

export const RISK_FILTER_PARAM_LABEL_KEYS: Record<RiskFilterParamKey, string> = {
  title: 'risk.filter-search',
  categorySlug: 'risk.field-category',
  subCategorySlug: 'risk.field-sub-category',
  riskType: 'risk.field-risk-type',
  riskLevel: 'risk.field-risk-level',
  impact: 'risk.col-impact',
  likelihood: 'risk.col-likelihood',
  minScore: 'risk.col-inherent-score',
  maxScore: 'risk.col-inherent-score',
  state: 'risk.field-status',
};

export function isRiskFilterValueSet(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'number') return !Number.isNaN(value);
  return false;
}

export function getActiveRiskFilterKeys(
  filters: Record<string, unknown>
): RiskFilterParamKey[] {
  return RISK_FILTER_PARAM_ORDER.filter(
    (k) => k in filters && isRiskFilterValueSet(filters[k])
  );
}
