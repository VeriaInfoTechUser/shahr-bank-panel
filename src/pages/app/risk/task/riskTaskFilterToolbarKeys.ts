export const RISK_TASK_FILTER_PARAM_ORDER = ['title', 'frameworkSlug', 'domainSlug'] as const;

export type RiskTaskFilterParamKey = (typeof RISK_TASK_FILTER_PARAM_ORDER)[number];

export const RISK_TASK_FILTER_PARAM_LABEL_KEYS: Record<RiskTaskFilterParamKey, string> = {
  title: 'risk-task.filter-field-title',
  frameworkSlug: 'risk-task.filter-field-framework',
  domainSlug: 'risk-task.filter-field-domain',
};

export function isRiskTaskFilterValueSet(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'number') return !Number.isNaN(value);
  return false;
}

export function getActiveRiskTaskFilterKeys(
  filters: Record<string, unknown>
): RiskTaskFilterParamKey[] {
  return RISK_TASK_FILTER_PARAM_ORDER.filter(
    (k) => k in filters && isRiskTaskFilterValueSet(filters[k])
  );
}
