import {
  TASK_FILTER_PARAM_LABEL_KEYS,
  TASK_FILTER_PARAM_ORDER,
  type TaskFilterParamKey,
  isTaskFilterValueSet,
} from '@/pages/app/base-info/tasks/taskFilterToolbarKeys';

/** فیلتر عملیات تطبیق مثل تعهدات، بدون `mandatory_unit` و بدون `compliance_enforcer` (فقط ریسک) */
export const COMPLIANCE_OPS_FILTER_PARAM_ORDER = TASK_FILTER_PARAM_ORDER.filter(
  (k): k is ComplianceOpsFilterParamKey =>
    k !== 'mandatory_unit' && k !== 'compliance_enforcer'
);

export type ComplianceOpsFilterParamKey = Exclude<
  TaskFilterParamKey,
  'mandatory_unit' | 'compliance_enforcer'
>;

export const COMPLIANCE_OPS_FILTER_PARAM_LABEL_KEYS: Record<
  ComplianceOpsFilterParamKey,
  string
> = {
  title: TASK_FILTER_PARAM_LABEL_KEYS.title,
  enforcer: TASK_FILTER_PARAM_LABEL_KEYS.enforcer,
  level: TASK_FILTER_PARAM_LABEL_KEYS.level,
  code: TASK_FILTER_PARAM_LABEL_KEYS.code,
  rule_id: TASK_FILTER_PARAM_LABEL_KEYS.rule_id,
  warranty_id: TASK_FILTER_PARAM_LABEL_KEYS.warranty_id,
  section_id: TASK_FILTER_PARAM_LABEL_KEYS.section_id,
  data_from: TASK_FILTER_PARAM_LABEL_KEYS.data_from,
  data_to: TASK_FILTER_PARAM_LABEL_KEYS.data_to,
};

export function getActiveComplianceOpsFilterKeys(
  filters: Record<string, unknown>
): ComplianceOpsFilterParamKey[] {
  return COMPLIANCE_OPS_FILTER_PARAM_ORDER.filter(
    (k) => k in filters && isTaskFilterValueSet(filters[k])
  );
}
