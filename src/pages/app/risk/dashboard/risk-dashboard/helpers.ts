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

/** رنگ متناظر هر سطح ریسک */
export const levelColors: Record<RiskLevel, string> = {
  critical: "#f43f5e",
  high: "#fb923c",
  medium: "#facc15",
  low: "#34d399",
}

export const stateColors: Record<RiskState, string> = {
  draft: "#94a3b8",
  registered: "#60a5fa",
  analysis: "#a78bfa",
  response: "#22d3ee",
  monitoring: "#2dd4bf",
  closed: "#34d399",
  archived: "#64748b",
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
export function ownerLabel(ownerId: string | null): string {
  if (!ownerId) return "بدون مالک"
  return `کارشناس ${toFa(Number(ownerId))}`
}
