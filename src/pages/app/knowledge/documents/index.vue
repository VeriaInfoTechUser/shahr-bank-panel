<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDataTable, createColumn } from '@core';
import BaseTable from '@core/ui/base/BaseTable.vue';
import DocumentsBreadcrumbToolbar from './DocumentsBreadcrumbToolbar.vue';
import { useBreadcrumbSlot } from '@/composables/useBreadcrumb';

const { t } = useI18n();
const { setContent: setBreadcrumbSlot } = useBreadcrumbSlot();

// ── Filters ─────────────────────────────────────────────────────────────────
const showFilter = ref(false);

// ── Table ───────────────────────────────────────────────────────────────────
const table = useDataTable({
  columns: [
    createColumn({
      key: 'title',
      label: t('documents.col-title'),
      sortable: false,
      bodyCell: (row: Record<string, unknown>) => row.title ?? '—',
    }),
    createColumn({
      key: 'category',
      label: t('documents.col-category'),
      sortable: false,
    }),
    createColumn({
      key: 'type',
      label: t('documents.col-type'),
      sortable: false,
    }),
    createColumn({
      key: 'size',
      label: t('documents.col-size'),
      sortable: false,
    }),
    createColumn({
      key: 'updatedAt',
      label: t('documents.col-updated-at'),
      sortable: false,
      bodyCell: (row: Record<string, unknown>) => {
        const iso = String(row.updatedAt ?? '');
        if (!iso) return '—';
        try {
          return new Date(iso).toLocaleDateString('fa-IR');
        } catch {
          return iso;
        }
      },
    }),
    createColumn({
      key: 'status',
      label: t('documents.col-status'),
      sortable: false,
    }),
  ],
  selectable: false,
  exportEnabled: true,
  cacheKey: 'documents-list',
  listCacheStaleTime: 0,
});

onMounted(() => {
  setBreadcrumbSlot(DocumentsBreadcrumbToolbar, {
    onAdd: () => { /* TODO: open add modal */ },
    onExport: () => table.exportCSV(),
    onFilter: () => { showFilter.value = !showFilter.value; },
    onClearFilters: () => table.clearFilters(),
    hasActiveFilters: false,
  });
});
</script>

<template>
  <div class="grid grid-cols-12 gap-2 p-2">
    <div class="col-span-12">
      <BaseTable
        :table="table"
        :selectable="false"
        :export-enabled="table.exportEnabled"
        :empty-message="t('documents.empty')"
        :actions="true"
        :show-search="false"
      >
        <!-- Status badge -->
        <template #cell-status="{ row }">
          <span
            class="inline-block rounded px-2 py-0.5 text-xs font-medium"
            :class="row.status === 'active' ? 'bg-success/15 text-success' : 'bg-slate-100 text-slate-500 dark:bg-darkmode-600 dark:text-slate-400'"
          >
            {{ row.status === 'active' ? t('documents.status-active') : t('documents.status-inactive') }}
          </span>
        </template>
      </BaseTable>
    </div>
  </div>
</template>
