# Table System Analysis

## useTable Composable (`src/core/table/useTable.ts`)

Server-side table with pagination, search, and selection.

```typescript
const table = useTable({
  columns: [...],           // Column definitions
  rowKey: 'id',             // Row identity key
  initialLimit: 10,         // Page size
  searchDebounceMs: 400,    // Search debounce
});
```

### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `rows` | `Ref<TableRow[]>` | Current page data |
| `loading` | `Ref<boolean>` | Loading state |
| `total` | `Ref<number>` | Total records |
| `page` | `Ref<number>` | Current page |
| `limit` | `Ref<number>` | Page size |
| `search` | `Ref<string>` | Search query |
| `selectedRows` | `Ref<TableRow[]>` | Selected rows |
| `setPage(p)` | `Function` | Set page number |
| `setLimit(l)` | `Function` | Set page size |
| `setRows(r)` | `Function` | Set page data |
| `setLoading(v)` | `Function` | Set loading state |
| `setSearch(v)` | `Function` | Set search query |
| `resetPagination()` | `Function` | Reset to page 1 |

## Related Composables

| Composable | Purpose |
|------------|---------|
| `useTablePagination` | Page/limit/total management |
| `useTableSearch` | Debounced search input |
| `useTableSelection` | Row selection (multi-select) |
| `useDataTable` | Extended table with additional features |

## Column Builder (`src/core/table/columnBuilder.ts`)

Defines column configuration for tables.

## Export Utils (`src/core/table/exportUtils.ts`)

CSV/Excel export functionality for table data.
