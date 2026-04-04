export type FilterType = 'text' | 'select' | 'date' | 'number' | 'boolean';

export type ColumnAlign = 'left' | 'center' | 'right';

/** Column config for BaseTable. Supports slots and dynamic rendering. */
export interface ColumnConfig {
  key: string;
  /** اگر با `key` متفاوت باشد، مرتب‌سازی سروری با این نام فیلد ارسال می‌شود */
  sortKey?: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  visible?: boolean;
  exportable?: boolean;
  filter?: FilterType;
  width?: string;
  align?: ColumnAlign;
  /** When true, use #cell-{key} slot for this column */
  slot?: boolean;
  bodyCell?: (row: Record<string, unknown>) => unknown;
}

export function createColumn(config: ColumnConfig): ColumnConfig {
  return {
    sortable: true,
    visible: true,
    exportable: true,
    filter: 'text',
    align: 'left',
    ...config,
  };
}

export function createColumns(configs: ColumnConfig[]): ColumnConfig[] {
  return configs.map(createColumn);
}
