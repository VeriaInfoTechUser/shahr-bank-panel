<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDataTable, createColumn, type FetchFn } from '@core';
import BaseTable from '@core/ui/base/BaseTable.vue';
import DocumentsBreadcrumbToolbar from './DocumentsBreadcrumbToolbar.vue';
import CreateDocumentModal from './CreateDocumentModal.vue';
import { useBreadcrumbSlot } from '@/composables/useBreadcrumb';
import { http } from '@/core/api/http';
import { endpoints } from '@/core/api/endpoints';

const { t } = useI18n();
const { setContent: setBreadcrumbSlot } = useBreadcrumbSlot();

// ── Modals ──────────────────────────────────────────────────────────────────
const showCreateModal = ref(false);

// ── Filters ─────────────────────────────────────────────────────────────────
const showFilter = ref(false);

// ── Table ───────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('fa-IR');
  } catch {
    return iso;
  }
}

const fetchDocuments: FetchFn = async ({ page, limit, filters }) => {
  const res = await http.get(endpoints.rag.documents.process, {
    params: { page, limit, ...filters },
  });
  const data = (res as Record<string, unknown>)?.data as Record<string, unknown> | undefined;
  const list = (data?.list ?? []) as Record<string, unknown>[];
  const count = (data?.paginator as Record<string, unknown>)?.count ?? 0;
  return { list: Array.isArray(list) ? list : [], count: Number(count) };
};

const table = useDataTable({
  fetchFn: fetchDocuments,
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
      bodyCell: (row: Record<string, unknown>) => formatDate(String(row.updatedAt ?? '')),
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

function onModalSuccess() {
  table.invalidateListCache();
  table.setPage(1);
}

onMounted(() => {
  table.fetch();
  setBreadcrumbSlot(DocumentsBreadcrumbToolbar, {
    onAdd: () => { showCreateModal.value = true; },
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

    <!-- Create Modal -->
    <CreateDocumentModal
      :show="showCreateModal"
      @update:show="showCreateModal = $event"
      @success="onModalSuccess"
    />
  </div>
</template>
