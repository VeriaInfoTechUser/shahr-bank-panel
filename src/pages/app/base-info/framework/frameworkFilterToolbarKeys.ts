export const FRAMEWORK_FILTER_PARAM_ORDER = ['title'] as const;

export type FrameworkFilterParamKey = (typeof FRAMEWORK_FILTER_PARAM_ORDER)[number];

export const FRAMEWORK_FILTER_PARAM_LABEL_KEYS: Record<FrameworkFilterParamKey, string> = {
  title: 'framework.filter-field-title',
};

export function isFrameworkFilterValueSet(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'number') return !Number.isNaN(value);
  return false;
}

export function getActiveFrameworkFilterKeys(
  filters: Record<string, unknown>
): FrameworkFilterParamKey[] {
  return FRAMEWORK_FILTER_PARAM_ORDER.filter(
    (k) => k in filters && isFrameworkFilterValueSet(filters[k])
  );
}
