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
import AddJobModal from './AddJobModal.vue';
import JobBreadcrumbToolbar from './JobBreadcrumbToolbar.vue';

const { t } = useI18n();
const { setContent: setBreadcrumbSlot } = useBreadcrumbSlot();
const { openModal } = useGlobalModal();

const showAddModal = ref(false);
const showEditModal = ref(false);
const selectedJob = ref<Record<string, unknown> | null>(null);

const statusLabelMap: Record<string, string> = {
  TO_DO: t('job.status-to-do'),
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
      key: 'metric_slug',
      label: t('job.metric-slug'),
      sortable: false,
      bodyCell: (row) => row.metric_slug ?? '—',
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
      key: 'status',
      label: t('job.status'),
      sortable: false,
      bodyCell: (row) => statusLabelMap[row.status as string] ?? (row.status as string) ?? '—',
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
    onAdd: onAddJob,
    onExport: onExportJobs,
  });
});

function onEditJob(row: Record<string, unknown>) {
  selectedJob.value = row;
  showEditModal.value = true;
}

function onDeleteJob(row: Record<string, unknown>) {
  openModal({
    component: BaseConfirmModal,
    props: {
      titleKey: 'job.delete-confirm-title',
      messageKey: 'job.delete-confirm-message',
      confirmVariant: 'danger' as const,
      onConfirmAction: async () => {
        const id = row.id;
        if (!id) {
          toast(t('job.delete-error'), { type: 'error' });
          throw new Error('missing id');
        }
        const res = await grcRepo.calculationJobDelete(String(id));
        if (!res?.result) {
          const msg = res?.error?.[0] ?? t('job.delete-error');
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

function onAddJob() {
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
              @click.stop="onEditJob(row)"
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
              @click.stop="onDeleteJob(row)"
            >
              <Lucide icon="Trash2" class="!h-3.5 !w-3.5" />
            </Button>
          </div>
        </template>
      </BaseTable>
    </div>

    <AddJobModal
      :show="showAddModal"
      mode="add"
      @update:show="showAddModal = $event"
      @success="onModalSuccess"
    />

    <AddJobModal
      v-if="selectedJob"
      :show="showEditModal"
      mode="edit"
      :job="selectedJob"
      @update:show="showEditModal = $event"
      @success="onModalSuccess"
    />
  </div>
</template>
