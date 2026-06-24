# Admin Panel Analysis

**Project:** veria-panel  
**Framework:** Vue 3.3.4 + Vite 7  
**State Management:** Pinia  
**UI Libraries:** Tailwind CSS + PrimeVue 4.5.4 + DaisyUI  
**Routing:** Vue Router 4  
**i18n:** vue-i18n (FA, EN, AR)  
**API:** Axios with interceptors  
**Charts:** ECharts + Chart.js  
**Forms:** VeeValidate 4 + Yup  

## Date: 2026-06-14

## Modules

| Module | Route Prefix | Description |
|--------|-------------|-------------|
| Dashboard | `/app/dashboard` | Main dashboard with overview |
| Account | `/app/account` | User profile, password, history, notifications |
| Base Info | `/app/base-info` | Rules & regulations, tasks (admin only) |
| Compliance | `/app/compliance` | Dashboard, operations, doing-task, reports |
| Risk | `/app/risk` | Dashboard, operations, doing-task, reports |
| ESG | `/app/esg` | Dashboard, governance, social, environment, reports |
| Governance | `/app/governance` | Guide, liaisons, legislative authority, law type |
| Auth | `/auth/login` | Login page |

## Architecture

```
src/
├── core/                    # Core infrastructure
│   ├── api/                 # HTTP client, endpoints, error handling, audit logging
│   ├── permission/          # RBAC: permissionStore, usePermission, menuBuilder
│   ├── table/               # useTable, useDataTable, pagination, search, selection
│   ├── theme/               # Theme config, dark mode, color scheme
│   └── erm/                 # ERM rule author cache
├── composables/             # Shared composables (breadcrumb, modals, ESG, etc.)
├── constants/               # Config, validation objects
├── layouts/                 # SideMenu, TopMenu, SimpleMenu layouts
├── pages/                   # Route components
├── stores/                  # Pinia stores (side-menu, user, locale, etc.)
├── types/                   # TypeScript interfaces
├── utils/                   # Helpers, cookie, i18n, PDF export, etc.
└── base-components/         # Shared UI components (Dialog, Tippy, Breadcrumb, etc.)
```

## Key Files

| File | Purpose |
|------|---------|
| `src/core/api/http.ts` | Axios instance with auth interceptors, audit logging, retry |
| `src/core/api/apiClient.ts` | Typed API client (GET/POST/PUT/DELETE) |
| `src/core/api/endpoints.ts` | All API endpoint constants |
| `src/core/permission/permissionStore.ts` | RBAC store (roles, permissions, accessMatrix) |
| `src/core/permission/usePermission.ts` | Permission check composable |
| `src/core/table/useTable.ts` | Server-side table composable |
| `src/stores/side-menu.ts` | Sidebar menu structure |
| `src/router/index.ts` | All routes with auth guards |
| `src/constants/config.js` | Base URL, locale settings |
| `src/utils/i18n.ts` | Multi-language config (FA/EN/AR) |
