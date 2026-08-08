import { theme } from "@/config/theme"
import type { RiskLevel, RiskState, RiskType } from "./types"

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

/** تبدیل HEX به سه‌تایی RGB (برای ساخت rgba با شفافیت) */
export function hexToRgb(hex: string): [number, number, number] {
  const m = hex.replace("#", "")
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m
  const n = parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** ساخت رشته rgba از رنگ تم با شفافیت دلخواه */
export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const faNum = new Intl.NumberFormat("fa-IR")

/** تبدیل عدد به ارقام فارسی */
export function toFa(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—"
  return faNum.format(n)
}

/** تبدیل تاریخ میلادی ISO به نمایش شمسی */
export function toJalali(iso: string | null): string {
  if (!iso) return "—"
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(iso))
  } catch {
    return "—"
  }
}

/** تعداد روز مانده تا مهلت (منفی یعنی گذشته) */
export function daysUntil(iso: string | null): number | null {
  if (!iso) return null
  const diff = new Date(iso).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/** نمایش مالک بر اساس شناسه */
export function ownerLabel(ownerId: string | null, memberNames?: Map<string, string>): string {
  if (!ownerId) return "بدون مالک"
  if (memberNames?.has(ownerId)) return memberNames.get(ownerId)!
  return `کارشناس ${toFa(Number(ownerId))}`
}
