import { ref, computed, watch } from 'vue';
import type { ColumnConfig } from './columnBuilder';
import { exportToCSV, exportToExcel } from './exportUtils';
import { apiClient } from '../api/apiClient';

export type FetchFn = (params: {
  page: number;
  limit: number;
  sort?: Record<string, number>;
  filters?: Record<string, unknown>;
}) => Promise<{ list: Record<string, unknown>[]; count: number }>;

export interface DataTableOptions {
  endpoint?: string;
  fetchFn?: FetchFn;
  columns: ColumnConfig[];
  selectable?: boolean;
  exportEnabled?: boolean;
  filtersEnabled?: boolean;
  pageSize?: number;
  cacheKey?: string;
}

export function useDataTable(options: DataTableOptions) {
  const {
    endpoint,
    fetchFn,
    columns,
    selectable = false,
    exportEnabled = true,
    pageSize = 10,
    cacheKey,
  } = options;

  const data = ref<Record<string, unknown>[]>([]);
  const loading = ref(false);
  const total = ref(0);
  const page = ref(1);
  const limit = ref(pageSize);
  const sortField = ref<string | null>(null);
  const sortOrder = ref<1 | -1>(1);
  const filters = ref<Record<string, unknown>>({});
  const selectedRows = ref<Record<string, unknown>[]>([]);
  const visibleColumns = ref<string[]>(
    columns.filter((c) => c.visible !== false).map((c) => c.key)
  );

  const columnSettings = computed(() =>
    columns.filter((c) => visibleColumns.value.includes(c.key))
  );

  function loadColumnSettings() {
    if (!cacheKey) return;
    try {
      const stored = localStorage.getItem(`core-table-${cacheKey}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) visibleColumns.value = parsed;
      }
    } catch {
      //
    }
  }

  function saveColumnSettings() {
    if (!cacheKey) return;
    localStorage.setItem(`core-table-${cacheKey}`, JSON.stringify(visibleColumns.value));
  }

  if (cacheKey) {
    loadColumnSettings();
    watch(visibleColumns, saveColumnSettings, { deep: true });
  }

  async function fetch() {
    loading.value = true;
    try {
      if (fetchFn) {
        const result = await fetchFn({
          page: page.value,
          limit: limit.value,
          sort: sortField.value ? { [sortField.value]: sortOrder.value } : undefined,
          filters: filters.value,
        });
        data.value = result.list || [];
        total.value = result.count || 0;
      } else if (endpoint) {
        const body = {
          page: page.value,
          limit: limit.value,
          sort: sortField.value ? { [sortField.value]: sortOrder.value } : undefined,
          ...filters.value,
        };
        const result = await apiClient.post<{ data?: { list?: unknown[]; paginator?: { count?: number } } }>(
          endpoint,
          body
        );
        const list = result?.data?.list ?? [];
        const count = result?.data?.paginator?.count ?? 0;
        data.value = Array.isArray(list) ? list : [];
        total.value = count;
      }
    } finally {
      loading.value = false;
    }
  }

  function setPage(p: number) {
    page.value = p;
    fetch();
  }

  function setSort(field: string, order: 1 | -1) {
    sortField.value = field;
    sortOrder.value = order;
    fetch();
  }

  function setFilters(f: Record<string, unknown>) {
    filters.value = { ...filters.value, ...f };
    page.value = 1;
    fetch();
  }

  function setLimit(l: number) {
    limit.value = l;
    page.value = 1;
    fetch();
  }

  function toggleColumn(key: string) {
    const idx = visibleColumns.value.indexOf(key);
    if (idx >= 0) {
      visibleColumns.value = visibleColumns.value.filter((k) => k !== key);
    } else {
      visibleColumns.value = [...visibleColumns.value, key];
    }
  }

  function exportCSV() {
    const rows = selectedRows.value.length > 0 ? selectedRows.value : data.value;
    exportToCSV(rows, columnSettings.value);
  }

  function exportExcel() {
    const rows = selectedRows.value.length > 0 ? selectedRows.value : data.value;
    exportToExcel(rows, columnSettings.value);
  }

  return {
    data,
    loading,
    total,
    page,
    limit,
    sortField,
    sortOrder,
    filters,
    selectedRows,
    visibleColumns,
    columnSettings,
    selectable,
    exportEnabled,
    fetch,
    setPage,
    setSort,
    setFilters,
    setLimit,
    toggleColumn,
    exportCSV,
    exportExcel,
  };
}
