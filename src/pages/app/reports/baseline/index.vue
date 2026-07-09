<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDataTable, createColumn, type FetchFn } from '@core';
import BaseTable from '@core/ui/base/BaseTable.vue';
import { useBreadcrumbSlot } from '@/composables/useBreadcrumb';
import Button from '@/base-components/Button';
import Lucide from '@/base-components/Lucide';
import CreateReportModal from './CreateReportModal.vue';
import BaselineBreadcrumbToolbar from './BaselineBreadcrumbToolbar.vue';
import { reportRepo, type ReportItem } from '@/core/repositories/reportRepo';

const { t } = useI18n();
const { setContent: setBreadcrumbSlot } = useBreadcrumbSlot();

// ── Modal ───────────────────────────────────────────────────────────────────
const showModal = ref(false);

function openCreateModal() {
  showModal.value = true;
}

// ── Table ───────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('fa-IR');
  } catch {
    return iso;
  }
}

const fetchReports: FetchFn = async ({ page, limit }) => {
  const res = await reportRepo.getReportList({ page, limit });
  const list = res?.data?.list ?? [];
  const count = res?.data?.paginator?.count ?? 0;
  return { list: Array.isArray(list) ? list : [], count };
};

const table = useDataTable({
  fetchFn: fetchReports,
  columns: [
    createColumn({
      key: 'frameworkTitle',
      label: t('reports.col-framework'),
      sortable: false,
      bodyCell: (row: Record<string, unknown>) => row.frameworkTitle ?? row.frameworkSlug ?? '—',
    }),
    createColumn({
      key: 'type',
      label: t('reports.col-type'),
      sortable: false,
    }),
    createColumn({
      key: 'period',
      label: t('reports.col-period'),
      sortable: false,
      bodyCell: (row: Record<string, unknown>) => {
        const start = String(row.startDate ?? '');
        const end = String(row.endDate ?? '');
        if (!start && !end) return '—';
        return `${formatDate(start)} — ${formatDate(end)}`;
      },
    }),
    createColumn({
      key: 'createdAt',
      label: t('reports.col-date'),
      sortable: false,
      bodyCell: (row: Record<string, unknown>) => formatDate(String(row.createdAt ?? '')),
    }),
  ],
  selectable: false,
  exportEnabled: true,
  cacheKey: 'baseline-reports-list',
  listCacheStaleTime: 0,
});

function onModalSuccess() {
  table.invalidateListCache();
  table.setPage(1);
}

onMounted(() => {
  table.fetch();
  setBreadcrumbSlot(BaselineBreadcrumbToolbar, {
    onAdd: openCreateModal,
    onExport: () => table.exportCSV(),
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
        <template #cell-type="{ row }">
          <span class="inline-block rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-darkmode-600 dark:text-slate-300">
            {{ row.type }}
          </span>
        </template>
        <template #actions="{ row }">
          <div class="flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="outline-secondary"
              size="sm"
              class="!h-7 !w-7 !px-0 !py-0"
              :aria-label="t('reports.download')"
              :title="t('reports.download')"
              @click.stop="reportRepo.downloadReport(row.id)"
            >
              <Lucide icon="Download" class="!h-3.5 !w-3.5" />
            </Button>
          </div>
        </template>
      </BaseTable>
    </div>

    <CreateReportModal
      :show="showModal"
      @update:show="showModal = $event"
      @success="onModalSuccess"
    />
  </div>
</template>
