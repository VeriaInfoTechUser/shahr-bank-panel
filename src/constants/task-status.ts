/**
 * Task Status — synced with backend TaskStatus enum.
 *
 * Backend enum:
 *   OPEN = 'open'
 *   IN_PROGRESS = 'in_progress'
 *   PENDING_REVIEW = 'pending_review'
 *   APPROVED = 'approved'
 *   REJECTED = 'rejected'
 *   DONE = 'done'
 *   CANCELLED = 'cancelled'
 */

// ---------------------------------------------------------------------------
// 1. Raw enum values (as const for literal type inference)
// ---------------------------------------------------------------------------

export const TaskStatus = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  PENDING_REVIEW: 'pending_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  DONE: 'done',
  CANCELLED: 'cancelled',
} as const;

export type TaskStatusType = (typeof TaskStatus)[keyof typeof TaskStatus];

// ---------------------------------------------------------------------------
// 2. Per-status info shape
// ---------------------------------------------------------------------------

export interface TaskStatusInfo {
  key: TaskStatusType;
  label: string;
  hex: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  badgeClass: string;
  severity: 'info' | 'warning' | 'success' | 'danger' | 'secondary' | 'contrast';
  description: string;
}

// ---------------------------------------------------------------------------
// 3. Metadata map — one entry per status
// ---------------------------------------------------------------------------

export const TaskStatusMetadata: Record<TaskStatusType, TaskStatusInfo> = {
  [TaskStatus.OPEN]: {
    key: 'open',
    label: 'task.status.open',
    hex: '#6366f1',
    bgClass: 'bg-indigo-50 dark:bg-indigo-950/40',
    textClass: 'text-indigo-800 dark:text-indigo-100',
    borderClass: 'border-indigo-300 dark:border-indigo-500/50',
    badgeClass:
      'inline-flex items-center justify-center rounded-md px-2 py-0.5 text-[10px] font-semibold leading-snug shadow-sm border bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-100 dark:border-indigo-500/40',
    severity: 'info',
    description: 'task.status.open.desc',
  },

  [TaskStatus.IN_PROGRESS]: {
    key: 'in_progress',
    label: 'task.status.in_progress',
    hex: '#8b5cf6',
    bgClass: 'bg-violet-50 dark:bg-violet-950/40',
    textClass: 'text-violet-800 dark:text-violet-100',
    borderClass: 'border-violet-300 dark:border-violet-500/50',
    badgeClass:
      'inline-flex items-center justify-center rounded-md px-2 py-0.5 text-[10px] font-semibold leading-snug shadow-sm border bg-violet-50 text-violet-800 border-violet-200 dark:bg-violet-950/40 dark:text-violet-100 dark:border-violet-500/40',
    severity: 'warning',
    description: 'task.status.in_progress.desc',
  },

  [TaskStatus.PENDING_REVIEW]: {
    key: 'pending_review',
    label: 'task.status.pending_review',
    hex: '#f59e0b',
    bgClass: 'bg-amber-50 dark:bg-amber-950/40',
    textClass: 'text-amber-800 dark:text-amber-100',
    borderClass: 'border-amber-300 dark:border-amber-500/50',
    badgeClass:
      'inline-flex items-center justify-center rounded-md px-2 py-0.5 text-[10px] font-semibold leading-snug shadow-sm border bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-100 dark:border-amber-500/40',
    severity: 'warning',
    description: 'task.status.pending_review.desc',
  },

  [TaskStatus.APPROVED]: {
    key: 'approved',
    label: 'task.status.approved',
    hex: '#10b981',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
    textClass: 'text-emerald-800 dark:text-emerald-100',
    borderClass: 'border-emerald-300 dark:border-emerald-500/50',
    badgeClass:
      'inline-flex items-center justify-center rounded-md px-2 py-0.5 text-[10px] font-semibold leading-snug shadow-sm border bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-100 dark:border-emerald-500/40',
    severity: 'success',
    description: 'task.status.approved.desc',
  },

  [TaskStatus.REJECTED]: {
    key: 'rejected',
    label: 'task.status.rejected',
    hex: '#ef4444',
    bgClass: 'bg-red-50 dark:bg-red-950/40',
    textClass: 'text-red-800 dark:text-red-100',
    borderClass: 'border-red-300 dark:border-red-500/50',
    badgeClass:
      'inline-flex items-center justify-center rounded-md px-2 py-0.5 text-[10px] font-semibold leading-snug shadow-sm border bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-100 dark:border-red-500/40',
    severity: 'danger',
    description: 'task.status.rejected.desc',
  },

  [TaskStatus.DONE]: {
    key: 'done',
    label: 'task.status.done',
    hex: '#0ea5e9',
    bgClass: 'bg-sky-50 dark:bg-sky-950/40',
    textClass: 'text-sky-800 dark:text-sky-100',
    borderClass: 'border-sky-300 dark:border-sky-500/50',
    badgeClass:
      'inline-flex items-center justify-center rounded-md px-2 py-0.5 text-[10px] font-semibold leading-snug shadow-sm border bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-100 dark:border-sky-500/40',
    severity: 'contrast',
    description: 'task.status.done.desc',
  },

  [TaskStatus.CANCELLED]: {
    key: 'cancelled',
    label: 'task.status.cancelled',
    hex: '#64748b',
    bgClass: 'bg-slate-100 dark:bg-slate-800/60',
    textClass: 'text-slate-700 dark:text-slate-200',
    borderClass: 'border-slate-300 dark:border-slate-500/50',
    badgeClass:
      'inline-flex items-center justify-center rounded-md px-2 py-0.5 text-[10px] font-semibold leading-snug shadow-sm border bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:text-slate-200 dark:border-slate-500/40',
    severity: 'secondary',
    description: 'task.status.cancelled.desc',
  },
} as const;

