import {
  rowHasClause,
  getProgress,
} from '@/pages/app/compliance/operations/complianceStatusHelpers';
import {
  assignerLabelFromProgressPayload,
  assignerLabelFromTaskPayload,
} from '@/composables/commitmentSummary';

const KNOWN_LEVELS = new Set(['todo', 'doing', 'done', 'approve', 'reject']);

function userLikeName(o: unknown): string {
  if (o == null || typeof o !== 'object' || Array.isArray(o)) return '';
  const r = o as Record<string, unknown>;
  const name = r.name ?? r.full_name ?? r.title ?? r.email ?? r.mobile;
  if (name != null && String(name).trim()) return String(name).trim();
  return '';
}

/** مجری ریسک — رابطی که ریسک به او اساین شده (`risk.user`). */
export function riskModalRiskExecutorLabel(
  row: Record<string, unknown> | null | undefined
): string {
  if (!row) return '—';
  const risk = row.risk as Record<string, unknown> | undefined;
  if (!risk) return '—';
  const u = risk.user;
  if (u != null && typeof u === 'object' && !Array.isArray(u)) {
    if (Object.keys(u).length === 0) return '—';
    const s = userLikeName(u);
    if (s) return s;
  }
  return '—';
}

/**
 * مجری تکلیف — رابطی که عملیات تطبیق مرتبط با این ریسک را انجام داده
 * (`risk.assigner*` سپس progress/task ارجاع‌دهنده).
 */
export function riskModalTaskComplianceAssignerLabel(
  row: Record<string, unknown> | null | undefined
): string {
  if (!row) return '—';
  const risk = row.risk as Record<string, unknown> | undefined;
  if (risk) {
    for (const k of ['assigner', 'assigner_user', 'assigner_information'] as const) {
      const v = risk[k];
      if (v != null && typeof v === 'object' && !Array.isArray(v)) {
        const s = userLikeName(v);
        if (s) return s;
      }
    }
  }
  const prog = getProgress(row);
  if (prog) {
    const s = assignerLabelFromProgressPayload(prog).trim();
    if (s) return s;
  }
  const task = row.task as Record<string, unknown> | undefined;
  if (task) {
    const s = assignerLabelFromTaskPayload(task).trim();
    if (s) return s;
  }
  const fromRow = assignerLabelFromTaskPayload(row).trim();
  if (fromRow) return fromRow;
  if (risk) {
    const aid = risk.assigner_id;
    if (aid != null && aid !== '') return `#${aid}`;
  }
  return '—';
}

export function getRisk(row: Record<string, unknown>): Record<string, unknown> | null {
  const r = row.risk;
  if (r == null || typeof r !== 'object' || Array.isArray(r)) return null;
  if (Object.keys(r).length === 0) return null;
  return r as Record<string, unknown>;
}

function riskStateKey(r: Record<string, unknown>): string {
  const level = r.level;
  const status = r.status;
  const raw =
    typeof level === 'string' && level.trim()
      ? level
      : typeof status === 'string'
        ? status
        : '';
  return raw.trim().toLowerCase();
}

/** همان منطق ستون وضعیت در `operations/index.vue` */
export function getRiskStatusKey(row: Record<string, unknown>): string {
  if (rowHasClause(row)) return 'clauses';
  const r = getRisk(row);
  if (!r) return 'pending-assignment';
  const key = riskStateKey(r);
  if (key && KNOWN_LEVELS.has(key)) return key;
  return 'unknown';
}

export function getRiskStateKeyForLabel(r: Record<string, unknown>): string {
  return riskStateKey(r);
}
