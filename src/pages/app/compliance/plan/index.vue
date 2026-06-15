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
import AddPlanModal from './AddPlanModal.vue';
import PlanBreadcrumbToolbar from './PlanBreadcrumbToolbar.vue';

const { t } = useI18n();
const { setContent: setBreadcrumbSlot } = useBreadcrumbSlot();
const { openModal } = useGlobalModal();

const showAddModal = ref(false);

const fetchPlans: FetchFn = async ({ page, limit, filters }) => {
  const res = await grcRepo.planList({ page, limit, ...(filters ?? {}) });
  const list = res?.data?.list ?? [];
  const count = res?.data?.paginator?.count ?? 0;
  return { list: Array.isArray(list) ? list : [], count };
};

const table = useDataTable({
  fetchFn: fetchPlans,
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
      bodyCell: (row) => row.summary,
    }),
  ],
  selectable: false,
  exportEnabled: true,
  pageSize: 10,
  cacheKey: 'plan-list',
  listCacheStaleTime: 0,
});

function onExportPlans() {
  table.exportCSV();
}

onMounted(() => {
  table.invalidateListCache();
  table.fetch();
  setBreadcrumbSlot(PlanBreadcrumbToolbar, {
    onAdd: onAddPlan,
    onExport: onExportPlans,
    table,
  });
});

function onDeletePlan(row: Record<string, unknown>) {
  openModal({
    component: BaseConfirmModal,
    props: {
      titleKey: 'plan.delete-confirm-title',
      messageKey: 'plan.delete-confirm-message',
      confirmVariant: 'danger' as const,
      onConfirmAction: async () => {
        const slug = row.slug;
        if (!slug) {
          toast(t('plan.delete-error'), { type: 'error' });
          throw new Error('missing slug');
        }
        const res = await grcRepo.planDelete(slug as string);
        if (!res?.result) {
          const msg = res?.error?.[0] ?? t('plan.delete-error');
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

function onAddPlan() {
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
        :actions-header="t('task.settings')"
        :show-search="false"
      >
        <template #actions="{ row }">
          <div class="flex items-center justify-center gap-3">
            <Button
              type="button"
              variant="outline-danger"
              size="sm"
              class="!h-7 !w-7 !px-0 !py-0"
              :aria-label="t('task.delete')"
              :title="t('task.delete')"
              @click.stop="onDeletePlan(row)"
            >
              <Lucide icon="Trash2" class="!h-3.5 !w-3.5" />
            </Button>
          </div>
        </template>
      </BaseTable>
    </div>

    <AddPlanModal
      :show="showAddModal"
      @update:show="showAddModal = $event"
      @success="onModalSuccess"
    />
  </div>
</template>
