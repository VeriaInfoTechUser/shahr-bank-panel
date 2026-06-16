export const PLAN_FILTER_PARAM_ORDER = ['title', 'frameworkSlug', 'domainSlug'] as const;

export type PlanFilterParamKey = (typeof PLAN_FILTER_PARAM_ORDER)[number];

export const PLAN_FILTER_PARAM_LABEL_KEYS: Record<PlanFilterParamKey, string> = {
  title: 'plan.filter-field-title',
  frameworkSlug: 'plan.filter-field-framework',
  domainSlug: 'plan.filter-field-domain',
};

export function isPlanFilterValueSet(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'number') return !Number.isNaN(value);
  return false;
}

export function getActivePlanFilterKeys(
  filters: Record<string, unknown>
): PlanFilterParamKey[] {
  return PLAN_FILTER_PARAM_ORDER.filter(
    (k) => k in filters && isPlanFilterValueSet(filters[k])
  );
}
