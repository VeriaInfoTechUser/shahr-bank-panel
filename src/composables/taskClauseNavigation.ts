/** شناسهٔ تسک برای ردیف‌های عملیات / لیست تعهدات (فیلتر زیرمجموعهٔ تبصره). */
export function resolveOperationsTaskRowId(row: Record<string, unknown>): number | null {
  const task = row.task as Record<string, unknown> | undefined;
  const candidates = [row.id, row.task_id, task?.id];
  for (const c of candidates) {
    if (c == null || c === '') continue;
    const n = typeof c === 'number' ? c : Number(c);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

function buildClauseQueryFromRow(row: Record<string, unknown>, taskId: number) {
  const task = row.task as Record<string, unknown> | undefined;
  const titleFromTask =
    task && typeof task.title === 'string' ? task.title.trim() : '';
  const titleFromRow =
    typeof row.title === 'string' ? row.title.trim() : '';
  const titleStr = (titleFromTask || titleFromRow).slice(0, 500);
  const query: Record<string, string> = { reference_id: String(taskId) };
  if (titleStr) query.ref_title = titleStr;
  return query;
}

/** مسیر صفحهٔ تعهدات (اطلاعات پایه) با `reference_id` = همان تسک. */
export function clauseFilteredTasksRoute(row: Record<string, unknown>) {
  const taskId = resolveOperationsTaskRowId(row);
  if (taskId == null) {
    return { name: 'app-base-info-tasks' as const, query: {} as Record<string, string> };
  }
  return {
    name: 'app-base-info-tasks' as const,
    query: buildClauseQueryFromRow(row, taskId),
  };
}

/** همان صفحهٔ عملیات تطبیق با فیلتر `reference_id` روی لیست compliance. */
export function clauseFilteredComplianceOperationsRoute(row: Record<string, unknown>) {
  const taskId = resolveOperationsTaskRowId(row);
  if (taskId == null) {
    return { name: 'app-compliance-operations' as const, query: {} as Record<string, string> };
  }
  return {
    name: 'app-compliance-operations' as const,
    query: buildClauseQueryFromRow(row, taskId),
  };
}

/** همان صفحهٔ عملیات ریسک با فیلتر `reference_id`. */
export function clauseFilteredRiskOperationsRoute(row: Record<string, unknown>) {
  const taskId = resolveOperationsTaskRowId(row);
  if (taskId == null) {
    return { name: 'app-risk-operations' as const, query: {} as Record<string, string> };
  }
  return {
    name: 'app-risk-operations' as const,
    query: buildClauseQueryFromRow(row, taskId),
  };
}
