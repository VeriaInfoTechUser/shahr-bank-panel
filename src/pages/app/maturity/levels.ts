/**
 * Maturity levels (1–5) — colors match `DEFAULT_MATURITY_LEVELS` in the backend
 * (see docs/maturity-module.md) and stay constant across light/dark themes.
 */
export const MATURITY_LEVEL_COLORS: Record<number, string> = {
  1: '#ef4444', // Initial  — red
  2: '#f97316', // Managed  — orange
  3: '#eab308', // Defined  — yellow
  4: '#22c55e', // Measured — green
  5: '#16a34a', // Optimized— dark green
};

/** Level of the average score (used by KPIs) — round-half-up to 1..5. */
export function levelOfScore(score: number): number {
  return Math.max(1, Math.min(5, Math.round(score / 20)));
}

export function levelColor(level: number): string {
  return MATURITY_LEVEL_COLORS[level] ?? '#94a3b8';
}

/** i18n key for a level label (1–5) or the not-assessed fallback. */
export function levelLabelKey(level: number): string {
  if (level >= 1 && level <= 5) return `maturity.level-${level}`;
  return 'maturity.not-assessed';
}
