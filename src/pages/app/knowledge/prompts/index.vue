<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useDataTable, createColumn, type FetchFn } from '@core';
import BaseTable from '@core/ui/base/BaseTable.vue';
import PromptsBreadcrumbToolbar from './PromptsBreadcrumbToolbar.vue';
import CreatePromptModal from './CreatePromptModal.vue';
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
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('fa-IR');
  } catch {
    return iso;
  }
}

const typeLabels: Record<string, string> = {
  'structure-data': 'داده ساخت‌یافته',
  agent: 'عامل',
};

const fetchPrompts: FetchFn = async ({ page, limit, filters }) => {
  const res = await grcHttp.get(endpoints.rag.prompts.list, {
    params: { page, limit, ...filters },
  });
  const body = (res as Record<string, unknown>)?.data as Record<string, unknown> | undefined;
  const inner = body?.data as Record<string, unknown> | undefined;
  const list = (inner?.list ?? []) as Record<string, unknown>[];
  const count = (inner?.paginator as Record<string, unknown>)?.count ?? 0;
  return { list: Array.isArray(list) ? list : [], count: Number(count) };
};

const table = useDataTable({
  fetchFn: fetchPrompts,
  columns: [
    createColumn({
      key: 'title',
      label: t('prompts.col-title'),
      sortable: false,
      bodyCell: (row: Record<string, unknown>) => row.title ?? '—',
    }),
    createColumn({
      key: 'summary',
      label: t('prompts.col-summary'),
      sortable: false,
      bodyCell: (row: Record<string, unknown>) => row.summary ?? '—',
    }),
    createColumn({
      key: 'type',
      label: t('prompts.col-type'),
      sortable: false,
      bodyCell: (row: Record<string, unknown>) => typeLabels[String(row.type ?? '')] ?? row.type ?? '—',
    }),
    createColumn({
      key: 'createdAt',
      label: t('prompts.col-created-at'),
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
  cacheKey: 'prompts-list',
  listCacheStaleTime: 0,
});

function onModalSuccess() {
  table.invalidateListCache();
  table.setPage(1);
}

onMounted(() => {
  table.fetch();
  setBreadcrumbSlot(PromptsBreadcrumbToolbar, {
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
        :empty-message="t('prompts.empty')"
        :actions="true"
        :show-search="false"
      >
        <template #actions="{ row }">
          <div class="flex items-center justify-center gap-2">
            <a
              href="#"
              class="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-primary transition-colors hover:bg-primary/10"
              @click.prevent="router.push({ name: 'app-knowledge-prompts-detail', params: { slug: row.slug } })"
            >
              <Lucide icon="Eye" class="h-3.5 w-3.5" />
              {{ t('prompts.detail-title') }}
            </a>
          </div>
        </template>
      </BaseTable>
    </div>

    <CreatePromptModal
      :show="showCreateModal"
      @update:show="showCreateModal = $event"
      @success="onModalSuccess"
    />
  </div>
</template>
