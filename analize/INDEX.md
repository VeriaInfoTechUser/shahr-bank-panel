# Admin Panel Index

## Quick Links

| Document | Description |
|----------|-------------|
| [OVERVIEW.md](./OVERVIEW.md) | Project overview, tech stack, architecture |
| [API-LAYER.md](./API-LAYER.md) | HTTP client, endpoints, error handling |
| [PERMISSIONS.md](./PERMISSIONS.md) | RBAC, roles, route guards |
| [TABLE-SYSTEM.md](./TABLE-SYSTEM.md) | useTable, pagination, search, selection |
| [COMPOSABLES.md](./COMPOSABLES.md) | All composables by category |
| [STORES.md](./STORES.md) | Pinia stores |
| [PAGES.md](./PAGES.md) | Page structure and routes |
| [UTILS.md](./UTILS.md) | Utility functions |
| [THEME-LAYOUT.md](./THEME-LAYOUT.md) | Theme, layouts, dark mode |

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Vue | 3.3.4 | Framework |
| Vite | 7.0.4 | Build tool |
| Pinia | 2.0.23 | State management |
| Vue Router | 4.1.6 | Routing |
| Tailwind CSS | 3.4.3 | Styling |
| PrimeVue | 4.5.4 | UI components |
| DaisyUI | 4.12.24 | Tailwind components |
| Axios | 1.13.4 | HTTP client |
| ECharts | 6.1.0 | Charts |
| vue-i18n | 9.13.1 | Internationalization |
| VeeValidate | 4.13.2 | Form validation |
| Yup | 1.4.0 | Schema validation |

## Project Stats

- **Total Files:** ~200+ TypeScript/JavaScript files
- **Pages:** 30+ page components
- **Stores:** 12+ Pinia stores
- **Composables:** 20+ composables
- **Languages:** 3 (FA, EN, AR)

## Key Patterns

1. **One component per file** — Clean separation
2. **Composable-based logic** — Reusable business logic
3. **Server-side tables** — useTable with pagination
4. **RBAC** — Role and permission-based access
5. **Audit logging** — All API requests logged
6. **i18n** — Full multilingual support
