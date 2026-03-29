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
    if (v == null) continue;
    if (typeof v === 'string' && v.trim()) return v;
    if (typeof v === 'number' && !Number.isNaN(v)) return String(v);
  }
  return '—';
}

function codeCell(row: Record<string, unknown>) {
  return pickStr(row, 'value', 'slug', 'code');
}

function titleCell(row: Record<string, unknown>) {
  return pickStr(row, 'title', 'name', 'label');
}

const fetchRuleTypes: FetchFn = async ({ page, limit, sort, filters }) => {
  const res = await ermRepo.ruleTypeList({
    page,
    limit,
    ...(sort && { sort }),
    ...filters,
    api_version: 8,
  });
  const list = res?.data?.list ?? [];
  const count = res?.data?.paginator?.count ?? 0;
  return { list: Array.isArray(list) ? list : [], count };
};

const table = useDataTable({
  fetchFn: fetchRuleTypes,
  columns: [
    createColumn({
      key: 'code',
      label: t('general.code'),
      sortable: false,
      bodyCell: codeCell,
    }),
    createColumn({
      key: 'title',
      label: t('settings-page.law-type-col-name'),
      sortable: false,
      bodyCell: titleCell,
    }),
  ],
  selectable: true,
  exportEnabled: true,
  pageSize: 10,
  cacheKey: 'settings-rule-type-list',
  listCacheStaleTime: 0,
});

function onAddLawType() {
  console.log('Add rule type');
}

onMounted(() => {
  table.fetch();
  setBreadcrumbSlot(SettingsExportToolbar, {
    onExport: () => table.exportCSV(),
    onAdd: onAddLawType,
    addLabelKey: 'settings-page.add-law-type',
  });
});

function onEditLawType(row: Record<string, unknown>) {
  console.log('Edit rule type', row);
}

function onDeleteLawType(row: Record<string, unknown>) {
  console.log('Delete rule type', row);
}
</script>

<template>
  <div class="grid grid-cols-12 gap-2 p-2">
    <div class="col-span-12">
      <BaseTable
        :table="table"
        :selectable="true"
        :export-enabled="table.exportEnabled"
        :empty-message="t('general.no-data')"
        :actions="true"
        :actions-header="t('task.settings')"
        :actions-column-min-width="'100px'"
        :show-search="false"
      >
        <template #actions="{ row }">
          <div class="flex flex-wrap items-center justify-center gap-0.5">
            <button
              type="button"
              class="rounded p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-primary dark:text-slate-400 dark:hover:bg-darkmode-600 dark:hover:text-primary"
              :aria-label="t('title.update')"
              :title="t('title.update')"
              @click.stop="onEditLawType(row)"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              type="button"
              class="rounded p-1.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-darkmode-600 dark:hover:text-red-400"
              :aria-label="t('task.delete')"
              :title="t('task.delete')"
              @click.stop="onDeleteLawType(row)"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </template>
      </BaseTable>
    </div>
  </div>
</template>
