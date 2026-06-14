export const CONTROL_FILTER_PARAM_ORDER = ['title', 'frameworkSlug', 'domainSlug'] as const;

export type ControlFilterParamKey = (typeof CONTROL_FILTER_PARAM_ORDER)[number];

export const CONTROL_FILTER_PARAM_LABEL_KEYS: Record<ControlFilterParamKey, string> = {
  title: 'control.filter-field-title',
  frameworkSlug: 'control.filter-field-framework',
  domainSlug: 'control.filter-field-domain',
};

export function isControlFilterValueSet(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'number') return !Number.isNaN(value);
  return false;
}

export function getActiveControlFilterKeys(
  filters: Record<string, unknown>
): ControlFilterParamKey[] {
  return CONTROL_FILTER_PARAM_ORDER.filter(
    (k) => k in filters && isControlFilterValueSet(filters[k])
  );
}
