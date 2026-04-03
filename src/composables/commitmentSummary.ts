/**
 * خلاصهٔ نمایش تعهد (همان فیلدهای مدال وضعیت عملیات تطبیق).
 */

export type CommitmentSummary = {
  titleStr: string;
  warrantyTitle: string;
  sectionLabel: string;
  ruleCode: string;
  ruleText: string;
  unitsList: string[];
  hasParentRef: boolean;
  parentRefDisplay: string;
};

export function resolveTaskRecord(
  row: Record<string, unknown> | null | undefined
): Record<string, unknown> | null {
  if (!row || typeof row !== 'object') return null;
  const nested = row.task;
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    return nested as Record<string, unknown>;
  }
  if (
    row.rule != null ||
    row.warranty != null ||
    row.mandatory_unit != null ||
    row.section != null
  ) {
    return row;
  }
  return null;
}

/** برای صفحهٔ انجام تعهد: اگر فقط عنوان داریم هم خلاصه بسازیم */
export function resolveTaskRecordForDoingTaskPage(
  row: Record<string, unknown> | null | undefined
): Record<string, unknown> | null {
  const r = resolveTaskRecord(row);
  if (r) return r;
  if (!row || typeof row !== 'object') return null;
  const title = row.title;
  if (typeof title === 'string' && title.trim()) return row;
  return null;
}

export function buildCommitmentSummaryFromRaw(
  raw: Record<string, unknown>
): CommitmentSummary {
  const rule = raw.rule as Record<string, unknown> | undefined;
  const warranty = raw.warranty as Record<string, unknown> | undefined;
  const section = raw.section as Record<string, unknown> | undefined;
  const mandatory_unit = raw.mandatory_unit as
    | Array<Record<string, unknown>>
    | undefined;

  let sectionLabel = '';
  if (section) {
    const childrenRaw = section.children;
    const st = typeof section.title === 'string' ? section.title : '';
    if (childrenRaw != null && typeof childrenRaw === 'object') {
      if (Array.isArray(childrenRaw) && childrenRaw.length > 0) {
        const ch = childrenRaw[0] as Record<string, unknown>;
        const ct = typeof ch.title === 'string' ? ch.title : '';
        sectionLabel = st && ct ? `${st} / ${ct}` : st || ct;
      } else if (!Array.isArray(childrenRaw)) {
        const ch = childrenRaw as Record<string, unknown>;
        const ct = typeof ch.title === 'string' ? ch.title : '';
        sectionLabel = st && ct ? `${st} / ${ct}` : st || ct;
      }
    } else {
      sectionLabel = st;
    }
  }

  const unitsList = Array.isArray(mandatory_unit)
    ? mandatory_unit.map((u) => String(u.title ?? '').trim()).filter(Boolean)
    : [];

  const ruleCode =
    rule && typeof rule.code === 'string' ? rule.code.trim() : '';
  const ruleText =
    rule && typeof rule.rule === 'string' ? rule.rule.trim() : '';

  const warrantyTitle =
    warranty && typeof warranty.title === 'string'
      ? warranty.title.trim()
      : '';

  const titleStr =
    typeof raw.title === 'string' ? raw.title.trim() : '';

  const refId = raw.reference_id;
  const refNum = Number(refId);
  const hasParentRef =
    refId != null && refId !== '' && Number.isFinite(refNum) && refNum > 0;

  return {
    titleStr,
    warrantyTitle,
    sectionLabel,
    ruleCode,
    ruleText,
    unitsList,
    hasParentRef,
    parentRefDisplay: hasParentRef ? String(refNum) : '',
  };
}

export function buildCommitmentSummary(
  row: Record<string, unknown> | null | undefined
): CommitmentSummary | null {
  const raw = resolveTaskRecord(row);
  if (!raw) return null;
  return buildCommitmentSummaryFromRaw(raw);
}

export function buildCommitmentSummaryForDoingTaskPage(
  row: Record<string, unknown> | null | undefined
): CommitmentSummary | null {
  const raw = resolveTaskRecordForDoingTaskPage(row);
  if (!raw) return null;
  return buildCommitmentSummaryFromRaw(raw);
}

/** حوزه/استاندارد از آبجکت تسک (لیست عملیات)، وقتی در پاسخ progress/detail نیست */
export function extractDomainLabelFromTask(
  raw: Record<string, unknown>
): string {
  const std = raw.standard;
  if (std != null && typeof std === 'object' && !Array.isArray(std)) {
    const o = std as Record<string, unknown>;
    const t = o.title ?? o.name;
    if (typeof t === 'string' && t.trim()) return t.trim();
  }
  const st = raw.standard_title;
  if (typeof st === 'string' && st.trim()) return st.trim();
  return '';
}

/** بخش و حوزه از ردیف لیست عملیات — قبل از رفتن به صفحهٔ doing-task */
export function extractDoingTaskNavLabelsFromRow(
  row: Record<string, unknown> | null | undefined
): { sectionLabel: string | null; domainLabel: string | null } {
  if (!row || typeof row !== 'object') {
    return { sectionLabel: null, domainLabel: null };
  }
  const raw = resolveTaskRecordForDoingTaskPage(row);
  if (!raw) return { sectionLabel: null, domainLabel: null };
  const summary = buildCommitmentSummaryFromRaw(raw);
  const sec = summary.sectionLabel.trim();
  const domain = extractDomainLabelFromTask(raw);
  return {
    sectionLabel: sec || null,
    domainLabel: domain || null,
  };
}
