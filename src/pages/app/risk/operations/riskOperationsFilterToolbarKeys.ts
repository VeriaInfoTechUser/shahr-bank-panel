import {
  TASK_FILTER_PARAM_LABEL_KEYS,
  TASK_FILTER_PARAM_ORDER,
  type TaskFilterParamKey,
  isTaskFilterValueSet,
} from '@/pages/app/base-info/tasks/taskFilterToolbarKeys';

/** فیلتر عملیات ریسک — بدون واحد مکلف؛ شامل `compliance_enforcer` */
export const RISK_OPS_FILTER_PARAM_ORDER = TASK_FILTER_PARAM_ORDER.filter(
  (k): k is RiskOpsFilterParamKey => k !== 'mandatory_unit'
);

export type RiskOpsFilterParamKey = Exclude<TaskFilterParamKey, 'mandatory_unit'>;

export const RISK_OPS_FILTER_PARAM_LABEL_KEYS: Record<RiskOpsFilterParamKey, string> =
  Object.fromEntries(
    RISK_OPS_FILTER_PARAM_ORDER.map((k) => [k, TASK_FILTER_PARAM_LABEL_KEYS[k]])
  ) as Record<RiskOpsFilterParamKey, string>;

export function getActiveRiskOpsFilterKeys(
  filters: Record<string, unknown>
): RiskOpsFilterParamKey[] {
  return RISK_OPS_FILTER_PARAM_ORDER.filter(
    (k) => k in filters && isTaskFilterValueSet(filters[k])
  );
}
