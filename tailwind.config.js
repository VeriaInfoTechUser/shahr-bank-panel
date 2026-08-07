/**
 * Tailwind configuration — consumed from the central design-system theme.
 *
 * EVERY color / radius / shadow / font / spacing / component-dimension value
 * originates from `src/config/theme.ts` (the single source of truth).
 * Changing a value there regenerates the CSS custom properties below and all
 * semantic utilities (`bg-primary`, `text-text-primary`, `border-border`,
 * `bg-surface`, `ring-focus-ring`, `h-btn`, `w-sidebar`, ...).
 */
const plugin = require("tailwindcss/plugin");
const colors = require("tailwindcss/colors");
const { parseColor } = require("tailwindcss/lib/util/color");
const path = require("path");

// Load the central theme (TS) through jiti (already a tailwindcss dependency).
let loadTheme;
try {
  loadTheme = require("jiti")(__filename);
} catch {
  loadTheme = require(path.resolve(__dirname, "node_modules/jiti"))(__filename);
}
const { theme: THEME } = loadTheme(path.resolve(__dirname, "src/config/theme.ts"));

/** Converts HEX color to an "r g b" triplet (used by rgb(var(--x) / a)). */
const toRGB = (value) => {
  try {
    return parseColor(value).color.join(" ");
  } catch {
    return value;
  }
};

// ---------------------------------------------------------------------------
// Build CSS custom properties for a color scope ({light} -> :root, {dark} -> .dark)
// ---------------------------------------------------------------------------
function colorVars(scope) {
  const vars = {};
  for (const [key, value] of Object.entries(scope)) {
    vars[`--color-${key}`] = toRGB(value);
  }
  return vars;
}

// ---------------------------------------------------------------------------
// Semantic Tailwind color utilities from the central theme (light scope keys)
// ---------------------------------------------------------------------------
const semanticColors = {};
for (const key of Object.keys(THEME.colors.light)) {
  if (key === 'primary' || key === 'primary-muted') continue; // handled as object below
  semanticColors[key] = `rgb(var(--color-${key}) / <alpha-value>)`;
}
// `primary` kept as an object (DEFAULT + muted) for theme("colors.primary.DEFAULT")
// references in CSS components and `bg-primary-muted` utilities.
semanticColors.primary = {
  DEFAULT: "rgb(var(--color-primary) / <alpha-value>)",
  muted: "rgb(var(--color-primary-muted) / <alpha-value>)",
};
// Back-compat alias: `danger` == `error` semantic token.
semanticColors.danger = "rgb(var(--color-error) / <alpha-value>)";
// Status (non-themed data-viz) palette.
for (const [key, value] of Object.entries(THEME.status)) {
  semanticColors[`status-${key}`] = `rgb(var(--color-status-${key}) / <alpha-value>)`;
}
// Legacy darkmode step palette (flat object form kept for `dark:bg-darkmode-*`).
semanticColors.darkmode = {
  50: "rgb(var(--color-darkmode-50) / <alpha-value>)",
  100: "rgb(var(--color-darkmode-100) / <alpha-value>)",
  200: "rgb(var(--color-darkmode-200) / <alpha-value>)",
  300: "rgb(var(--color-darkmode-300) / <alpha-value>)",
  400: "rgb(var(--color-darkmode-400) / <alpha-value>)",
  500: "rgb(var(--color-darkmode-500) / <alpha-value>)",
  600: "rgb(var(--color-darkmode-600) / <alpha-value>)",
  700: "rgb(var(--color-darkmode-700) / <alpha-value>)",
  800: "rgb(var(--color-darkmode-800) / <alpha-value>)",
  900: "rgb(var(--color-darkmode-900) / <alpha-value>)",
};

// ---------------------------------------------------------------------------
// Typography / radius / spacing / shadows derived from the theme
// ---------------------------------------------------------------------------
const px = (v) => `${v}px`;

