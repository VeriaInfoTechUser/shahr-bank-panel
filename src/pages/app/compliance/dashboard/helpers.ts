import { theme } from "@/config/theme"
import type { ComplianceAnswer, TaskState } from "./types"
import {
  toFa,
  toPct,
  toJalali,
  daysUntil,
  personLabel,
} from "@/components/dashboard/helpers"

/** ابزارهای عمومی از کامپوننت‌های مشترک داشبورد */
export { toFa, toPct, toJalali, daysUntil, personLabel }

export const answerLabels: Record<ComplianceAnswer, string> = {
  not_started: "شروع‌نشده",
  compliant: "منطبق",
  partially_compliant: "نسبتاً منطبق",
  non_compliant: "نامنطبق",
}

export const stateLabels: Record<TaskState, string> = {
  todo: "در صف",
  in_progress: "در حال انجام",
  done: "انجام‌شده",
  approved: "تأییدشده",
  rejected: "ردشده",
}

/** رنگ متناظر هر پاسخ تطبیق — از تم مرکزی (src/config/theme.ts) */
export const answerColors: Record<ComplianceAnswer, string> = {
  compliant: theme.status.low,
  partially_compliant: theme.status.medium,
  non_compliant: theme.status.critical,
  not_started: theme.status.draft,
}

/** رنگ متناظر هر وضعیت کاری — از تم مرکزی */
export const stateColors: Record<TaskState, string> = {
  todo: theme.status.draft,
  in_progress: theme.status.registered,
  done: theme.status.monitoring,
  approved: theme.status.low,
  rejected: theme.status.critical,
}

/** ترتیب نمایش پاسخ‌ها (از بهترین تا بدترین) */
export const answerOrder: ComplianceAnswer[] = [
  "compliant",
  "partially_compliant",
  "non_compliant",
  "not_started",
]

/** ترتیب نمایش وضعیت‌ها */
export const stateOrder: TaskState[] = ["todo", "in_progress", "done", "approved", "rejected"]
