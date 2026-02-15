# Core Architecture

Enterprise reusable core for admin panels.

## Structure

```
core/
├── ui/base/          # PrimeVue-wrapped base components
│   ├── BaseButton.vue
│   ├── BaseInput.vue
│   ├── BaseSelect.vue
│   ├── BaseModal.vue
│   ├── BaseTable.vue
│   ├── BaseForm.vue
│   └── BaseCard.vue
├── table/            # Data table system
│   ├── useDataTable.ts      # Legacy: fetch + state
│   ├── useTable.ts          # New: state only (server-side)
│   ├── useTablePagination.ts
│   ├── useTableSearch.ts
│   ├── useTableSelection.ts
│   ├── columnBuilder.ts
│   └── exportUtils.ts
├── form/             # Form builder
│   ├── useFormBuilder.ts
│   ├── validationBuilder.ts
│   └── fieldFactory.ts
├── permission/       # RBAC
│   ├── permissionStore.ts
│   ├── usePermission.ts
│   └── menuBuilder.ts
├── theme/            # Theme system
│   ├── themeStore.ts
│   └── themeConfig.ts
├── layout/
│   ├── useLayout.ts
│   └── sidebarBuilder.ts
├── services/
│   └── api.ts
└── index.ts
```

## Usage

### BaseTable (wrapper — no direct PrimeVue)

BaseTable is the only table component; pages never use PrimeVue DataTable directly.

**New API (recommended):** props + events; parent owns data and fetch.

```ts
import BaseTable from '@core/ui/base/BaseTable.vue';
import { useTable, createColumn } from '@core';

const table = useTable({
  columns: [
    createColumn({ key: 'id', label: 'ID', sortable: true }),
    createColumn({ key: 'name', label: 'Name', sortable: true }),
  ],
  rowKey: 'id',
  initialLimit: 10,
  searchDebounceMs: 400,
});

// After fetch: table.setRows(data); table.setTotal(count);
// Bind to BaseTable: :columns, :rows, :loading, :total, :page, :limit, v-model:search, v-model:selected
// Listen: @update:page, @update:limit, @search, @sort, @edit, @delete
```

**Legacy API:** pass `useDataTable()` return as `table` prop (same as before).

```ts
const table = useDataTable({ endpoint: '...', columns: [...], cacheKey: '...' });
// <BaseTable :table="table" />
```

### BaseForm
```ts
import BaseForm from '@core/ui/base/BaseForm.vue';

const schema = [
  { type: 'text', name: 'title', label: 'Title', required: true },
  { type: 'select', name: 'status', label: 'Status', options: [...] },
];
```

### usePermission
```ts
import { usePermission } from '@core';

const { can, hasRole, canShowMenu } = usePermission();
if (can('users.view')) { ... }
```

### Theme
```ts
import { useThemeStore } from '@core';

const theme = useThemeStore();
theme.toggle();
```
