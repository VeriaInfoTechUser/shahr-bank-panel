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
│   ├── useDataTable.ts
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

### BaseTable
```ts
import { useDataTable, createColumn } from '@core';
import BaseTable from '@core/ui/base/BaseTable.vue';

const table = useDataTable({
  endpoint: 'admin/user/profile/list',
  columns: [
    createColumn({ key: 'email', label: 'Email', sortable: true }),
    createColumn({ key: 'name', label: 'Name' }),
  ],
  selectable: true,
  exportEnabled: true,
  cacheKey: 'users-list',
});
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
