<script setup lang="ts">
/**
 * Example: Server-side table using BaseTable + useTable.
 * No PrimeVue usage; only BaseTable and composables.
 * Replace fetchUsers with your real API.
 */
import { onMounted } from 'vue';
import BaseTable from '@core/ui/base/BaseTable.vue';
import { useTable, createColumn } from '@core';

// Columns definition
const columns = [
  createColumn({ key: 'id', label: 'ID', sortable: true, width: '80px' }),
  createColumn({ key: 'name', label: 'Name', sortable: true }),
  createColumn({ key: 'email', label: 'Email', sortable: true }),
  createColumn({
    key: 'status',
    label: 'Status',
    slot: true, // use #cell-status slot
  }),
];

const table = useTable({
  columns,
  rowKey: 'id',
  initialLimit: 10,
  searchDebounceMs: 400,
});

// Simulated API (replace with real endpoint)
async function fetchUsers() {
  table.setLoading(true);
  try {
    const page = table.page.value;
    const limit = table.limit.value;
    const search = table.search.value;
    // jsonplaceholder does not support search; use local slice for demo
    const res = await fetch('https://jsonplaceholder.typicode.com/users');
    const all = await res.json();
    const list = Array.isArray(all) ? all : [];
    const start = (page - 1) * limit;
    const data = list.slice(start, start + limit);
    const total = list.length;
    table.setRows(Array.isArray(data) ? data : []);
    table.setTotal(total);
  } catch {
    table.setRows([]);
    table.setTotal(0);
  } finally {
    table.setLoading(false);
  }
}

onMounted(() => {
  fetchUsers();
});

function onPageChange() {
  fetchUsers();
}

function onLimitChange() {
  table.resetPagination(table.limit.value);
  fetchUsers();
}

function onSearch() {
  table.setPage(1);
  fetchUsers();
}

function onSort() {
  table.setPage(1);
  fetchUsers();
}

function onEdit(row: Record<string, unknown>) {
  console.log('Edit', row);
}

function onDelete(row: Record<string, unknown>) {
  console.log('Delete', row);
}

function onRowClick(row: Record<string, unknown>) {
  console.log('Row click', row);
}
</script>

<template>
  <div class="p-6">
    <h2 class="mb-6 text-xl font-semibold text-slate-800 dark:text-slate-200">
      Users (BaseTable example)
    </h2>

    <BaseTable
      :columns="table.columns"
      :rows="table.rows"
      :loading="table.loading"
      :total="table.total"
      :page="table.page"
      :limit="table.limit"
      :search="table.search"
      :selected="table.selectedRows"
      :selectable="false"
      :actions="true"
      :row-key="table.rowKey"
      empty-message="No users found."
      search-placeholder="Search users..."
      @update:page="(v) => { table.setPage(v); onPageChange(); }"
      @update:limit="(v) => { table.setLimit(v); onLimitChange(); }"
      @update:search="table.setSearch"
      @search="onSearch"
      @sort="onSort"
      @row-click="onRowClick"
      @edit="onEdit"
      @delete="onDelete"
    >
      <template #header>
        <div class="px-4 py-2 text-sm text-slate-500 dark:text-slate-400">
          Table header slot (filters, export, etc.)
        </div>
      </template>

      <!-- Custom cell for status -->
      <template #cell-status="{ row }">
        <span
          :class="[
            'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
            (row as { id?: number }).id! % 2 === 0
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
          ]"
        >
          {{ (row as { id?: number }).id! % 2 === 0 ? 'Active' : 'Inactive' }}
        </span>
      </template>

      <!-- Optional: override actions column -->
      <!-- <template #actions="{ row }">
        <button @click.stop="onEdit(row)">Edit</button>
      </template> -->
    </BaseTable>
  </div>
</template>
