<script setup lang="ts">
import { computed, watch } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import type { useDataTable } from '../../table/useDataTable';

const props = withDefaults(
  defineProps<{
    table: ReturnType<typeof useDataTable>;
    loading?: boolean;
    selectable?: boolean;
    exportEnabled?: boolean;
    filtersEnabled?: boolean;
    emptyMessage?: string;
  }>(),
  {
    loading: false,
    selectable: false,
    exportEnabled: true,
    filtersEnabled: true,
    emptyMessage: 'No records found',
  }
);

const emit = defineEmits<{
  (e: 'selection-change', rows: Record<string, unknown>[]): void;
}>();

const columns = computed(() => props.table.columnSettings);
const data = computed(() => props.table.data.value);
const total = computed(() => props.table.total.value);
const page = computed(() => props.table.page.value);
const limit = computed(() => props.table.limit.value);
const selected = computed({
  get: () => props.table.selectedRows.value,
  set: (v) => {
    props.table.selectedRows.value = v;
    emit('selection-change', v);
  },
});

function onPage(e: { page: number; rows: number }) {
  props.table.setPage(e.page + 1);
  props.table.setLimit(e.rows);
}

function onSort(e: { sortField: string; sortOrder: number }) {
  if (e.sortField) {
    props.table.setSort(e.sortField, (e.sortOrder as 1 | -1) || 1);
  }
}
</script>

<template>
  <div class="core-base-table">
    <DataTable
      :value="data"
      :loading="loading || table.loading.value"
      v-model:selection="selected"
      dataKey="id"
      :selectionMode="selectable ? 'multiple' : null"
      :paginator="true"
      :lazy="true"
      :totalRecords="total"
      :rows="limit"
      :first="(page - 1) * limit"
      :rowsPerPageOptions="[5, 10, 25, 50]"
      @page="onPage"
      :sortField="table.sortField.value"
      :sortOrder="table.sortOrder.value"
      @sort="onSort"
      stripedRows
      class="table table-zebra w-full"
      :pt="{
        root: { class: 'border rounded-lg overflow-hidden' },
        wrapper: { class: 'overflow-x-auto' },
        header: { class: 'bg-base-200' },
        bodyRow: { class: 'hover' },
        emptyMessage: { class: 'text-center py-8' },
      }"
    >
      <template #empty>
        <div class="text-center py-8 text-base-content/70">
          {{ emptyMessage }}
        </div>
      </template>
      <template #loading>
        <div class="flex justify-center items-center py-12">
          <span class="loading loading-spinner loading-lg"></span>
        </div>
      </template>
      <Column v-if="selectable" selectionMode="multiple" :exportable="false" />
      <Column
        v-for="col in columns"
        :key="col.key"
        :field="col.key"
        :header="col.label"
        :sortable="col.sortable"
        :exportable="col.exportable"
      >
        <template #body="{ data: row }">
          <slot name="cell" :row="row" :column="col">
            {{ col.bodyCell ? col.bodyCell(row) : row[col.key] }}
          </slot>
        </template>
      </Column>
    </DataTable>
  </div>
</template>