// ---------------------------------------------------------------------------
// 4. Ordered list (for iteration / table columns)
// ---------------------------------------------------------------------------

export const TASK_STATUS_LIST: readonly TaskStatusType[] = [
  TaskStatus.OPEN,
  TaskStatus.IN_PROGRESS,
  TaskStatus.PENDING_REVIEW,
  TaskStatus.APPROVED,
  TaskStatus.REJECTED,
  TaskStatus.DONE,
  TaskStatus.CANCELLED,
] as const;

// ---------------------------------------------------------------------------
// 5. Composable
// ---------------------------------------------------------------------------

const FALLBACK: TaskStatusInfo = {
  key: 'open',
  label: 'task.status.unknown',
  hex: '#94a3b8',
  bgClass: 'bg-slate-100 dark:bg-slate-800/60',
  textClass: 'text-slate-600 dark:text-slate-300',
  borderClass: 'border-slate-300 dark:border-slate-500/50',
  badgeClass:
    'inline-flex items-center justify-center rounded-md px-2 py-0.5 text-[10px] font-semibold leading-snug shadow-sm border bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-500/40',
  severity: 'secondary',
  description: '',
};

export function useTaskStatus() {
  /** Full info object for a status key (falls back to a neutral style). */
  function getStatusInfo(status: string): TaskStatusInfo {
    return (TaskStatusMetadata as Record<string, TaskStatusInfo>)[status] ?? FALLBACK;
  }

  /** i18n label key — call `t()` on the result. */
  function getStatusLabel(status: string): string {
    return getStatusInfo(status).label;
  }

  /** Hex colour string. */
  function getStatusColor(status: string): string {
    return getStatusInfo(status).hex;
  }

  /** Full Tailwind badge class string (ready for a `<span>`). */
  function getBadgeClass(status: string): string {
    return getStatusInfo(status).badgeClass;
  }

  /**
   * Flat options array for <Select> / <BaseSelect>.
   * Pass `t` (vue-i18n `useI18n().t`) to translate labels.
   */
  function statusOptions(t: (key: string) => string) {
    return TASK_STATUS_LIST.map((s) => ({
      value: s,
      label: t(TaskStatusMetadata[s].label),
    }));
  }

  return {
    TaskStatus,
    TaskStatusMetadata,
    TASK_STATUS_LIST,
    statusOptions,
    getStatusInfo,
    getStatusLabel,
    getStatusColor,
    getBadgeClass,
  };
}
