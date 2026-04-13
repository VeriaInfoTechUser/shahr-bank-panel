/** مقادیر فیلتر `level` — فقط برای عملیات تطبیق / همان فیلتر مشترک: CSV مثلاً waiting,doing,done */
export const COMPLIANCE_PROGRESS_LEVEL_FILTER_VALUES = [
  'waiting',
  'doing',
  'done',
  'approve',
  'reject',
] as const;

export type ComplianceProgressLevelFilterValue =
  (typeof COMPLIANCE_PROGRESS_LEVEL_FILTER_VALUES)[number];

/** برچسب‌ها مطابق نمایش وضعیت در عملیات تطبیق */
export const COMPLIANCE_PROGRESS_LEVEL_LABEL_KEYS: Record<
  ComplianceProgressLevelFilterValue,
  string
> = {
  waiting: 'compliance-page.status-pending-assignment',
  doing: 'compliance-page.status-doing',
  done: 'compliance-page.status-done',
  approve: 'compliance-page.status-approve',
  reject: 'compliance-page.status-reject',
};
