/** ابزارهای مشترک همه داشبوردها — شماره/تاریخ/رنگ/نام شخص */

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
export function personLabel(
  id: string | null | undefined,
  memberNames?: Map<string, string>,
  fallback = "نامشخص",
): string {
  if (!id) return fallback
  if (memberNames?.has(id)) return memberNames.get(id)!
  return `کارشناس ${toFa(Number(id))}`
}
