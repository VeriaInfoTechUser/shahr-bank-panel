/**
 * ============================================================================
 * CENTRAL THEME CONFIGURATION — single source of truth for the admin panel's
 * visual identity.
 *
 * Everything visual that is shared across the application is defined here:
 *   - Semantic colors (light + dark)
 *   - Status / data-viz palette
 *   - Typography (family, sizes, weights, line heights, letter spacing)
 *   - Border radius scale
 *   - Spacing scale
 *   - Shadow scale
 *   - Common component dimensions
 *
 * Consumption:
 *   - `tailwind.config.js` imports this file (via jiti) and generates every
 *     CSS custom property (`--color-*`, `--radius-*`, `--shadow-*`, ...) plus
 *     the semantic Tailwind utilities (`bg-primary`, `text-text-primary`,
 *     `border-border`, `bg-surface`, `ring-focus-ring`, ...) from it.
 *   - Components reference the CSS custom properties / Tailwind utilities
 *     instead of raw hex values, so changing a value here propagates
 *     application-wide.
 *
 * To change the global look (e.g. primary color, radius, font, background):
 *   edit the values below — nothing else needs to change.
 * ============================================================================
 */

export interface ThemeScopeColors {
  [key: string]: string;
}

export interface ThemeColors {
  /** Applied on `:root` (light mode is the default). */
  light: ThemeScopeColors;
  /** Applied on the `.dark` class. */
  dark: ThemeScopeColors;
}

