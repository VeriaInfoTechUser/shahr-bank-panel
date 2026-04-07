/** کلیدهای API فیلتر تعهدات — ترتیب نمایش بج‌ها */
export const TASK_FILTER_PARAM_ORDER = [
  'title',
  'code',
  'rule_id',
  'warranty_id',
  'section_id',
  'mandatory_unit',
  'data_from',
  'data_to',
] as const;

export type TaskFilterParamKey = (typeof TASK_FILTER_PARAM_ORDER)[number];

/** کلید i18n برای عنوان بج هر پارامتر */
export const TASK_FILTER_PARAM_LABEL_KEYS: Record<TaskFilterParamKey, string> = {
  title: 'task.filter-field-title',
  code: 'task.code',
  rule_id: 'task.filter-field-rule',
  warranty_id: 'task.filter-field-warranty',
  section_id: 'task.filter-field-section',
  mandatory_unit: 'task.filter-field-mandatory-unit',
  data_from: 'task.filter-date-from',
  data_to: 'task.filter-date-to',
};

export function isTaskFilterValueSet(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'number') return !Number.isNaN(value);
  if (typeof value === 'boolean') return true;
  return false;
}

export function getActiveTaskFilterKeys(filters: Record<string, unknown>): TaskFilterParamKey[] {
  return TASK_FILTER_PARAM_ORDER.filter(
    (k) => k in filters && isTaskFilterValueSet(filters[k])
  );
}
