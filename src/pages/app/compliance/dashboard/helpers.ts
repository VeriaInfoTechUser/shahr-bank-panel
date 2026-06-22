import type { ComplianceAnswer, TaskState } from "./types"

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

/** رنگ متناظر هر پاسخ تطبیق */
export const answerColors: Record<ComplianceAnswer, string> = {
  compliant: "#34d399",
  partially_compliant: "#facc15",
  non_compliant: "#f43f5e",
  not_started: "#94a3b8",
}

/** رنگ متناظر هر وضعیت کاری */
export const stateColors: Record<TaskState, string> = {
  todo: "#94a3b8",
  in_progress: "#60a5fa",
  done: "#2dd4bf",
  approved: "#34d399",
  rejected: "#f43f5e",
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

const faNum = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 1 })

/** تبدیل عدد به ارقام فارسی */
export function toFa(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—"
  return faNum.format(n)
}

/** نمایش درصد با علامت ٪ */
export function toPct(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—"
  return `${faNum.format(Math.round(n * 10) / 10)}٪`
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

/** نمایش شخص (مالک/مسئول) بر اساس شناسه */
export function personLabel(id: string | null | undefined, memberNames?: Map<string, string>): string {
  if (!id) return "نامشخص"
  if (memberNames?.has(id)) return memberNames.get(id)!
  return `کارشناس ${toFa(Number(id))}`
}
