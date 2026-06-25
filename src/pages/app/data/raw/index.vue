<script setup lang="ts">
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDataTable, createColumn, type FetchFn } from '@core';
import BaseTable from '@core/ui/base/BaseTable.vue';
import { grcRepo } from '@/core/repositories/grcRepo';
import { useBreadcrumbSlot } from '@/composables/useBreadcrumb';
import GovernanceExportToolbar from '@/pages/app/governance/GovernanceExportToolbar.vue';

const { t } = useI18n();
const { setContent: setBreadcrumbSlot } = useBreadcrumbSlot();

const fetchItems: FetchFn = async ({ page, limit, filters }) => {
  const res = await grcRepo.rawDataList({ page, limit, ...filters });
  const list = res?.data?.list ?? [];
  const count = res?.data?.paginator?.count ?? 0;
  return { list: Array.isArray(list) ? list : [], count };
};

const table = useDataTable({
  fetchFn: fetchItems,
  columns: [
    createColumn({
      key: 'id',
      label: t('raw-data-page.col-id'),
      sortable: false,
      width: '70px',
    }),
    createColumn({
      key: 'asset_slug',
      label: t('raw-data-page.col-asset'),
      sortable: false,
    }),
    createColumn({
      key: 'metric_slug',
      label: t('raw-data-page.col-metric'),
      sortable: false,
    }),
    createColumn({
      key: 'value',
      label: t('raw-data-page.col-value'),
      sortable: false,
      width: '100px',
      align: 'right',
    }),
    createColumn({
      key: 'unit',
      label: t('raw-data-page.col-unit'),
      sortable: false,
    }),
    createColumn({
      key: 'status',
      label: t('raw-data-page.col-status'),
      sortable: false,
      width: '80px',
      bodyCell: (row) => {
        const val = row.status;
        return val === 1 || val === '1'
          ? t('raw-data-page.status-active')
          : t('raw-data-page.status-inactive');
      },
    }),
    createColumn({
      key: 'timezone',
      label: t('raw-data-page.col-timezone'),
      sortable: false,
      width: '80px',
    }),
    createColumn({
      key: 'from_timestamp',
      label: t('raw-data-page.col-from'),
      sortable: false,
      bodyCell: (row) => {
        const v = row.from_timestamp;
        if (!v) return '—';
        return new Date(String(v)).toLocaleString();
      },
    }),
    createColumn({
      key: 'to_timestamp',
      label: t('raw-data-page.col-to'),
      sortable: false,
      bodyCell: (row) => {
        const v = row.to_timestamp;
        if (!v) return '—';
        return new Date(String(v)).toLocaleString();
      },
    }),
    createColumn({
      key: 'created_at',
      label: t('raw-data-page.col-created'),
      sortable: false,
      bodyCell: (row) => {
        const v = row.created_at;
        if (!v) return '—';
        return new Date(String(v)).toLocaleString();
      },
    }),
  ],
  selectable: false,
  exportEnabled: true,
  cacheKey: 'raw-data-list',
  listCacheStaleTime: 0,
});

onMounted(() => {
  table.fetch();
  setBreadcrumbSlot(GovernanceExportToolbar, {
    onExport: () => table.exportCSV(),
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
        :actions="false"
        :show-search="false"
      />
    </div>
  </div>
</template>
