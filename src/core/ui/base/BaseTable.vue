<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import type { ColumnConfig } from '../../table/columnBuilder';

/** Legacy: useDataTable return type for backward compatibility */
interface DataTableInstance {
  columnSettings: { value: ColumnConfig[] } | ColumnConfig[];
  data: { value: Record<string, unknown>[] };
  loading: { value: boolean };
  total: { value: number };
  page: { value: number };
  limit: { value: number };
  selectedRows: { value: Record<string, unknown>[] };
  sortField: { value: string | null };
  sortOrder: { value: number };
  setPage: (p: number) => void;
  setLimit: (l: number) => void;
  setSort: (field: string, order: 1 | -1) => void;
}

/* -------------------------------------------------------------------------
   PROPS — BaseTable acts as a wrapper; all data and state come from parent.
   No internal fetch. Replace PrimeVue by changing only this file.
   Optional "table" prop: useDataTable instance for backward compatibility.
   ------------------------------------------------------------------------- */

const props = withDefaults(
  defineProps<{
    /** Legacy: pass useDataTable() return to use its state and methods */
    table?: DataTableInstance;
    columns?: ColumnConfig[];
    rows?: Record<string, unknown>[];
    loading?: boolean;
    total?: number;
    page?: number;
    limit?: number;
    search?: string;
    /** Selected rows (v-model:selected) */
    selected?: Record<string, unknown>[];
    /** Show selection column: checkbox (multiple) or radio (single) */
    selectable?: boolean;
    /** When selectable: 'multiple' = checkboxes + select all, 'single' = one row only */
    selectionMode?: 'single' | 'multiple';
    actions?: boolean;
    /** Header label for actions column (e.g. "تنظیمات" / "Settings") */
    actionsHeader?: string;
    rowKey?: string;
    emptyMessage?: string;
    showSearch?: boolean;
    searchPlaceholder?: string;
    stickyHeader?: boolean;
    rowsPerPageOptions?: number[];
    /** Current sort field (from parent after @sort) */
    sortField?: string | null;
    /** Current sort order 1 | -1 (from parent after @sort) */
    sortOrder?: number;
  }>(),
  {
    columns: () => [],
    rows: () => [],
    loading: false,
    total: 0,
    page: 1,
    limit: 10,
    search: '',
    selected: () => [],
    selectable: false,
    selectionMode: 'multiple',
    actions: false,
    actionsHeader: '',
    rowKey: 'id',
    emptyMessage: 'No records found',
    showSearch: true,
    searchPlaceholder: 'Search...',
    stickyHeader: true,
    rowsPerPageOptions: () => [5, 10, 25, 50],
    sortField: null,
    sortOrder: 1,
  }
);

/** When table prop is provided, derive state from it */
const effectiveColumns = computed(() => {
  if (props.table) {
    const raw = props.table.columnSettings;
    const list = Array.isArray(raw) ? raw : (raw?.value ?? []);
    return list.filter((c) => c != null && typeof c === 'object' && 'key' in c);
  }
  return Array.isArray(props.columns) ? props.columns : [];
});

const effectiveRows = computed(() =>
  props.table ? props.table.data.value : (props.rows ?? [])
);
const effectiveLoading = computed(() =>
  props.table ? props.table.loading.value : (props.loading ?? false)
);
const effectiveTotal = computed(() =>
  props.table ? props.table.total.value : (props.total ?? 0)
);
const effectivePage = computed(() =>
  props.table ? props.table.page.value : (props.page ?? 1)
);
const effectiveLimit = computed(() =>
  props.table ? props.table.limit.value : (props.limit ?? 10)
);
const effectiveSelected = computed(() =>
  props.table ? props.table.selectedRows.value : (props.selected ?? [])
);
const effectiveSortField = computed(() =>
  props.table ? props.table.sortField.value : (props.sortField ?? null)
);
const effectiveSortOrder = computed(() =>
  props.table ? props.table.sortOrder.value : (props.sortOrder ?? 1)
);

const emit = defineEmits<{
  (e: 'update:page', value: number): void;
  (e: 'update:limit', value: number): void;
  (e: 'update:search', value: string): void;
  (e: 'update:selected', value: Record<string, unknown>[]): void;
  (e: 'sort', payload: { field: string; order: 1 | -1 }): void;
  (e: 'filter', payload: Record<string, unknown>): void;
  (e: 'search', value: string): void;
  (e: 'select', rows: Record<string, unknown>[]): void;
  (e: 'row-click', row: Record<string, unknown>): void;
  (e: 'edit', row: Record<string, unknown>): void;
  (e: 'delete', row: Record<string, unknown>): void;
}>();

