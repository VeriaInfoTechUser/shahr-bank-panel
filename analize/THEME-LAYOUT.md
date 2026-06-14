# Theme & Layout Analysis

## Theme System (`src/core/theme/`)

| File | Purpose |
|------|---------|
| `themeConfig.ts` | Theme configuration |
| `themeStore.ts` | Pinia store for theme state |

## Layouts

| Layout | Directory | Purpose |
|--------|-----------|---------|
| `SideMenu` | `layouts/SideMenu/` | Main layout with sidebar navigation |
| `TopMenu` | `layouts/TopMenu/` | Top navigation layout |
| `SimpleMenu` | `layouts/SimpleMenu/` | Simplified menu layout |

## CSS Architecture

- **Tailwind CSS** — Utility-first CSS framework
- **PrimeVue Aura** — UI component library with theming
- **DaisyUI** — Tailwind component library
- **PostCSS** — Advanced CSS processing (nesting, variables)

## Dark Mode

- Supported via Tailwind `dark:` variant
- Toggle via `darkMode` store
- CSS selector: `.dark`

## RTL Support

- Default direction: RTL (Persian)
- Configurable per locale
- `defaultDirection: 'rtl'` in config
