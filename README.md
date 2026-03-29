# Veria Panel - Local Administration Dashboard

A Vue 3 + TypeScript + Vite administration panel for Shahr Bank.

## Features

- ✅ **100% Offline Capable** - All dependencies installed locally, no internet required for runtime
- 🎨 PrimeVue UI Components + PrimeIcons (local)
- 🌐 Vue 3 with Composition API
- 🔒 Pinia State Management
- 🚀 Vue Router
- 📝 Vee-validate Form Validation
- 🎯 TailwindCSS + DaisyUI Styling

## Prerequisites

- Node.js 18+ 
- npm 9+

## Installation

```bash
npm install
```

All packages are installed from the custom mirror registry (`mirror2.chabokan.net/npm`) for offline use.

## Development

```bash
npm run dev
```

The development server runs on `http://localhost:7070/`

## Build

```bash
npm run build
```

## Preview Production Build

```bash
npm run preview
```

## Configuration

### Backend API

The frontend communicates with your backend API at:

```javascript
// src/constants/config.js
export const base_url = 'http://localhost:8085/';
```

### Ports

- Frontend Dev Server: `7070`
- Backend API: `8085`

## Project Structure

```
src/
├── api/          # API client and HTTP interceptors
├── assets/       # Static assets (CSS, fonts, images)
│   └── css/      # Stylesheets including local PrimeIcons
├── components/   # Reusable Vue components
├── constants/    # Configuration and constants
├── core/         # Core utilities and composables
├── examples/     # Example implementations (may use external APIs)
├── pages/        # Page components
│   └── app/
│       └── base-info/
│           ├── rules-regulations/  # Rules & Regulations CRUD table
│           └── duties/             # Tasks (duties) table — POST erm/task/list
└── router/       # Vue Router configuration
```

### Tasks Page (`/app/base-info/duties`)

Displays a paginated table of tasks fetched via `POST /erm/task/list`. Columns:

| Column | Source Field |
|--------|-------------|
| متن قانون (Rule Text) | `row.rule.rule` |
| کد (Code) | `row.code` |
| نوع تعهد (Duty Type) | `row.rule.type_information.title` |
| موضوع قانون (Rule Subject) | `row.section.title / row.section.children.title` |
| واحد مکلف (Mandatory Unit) | `row.mandatory_unit[].title` |
| تبصره (Clause) | `row.has_clause` (1 = دارد, 0 = ندارد) |
| فایل (File) | — |
| تنظیمات (Settings) | Actions: attachment, edit, delete |

## Offline Notes

- ✅ All npm packages installed locally
- ✅ PrimeIcons CSS and fonts are local
- ✅ All API calls go to `localhost:8085`
- ⚠️ `/src/examples/UsersTable.vue` uses `jsonplaceholder.typicode.com` (demo only - not used in production)

## Development Tips

- The app is configured for **local-only operation**
- No external CDN resources after initial setup
- All icons and styles work offline

## License

Private - Shahr Bank
