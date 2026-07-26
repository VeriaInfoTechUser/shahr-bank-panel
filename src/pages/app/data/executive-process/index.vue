<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import { onMounted, ref } from 'vue';
import { useDataTable, createColumn, type FetchFn } from '@core';
import BaseTable from '@core/ui/base/BaseTable.vue';
import BaseConfirmModal from '@core/ui/base/BaseConfirmModal.vue';
import { grcRepo } from '@/core/repositories/grcRepo';
import { useGlobalModal } from '@/composables/useGlobalModal';
import { useBreadcrumbSlot } from '@/composables/useBreadcrumb';
import Button from '@/base-components/Button';
import Lucide from '@/base-components/Lucide';
import AddPrimaryJobModal from './AddPrimaryJobModal.vue';
import AddSecondaryJobModal from './AddSecondaryJobModal.vue';
import ExecuteResultModal from './ExecuteResultModal.vue';
import JobBreadcrumbToolbar from './JobBreadcrumbToolbar.vue';

const { t } = useI18n();
const { openModal } = useGlobalModal();
const { setContent: setBreadcrumbSlot } = useBreadcrumbSlot();

const showPrimaryModal = ref(false);
const showSecondaryModal = ref(false);
const showResultModal = ref(false);
const executeResultData = ref<Record<string, unknown> | null>(null);

const stateLabelMap: Record<string, string> = {
  TO_DO: t('job.status-to-do'),
  IN_QUEUE: t('job.status-in-queue'),
  IN_PROGRESS: t('job.status-in-progress'),
  DONE: t('job.status-done'),
  FAILED: t('job.status-failed'),
  CANCELLED: t('job.status-cancelled'),
};

const fetchJobs: FetchFn = async ({ page, limit, filters }) => {
  const res = await grcRepo.calculationJobList({ page, limit, ...(filters ?? {}) });
  const list = res?.data?.list ?? [];
  const count = res?.data?.paginator?.count ?? 0;
  return { list: Array.isArray(list) ? list : [], count };
};

const table = useDataTable({
  fetchFn: fetchJobs,
  columns: [
    createColumn({
      key: 'slug',
      label: t('job.slug'),
      sortable: false,
      bodyCell: (row) => row.slug ?? '—',
    }),
    createColumn({
      key: 'indicator_name',
      label: t('job.indicator-name'),
      sortable: false,
      bodyCell: (row) => row.indicator_name ?? '—',
    }),
createColumn({
      key: 'indicator_name',
      label: t('job.indicator-name'),
      sortable: false,
      bodyCell: (row) => row.indicator_name ?? '—',
    }),
    createColumn({
      key: 'type',
      label: t('job.type'),
      sortable: false,
      bodyCell: (row) => row.type ?? '—',
    }),
    createColumn({
      key: 'calculation_level',
      label: t('job.calculation-level'),
      sortable: false,
      bodyCell: (row) => row.calculation_level ?? '—',
    }),
    createColumn({
      key: 'state',
      label: t('job.status'),
      sortable: false,
      bodyCell: (row) => stateLabelMap[row.state as string] ?? (row.state as string) ?? '—',
    }),
    createColumn({
      key: 'date_from',
      label: t('job.date-from'),
      sortable: false,
      bodyCell: (row) => {
        if (!row.date_from) return '—';
        return new Date(row.date_from as string).toLocaleString('fa-IR');
      },
    }),
    createColumn({
      key: 'date_to',
      label: t('job.date-to'),
      sortable: false,
      bodyCell: (row) => {
        if (!row.date_to) return '—';
        return new Date(row.date_to as string).toLocaleString('fa-IR');
      },
    }),
    createColumn({
      key: 'retry_count',
      label: t('job.retry-count'),
      sortable: false,
      bodyCell: (row) => row.retry_count != null ? String(row.retry_count) : '—',
    }),
  ],
  selectable: false,
  exportEnabled: true,
  cacheKey: 'calculation-job-list',
  listCacheStaleTime: 0,
});

function onExportJobs() {
  table.exportCSV();
}

onMounted(() => {
  table.invalidateListCache();
  table.fetch();
  setBreadcrumbSlot(JobBreadcrumbToolbar, {
    onAddPrimary: onAddPrimaryJob,
    onAddSecondary: onAddSecondaryJob,
    onExport: onExportJobs,
  });
});

function onAddPrimaryJob() {
  showPrimaryModal.value = true;
}

function onAddSecondaryJob() {
  showSecondaryModal.value = true;
}

function onExecuteJob(row: Record<string, unknown>) {
  openModal({
    component: BaseConfirmModal,
    props: {
      titleKey: 'job.execute-confirm-title',
      messageKey: 'job.execute-confirm-message',
      confirmVariant: 'primary' as const,
      onConfirmAction: async () => {
        const slug = row.slug;
        if (!slug) {
          toast(t('job.execute-error'), { type: 'error' });
          throw new Error('missing slug');
        }
        const res = await grcRepo.calculationJobExecute(String(slug));
        if (!res?.result) {
          const msg = res?.error?.[0] ?? t('job.execute-error');
          toast(msg, { type: 'error' });
          throw new Error(msg);
        }
        executeResultData.value = res.data;
        showResultModal.value = true;
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
          <div class="flex items-center justify-center">
            <Button
              type="button"
              variant="primary"
              size="sm"
              class="!h-7 !px-2.5 !py-0"
              :aria-label="t('job.execute-confirm-title')"
              :title="t('job.execute-confirm-title')"
              @click.stop="onExecuteJob(row)"
            >
              <Lucide icon="Play" class="!h-3.5 !w-3.5" />
            </Button>
          </div>
        </template>
      </BaseTable>
    </div>

    <AddPrimaryJobModal
      :show="showPrimaryModal"
      mode="add"
      @update:show="showPrimaryModal = $event"
      @success="onModalSuccess"
    />

    <AddSecondaryJobModal
      :show="showSecondaryModal"
      mode="add"
      @update:show="showSecondaryModal = $event"
      @success="onModalSuccess"
    />

    <ExecuteResultModal
      :show="showResultModal"
      :data="executeResultData"
      @update:show="showResultModal = $event"
    />
  </div>
</template>
