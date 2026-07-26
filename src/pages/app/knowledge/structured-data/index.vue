<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useDataTable, createColumn, type FetchFn } from '@core';
import BaseTable from '@core/ui/base/BaseTable.vue';
import StructuredDataBreadcrumbToolbar from './StructuredDataBreadcrumbToolbar.vue';
import CreateStructuredDataModal from './CreateStructuredDataModal.vue';
import { useBreadcrumbSlot } from '@/composables/useBreadcrumb';
import Lucide from '@/base-components/Lucide';
import { grcHttp } from '@/core/api/grcHttp';
import { endpoints } from '@/core/api/endpoints';

const { t } = useI18n();
const router = useRouter();
const { setContent: setBreadcrumbSlot } = useBreadcrumbSlot();

const showCreateModal = ref(false);
const showFilter = ref(false);

function formatDate(iso: string) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('fa-IR');
  } catch {
    return iso;
  }
}

const tagOptions: Record<string, string> = {
  legal: 'حقوقی',
  compliance: 'تطبیق',
  risk: 'ریسک',
  governance: 'حاکمیت',
  esg: 'پایداری',
  policy: 'سیاست‌نامه',
};

const fetchStructuredData: FetchFn = async ({ page, limit, filters }) => {
  const res = await grcHttp.get(endpoints.rag.structuredData.list, {
    params: { page, limit, ...filters },
  });
  const body = (res as Record<string, unknown>)?.data as Record<string, unknown> | undefined;
  const inner = body?.data as Record<string, unknown> | undefined;
  const list = (inner?.list ?? []) as Record<string, unknown>[];
  const count = (inner?.paginator as Record<string, unknown>)?.count ?? 0;
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
      key: 'promptTitle',
      label: t('structured-data.col-prompt-title'),
      sortable: false,
      bodyCell: (row: Record<string, unknown>) => row.promptTitle ?? '—',
    }),
    createColumn({
      key: 'promptSummary',
      label: t('structured-data.col-prompt-summary'),
      sortable: false,
      bodyCell: (row: Record<string, unknown>) => row.promptSummary ?? '—',
    }),
    createColumn({
      key: 'dataText',
      label: t('structured-data.col-data-text'),
      sortable: false,
      bodyCell: (row: Record<string, unknown>) => {
        const text = String(row.dataText ?? '');
        return text.length > 80 ? text.slice(0, 80) + '...' : (text || ' ');
      },
    }),
    createColumn({
      key: 'chunkCount',
      label: t('structured-data.col-chunk-count'),
      sortable: false,
      bodyCell: (row: Record<string, unknown>) => row.chunkCount ?? 0,
    }),
    createColumn({
      key: 'tags',
      label: t('structured-data.col-tags'),
      sortable: false,
      bodyCell: (row: Record<string, unknown>) => {
        const tags = (row.tags ?? []) as string[];
        return tags.length ? tags.join(', ') : '';
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
      label: '',
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
        <template #cell-tags="{ row }">
          <div class="flex flex-wrap justify-center gap-1">
            <template v-if="(row.tags as string[])?.length">
              <span
                v-for="tag in (row.tags as string[])"
                :key="tag"
                class="inline-flex items-center rounded-full border border-primary/15 bg-primary/5 px-2 py-0.5 text-[11px] font-medium text-primary dark:border-primary/20 dark:bg-primary/10 dark:text-primary"
              >
                {{ tagOptions[tag] ?? tag }}
              </span>
            </template>
          </div>
        </template>

        <template #actions="{ row }">
          <div class="flex items-center justify-center gap-2">
            <a
              href="#"
              class="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-primary transition-colors hover:bg-primary/10"
              @click.prevent="router.push({ name: 'app-knowledge-structured-data-detail', params: { slug: row.slug } })"
            >
              <Lucide icon="Eye" class="h-3.5 w-3.5" />
              {{ t('structured-data.detail-title') }}
            </a>
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