const fontSize = Object.fromEntries(
  Object.entries(THEME.typography.sizes).map(([key, size]) => {
    const lineHeights = {
      xs: 16,
      sm: 20,
      base: 24,
      lg: 28,
      xl: 28,
      "2xl": 32,
      "3xl": 36,
      "4xl": 40,
    };
    return [key, [px(size), { lineHeight: px(lineHeights[key] ?? 24) }]];
  })
);

const borderRadius = {
  ...Object.fromEntries(
    Object.entries(THEME.radius).map(([key, value]) => [
      key,
      key === "full" ? "9999px" : px(value),
    ])
  ),
  // Component radii driven by theme.components (consumed as rounded-card / rounded-modal)
  card: px(THEME.components.cardRadius),
  modal: px(THEME.components.modalRadius),
};

const boxShadow = { ...THEME.shadows };

const spacing = Object.fromEntries(
  Object.entries(THEME.spacing).map(([key, value]) => [key, px(value)])
);

const dimensions = {
  height: {
    btn: px(THEME.components.buttonHeight),
    input: px(THEME.components.inputHeight),
    header: px(THEME.components.headerHeight),
  },
  width: {
    sidebar: px(THEME.components.sidebarWidth),
    "sidebar-collapsed": px(THEME.components.sidebarCollapsedWidth),
  },
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,vue}"],
  safelist: [
    {
      pattern: /animate-delay-.+/,
    },
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: semanticColors,
      fontWeight: THEME.typography.weights,
      fontFamily: {
        "public-sans": THEME.typography.family,
      },
      fontSize,
      borderRadius,
      boxShadow,
      spacing,
      ...dimensions,
      container: {
        center: true,
      },
      maxWidth: {
        "1/4": "25%",
        "1/2": "50%",
        "3/4": "75%",
      },
      strokeWidth: {
        0.5: 0.5,
        1.5: 1.5,
        2.5: 2.5,
      },
      backgroundImage: {
        "menu-active":
          "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' transform='rotate(180)'  width='20' height='80' viewBox='0 0 20 122.1'%3E%3Cpath data-name='Union 1' d='M16.038 122H16v-2.213a95.805 95.805 0 00-2.886-20.735 94.894 94.894 0 00-7.783-20.434A39.039 39.039 0 010 61.051a39.035 39.035 0 015.331-17.567 94.9 94.9 0 007.783-20.435A95.746 95.746 0 0016 2.314V0h4v122h-3.961v.1l-.001-.1z' fill='%23f1f5f8'/%3E%3C/svg%3E\")",
        "menu-active-dark":
          "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='80' viewBox='0 0 20 122.1'%3E%3Cpath data-name='Union 1' d='M16.038 122H16v-2.213a95.805 95.805 0 00-2.886-20.735 94.894 94.894 0 00-7.783-20.434A39.039 39.039 0 010 61.051a39.035 39.035 0 015.331-17.567 94.9 94.9 0 007.783-20.435A95.746 95.746 0 0016 2.314V0h4v122h-3.961v.1l-.001-.1z' fill='%23232e45'/%3E%3C/svg%3E\")",
        "skew-pattern":
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1920.004' height='1193.001' viewBox='0 0 1920.004 1193.001'%3E%3Cpath id='Intersection_13' data-name='Intersection 13' d='M1183.231,1554.011,2050,361.011h346.311V1440.1l-82.762,113.912Zm-706.924-1193H918.725L476.308,969.945Z' transform='translate(-476.307 -361.011)' fill='rgba(255,255,255,0.02)'/%3E%3C/svg%3E%0A\")",
        "skew-pattern-dark":
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1920.004' height='1193.001' viewBox='0 0 1920.004 1193.001'%3E%3Cpath id='Intersection_13' data-name='Intersection 13' d='M1183.231,1554.011,2050,361.011h346.311V1440.1l-82.762,113.912Zm-706.924-1193H918.725L476.308,969.945Z' transform='translate(-476.307 -361.011)' fill='rgba(0,0,0,0.06)'/%3E%3C/svg%3E%0A\")",
        "bredcrumb-chevron-dark":
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1' stroke-linecap='round' stroke-linejoin='round' class='feather feather-chevron-right breadcrumb__icon'%3E%3Cpolyline points='9 18 15 12 9 6'%3E%3C/polyline%3E%3C/svg%3E\")",
        "bredcrumb-chevron-light":
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23e8eeff' stroke-width='1' stroke-linecap='round' stroke-linejoin='round' class='feather feather-chevron-right breadcrumb__icon'%3E%3Cpolyline points='9 18 15 12 9 6'%3E%3C/polyline%3E%3C/svg%3E\")",
        "bredcrumb-chevron-darkmode":
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23718096' stroke-width='1' stroke-linecap='round' stroke-linejoin='round' class='feather feather-chevron-right breadcrumb__icon'%3E%3Cpolyline points='9 18 15 12 9 6'%3E%3C/polyline%3E%3C/svg%3E\")",
      },
      keyframes: {
        // Side & simple menu
        "intro-divider": {
          "100%": {
            opacity: 1,
          },
        },
        "intro-menu": {
          "100%": {
            opacity: 1,
            transform: "translateX(0px)",
          },
        },
        "active-side-menu-chevron": {
          "100%": {
            opacity: 1,
            "margin-right": "-27px",
          },
        },

        // Top menu
        "intro-top-menu": {
          "100%": {
            opacity: 1,
            transform: "translateY(0px)",
          },
        },
        "active-top-menu-chevron": {
          "100%": {
            opacity: 1,
            "margin-bottom": "-54px",
          },
        },

        // Wrapper
        "intro-wrapper": {
          "100%": {
            opacity: 1,
            transform: "translateX(0px)",
          },
        },
      },
    },
  },
  daisyui: {
    themes: ["light", "dark"],
    darkTheme: "dark",
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("daisyui"),
    plugin(function ({ addBase, matchUtilities }) {
      addBase({
        // Light theme: default values (sourced from src/config/theme.ts)
        ":root": {
          ...colorVars(THEME.colors.light),
          // Status (non-themed) palette
          ...Object.fromEntries(
            Object.entries(THEME.status).map(([key, value]) => [
              `--color-status-${key}`,
              toRGB(value),
            ])
          ),
          // Typography tokens
          "--font-family-base": THEME.typography.family.join(", "),
          ...Object.fromEntries(
            Object.entries(THEME.typography.sizes).map(([key, value]) => [
              `--font-size-${key}`,
              px(value),
            ])
          ),
          ...Object.fromEntries(
            Object.entries(THEME.typography.lineHeights).map(([key, value]) => [
              `--line-height-${key}`,
              String(value),
            ])
          ),
          ...Object.fromEntries(
            Object.entries(THEME.typography.letterSpacing).map(([key, value]) => [
              `--letter-spacing-${key}`,
              value,
            ])
          ),
          // Radius tokens
          ...Object.fromEntries(
            Object.entries(THEME.radius).map(([key, value]) => [
              `--radius-${key}`,
              key === "full" ? "9999px" : px(value),
            ])
          ),
          // Spacing tokens
          ...Object.fromEntries(
            Object.entries(THEME.spacing).map(([key, value]) => [
              `--space-${key}`,
              px(value),
            ])
          ),
          // Shadow tokens
          ...Object.fromEntries(
            Object.entries(THEME.shadows).map(([key, value]) => [
              `--shadow-${key}`,
              value,
            ])
          ),
          // Component dimension tokens
          "--size-button": px(THEME.components.buttonHeight),
          "--size-input": px(THEME.components.inputHeight),
          "--size-header": px(THEME.components.headerHeight),
          "--size-sidebar": px(THEME.components.sidebarWidth),
          "--size-sidebar-collapsed": px(THEME.components.sidebarCollapsedWidth),
          "--radius-card": px(THEME.components.cardRadius),
          "--radius-modal": px(THEME.components.modalRadius),
        },
        // Default dark-mode colors
        ".dark": {
          ...colorVars(THEME.colors.dark),
        },
        // Theme 1 colors (legacy alternate theme presets)
        ".theme-1": {
          "--color-primary": toRGB(colors.emerald["900"]),
          "--color-primary-muted": toRGB(colors.emerald["300"]),
          "--color-secondary": toRGB(colors.slate["200"]),
          "--color-success": toRGB(colors.emerald["600"]),
          "--color-info": toRGB(colors.cyan["500"]),
          "--color-warning": toRGB(colors.yellow["400"]),
          "--color-pending": toRGB(colors.amber["500"]),
          "--color-danger": toRGB(colors.rose["600"]),
          "--color-light": toRGB(colors.slate["100"]),
          "--color-dark": toRGB(colors.slate["800"]),
          "&.dark": {
            "--color-primary": toRGB(colors.emerald["800"]),
          },
        },
        // Theme 2 colors
        ".theme-2": {
          "--color-primary": toRGB(colors.blue["800"]),
          "--color-primary-muted": toRGB(colors.blue["300"]),
          "--color-secondary": toRGB(colors.slate["200"]),
          "--color-success": toRGB(colors.lime["500"]),
          "--color-info": toRGB(colors.cyan["500"]),
          "--color-warning": toRGB(colors.yellow["400"]),
          "--color-pending": toRGB(colors.orange["500"]),
          "--color-danger": toRGB(colors.red["600"]),
          "--color-light": toRGB(colors.slate["100"]),
          "--color-dark": toRGB(colors.slate["800"]),
          "&.dark": {
            "--color-primary": toRGB(colors.blue["800"]),
          },
        },
        // Theme 3 colors
        ".theme-3": {
          "--color-primary": toRGB(colors.cyan["900"]),
          "--color-primary-muted": toRGB(colors.cyan["300"]),
          "--color-secondary": toRGB(colors.slate["200"]),
          "--color-success": toRGB(colors.teal["600"]),
          "--color-info": toRGB(colors.cyan["500"]),
          "--color-warning": toRGB(colors.amber["500"]),
          "--color-pending": toRGB(colors.amber["600"]),
          "--color-danger": toRGB(colors.red["700"]),
          "--color-light": toRGB(colors.slate["100"]),
          "--color-dark": toRGB(colors.slate["800"]),
          "&.dark": {
            "--color-primary": toRGB(colors.cyan["800"]),
          },
        },
        // Theme 4 colors
        ".theme-4": {
          "--color-primary": toRGB(colors.indigo["900"]),
          "--color-primary-muted": toRGB(colors.indigo["300"]),
          "--color-secondary": toRGB(colors.slate["200"]),
          "--color-success": toRGB(colors.emerald["600"]),
          "--color-info": toRGB(colors.cyan["500"]),
          "--color-warning": toRGB(colors.yellow["500"]),
          "--color-pending": toRGB(colors.orange["600"]),
          "--color-danger": toRGB(colors.red["700"]),
          "--color-light": toRGB(colors.slate["100"]),
          "--color-dark": toRGB(colors.slate["800"]),
          "&.dark": {
            "--color-primary": toRGB(colors.indigo["700"]),
          },
        },
      });

      // Animation delay utilities
      matchUtilities(
        {
          "animate-delay": (value) => ({
            "animation-delay": value,
          }),
        },
        {
          values: (() => {
            const values = {};
            for (let i = 1; i <= 50; i++) {
              values[i * 10] = `${i * 0.1}s`;
            }
            return values;
          })(),
        }
      );

      // Animation fill mode utilities
      matchUtilities(
        {
          "animate-fill-mode": (value) => ({
            "animation-fill-mode": value,
          }),
        },
        {
          values: {
            none: "none",
            forwards: "forwards",
            backwards: "backwards",
            both: "both",
          },
        }
      );
    }),
  ],
  variants: {
    extend: {
      boxShadow: ["dark"],
    },
  },
};
