import { ref, type Ref } from 'vue';

export type TableRow = Record<string, unknown>;

export interface UseTableSelectionReturn {
  /** Currently selected rows */
  selectedRows: Ref<TableRow[]>;
  setSelected: (rows: TableRow[]) => void;
  clearSelection: () => void;
  /** Toggle selection of a single row (by reference or rowKey) */
  toggleRow: (row: TableRow, rowKey?: string) => void;
}

/**
 * Composable for table row selection state.
 * Parent binds selectedRows to BaseTable and listens to @select.
 */
export function useTableSelection(): UseTableSelectionReturn {
  const selectedRows = ref<TableRow[]>([]);

  function setSelected(rows: TableRow[]) {
    selectedRows.value = Array.isArray(rows) ? rows : [];
  }

  function clearSelection() {
    selectedRows.value = [];
  }

  function toggleRow(row: TableRow, rowKey = 'id') {
    const keyVal = row[rowKey];
    const idx = selectedRows.value.findIndex((r) => r[rowKey] === keyVal);
    if (idx >= 0) {
      selectedRows.value = selectedRows.value.filter((_, i) => i !== idx);
    } else {
      selectedRows.value = [...selectedRows.value, row];
    }
  }

  return {
    selectedRows,
    setSelected,
    clearSelection,
    toggleRow,
  };
}
