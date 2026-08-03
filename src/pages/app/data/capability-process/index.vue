<script setup lang="ts">
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDataTable, createColumn, type FetchFn } from '@core';
import BaseTable from '@core/ui/base/BaseTable.vue';
import { grcRepo } from '@/core/repositories/grcRepo';

const { t } = useI18n();

const fetchCapabilities: FetchFn = async ({ page, limit, filters }) => {
  const res = await grcRepo.calculationCapabilityList({ page, limit, ...(filters ?? {}) });
  const list = res?.data?.list ?? [];
  const count = res?.data?.paginator?.count ?? 0;
  return { list: Array.isArray(list) ? list : [], count };
};

const table = useDataTable({
  fetchFn: fetchCapabilities,
  columns: [
    createColumn({
      key: 'capability_name',
      label: t('job-log.capability-name'),
      sortable: false,
      bodyCell: (row) => row.capability_name ?? row.capability_slug ?? '—',
    }),
    createColumn({
      key: 'date_from',
      label: t('job.date-from'),
      sortable: false,
      bodyCell: (row) => row.date_from ?? '—',
    }),
    createColumn({
      key: 'date_to',
      label: t('job.date-to'),
      sortable: false,
      bodyCell: (row) => row.date_to ?? '—',
    }),
    createColumn({
      key: 'period_type',
      label: t('job-log.period-type'),
      sortable: false,
      bodyCell: (row) => row.period_type ?? '—',
    }),
    createColumn({
      key: 'value',
      label: t('job-log.value'),
      sortable: false,
      bodyCell: (row) => row.value != null ? String(row.value) : '—',
    }),
    createColumn({
      key: 'unit',
      label: t('job-log.unit'),
      sortable: false,
      bodyCell: (row) => row.unit ?? '—',
    }),
    createColumn({
      key: 'calculated_at',
      label: t('job-log.calculated-at'),
      sortable: false,
      bodyCell: (row) => {
        const d = row.calculated_at;
        if (!d) return '—';
        return new Date(d as string).toLocaleString('fa-IR');
      },
    }),
  ],
  selectable: false,
  exportEnabled: true,
  cacheKey: 'calculation-capability-list',
  listCacheStaleTime: 0,
});

onMounted(() => {
  table.fetch();
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
