import {
  TASK_FILTER_PARAM_LABEL_KEYS,
  TASK_FILTER_PARAM_ORDER,
  type TaskFilterParamKey,
  isTaskFilterValueSet,
} from '@/pages/app/base-info/tasks/taskFilterToolbarKeys';

const _riskOpsOrderSansMandatory = TASK_FILTER_PARAM_ORDER.filter(
  (k) =>
    k !== 'mandatory_unit' && k !== 'warranty_id' && k !== 'section_id'
);
const _levelIdx = _riskOpsOrderSansMandatory.indexOf('level');

const _riskOpsBeforeCode = [
  ..._riskOpsOrderSansMandatory.slice(0, _levelIdx + 1),
  'risk_response_type',
  ..._riskOpsOrderSansMandatory.slice(_levelIdx + 1),
] as TaskFilterParamKey[];

const _codeIdx = _riskOpsBeforeCode.indexOf('code');

/** فیلتر عملیات ریسک — بدون واحد مکلف، نوع تعهد، حوزه، موضوع؛ `risk_response_type` بعد از وضعیت؛ شدت قبل از کد */
export const RISK_OPS_FILTER_PARAM_ORDER = [
  ..._riskOpsBeforeCode.slice(0, _codeIdx),
  'min_risk',
  'max_risk',
  ..._riskOpsBeforeCode.slice(_codeIdx),
] as const;

export type RiskOpsFilterParamKey = (typeof RISK_OPS_FILTER_PARAM_ORDER)[number];

export const RISK_OPS_FILTER_PARAM_LABEL_KEYS = Object.fromEntries(
  RISK_OPS_FILTER_PARAM_ORDER.map((k) => {
    if (k === 'risk_response_type') return [k, 'risk-operations.todo-field-strategy'];
    if (k === 'min_risk') return [k, 'risk-operations.filter-min-risk'];
    if (k === 'max_risk') return [k, 'risk-operations.filter-max-risk'];
    return [k, TASK_FILTER_PARAM_LABEL_KEYS[k as TaskFilterParamKey]];
  })
) as Record<RiskOpsFilterParamKey, string>;

function isDefaultFullRiskIntensityRange(filters: Record<string, unknown>): boolean {
  const a = Number(filters.min_risk);
  const b = Number(filters.max_risk);
  return Number.isFinite(a) && Number.isFinite(b) && a === 1 && b === 25;
}

export function getActiveRiskOpsFilterKeys(
  filters: Record<string, unknown>
): RiskOpsFilterParamKey[] {
  const hideIntensityDefaults = isDefaultFullRiskIntensityRange(filters);
  return RISK_OPS_FILTER_PARAM_ORDER.filter((k) => {
    if (hideIntensityDefaults && (k === 'min_risk' || k === 'max_risk')) return false;
    return k in filters && isTaskFilterValueSet(filters[k]);
  });
}
