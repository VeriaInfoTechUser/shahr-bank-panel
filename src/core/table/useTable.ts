import { ref, type Ref } from 'vue';
import type { ColumnConfig } from './columnBuilder';
import { useTablePagination } from './useTablePagination';
import { useTableSearch } from './useTableSearch';
import { useTableSelection } from './useTableSelection';

export type TableRow = Record<string, unknown>;

export interface UseTableOptions {
  /** Column definitions */
  columns: ColumnConfig[];
  /** Row key for selection and row identity (default 'id') */
  rowKey?: string;
  /** Initial page size */
  initialLimit?: number;
  /** Show search input and debounce ms (default 400). Set to 0 to hide search. */
  searchDebounceMs?: number;
}

export interface UseTableReturn {
  // --- State (pass as props to BaseTable)
  columns: ColumnConfig[];
  rows: Ref<TableRow[]>;
  loading: Ref<boolean>;
  total: Ref<number>;
  page: Ref<number>;
  limit: Ref<number>;
  search: Ref<string>;
  selectedRows: Ref<TableRow[]>;
  rowKey: string;

  // --- Pagination (from useTablePagination)
  setPage: (p: number) => void;
  setLimit: (l: number) => void;
  setTotal: (t: number) => void;
  resetPagination: (newLimit?: number) => void;

  // --- Search (from useTableSearch)
  setSearch: (value: string) => void;

  // --- Selection (from useTableSelection)
  setSelected: (rows: TableRow[]) => void;
  clearSelection: () => void;

  // --- Data (parent sets these after fetch)
  setRows: (rows: TableRow[]) => void;
  setLoading: (v: boolean) => void;
}

/**
 * Main table composable for server-side tables.
 * Combines pagination, search, and selection. Parent fetches data and sets rows/total/loading;
 * parent listens to BaseTable events (@update:page, @search, etc.) and refetches.
 */
export function useTable(options: UseTableOptions): UseTableReturn {
  const {
    columns,
    rowKey = 'id',
    initialLimit = 10,
    searchDebounceMs = 400,
  } = options;

  const rows = ref<TableRow[]>([]);
  const loading = ref(false);

  const pagination = useTablePagination({
    initialPage: 1,
    initialLimit,
    initialTotal: 0,
  });

  const { search } = useTableSearch({
    debounceMs: searchDebounceMs,
    initialValue: '',
    // onSearch is not set here; parent will listen to @search from BaseTable
  });

  const selection = useTableSelection();

  function setRows(r: TableRow[]) {
    rows.value = Array.isArray(r) ? r : [];
  }

  function setLoading(v: boolean) {
    loading.value = v;
  }

  function setSearch(value: string) {
    search.value = value;
  }

  return {
    columns,
    rows,
    loading,
    total: pagination.total,
    page: pagination.page,
    limit: pagination.limit,
    search,
    selectedRows: selection.selectedRows,
    rowKey,

    setPage: pagination.setPage,
    setLimit: pagination.setLimit,
    setTotal: pagination.setTotal,
    resetPagination: pagination.reset,

    setSearch,
    setSelected: selection.setSelected,
    clearSelection: selection.clearSelection,

    setRows,
    setLoading,
  };
}
