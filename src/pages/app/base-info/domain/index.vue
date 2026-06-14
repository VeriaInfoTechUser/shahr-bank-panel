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
import AddDomainModal from './AddDomainModal.vue';

const { t } = useI18n();
const { setContent: setBreadcrumbSlot } = useBreadcrumbSlot();
const { openModal } = useGlobalModal();

const showAddModal = ref(false);
const showEditModal = ref(false);
const selectedDomain = ref<Record<string, unknown> | null>(null);

const fetchDomains: FetchFn = async ({ page, limit }) => {
  const res = await grcRepo.domainList({ page, limit });
  const list = res?.data?.list ?? [];
  const count = res?.data?.paginator?.count ?? 0;
  return { list: Array.isArray(list) ? list : [], count };
};

const table = useDataTable({
  fetchFn: fetchDomains,
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
      key: 'status',
      label: t('title.status'),
      sortable: false,
      bodyCell: (row) => row.status === 1 ? t('status.active') : t('status.inactive'),
    }),
    createColumn({
      key: 'controlCount',
      label: t('domain.controls-count'),
      sortable: false,
      bodyCell: (row) => row.controlCount ?? '0',
    }),
  ],
  selectable: false,
  exportEnabled: true,
  pageSize: 10,
  cacheKey: 'domain-list',
  listCacheStaleTime: 0,
});

onMounted(() => {
  table.invalidateListCache();
  table.fetch();
  setBreadcrumbSlot(null);
});

function onEditDomain(row: Record<string, unknown>) {
  selectedDomain.value = row;
  showEditModal.value = true;
}

function onDeleteDomain(row: Record<string, unknown>) {
  openModal({
    component: BaseConfirmModal,
    props: {
      titleKey: 'domain.delete-confirm-title',
      messageKey: 'domain.delete-confirm-message',
      confirmVariant: 'danger' as const,
      onConfirmAction: async () => {
        const slug = row.slug;
        if (!slug) {
          toast(t('domain.delete-error'), { type: 'error' });
          throw new Error('missing slug');
        }
        const res = await grcRepo.domainDelete(slug as string);
        if (!res?.result) {
          const msg = res?.error?.[0] ?? t('domain.delete-error');
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

function onAddDomain() {
  showAddModal.value = true;
}

function onModalSuccess() {
  table.invalidateListCache();
  table.setPage(1);
}
</script>

<template>
  <div class="grid grid-cols-12 gap-2 p-2">
    <div class="col-span-12 flex justify-end mb-2">
      <Button
        type="button"
        variant="primary"
        @click="onAddDomain"
      >
        <Lucide icon="Plus" class="h-4 w-4 mr-1" />
        {{ t('domain.add') }}
      </Button>
    </div>
    <div class="col-span-12">
      <BaseTable
        :table="table"
        :selectable="false"
        :export-enabled="table.exportEnabled"
        :empty-message="t('general.no-data')"
        :actions="true"
        :actions-header="t('task.settings')"
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
              @click.stop="onEditDomain(row)"
            >
              <Lucide icon="Pencil" class="!h-3.5 !w-3.5" />
            </Button>
            <Button
              type="button"
              variant="outline-danger"
              size="sm"
              class="!h-7 !w-7 !px-0 !py-0"
              :aria-label="t('task.delete')"
              :title="t('task.delete')"
              @click.stop="onDeleteDomain(row)"
            >
              <Lucide icon="Trash2" class="!h-3.5 !w-3.5" />
            </Button>
          </div>
        </template>
      </BaseTable>
    </div>

    <AddDomainModal
      :show="showAddModal"
      mode="add"
      @update:show="showAddModal = $event"
      @success="onModalSuccess"
    />

    <AddDomainModal
      v-if="selectedDomain"
      :show="showEditModal"
      mode="edit"
      :domain="selectedDomain"
      @update:show="showEditModal = $event"
      @success="onModalSuccess"
    />
  </div>
</template>
