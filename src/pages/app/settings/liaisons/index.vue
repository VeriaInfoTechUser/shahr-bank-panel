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

function memberNameCell(row: Record<string, unknown>) {
  const fn = row.first_name;
  const ln = row.last_name;
  if (typeof fn === 'string' || typeof ln === 'string') {
    const s = [fn, ln].filter((x) => typeof x === 'string' && x.trim()).join(' ');
    return s || '—';
  }
  return pickStr(row, 'title', 'name', 'label', 'full_name');
}

const fetchMembers: FetchFn = async ({ page, limit, sort, filters }) => {
  const res = await ermRepo.memberList({
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
  fetchFn: fetchMembers,
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
      bodyCell: memberNameCell,
    }),
    createColumn({
      key: 'mobile',
      label: t('title.mobile'),
      sortable: false,
      bodyCell: (row) => pickStr(row, 'mobile', 'phone', 'cell'),
    }),
    createColumn({
      key: 'email',
      label: t('title.email'),
      sortable: false,
      bodyCell: (row) => pickStr(row, 'email'),
    }),
  ],
  selectable: false,
  exportEnabled: true,
  pageSize: 10,
  cacheKey: 'settings-members-list',
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
