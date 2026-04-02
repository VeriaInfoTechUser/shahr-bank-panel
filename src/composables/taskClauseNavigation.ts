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

/** مسیر صفحهٔ تعهدات با `reference_id` = همان تسک (لیست فیلترشده). */
export function clauseFilteredTasksRoute(row: Record<string, unknown>) {
  const taskId = resolveOperationsTaskRowId(row);
  if (taskId == null) {
    return { name: 'app-base-info-tasks' as const, query: {} as Record<string, string> };
  }
  const task = row.task as Record<string, unknown> | undefined;
  const titleFromTask =
    task && typeof task.title === 'string' ? task.title.trim() : '';
  const titleFromRow =
    typeof row.title === 'string' ? row.title.trim() : '';
  const titleStr = (titleFromTask || titleFromRow).slice(0, 500);
  const query: Record<string, string> = { reference_id: String(taskId) };
  if (titleStr) query.ref_title = titleStr;
  return { name: 'app-base-info-tasks' as const, query };
}
