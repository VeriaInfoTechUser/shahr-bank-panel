/** مقادیر فیلتر وضعیت پیشرفت — همان کلیدهای نمایش ستون وضعیت در عملیات تطبیق */
export const COMPLIANCE_PROGRESS_LEVEL_FILTER_VALUES = [
  'clauses',
  'pending-assignment',
  'todo',
  'doing',
  'done',
  'approve',
  'reject',
] as const;

export type ComplianceProgressLevelFilterValue =
  (typeof COMPLIANCE_PROGRESS_LEVEL_FILTER_VALUES)[number];

/** کلید i18n هر مقدار (همان عناوین وضعیت در عملیات تطبیق) */
export const COMPLIANCE_PROGRESS_LEVEL_LABEL_KEYS: Record<
  ComplianceProgressLevelFilterValue,
  string
> = {
  clauses: 'compliance-page.status-clauses',
  'pending-assignment': 'compliance-page.status-pending-assignment',
  todo: 'compliance-page.status-todo',
  doing: 'compliance-page.status-doing',
  done: 'compliance-page.status-done',
  approve: 'compliance-page.status-approve',
  reject: 'compliance-page.status-reject',
};
