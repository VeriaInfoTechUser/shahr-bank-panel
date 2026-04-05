/** کلیدهای API فیلتر قوانین — ترتیب نمایش بج‌ها */
export const RULE_FILTER_PARAM_ORDER = [
  'rule',
  'code',
  'author',
  'category',
  'type',
  'requirement',
  'validity',
  'promulgation_at_from',
  'data_from',
  'data_to',
] as const;

export type RuleFilterParamKey = (typeof RULE_FILTER_PARAM_ORDER)[number];

/** کلید i18n برای عنوان بج هر پارامتر */
export const RULE_FILTER_PARAM_LABEL_KEYS: Record<RuleFilterParamKey, string> = {
  rule: 'rule.filter-field-rule',
  code: 'rule.filter-field-code',
  author: 'rule.filter-field-author',
  category: 'rule.filter-field-category',
  type: 'rule.filter-field-type',
  requirement: 'rule.form-requirement',
  validity: 'rule.validity',
  promulgation_at_from: 'rule.filter-date-promulgation',
  data_from: 'rule.filter-date-data-from',
  data_to: 'rule.filter-date-data-to',
};

export function isRuleFilterValueSet(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'number') return !Number.isNaN(value);
  if (typeof value === 'boolean') return true;
  return false;
}

export function getActiveRuleFilterKeys(filters: Record<string, unknown>): RuleFilterParamKey[] {
  return RULE_FILTER_PARAM_ORDER.filter(
    (k) => k in filters && isRuleFilterValueSet(filters[k])
  );
}
