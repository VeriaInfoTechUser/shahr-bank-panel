<script setup lang="ts">
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDataTable, createColumn, type FetchFn } from '@core';
import BaseTable from '@core/ui/base/BaseTable.vue';
import { ermRepo } from '@/core/repositories/ermRepo';
import { useBreadcrumbSlot } from '@/composables/useBreadcrumb';
import SettingsExportToolbar from '../SettingsExportToolbar.vue';

const { t } = useI18n();
const { setContent: setBreadcrumbSlot } = useBreadcrumbSlot();

function pickStr(row: Record<string, unknown>, ...keys: string[]) {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === 'string' && v.trim()) return v;
    if (typeof v === 'number' && !Number.isNaN(v)) return String(v);
  }
  return '—';
}

function titleCell(row: Record<string, unknown>) {
  const info = row.title_information as Record<string, unknown> | undefined;
  if (info && typeof info.title === 'string') return info.title;
  return pickStr(row, 'title', 'name', 'label');
}

const fetchRuleTypes: FetchFn = async ({ page, limit, sort, filters }) => {
  const res = await ermRepo.ruleTypeList({
    page,
    limit,
    ...(sort && { sort }),
    ...filters,
  });
  const list = res?.data?.list ?? [];
  const count = res?.data?.paginator?.count ?? 0;
  return { list: Array.isArray(list) ? list : [], count };
};

const table = useDataTable({
  fetchFn: fetchRuleTypes,
  columns: [
    createColumn({
      key: 'id',
      label: t('general.id'),
      sortable: false,
      bodyCell: (row) => pickStr(row, 'id'),
    }),
    createColumn({
      key: 'code',
      label: t('general.code'),
      sortable: false,
      bodyCell: (row) => pickStr(row, 'code'),
    }),
    createColumn({
      key: 'title',
      label: t('general.title'),
      sortable: false,
      bodyCell: titleCell,
    }),
    createColumn({
      key: 'description',
      label: t('general.description'),
      sortable: false,
      bodyCell: (row) => pickStr(row, 'description', 'detail'),
    }),
  ],
  selectable: false,
  exportEnabled: true,
  pageSize: 10,
  cacheKey: 'settings-rule-type-list',
  listCacheStaleTime: 0,
});

onMounted(() => {
  table.fetch();
  setBreadcrumbSlot(SettingsExportToolbar, {
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
