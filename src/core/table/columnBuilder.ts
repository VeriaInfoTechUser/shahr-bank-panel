export type FilterType = 'text' | 'select' | 'date' | 'number' | 'boolean';

export interface ColumnConfig {
  key: string;
  label: string;
  sortable?: boolean;
  visible?: boolean;
  exportable?: boolean;
  filter?: FilterType;
  width?: string;
  align?: 'left' | 'center' | 'right';
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