/* -------------------------------------------------------------------------
   SEARCH — debounce 400ms then emit 'search'
   ------------------------------------------------------------------------- */

const searchInput = ref(props.search);
watch(
  () => props.search,
  (v) => {
    searchInput.value = v ?? '';
  },
  { immediate: true }
);

let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
function onSearchInput(value: string) {
  searchInput.value = value;
  emit('update:search', value);
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    emit('search', value);
    searchDebounceTimer = null;
  }, 400);
}

/* -------------------------------------------------------------------------
   SELECTION — v-model:selected
   ------------------------------------------------------------------------- */

const selectionModel = computed({
  get: () => effectiveSelected.value,
  set: (v: Record<string, unknown>[]) => {
    const rows = Array.isArray(v) ? v : [];
    if (props.table) props.table.selectedRows.value = rows;
    emit('update:selected', rows);
    emit('select', rows);
  },
});

/* -------------------------------------------------------------------------
   PAGINATION — emit only; parent owns state
   ------------------------------------------------------------------------- */

function onPage(e: { page: number; rows: number }) {
  const page = e.page + 1;
  const limit = e.rows;
  if (props.table) {
    props.table.setPage(page);
    props.table.setLimit(limit);
  }
  emit('update:page', page);
  emit('update:limit', limit);
}

/* -------------------------------------------------------------------------
   SORT — emit only
   ------------------------------------------------------------------------- */

function onSort(e: { sortField: string; sortOrder: number }) {
  if (e.sortField) {
    const order = (e.sortOrder === 1 ? 1 : -1) as 1 | -1;
    if (props.table) props.table.setSort(e.sortField, order);
    emit('sort', { field: e.sortField, order });
  }
}

/* -------------------------------------------------------------------------
   ROW CLICK
   ------------------------------------------------------------------------- */

function onRowClick(event: { data: Record<string, unknown> }) {
  emit('row-click', event.data);
}

/* -------------------------------------------------------------------------
   COLUMNS — filter valid columns
   ------------------------------------------------------------------------- */

const tableColumns = computed(() => effectiveColumns.value);

/* -------------------------------------------------------------------------
   SLOTS — check if a cell slot exists for column key
   ------------------------------------------------------------------------- */

</script>

