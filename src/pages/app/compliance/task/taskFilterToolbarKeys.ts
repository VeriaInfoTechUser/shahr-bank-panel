export const COMPLIANCE_TASK_FILTER_PARAM_ORDER = ['title', 'planSlug', 'frameworkSlug', 'domainSlug'] as const;

export type ComplianceTaskFilterParamKey = (typeof COMPLIANCE_TASK_FILTER_PARAM_ORDER)[number];

export const COMPLIANCE_TASK_FILTER_PARAM_LABEL_KEYS: Record<ComplianceTaskFilterParamKey, string> = {
  title: 'compliance-task.filter-field-title',
  planSlug: 'compliance-task.filter-field-plan',
  frameworkSlug: 'compliance-task.filter-field-framework',
  domainSlug: 'compliance-task.filter-field-domain',
};

export function isComplianceTaskFilterValueSet(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'number') return !Number.isNaN(value);
  return false;
}

export function getActiveComplianceTaskFilterKeys(
  filters: Record<string, unknown>
): ComplianceTaskFilterParamKey[] {
  return COMPLIANCE_TASK_FILTER_PARAM_ORDER.filter(
    (k) => k in filters && isComplianceTaskFilterValueSet(filters[k])
  );
}
