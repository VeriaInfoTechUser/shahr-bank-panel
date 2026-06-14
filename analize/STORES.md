# Stores Analysis (Pinia)

## UI Stores

| Store | File | Purpose |
|-------|------|---------|
| `sideMenu` | `stores/side-menu.ts` | Sidebar menu items with role-based visibility |
| `simpleMenu` | `stores/simple-menu.ts` | Simple menu layout |
| `topMenu` | `stores/top-menu.ts` | Top menu layout |
| `darkMode` | `stores/dark-mode.ts` | Dark mode toggle |
| `colorScheme` | `stores/color-scheme.ts` | Color scheme preference |
| `globalModal` | `stores/global-modal.ts` | Global modal state |
| `riskDoingTaskNavigation` | `stores/riskDoingTaskNavigation.ts` | Risk task navigation state |
| `complianceDoingTaskNavigation` | `stores/complianceDoingTaskNavigation.ts` | Compliance task navigation |

## User & Auth Stores

| Store | File | Purpose |
|-------|------|---------|
| `user` | `stores/user.js` | User data management |
| `locale` | `stores/locale.js` | Language/locale state |

## Core Stores

| Store | File | Purpose |
|-------|------|---------|
| `permission` | `core/permission/permissionStore.ts` | RBAC (roles, permissions, accessMatrix) |
| `theme` | `core/theme/themeStore.ts` | Theme configuration |
