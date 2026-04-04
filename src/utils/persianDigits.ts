/** ارقام فارسی (ایران) — U+06F0 … U+06F9 */
const PERSIAN = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

/**
 * تبدیل ارقام لاتین (۰۹۸۷۶۵۴۳۲۱) به فارسی در یک رشته.
 * فقط کاراکترهای [0-9] جایگزین می‌شوند؛ جداکننده‌ها و علائم دست‌نخورده می‌مانند.
 */
export function toPersianDigits(
  input: string | number | null | undefined
): string {
  if (input == null || input === '') return '';
  return String(input).replace(/[0-9]/g, (ch) => {
    const d = ch.charCodeAt(0) - 48;
    return d >= 0 && d <= 9 ? PERSIAN[d]! : ch;
  });
}

export function isPersianDigitLocale(locale: string): boolean {
  return String(locale).toLowerCase().startsWith('fa');
}
