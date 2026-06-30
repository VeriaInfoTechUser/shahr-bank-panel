export { apiClient } from './api/apiClient';

export { usePermissionStore } from './permission/permissionStore';
export { usePermission } from './permission/usePermission';
export { useMenuBuilder } from './permission/menuBuilder';
export type { MenuItem } from './permission/menuBuilder';

export { useDataTable } from './table/useDataTable';
export type { FetchFn } from './table/useDataTable';
export { createColumn, createColumns } from './table/columnBuilder';
export type { ColumnConfig, ColumnAlign } from './table/columnBuilder';
export { exportToCSV, exportToExcel } from './table/exportUtils';

/* New table system (BaseTable wrapper + composables) */
export { useTable } from './table/useTable';
export type { UseTableOptions, UseTableReturn, TableRow } from './table/useTable';
export { useTablePagination } from './table/useTablePagination';
export type { UseTablePaginationOptions, UseTablePaginationReturn } from './table/useTablePagination';
export { useTableSearch } from './table/useTableSearch';
export type { UseTableSearchOptions, UseTableSearchReturn } from './table/useTableSearch';
export { useTableSelection } from './table/useTableSelection';
export type { UseTableSelectionReturn } from './table/useTableSelection';

export { useFormBuilder } from './form/useFormBuilder';
export { buildValidationSchema } from './form/validationBuilder';
export type { FieldSchema, FieldType } from './form/validationBuilder';
