/**
 * Badge styles — عملیات ریسک (نوار رنگی سمت راست).
 */
export function riskOperationsStatusBadgeClass(statusKey: string): string {
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
      'border-r-fuchsia-600 border-fuchsia-200/80 bg-fuchsia-50/95 text-fuchsia-950 focus-visible:ring-fuchsia-400/45 dark:border-fuchsia-500/45 dark:bg-fuchsia-950/40 dark:text-fuchsia-100',
    'pending-assignment':
      'border-r-stone-500 border-stone-200/90 bg-stone-100/90 text-stone-900 focus-visible:ring-stone-400/40 dark:border-stone-500 dark:bg-stone-900/50 dark:text-stone-100',
    todo:
      'border-r-orange-500 border-orange-200/85 bg-orange-50/95 text-orange-950 focus-visible:ring-orange-400/50 dark:border-orange-500/40 dark:bg-orange-950/45 dark:text-orange-100',
    doing:
      'border-r-violet-600 border-violet-200/85 bg-violet-50/95 text-violet-950 focus-visible:ring-violet-400/50 dark:border-violet-500/40 dark:bg-violet-950/45 dark:text-violet-100',
    done:
      'border-r-sky-600 border-sky-200/85 bg-sky-50/95 text-sky-950 focus-visible:ring-sky-400/50 dark:border-sky-500/40 dark:bg-sky-950/45 dark:text-sky-100',
    approve:
      'border-r-emerald-600 border-emerald-300/80 bg-emerald-50/95 text-emerald-950 focus-visible:ring-emerald-500/55 dark:border-emerald-500 dark:bg-emerald-950/45 dark:text-emerald-50',
    reject:
      'border-r-red-600 border-red-200/85 bg-red-50/95 text-red-950 focus-visible:ring-red-400/50 dark:border-red-500/45 dark:bg-red-950/40 dark:text-red-100',
    unknown:
      'border-r-slate-500 border-slate-200/90 bg-slate-100/95 text-slate-800 focus-visible:ring-slate-400/40 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100',
  };

  return `${base} ${map[statusKey] ?? map.unknown}`;
}

const REPORT_CARD_COLOR: Record<string, string> = {
  clauses:
    'border-r-fuchsia-600 border-fuchsia-200/80 bg-fuchsia-50/95 text-fuchsia-950 dark:border-fuchsia-500/45 dark:bg-fuchsia-950/40 dark:text-fuchsia-100',
  'pending-assignment':
    'border-r-stone-500 border-stone-200/90 bg-stone-100/90 text-stone-900 dark:border-stone-500 dark:bg-stone-900/50 dark:text-stone-100',
  todo:
    'border-r-orange-500 border-orange-200/85 bg-orange-50/95 text-orange-950 dark:border-orange-500/40 dark:bg-orange-950/45 dark:text-orange-100',
  doing:
    'border-r-violet-600 border-violet-200/85 bg-violet-50/95 text-violet-950 dark:border-violet-500/40 dark:bg-violet-950/45 dark:text-violet-100',
  done:
    'border-r-sky-600 border-sky-200/85 bg-sky-50/95 text-sky-950 dark:border-sky-500/40 dark:bg-sky-950/45 dark:text-sky-100',
  approve:
    'border-r-emerald-600 border-emerald-300/80 bg-emerald-50/95 text-emerald-950 dark:border-emerald-500 dark:bg-emerald-950/45 dark:text-emerald-50',
  reject:
    'border-r-red-600 border-red-200/85 bg-red-50/95 text-red-950 dark:border-red-500/45 dark:bg-red-950/40 dark:text-red-100',
  unknown:
    'border-r-slate-500 border-slate-200/90 bg-slate-100/95 text-slate-800 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100',
};

/** کارت عددی خلاصهٔ گزارش — همان پالت badge عملیات ریسک */
export function riskOperationsStatusReportCardClass(statusKey: string): string {
  const base = [
    'min-w-0 rounded-lg border border-y border-l border-r-[4px] px-3 py-2.5 shadow-sm',
    'transition-[box-shadow,background-color,border-color,color]',
  ].join(' ');
  return `${base} ${REPORT_CARD_COLOR[statusKey] ?? REPORT_CARD_COLOR.unknown}`;
}
