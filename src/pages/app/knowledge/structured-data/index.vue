<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDataTable, createColumn, type FetchFn } from '@core';
import BaseTable from '@core/ui/base/BaseTable.vue';
import StructuredDataBreadcrumbToolbar from './StructuredDataBreadcrumbToolbar.vue';
import CreateStructuredDataModal from './CreateStructuredDataModal.vue';
import { useBreadcrumbSlot } from '@/composables/useBreadcrumb';
import { grcHttp } from '@/core/api/grcHttp';
import { endpoints } from '@/core/api/endpoints';

const { t } = useI18n();
const { setContent: setBreadcrumbSlot } = useBreadcrumbSlot();

const showCreateModal = ref(false);
const showFilter = ref(false);

function formatDate(iso: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('fa-IR');
  } catch {
    return iso;
  }
}

const fetchStructuredData: FetchFn = async ({ page, limit, filters }) => {
  const res = await grcHttp.get(endpoints.rag.structuredData.list, {
    params: { page, limit, ...filters },
  });
  const body = (res as Record<string, unknown>)?.data as Record<string, unknown> | undefined;
  const list = (body?.list ?? []) as Record<string, unknown>[];
  const count = (body?.paginator as Record<string, unknown>)?.count ?? 0;
  return { list: Array.isArray(list) ? list : [], count: Number(count) };
};

const table = useDataTable({
  fetchFn: fetchStructuredData,
  columns: [
    createColumn({
      key: 'title',
      label: t('structured-data.col-title'),
      sortable: false,
      bodyCell: (row: Record<string, unknown>) => row.title ?? '—',
    }),
    createColumn({
      key: 'tags',
      label: t('structured-data.col-tags'),
      sortable: false,
      bodyCell: (row: Record<string, unknown>) => {
        const tags = (row.tags ?? []) as string[];
        return tags.length ? tags.join(', ') : '—';
      },
    }),
    createColumn({
      key: 'isConverted',
      label: t('structured-data.col-is-converted'),
      sortable: false,
      bodyCell: (row: Record<string, unknown>) => {
        return row.isConverted ? t('structured-data.status-yes') : t('structured-data.status-no');
      },
    }),
    createColumn({
      key: 'createdAt',
      label: t('structured-data.col-created-at'),
      sortable: false,
      bodyCell: (row: Record<string, unknown>) => formatDate(String(row.createdAt ?? '')),
    }),
    createColumn({
      key: 'actions',
      label: t('structured-data.col-actions'),
      sortable: false,
    }),
  ],
  selectable: false,
  exportEnabled: true,
  cacheKey: 'structured-data-list',
  listCacheStaleTime: 0,
});

function onModalSuccess() {
  table.invalidateListCache();
  table.setPage(1);
}

onMounted(() => {
  table.fetch();
  setBreadcrumbSlot(StructuredDataBreadcrumbToolbar, {
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
        :empty-message="t('structured-data.empty')"
        :actions="true"
        :show-search="false"
      >
        <template #actions="{ row }">
          <div class="flex items-center justify-center gap-2">
            <span class="text-[11px] text-slate-400 dark:text-slate-500">
              {{ row.id ?? '—' }}
            </span>
          </div>
        </template>
      </BaseTable>
    </div>

    <CreateStructuredDataModal
      :show="showCreateModal"
      @update:show="showCreateModal = $event"
      @success="onModalSuccess"
    />
  </div>
</template>
