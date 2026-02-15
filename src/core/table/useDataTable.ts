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

/** In-memory cache for list responses: key -> { list, count, timestamp } */
const listDataCache = new Map<
  string,
  { list: Record<string, unknown>[]; count: number; timestamp: number }
>();

function buildListCacheKey(
  cacheKey: string,
  page: number,
  limit: number,
  sortField: string | null,
  sortOrder: number,
  filters: Record<string, unknown>
): string {
  const sortPart = sortField ? `${sortField}:${sortOrder}` : '';
  const filtersJson = JSON.stringify(
    Object.keys(filters)
      .sort()
      .reduce((acc, k) => ({ ...acc, [k]: filters[k] }), {})
  );
  return `${cacheKey}:${page}:${limit}:${sortPart}:${filtersJson}`;
}

export interface DataTableOptions {
  endpoint?: string;
  fetchFn?: FetchFn;
  columns: ColumnConfig[];
  selectable?: boolean;
  exportEnabled?: boolean;
  filtersEnabled?: boolean;
  pageSize?: number;
  /** Persists column visibility in localStorage and enables list response cache when using fetchFn */
  cacheKey?: string;
  /** List cache TTL in ms. 0 = use cache until invalidateListCache() is called. Default 0. */
  listCacheStaleTime?: number;
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
    listCacheStaleTime = 0,
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
    const params = {
      page: page.value,
      limit: limit.value,
      sort: sortField.value ? { [sortField.value]: sortOrder.value } : undefined,
      filters: filters.value,
    };

    if (fetchFn && cacheKey) {
      const key = buildListCacheKey(
        cacheKey,
        params.page,
        params.limit,
        sortField.value,
        sortOrder.value,
        params.filters ?? {}
      );
      const cached = listDataCache.get(key);
      const now = Date.now();
      const useCache =
        cached &&
        (listCacheStaleTime === 0 || now - cached.timestamp < listCacheStaleTime);
      if (useCache) {
        data.value = cached.list || [];
        total.value = cached.count ?? 0;
        return;
      }
    }

    loading.value = true;
    try {
      if (fetchFn) {
        const result = await fetchFn(params);
        data.value = result.list || [];
        total.value = result.count || 0;
        if (cacheKey) {
          const key = buildListCacheKey(
            cacheKey,
            params.page,
            params.limit,
            sortField.value,
            sortOrder.value,
            params.filters ?? {}
          );
          listDataCache.set(key, {
            list: data.value,
            count: total.value,
            timestamp: Date.now(),
          });
        }
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

  /** Clear cached list data for this table. Call after add/update/delete so next fetch hits the API. */
  function invalidateListCache() {
    if (!cacheKey) return;
    for (const key of listDataCache.keys()) {
      if (key.startsWith(`${cacheKey}:`)) listDataCache.delete(key);
    }
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
    invalidateListCache,
  };
}
