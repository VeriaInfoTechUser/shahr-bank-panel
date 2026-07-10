<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDataTable, createColumn, type FetchFn } from '@core';
import BaseTable from '@core/ui/base/BaseTable.vue';
import DocumentsBreadcrumbToolbar from './DocumentsBreadcrumbToolbar.vue';
import CreateDocumentModal from './CreateDocumentModal.vue';
import { useBreadcrumbSlot } from '@/composables/useBreadcrumb';
import { grcHttp } from '@/core/api/grcHttp';
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
  const res = await grcHttp.get(endpoints.rag.documents.list, {
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
      key: 'fileName',
      label: t('documents.col-file-name'),
      sortable: false,
      bodyCell: (row: Record<string, unknown>) => row.fileName ?? '—',
    }),
    createColumn({
      key: 'storagePath',
      label: t('documents.col-storage-path'),
      sortable: false,
      bodyCell: (row: Record<string, unknown>) => row.storagePath ?? '—',
    }),
    createColumn({
      key: 'mimeType',
      label: t('documents.col-type'),
      sortable: false,
    }),
    createColumn({
      key: 'fileSize',
      label: t('documents.col-size'),
      sortable: false,
      bodyCell: (row: Record<string, unknown>) => {
        const bytes = Number(row.fileSize ?? 0);
        if (!bytes) return '—';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
      },
    }),
    createColumn({
      key: 'chunkCount',
      label: t('documents.col-chunks'),
      sortable: false,
    }),
    createColumn({
      key: 'status',
      label: t('documents.col-status'),
      sortable: false,
      bodyCell: (row: Record<string, unknown>) => {
        const s = Number(row.status ?? 0);
        return s === 1 ? t('documents.status-active') : t('documents.status-inactive');
      },
    }),
    createColumn({
      key: 'createdAt',
      label: t('documents.col-created-at'),
      sortable: false,
      bodyCell: (row: Record<string, unknown>) => formatDate(String(row.createdAt ?? '')),
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
      />
    </div>

    <!-- Create Modal -->
    <CreateDocumentModal
      :show="showCreateModal"
      @update:show="showCreateModal = $event"
      @success="onModalSuccess"
    />
  </div>
</template>