export const theme = {
  /**
   * ---------------------------------------------------------------- colors
   * Semantic color tokens. Each key becomes a CSS variable
   * (`--color-<key>`) and a Tailwind color utility (`bg-<key>`,
   * `text-<key>`, `border-<key>`, `ring-<key>`, ...).
   *
   * `primary`          → interactive accent (buttons, links, active nav,
   *                      focus, selected states)
   * `secondary`        → neutral interactive background
   * `success/warning/error/info/pending` → semantic states
   * `*-muted`          → soft tinted backgrounds used behind badges/alerts
   * `background`       → app canvas
   * `surface*`         → cards / elevated panels
   * `border*`          → hairlines and dividers
   * `text*`            → text hierarchy
   * `focus`, `focus-ring` → keyboard focus affordances
   * `overlay`          → modal / popover backdrops
   */
  colors: {
    light: {
      // Primary (teal — brand)
      primary: '#0f766e',
      'primary-hover': '#115e59',
      'primary-active': '#134e4a',
      'primary-foreground': '#ffffff',
      'primary-muted': '#ccfbf1',

      // Secondary
      secondary: '#f1f5f9',
      'secondary-foreground': '#334155',

      // Semantic states
      success: '#16a34a',
      'success-hover': '#15803d',
      'success-foreground': '#ffffff',
      'success-muted': '#f0fdf4',
      warning: '#f59e0b',
      'warning-hover': '#d97706',
      'warning-foreground': '#ffffff',
      'warning-muted': '#fffbeb',
      error: '#dc2626',
      'error-hover': '#b91c1c',
      'error-foreground': '#ffffff',
      'error-muted': '#fef2f2',
      info: '#06b6d4',
      'info-muted': '#ecfeff',
      pending: '#f97316',
      neutral: '#64748b',
      'neutral-muted': '#f1f5f9',

      // Surfaces & canvas
      background: '#f8f9fa',
      surface: '#ffffff',
      'surface-subtle': '#f0f4f2',
      'surface-hover': '#f1f5f9',

      // Borders
      border: '#e2e8f0',
      'border-subtle': '#f1f5f9',
      'border-strong': '#cbd5e1',

      // Text hierarchy
      'text-primary': '#0f172a',
      'text-secondary': '#475569',
      'text-muted': '#94a3b8',
      'text-disabled': '#cbd5e1',

      // Focus & overlays
      focus: '#0f766e',
      'focus-ring': '#0f766e',
      overlay: '#0f172a',

      // Legacy raw tokens (kept for back-compat utilities)
      light: '#f1f5f9',
      dark: '#334155',
    },

    dark: {
      // Primary (lighter teal on dark)
      primary: '#14b8a6',
      'primary-hover': '#2dd4bf',
      'primary-active': '#0d9488',
      'primary-foreground': '#ffffff',
      'primary-muted': '#99f6e4',

      // Secondary
      secondary: '#334155',
      'secondary-foreground': '#e2e8f0',

      // Semantic states
      success: '#22c55e',
      'success-hover': '#16a34a',
      'success-foreground': '#ffffff',
      'success-muted': '#052e16',
      warning: '#fbbf24',
      'warning-hover': '#f59e0b',
      'warning-foreground': '#451a03',
      'warning-muted': '#451a03',
      error: '#f87171',
      'error-hover': '#ef4444',
      'error-foreground': '#ffffff',
      'error-muted': '#450a0a',
      info: '#22d3ee',
      'info-muted': '#083344',
      pending: '#fb923c',
      neutral: '#94a3b8',
      'neutral-muted': '#1e293b',

      // Surfaces & canvas
      background: '#0f172a',
      surface: '#1b253b',
      'surface-subtle': '#232d45',
      'surface-hover': '#28334e',

      // Borders
      border: '#28334e',
      'border-subtle': '#1b253b',
      'border-strong': '#374466',

      // Text hierarchy
      'text-primary': '#f1f5f9',
      'text-secondary': '#cbd5e1',
      'text-muted': '#64748b',
      'text-disabled': '#475569',

      // Focus & overlays
      focus: '#14b8a6',
      'focus-ring': '#14b8a6',
      overlay: '#000000',

      // Legacy raw tokens
      light: '#1e293b',
      dark: '#0f172a',

      // Legacy darkmode step palette (kept for existing `dark:bg-darkmode-*` utilities)
      'darkmode-50': '#576784',
      'darkmode-100': '#4a5a79',
      'darkmode-200': '#415172',
      'darkmode-300': '#354567',
      'darkmode-400': '#303d5d',
      'darkmode-500': '#293552',
      'darkmode-600': '#28334e',
      'darkmode-700': '#232d45',
      'darkmode-800': '#1b253b',
      'darkmode-900': '#0f172a',
    },
  } satisfies ThemeColors,

  /**
   * ---------------------------------------------------------------- status
   * Non-themed status / data-viz colors. These carry *meaning* (risk level,
   * task state) rather than theme, so they stay constant in light & dark.
   */
  status: {
    open: '#6366f1',
    'in-progress': '#8b5cf6',
    pending: '#f59e0b',
    approved: '#10b981',
    rejected: '#ef4444',
    done: '#0ea5e9',
    cancelled: '#64748b',

    // ── Risk levels (سطح ریسک) ──────────────────────────────────────────
    critical: '#f43f5e',
    high: '#fb923c',
    medium: '#facc15',
    low: '#34d399',

    // ── Risk lifecycle states (وضعیت چرخه عمر ریسک) ─────────────────────
    draft: '#94a3b8',
    registered: '#60a5fa',
    analysis: '#a78bfa',
    response: '#22d3ee',
    monitoring: '#2dd4bf',
    closed: '#34d399',
    archived: '#64748b',

    // ── Risk types (ماهیت ریسک) ─────────────────────────────────────────
    threat: '#f43f5e',
    opportunity: '#2dd4bf',
  } as const,

  /**
   * ------------------------------------------------------------ typography
   * Values mirror the current Tailwind defaults so importing them is a visual
   * no-op — edit here to rescale the whole application.
   */
  typography: {
    family: [
      'Vazirmatn Variable',
      'Vazirmatn',
      'system-ui',
      '-apple-system',
      'Segoe UI',
      'Roboto',
      'Helvetica Neue',
      'Arial',
      'sans-serif',
    ] as const,
    sizes: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
    } as const,
    weights: {
      normal: 500,
      medium: 600,
      semibold: 700,
    } as const,
    lineHeights: {
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    } as const,
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    } as const,
  },

  /**
   * ---------------------------------------------------------------- radius
   * Border-radius scale in px (matches current Tailwind defaults).
   */
  radius: {
    none: 0,
    sm: 2,
    DEFAULT: 4,
    md: 6,
    lg: 8,
    xl: 12,
    '2xl': 16,
    '3xl': 24,
    full: 9999,
  } as const,

  /**
   * --------------------------------------------------------------- spacing
   * Semantic spacing scale in px.
   */
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    '2xl': 32,
  } as const,

  /**
   * ---------------------------------------------------------------- shadows
   * Shadow scale (matches current Tailwind defaults).
   */
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  } as const,

  /**
   * ------------------------------------------------------------- components
   * Common component dimensions (px). Consumed as Tailwind height/width
   * utilities (`h-btn`, `h-input`, `h-header`, `w-sidebar`) and CSS vars.
   */
  components: {
    buttonHeight: 40,
    inputHeight: 32,
    headerHeight: 64,
    sidebarWidth: 212,
    sidebarCollapsedWidth: 74,
    cardRadius: 12,
    modalRadius: 12,
  } as const,
} as const;

export type Theme = typeof theme;

/** Default export for convenience (`import theme from '@/config/theme'`). */
export default theme;
