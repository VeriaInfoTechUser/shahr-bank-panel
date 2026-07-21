<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDataTable, createColumn, type FetchFn } from '@core';
import BaseTable from '@core/ui/base/BaseTable.vue';
import BaseConfirmModal from '@/core/ui/base/BaseConfirmModal.vue';
import { grcRepo } from '@/core/repositories/grcRepo';
import { useBreadcrumbSlot } from '@/composables/useBreadcrumb';
import { useGlobalModal } from '@/composables/useGlobalModal';
import Button from '@/base-components/Button';
import Lucide from '@/base-components/Lucide';
import IndicatorFormModal from './IndicatorFormModal.vue';
import IndicatorBreadcrumbToolbar from './IndicatorBreadcrumbToolbar.vue';

const { t } = useI18n();
const { setContent: setBreadcrumbSlot } = useBreadcrumbSlot();
const { openModal } = useGlobalModal();

const showAddModal = ref(false);
const showEditModal = ref(false);
const selectedIndicator = ref<Record<string, unknown> | null>(null);

function pickStr(row: Record<string, unknown>, ...keys: string[]) {
  for (const k of keys) {
    const v = row[k];
    if (v == null) continue;
    if (typeof v === 'string' && v.trim()) return v;
    if (typeof v === 'number' && !Number.isNaN(v)) return String(v);
  }
  return '—';
}

const fetchIndicators: FetchFn = async ({ page, limit, filters }) => {
  const res = await grcRepo.indicatorList({ page, limit, ...(filters ?? {}) });
  const list = res?.data?.list ?? [];
  const count = res?.data?.paginator?.count ?? 0;
  return { list: Array.isArray(list) ? list : [], count };
};

const table = useDataTable({
  fetchFn: fetchIndicators,
  columns: [
    createColumn({
      key: 'slug',
      label: t('sustainability-indicator-page.col-slug'),
      sortable: false,
      bodyCell: (row) => pickStr(row, 'slug'),
    }),
    createColumn({
      key: 'title',
      label: t('sustainability-indicator-page.col-title'),
      sortable: false,
      bodyCell: (row) => pickStr(row, 'title', 'name'),
    }),
    createColumn({
      key: 'number',
      label: t('sustainability-indicator-page.col-number'),
      sortable: false,
      bodyCell: (row) => pickStr(row, 'number'),
    }),
    createColumn({
      key: 'status',
      label: t('sustainability-indicator-page.col-status'),
      sortable: false,
      bodyCell: (row) => row.status === 1 ? t('sustainability-indicator-page.status-active') : t('sustainability-indicator-page.status-inactive'),
    }),
    createColumn({
      key: 'description',
      label: t('sustainability-indicator-page.col-description'),
      sortable: false,
      bodyCell: (row) => pickStr(row, 'description', 'summary'),
    }),
  ],
  selectable: false,
  exportEnabled: true,
  cacheKey: 'sustainability-indicators-list',
  listCacheStaleTime: 0,
});

function onExportIndicators() {
  table.exportCSV();
}

function onAddIndicator() {
  showAddModal.value = true;
}

function onEditIndicator(row: Record<string, unknown>) {
  selectedIndicator.value = row;
  showEditModal.value = true;
}

function onDeleteIndicator(row: Record<string, unknown>) {
  openModal({
    component: BaseConfirmModal,
    props: {
      titleKey: 'sustainability-indicator-page.delete-title',
      messageKey: 'sustainability-indicator-page.delete-message',
      messageParams: { title: pickStr(row, 'title', 'slug') },
      confirmVariant: 'danger' as const,
      onConfirmAction: async () => {
        const slug = String(row.slug ?? '');
        if (!slug) {
          const msg = t('sustainability-indicator-page.delete-error');
          throw new Error(msg);
        }
        const res = await grcRepo.indicatorDelete(slug);
        if (!res?.result) {
          const msg = String(res?.error ?? t('sustainability-indicator-page.delete-error'));
          throw new Error(msg);
        }
      },
    },
    onSuccess: () => {
      table.invalidateListCache();
      void table.fetch();
    },
  });
}

function onModalSuccess() {
  table.invalidateListCache();
  table.setPage(1);
}

import { onMounted } from 'vue';

onMounted(() => {
  table.invalidateListCache();
  table.fetch();
  setBreadcrumbSlot(IndicatorBreadcrumbToolbar, {
    onAdd: onAddIndicator,
    onExport: onExportIndicators,
    table,
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
        :empty-message="t('general.no-data')"
        :actions="true"
        :show-search="false"
      >
        <template #actions="{ row }">
          <div class="flex items-center justify-center gap-3">
            <Button
              type="button"
              variant="outline-secondary"
              size="sm"
              class="!h-7 !w-7 !px-0 !py-0"
              :aria-label="t('title.update')"
              :title="t('title.update')"
              @click.stop="onEditIndicator(row)"
            >
              <Lucide icon="Pencil" class="!h-3.5 !w-3.5" />
            </Button>
            <Button
              type="button"
              variant="outline-danger"
              size="sm"
              class="!h-7 !w-7 !px-0 !py-0"
              :aria-label="t('general.delete')"
              :title="t('general.delete')"
              @click.stop="onDeleteIndicator(row)"
            >
              <Lucide icon="Trash2" class="!h-3.5 !w-3.5" />
            </Button>
          </div>
        </template>
      </BaseTable>
    </div>

    <IndicatorFormModal
      :show="showAddModal"
      @update:show="showAddModal = $event"
      @success="onModalSuccess"
    />

    <IndicatorFormModal
      v-if="selectedIndicator"
      :show="showEditModal"
      :record="selectedIndicator"
      @update:show="showEditModal = $event"
      @success="onModalSuccess"
    />
  </div>
</template>
