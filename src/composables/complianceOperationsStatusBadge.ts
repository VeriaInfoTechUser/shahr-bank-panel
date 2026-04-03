/**
 * Badge styles — عملیات تطبیق (همان چارچوب ریسک: نوار رنگی سمت راست).
 */
export function complianceOperationsStatusBadgeClass(statusKey: string): string {
  const base = [
    'inline-flex min-h-[1.4rem] w-[6rem] shrink-0 items-center justify-center',
    'break-words rounded-md border border-y border-l pl-1.5 pr-2 py-0.5 text-[9px] font-semibold leading-snug tracking-wide',
    'border-r-[3px] text-center shadow-sm',
    'cursor-default select-none',
    'transition-[box-shadow,background-color,border-color,color]',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
    'focus-visible:ring-offset-white dark:focus-visible:ring-offset-darkmode-800',
  ].join(' ');

  const map: Record<string, string> = {
    clauses:
      'border-r-indigo-600 border-indigo-200/80 bg-indigo-50/95 text-indigo-950 focus-visible:ring-indigo-400/45 dark:border-indigo-500/45 dark:bg-indigo-950/40 dark:text-indigo-100',
    'pending-assignment':
      'border-r-yellow-500 border-yellow-300/85 bg-amber-50/95 text-yellow-950 focus-visible:ring-yellow-400/50 dark:border-yellow-500/40 dark:bg-yellow-950/40 dark:text-yellow-100',
    todo:
      'border-r-amber-500 border-amber-200/85 bg-amber-50/95 text-amber-950 focus-visible:ring-amber-400/50 dark:border-amber-500/40 dark:bg-amber-950/45 dark:text-amber-100',
    doing:
      'border-r-cyan-600 border-cyan-200/85 bg-cyan-50/95 text-cyan-950 focus-visible:ring-cyan-400/50 dark:border-cyan-500/40 dark:bg-cyan-950/45 dark:text-cyan-100',
    done:
      'border-r-blue-600 border-blue-200/85 bg-sky-50/95 text-blue-950 focus-visible:ring-blue-400/50 dark:border-blue-500/40 dark:bg-blue-950/45 dark:text-blue-100',
    approve:
      'border-r-green-600 border-green-300/80 bg-green-50/95 text-green-950 focus-visible:ring-green-500/55 dark:border-green-500 dark:bg-green-950/45 dark:text-green-50',
    reject:
      'border-r-rose-600 border-rose-200/85 bg-rose-50/95 text-rose-950 focus-visible:ring-rose-400/50 dark:border-rose-500/45 dark:bg-rose-950/40 dark:text-rose-100',
    unknown:
      'border-r-slate-500 border-slate-200/90 bg-slate-100/95 text-slate-800 focus-visible:ring-slate-400/40 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100',
  };

  return `${base} ${map[statusKey] ?? map.unknown}`;
}

const REPORT_CARD_COLOR: Record<string, string> = {
  clauses:
    'border-r-indigo-600 border-indigo-200/80 bg-indigo-50/95 text-indigo-950 dark:border-indigo-500/45 dark:bg-indigo-950/40 dark:text-indigo-100',
  'pending-assignment':
    'border-r-yellow-500 border-yellow-300/85 bg-amber-50/95 text-yellow-950 dark:border-yellow-500/40 dark:bg-yellow-950/40 dark:text-yellow-100',
  todo:
    'border-r-amber-500 border-amber-200/85 bg-amber-50/95 text-amber-950 dark:border-amber-500/40 dark:bg-amber-950/45 dark:text-amber-100',
  doing:
    'border-r-cyan-600 border-cyan-200/85 bg-cyan-50/95 text-cyan-950 dark:border-cyan-500/40 dark:bg-cyan-950/45 dark:text-cyan-100',
  done:
    'border-r-blue-600 border-blue-200/85 bg-sky-50/95 text-blue-950 dark:border-blue-500/40 dark:bg-blue-950/45 dark:text-blue-100',
  approve:
    'border-r-green-600 border-green-300/80 bg-green-50/95 text-green-950 dark:border-green-500 dark:bg-green-950/45 dark:text-green-50',
  reject:
    'border-r-rose-600 border-rose-200/85 bg-rose-50/95 text-rose-950 dark:border-rose-500/45 dark:bg-rose-950/40 dark:text-rose-100',
  unknown:
    'border-r-slate-500 border-slate-200/90 bg-slate-100/95 text-slate-800 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100',
};

/**
 * کارت عددی خلاصهٔ گزارش — همان نوار رنگی و پالت badge (border-r مثل لیست تعهدات).
 */
export function complianceOperationsStatusReportCardClass(statusKey: string): string {
  const base = [
    'min-w-0 rounded-lg border border-y border-l border-r-[4px] px-3 py-2.5 shadow-sm',
    'transition-[box-shadow,background-color,border-color,color]',
  ].join(' ');
  return `${base} ${REPORT_CARD_COLOR[statusKey] ?? REPORT_CARD_COLOR.unknown}`;
}
