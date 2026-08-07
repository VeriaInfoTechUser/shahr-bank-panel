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
 *
 * Colours are sourced from `src/config/theme.ts` (status palette) and badge
 * classes use the semantic `status-*` Tailwind tokens — changing the theme
 * updates every badge application-wide.
 */
import { theme } from '@/config/theme';

/** Badge class built from the central `status-*` tokens (alpha tint on any bg). */
const badgeFor = (key: string) =>
  `inline-flex items-center justify-center rounded-md px-2 py-0.5 text-[10px] font-semibold leading-snug shadow-sm border bg-status-${key}/10 text-status-${key} border-status-${key}/40`;

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
    hex: theme.status.open,
    bgClass: 'bg-status-open/10 text-status-open',
    textClass: 'text-status-open',
    borderClass: 'border-status-open/40',
    badgeClass: badgeFor('open'),
    severity: 'info',
    description: 'task.status.open.desc',
  },

  [TaskStatus.IN_PROGRESS]: {
    key: 'in_progress',
    label: 'task.status.in_progress',
    hex: theme.status['in-progress'],
    bgClass: 'bg-status-in-progress/10 text-status-in-progress',
    textClass: 'text-status-in-progress',
    borderClass: 'border-status-in-progress/40',
    badgeClass: badgeFor('in-progress'),
    severity: 'warning',
    description: 'task.status.in_progress.desc',
  },

  [TaskStatus.PENDING_REVIEW]: {
    key: 'pending_review',
    label: 'task.status.pending_review',
    hex: theme.status.pending,
    bgClass: 'bg-status-pending/10 text-status-pending',
    textClass: 'text-status-pending',
    borderClass: 'border-status-pending/40',
    badgeClass: badgeFor('pending'),
    severity: 'warning',
    description: 'task.status.pending_review.desc',
  },

  [TaskStatus.APPROVED]: {
    key: 'approved',
    label: 'task.status.approved',
    hex: theme.status.approved,
    bgClass: 'bg-status-approved/10 text-status-approved',
    textClass: 'text-status-approved',
    borderClass: 'border-status-approved/40',
    badgeClass: badgeFor('approved'),
    severity: 'success',
    description: 'task.status.approved.desc',
  },

  [TaskStatus.REJECTED]: {
    key: 'rejected',
    label: 'task.status.rejected',
    hex: theme.status.rejected,
    bgClass: 'bg-status-rejected/10 text-status-rejected',
    textClass: 'text-status-rejected',
    borderClass: 'border-status-rejected/40',
    badgeClass: badgeFor('rejected'),
    severity: 'danger',
    description: 'task.status.rejected.desc',
  },

  [TaskStatus.DONE]: {
    key: 'done',
    label: 'task.status.done',
    hex: theme.status.done,
    bgClass: 'bg-status-done/10 text-status-done',
    textClass: 'text-status-done',
    borderClass: 'border-status-done/40',
    badgeClass: badgeFor('done'),
    severity: 'contrast',
    description: 'task.status.done.desc',
  },

  [TaskStatus.CANCELLED]: {
    key: 'cancelled',
    label: 'task.status.cancelled',
    hex: theme.status.cancelled,
    bgClass: 'bg-status-cancelled/10 text-status-cancelled',
    textClass: 'text-status-cancelled',
    borderClass: 'border-status-cancelled/40',
    badgeClass: badgeFor('cancelled'),
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
  hex: theme.status.cancelled,
  bgClass: 'bg-status-cancelled/10 text-status-cancelled',
  textClass: 'text-status-cancelled',
  borderClass: 'border-status-cancelled/40',
  badgeClass: badgeFor('cancelled'),
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
