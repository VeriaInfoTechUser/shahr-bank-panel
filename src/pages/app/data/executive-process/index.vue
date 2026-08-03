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
import AddCapabilityJobModal from './AddCapabilityJobModal.vue';
import ExecuteResultModal from './ExecuteResultModal.vue';
import JobBreadcrumbToolbar from './JobBreadcrumbToolbar.vue';

const { t } = useI18n();
const { openModal } = useGlobalModal();
const { setContent: setBreadcrumbSlot } = useBreadcrumbSlot();

const showPrimaryModal = ref(false);
const showSecondaryModal = ref(false);
const showCapabilityModal = ref(false);
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

function formatDate(v: unknown) {
  if (v == null || v === '') return '—';
  try {
    return new Date(String(v)).toLocaleDateString('fa-IR');
  } catch {
    return String(v);
  }
}

function formatDateTime(v: unknown) {
  if (v == null || v === '') return '—';
  try {
    return new Date(String(v)).toLocaleString('fa-IR');
  } catch {
    return String(v);
  }
}

function typeLabel(v: unknown) {
  const key = String(v ?? '').toUpperCase();
  const map: Record<string, string> = {
    CALCULATE: t('job.type-calculate'),
    RECALCULATE: t('job.type-recalculate'),
    UPDATE: t('job.type-update'),
    TEST: t('job.type-test'),
  };
  return map[key] ?? (key || '—');
}

function levelLabel(v: unknown) {
  const s = String(v ?? '').toUpperCase();
  if (s === 'CAPABILITY') return t('job.level-capability');
  return s === 'INDICATOR' ? t('job.level-secondary') : t('job.level-primary');
}

function stateBadgeClass(v: unknown) {
  const s = String(v ?? '');
  const map: Record<string, string> = {
    TO_DO: 'bg-warning/15 text-warning',
    IN_QUEUE: 'bg-info/15 text-info',
    IN_PROGRESS: 'bg-info/15 text-info',
    DONE: 'bg-success/15 text-success',
    FAILED: 'bg-danger/15 text-danger',
    CANCELLED: 'bg-slate-200 text-slate-600 dark:bg-darkmode-600 dark:text-slate-300',
  };
  return map[s] ?? 'bg-slate-200 text-slate-600 dark:bg-darkmode-600 dark:text-slate-300';
}

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
      bodyCell: (row) => {
        const s = String(row.slug ?? '');
        if (!s) return '—';
        return s.length > 12 ? `${s.slice(0, 8)}…` : s;
      },
    }),
    createColumn({
      key: 'indicator_name',
      label: t('job.indicator-name'),
      sortable: false,
      bodyCell: (row) => row.indicator_name ?? '—',
    }),
    createColumn({
      key: 'data_source_name',
      label: t('job.data-source-name'),
      sortable: false,
      bodyCell: (row) => row.data_source_name ?? '—',
    }),
    createColumn({
      key: 'calculation_level',
      label: t('job.calculation-level'),
      sortable: false,
      bodyCell: (row) => levelLabel(row.calculation_level),
    }),
    createColumn({
      key: 'type',
      label: t('job.type'),
      sortable: false,
      bodyCell: (row) => typeLabel(row.type),
    }),
    createColumn({
      key: 'state',
      label: t('job.status'),
      sortable: false,
      bodyCell: (row) => stateLabelMap[row.state as string] ?? (row.state as string) ?? '—',
    }),
    createColumn({
      key: 'date_range',
      label: t('job.date-range'),
      sortable: false,
      exportable: false,
      bodyCell: (row) => {
        if (row.date_from == null && row.date_to == null) return '—';
        return `${formatDate(row.date_from)} — ${formatDate(row.date_to)}`;
      },
    }),
    createColumn({
      key: 'retry_count',
      label: t('job.retry-count'),
      sortable: false,
      bodyCell: (row) => row.retry_count != null ? String(row.retry_count) : '—',
    }),
    createColumn({
      key: 'created_at',
      label: t('general.created-at'),
      sortable: false,
      bodyCell: (row) => formatDateTime(row.created_at),
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
    onAddCapability: onAddCapabilityJob,
    onExport: onExportJobs,
  });
});

function onAddPrimaryJob() {
  showPrimaryModal.value = true;
}

function onAddSecondaryJob() {
  showSecondaryModal.value = true;
}

function onAddCapabilityJob() {
  showCapabilityModal.value = true;
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
        <template #cell-slug="{ row }">
          <span v-if="row.slug" :title="String(row.slug)">
            {{ String(row.slug).slice(0, 8) }}…
          </span>
          <span v-else>—</span>
        </template>

        <template #cell-calculation_level="{ row }">
          <span class="inline-block rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {{ levelLabel(row.calculation_level) }}
          </span>
        </template>

        <template #cell-type="{ row }">
          <span class="inline-block rounded bg-info/15 px-2 py-0.5 text-xs font-medium text-info">
            {{ typeLabel(row.type) }}
          </span>
        </template>

        <template #cell-state="{ row }">
          <span
            class="inline-block rounded px-2 py-0.5 text-xs font-medium"
            :class="stateBadgeClass(row.state)"
          >
            {{ stateLabelMap[row.state as string] ?? (row.state as string) ?? '—' }}
          </span>
        </template>

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

    <AddCapabilityJobModal
      :show="showCapabilityModal"
      mode="add"
      @update:show="showCapabilityModal = $event"
      @success="onModalSuccess"
    />

    <ExecuteResultModal
      :show="showResultModal"
      :data="executeResultData"
      @update:show="showResultModal = $event"
    />
  </div>
</template>
