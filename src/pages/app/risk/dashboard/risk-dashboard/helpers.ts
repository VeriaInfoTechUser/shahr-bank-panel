import { theme } from "@/config/theme"
import type { RiskLevel, RiskState, RiskType } from "./types"
import {
  personLabel,
  toFa,
  toJalali,
  daysUntil,
  hexToRgb,
  withAlpha,
} from "@/components/dashboard/helpers"

/** ابزارهای عمومی از کامپوننت‌های مشترک داشبورد */
export { toFa, toJalali, daysUntil, hexToRgb, withAlpha }

export const levelLabels: Record<RiskLevel, string> = {
  critical: "بحرانی",
  high: "بالا",
  medium: "متوسط",
  low: "پایین",
}

export const stateLabels: Record<RiskState, string> = {
  draft: "پیش‌نویس",
  registered: "ثبت‌شده",
  analysis: "تحلیل",
  response: "پاسخ",
  monitoring: "پایش",
  closed: "بسته‌شده",
  archived: "بایگانی",
}

export const typeLabels: Record<RiskType, string> = {
  threat: "تهدید",
  opportunity: "فرصت",
}

/** رنگ متناظر هر سطح ریسک — از تم مرکزی (src/config/theme.ts) */
export const levelColors: Record<RiskLevel, string> = {
  critical: theme.status.critical,
  high: theme.status.high,
  medium: theme.status.medium,
  low: theme.status.low,
}

/** رنگ متناظر هر وضعیت چرخه عمر — از تم مرکزی */
export const stateColors: Record<RiskState, string> = {
  draft: theme.status.draft,
  registered: theme.status.registered,
  analysis: theme.status.analysis,
  response: theme.status.response,
  monitoring: theme.status.monitoring,
  closed: theme.status.closed,
  archived: theme.status.archived,
}

/** رنگ متناظر ماهیت ریسک — از تم مرکزی */
export const typeColors: Record<RiskType, string> = {
  threat: theme.status.threat,
  opportunity: theme.status.opportunity,
}

/** نمایش مالک بر اساس شناسه */
export function ownerLabel(ownerId: string | null, memberNames?: Map<string, string>): string {
  return personLabel(ownerId, memberNames, "بدون مالک")
}
