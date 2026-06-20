<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import { onMounted, ref } from 'vue';
import { useDataTable, createColumn, type FetchFn } from '@core';
import BaseTable from '@core/ui/base/BaseTable.vue';
import BaseConfirmModal from '@core/ui/base/BaseConfirmModal.vue';
import { grcRepo } from '@/core/repositories/grcRepo';
import { useBreadcrumbSlot } from '@/composables/useBreadcrumb';
import { useGlobalModal } from '@/composables/useGlobalModal';
import Button from '@/base-components/Button';
import Lucide from '@/base-components/Lucide';
import AddFrameworkModal from './AddFrameworkModal.vue';
import FrameworkBreadcrumbToolbar from './FrameworkBreadcrumbToolbar.vue';

const { t } = useI18n();
const { setContent: setBreadcrumbSlot } = useBreadcrumbSlot();
const { openModal } = useGlobalModal();

const showAddModal = ref(false);
const showEditModal = ref(false);
const selectedFramework = ref<Record<string, unknown> | null>(null);

const fetchFrameworks: FetchFn = async ({ page, limit, filters }) => {
  const res = await grcRepo.frameworkList({ page, limit, ...(filters ?? {}) });
  const list = res?.data?.list ?? [];
  const count = res?.data?.paginator?.count ?? 0;
  return { list: Array.isArray(list) ? list : [], count };
};

const table = useDataTable({
  fetchFn: fetchFrameworks,
  columns: [
    createColumn({
      key: 'slug',
      label: t('title.id'),
      sortable: false,
      bodyCell: (row) => row.slug ?? '—',
    }),
    createColumn({
      key: 'title',
      label: t('title.title'),
      sortable: false,
      bodyCell: (row) => row.title ?? '—',
    }),
    createColumn({
      key: 'summary',
      label: t('title.summary'),
      sortable: false,
      bodyCell: (row) => row.summary ,
    }),
    createColumn({
      key: 'domainsCount',
      label: t('framework.domains-count'),
      sortable: false,
      bodyCell: (row) => row.domainsCount ?? '0',
    }),
    createColumn({
      key: 'controlCount',
      label: t('framework.controls-count'),
      sortable: false,
      bodyCell: (row) => row.controlCount ?? '0',
    }),
  ],
  selectable: false,
  exportEnabled: true,
  pageSize: 10,
  cacheKey: 'framework-list',
  listCacheStaleTime: 0,
});

function onExportFrameworks() {
  table.exportCSV();
}

onMounted(() => {
  table.invalidateListCache();
  table.fetch();
  setBreadcrumbSlot(FrameworkBreadcrumbToolbar, {
    onAdd: onAddFramework,
    onExport: onExportFrameworks,
    table,
  });
});

function onEditFramework(row: Record<string, unknown>) {
  selectedFramework.value = row;
  showEditModal.value = true;
}

function onDeleteFramework(row: Record<string, unknown>) {
  openModal({
    component: BaseConfirmModal,
    props: {
      titleKey: 'framework.delete-confirm-title',
      messageKey: 'framework.delete-confirm-message',
      confirmVariant: 'danger' as const,
      onConfirmAction: async () => {
        const slug = row.slug;
        if (!slug) {
          toast(t('framework.delete-error'), { type: 'error' });
          throw new Error('missing slug');
        }
        const res = await grcRepo.frameworkDelete(slug as string);
        if (!res?.result) {
          const msg = res?.error?.[0] ?? t('framework.delete-error');
          toast(msg, { type: 'error' });
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

function onAddFramework() {
  showAddModal.value = true;
}

function onModalSuccess() {
  table.invalidateListCache();
  table.setPage(1);
}
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
              @click.stop="onEditFramework(row)"
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
              @click.stop="onDeleteFramework(row)"
            >
              <Lucide icon="Trash2" class="!h-3.5 !w-3.5" />
            </Button>
          </div>
        </template>
      </BaseTable>
    </div>

    <AddFrameworkModal
      :show="showAddModal"
      mode="add"
      @update:show="showAddModal = $event"
      @success="onModalSuccess"
    />

    <AddFrameworkModal
      v-if="selectedFramework"
      :show="showEditModal"
      mode="edit"
      :framework="selectedFramework"
      @update:show="showEditModal = $event"
      @success="onModalSuccess"
    />
  </div>
</template>