<template>
  <div class="base-table">
    <!-- Search bar -->
    <div
      v-if="showSearch"
      class="base-table__toolbar mb-4 flex flex-wrap items-center gap-3"
    >
      <div class="relative flex-1 min-w-[200px] max-w-sm">
        <input
          :value="searchInput"
          type="search"
          class="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 shadow-sm transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 dark:border-darkmode-600 dark:bg-darkmode-800 dark:text-slate-100 dark:placeholder-slate-500"
          :placeholder="searchPlaceholder"
          autocomplete="off"
          @input="onSearchInput(($event.target as HTMLInputElement).value)"
        />
        <span
          class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
          aria-hidden="true"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
      </div>
    </div>

    <!-- Table card wrapper -->
    <div class="base-table__card overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-sm dark:border-darkmode-700/60 dark:bg-darkmode-800">
      <DataTable
        :value="effectiveRows"
        :loading="effectiveLoading"
        :dataKey="rowKey"
        :lazy="true"
        :paginator="true"
        :totalRecords="effectiveTotal"
        :rows="effectiveLimit"
        :first="(effectivePage - 1) * effectiveLimit"
        :rowsPerPageOptions="rowsPerPageOptions"
        v-model:selection="selectionModel"
        :selectionMode="selectable ? selectionMode : null"
        :sortField="effectiveSortField"
        :sortOrder="effectiveSortOrder"
        stripedRows
        class="base-table__datatable w-full text-sm"
        :pt="{
          root: { class: 'border-0' },
          table: { class: 'w-full border-collapse' },
          wrapper: { class: 'overflow-x-auto' },
          header: {
            class: stickyHeader
              ? 'sticky top-0 z-10 border-0 bg-slate-50/98 dark:bg-darkmode-800/98 backdrop-blur'
              : 'border-0 bg-slate-50/98 dark:bg-darkmode-800/98',
          },
          column: {
            header: {
              class: 'base-table__th whitespace-nowrap px-4 py-2.5 text-left text-xs font-medium tracking-wide text-slate-500 dark:text-slate-400 align-middle border-0 border-b border-slate-200/70 dark:border-darkmode-600/80',
            },
            sortIcon: { class: 'ml-1.5 inline-block text-slate-400 opacity-70' },
            bodyCell: {
              class: 'base-table__td align-middle px-4 py-2.5 text-slate-700 dark:text-slate-200 border-0 border-b border-slate-100/80 dark:border-darkmode-700/50',
            },
          },
          bodyRow: {
            class: 'base-table__row transition-colors [&.p-highlight]:bg-primary/10 dark:[&.p-highlight]:bg-primary/15',
          },
          paginator: {
            class: 'border-0 border-t border-slate-200/60 dark:border-darkmode-700/60 bg-slate-50/50 dark:bg-darkmode-800/80 text-slate-600 dark:text-slate-400 px-4 py-2.5 text-xs',
          },
          emptyMessage: { class: 'text-center py-12 text-sm text-slate-500 dark:text-slate-400' },
        }"
        @page="onPage"
        @sort="onSort"
        @row-click="onRowClick"
      >
        <template #header>
          <slot name="header" />
        </template>

        <template #empty>
          <slot name="empty">
            <div class="py-12 text-center text-slate-500 dark:text-slate-400">
              {{ emptyMessage }}
            </div>
          </slot>
        </template>

        <template #loading>
          <slot name="loading">
            <div class="flex items-center justify-center py-16">
              <div class="base-table__skeleton flex w-full flex-col gap-3 px-4">
                <div
                  v-for="i in 5"
                  :key="i"
                  class="h-10 animate-pulse rounded bg-slate-200/80 dark:bg-darkmode-600"
                />
              </div>
            </div>
          </slot>
        </template>

        <!-- Selection column: checkbox (multiple) or radio (single) -->
        <Column
          v-if="selectable"
          :selectionMode="selectionMode"
          :exportable="false"
          :style="{ width: '48px', minWidth: '48px' }"
          bodyClass="text-center"
        />

        <!-- Data columns -->
        <Column
          v-for="(col, index) in tableColumns"
          :key="col.key ?? `col-${index}`"
          :field="col.key"
          :header="col.label"
          :sortable="col.sortable ?? false"
          :style="col.width ? { width: col.width, minWidth: col.width } : undefined"
          :exportable="col.exportable !== false"
        >
          <template #body="{ data: row }">
            <!-- Legacy #cell with row + column; else per-column #cell-{key}; else default -->
            <slot name="cell" :row="row" :column="col">
              <slot :name="`cell-${col.key}`" :row="row">
                {{ col.bodyCell ? col.bodyCell(row) : row?.[col.key] ?? '—' }}
              </slot>
            </slot>
          </template>
        </Column>

        <!-- Actions column -->
        <Column
          v-if="actions"
          key="_actions"
          :exportable="false"
          :header="actionsHeader"
          :style="{ width: '100px', minWidth: '100px' }"
          bodyClass="text-center"
        >
          <template #body="{ data: row }">
            <!-- Custom content only via #actions slot (no default edit/delete) -->
            <slot name="actions" :row="row" />
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<style scoped>
.base-table__datatable :deep(.p-datatable-loading-overlay) {
  border-radius: inherit;
}

/* Remove extra border above header row — single clean line under header only */
.base-table__datatable :deep(.p-datatable-thead) {
  border-top: none;
}
.base-table__datatable :deep(.p-datatable-thead tr) {
  border-top: none;
}
.base-table__datatable :deep(.p-datatable-thead th) {
  border-top: none;
}
.base-table__datatable :deep(.p-datatable-header) {
  border-top: none;
  border-bottom: none;
}

/* Minimal row hover */
.base-table__datatable :deep(.p-datatable-tbody .base-table__row:hover),
.base-table__datatable :deep(.p-datatable-tbody tr:hover) {
  background-color: rgb(248 250 252 / 0.7);
}
.dark .base-table__datatable :deep(.p-datatable-tbody .base-table__row:hover),
.dark .base-table__datatable :deep(.p-datatable-tbody tr:hover) {
  background-color: rgb(30 41 59 / 0.4);
}

/* Subtle stripe for striped rows */
.base-table__datatable :deep(.p-datatable-tbody tr.p-row-odd) {
  background-color: rgb(248 250 252 / 0.4);
}
.dark .base-table__datatable :deep(.p-datatable-tbody tr.p-row-odd) {
  background-color: rgb(30 41 59 / 0.2);
}
</style>
