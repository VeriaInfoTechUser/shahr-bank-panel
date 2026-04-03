/** منطق یکسان با ستون وضعیت در `operations/index.vue` */

const KNOWN_LEVELS = new Set(['todo', 'doing', 'done', 'approve', 'reject']);

export function rowHasClause(row: Record<string, unknown>): boolean {
  const h = row.has_clause;
  if (h === 1 || h === true) return true;
  const c = row.clause;
  if (Array.isArray(c) && c.length > 0) return true;
  return false;
}

export function getProgress(row: Record<string, unknown>): Record<string, unknown> | null {
  const p = row.progress;
  if (p == null || typeof p !== 'object' || Array.isArray(p)) return null;
  if (Object.keys(p).length === 0) return null;
  return p as Record<string, unknown>;
}

function progressStateKey(p: Record<string, unknown>): string {
  const level = p.level;
  const status = p.status;
  const raw =
    typeof level === 'string' && level.trim()
      ? level
      : typeof status === 'string'
        ? status
        : '';
  return raw.trim().toLowerCase();
}

/** کلید وضعیت برای UI / فرم (مثلاً `pending-assignment`, `todo`, …) */
export function getComplianceStatusKey(row: Record<string, unknown>): string {
  if (rowHasClause(row)) return 'clauses';
  const p = getProgress(row);
  if (!p) return 'pending-assignment';
  const key = progressStateKey(p);
  if (key && KNOWN_LEVELS.has(key)) return key;
  return 'unknown';
}

/** ارجاع گروهی در API معمولاً `type === 'parent'` */
export function isProgressParentReferral(row: Record<string, unknown>): boolean {
  const p = getProgress(row);
  if (!p) return false;
  return p.type === 'parent';
}

export function getProgressExecutorLabel(row: Record<string, unknown>): string {
  const p = getProgress(row);
  if (!p) return '—';
  const u = p.user;
  if (u && typeof u === 'object' && !Array.isArray(u)) {
    const o = u as Record<string, unknown>;
    const name = [o.name, o.full_name, o.title, o.email, o.mobile].find(
      (x) => typeof x === 'string' && String(x).trim()
    );
    if (name) return String(name).trim();
    if (o.id != null && o.id !== '') return String(o.id);
  }
  return '—';
}

export type RuleAnswerOption = { score: string; value: string; label: string };

/** متن `description` تسک (در API لیست تسک‌ها) */
export function getTaskDescription(row: Record<string, unknown>): string {
  const task = row.task as Record<string, unknown> | undefined;
  const raw = task?.description ?? row.description;
  if (typeof raw !== 'string' || !raw.trim()) return '';
  return raw.trim();
}

/**
 * گزینه‌های وضعیت/پاسخ:
 * ۱) آرایهٔ `value` روی خود تسک `[{ value, key, score }, …]`
 * ۲) در نبود، `rule.answers` / مشابه روی قانون
 */
export function extractRuleAnswerOptions(row: Record<string, unknown>): RuleAnswerOption[] {
  const task =
    (row.task as Record<string, unknown> | undefined) ??
    (row as Record<string, unknown>);

  const fromValueArray = task?.value;
  if (Array.isArray(fromValueArray) && fromValueArray.length > 0) {
    const out: RuleAnswerOption[] = [];
    for (const item of fromValueArray) {
      if (!item || typeof item !== 'object') continue;
      const o = item as Record<string, unknown>;
      const score = String(o.score ?? '').trim();
      const text = String(o.value ?? '').trim();
      const key = String(o.key ?? '').trim();
      if (!score && !text && !key) continue;
      out.push({
        score: score || '0',
        value: text || key,
        label: text || key || score,
      });
    }
    if (out.length > 0) return out;
  }

  const rule =
    (task?.rule as Record<string, unknown> | undefined) ??
    (row.rule as Record<string, unknown> | undefined);
  if (!rule || typeof rule !== 'object') return [];
  const raw = rule.answers ?? rule.answer ?? rule.answer_list;
  if (!Array.isArray(raw) || raw.length === 0) return [];
  const out: RuleAnswerOption[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const score = String(o.score ?? o.id ?? '').trim();
    const value = String(
      o.answer_value ?? o.value ?? o.title ?? o.rule ?? o.label ?? ''
    ).trim();
    const label = String(
      o.title ?? o.label ?? o.name ?? (value || score)
    ).trim();
    if (!score && !value) continue;
    out.push({
      score: score || value,
      value: value || score,
      label: label || value || score,
    });
  }
  return out;
}
