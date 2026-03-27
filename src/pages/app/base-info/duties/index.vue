<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { computed, onMounted } from 'vue';
import { useDataTable, createColumn, type FetchFn } from '@core';
import BaseTable from '@core/ui/base/BaseTable.vue';
import { ermRepo } from '@/core/repositories/ermRepo';
import { useBreadcrumbSlot } from '@/composables/useBreadcrumb';
import TasksBreadcrumbToolbar from './TasksBreadcrumbToolbar.vue';

const { t } = useI18n();
const { setContent: setBreadcrumbSlot } = useBreadcrumbSlot();

const fetchDuties: FetchFn = async ({ page, limit, sort, filters }) => {
  const res = await ermRepo.taskList({
    page,
    limit,
    ...(sort && { sort }),
    ...filters,
  });
  const list = res?.data?.list ?? [];
  const count = res?.data?.paginator?.count ?? 0;
  return { list: Array.isArray(list) ? list : [], count };
};

function ruleCell(row: Record<string, unknown>) {
  const rule = row.rule as Record<string, unknown> | undefined;
  return rule && typeof rule.rule === 'string' ? rule.rule : '—';
}

function ruleCodeCell(row: Record<string, unknown>) {
  const rule = row.rule as Record<string, unknown> | undefined;
  return rule && typeof rule.code === 'string' ? rule.code : '—';
}

function sectionCell(row: Record<string, unknown>) {
  const section = row.section as Record<string, unknown> | undefined;
  if (!section) return '—';
  const children = section.children as Record<string, unknown> | undefined;
  if (children && typeof children.title === 'string') {
    return `${section.title} / ${children.title}`;
  }
  return typeof section.title === 'string' ? section.title : '—';
}

function warrantyCell(row: Record<string, unknown>) {
  const warranty = row.warranty as Record<string, unknown> | undefined;
  return warranty && typeof warranty.title === 'string' ? warranty.title : '—';
}

function mandatoryUnitCell(row: Record<string, unknown>) {
  const units = row.mandatory_unit as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(units) || units.length === 0) return '—';
  return units.map((u) => u.title ?? '').filter(Boolean).join('، ');
}

function progressLevelCell(row: Record<string, unknown>) {
  const progress = row.progress as Record<string, unknown> | undefined;
  if (!progress || typeof progress.level !== 'string') return '—';
  return progress.level;
}

function progressStatusCell(row: Record<string, unknown>) {
  const progress = row.progress as Record<string, unknown> | undefined;
  if (!progress || typeof progress.status !== 'string') return '—';
  return progress.status;
}

function assigneeCell(row: Record<string, unknown>) {
  const progress = row.progress as Record<string, unknown> | undefined;
  if (!progress) return '—';
  const user = progress.user as Record<string, unknown> | undefined;
  return user && typeof user.name === 'string' ? user.name : '—';
}

const table = useDataTable({
  fetchFn: fetchDuties,
  columns: [
    createColumn({
      key: 'code',
      label: t('duty.code'),
      sortable: true,
      bodyCell: (row) => row.code ?? '—',
    }),
    createColumn({
      key: 'title',
      label: t('duty.title'),
      sortable: true,
      bodyCell: (row) => row.title ?? '—',
    }),
    createColumn({
      key: 'rule',
      label: t('duty.rule'),
      bodyCell: ruleCell,
    }),
    createColumn({
      key: 'rule_code',
      label: t('duty.rule-code'),
      bodyCell: ruleCodeCell,
    }),
    createColumn({
      key: 'section',
      label: t('duty.section'),
      bodyCell: sectionCell,
    }),
    createColumn({
      key: 'warranty',
      label: t('duty.warranty'),
      bodyCell: warrantyCell,
    }),
    createColumn({
      key: 'mandatory_unit',
      label: t('duty.mandatory-unit'),
      bodyCell: mandatoryUnitCell,
    }),
    createColumn({
      key: 'status',
      label: t('duty.status'),
      bodyCell: (row) =>
          row.status === 1 ? t('duty.status-active') : t('duty.status-inactive'),
    }),
    createColumn({
      key: 'progress_level',
      label: t('duty.progress-level'),
      bodyCell: progressLevelCell,
    }),
    createColumn({
      key: 'progress_status',
      label: t('duty.progress-status'),
      bodyCell: progressStatusCell,
    }),
    createColumn({
      key: 'assignee',
      label: t('duty.assignee'),
      bodyCell: assigneeCell,
    }),
  ],
  selectable: false,
  exportEnabled: true,
  pageSize: 10,
  cacheKey: 'duties-list',
  listCacheStaleTime: 0,
});

onMounted(() => {
  table.fetch();
  setBreadcrumbSlot(TasksBreadcrumbToolbar, {
    onExport: onExportDuties,
    onTrash: onTrashDuties,
    onAdd: onAddDuty,
  });
});

function onEditDuty(row: Record<string, unknown>) {
  console.log('Edit duty', row);
}

function onDeleteDuty(row: Record<string, unknown>) {
  console.log('Delete duty', row);
}

function onAddDuty() {
  console.log('Add duty');
}

function onExportDuties() {
  table.exportCSV();
}

function onTrashDuties() {
  const selected = table.selectedRows.value;
  if (selected.length === 0) return;
  console.log('Delete selected', selected.length, selected);
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
          :actions-header="t('duty.settings')"
          :show-search="false"
      >
        <template #cell-status="{ row }">
            <span
                :class="[
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                row.status === 1
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
              ]"
            >
              {{ row.status === 1 ? t('duty.status-active') : t('duty.status-inactive') }}
            </span>
        </template>
        <template #cell-progress_level="{ row }">
            <span
                :class="[
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                (row.progress as any)?.level === 'approve'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                  : (row.progress as any)?.level === 'reject'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    : (row.progress as any)?.level === 'done'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
              ]"
            >
              {{ progressLevelCell(row) }}
            </span>
        </template>
        <template #actions="{ row }">
          <div class="flex items-center justify-center gap-1">
            <button
                type="button"
                class="rounded p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-primary dark:text-slate-400 dark:hover:bg-darkmode-600 dark:hover:text-primary"
                :aria-label="t('title.update')"
                @click.stop="onEditDuty(row)"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
                type="button"
                class="rounded p-1.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-darkmode-600 dark:hover:text-red-400"
                :aria-label="'Delete'"
                @click.stop="onDeleteDuty(row)"
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
