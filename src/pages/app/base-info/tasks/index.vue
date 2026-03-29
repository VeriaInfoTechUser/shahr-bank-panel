<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { onMounted } from 'vue';
import { useDataTable, createColumn, type FetchFn } from '@core';
import BaseTable from '@core/ui/base/BaseTable.vue';
import { ermRepo } from '@/core/repositories/ermRepo';
import { useBreadcrumbSlot } from '@/composables/useBreadcrumb';
import TasksBreadcrumbToolbar from './TasksBreadcrumbToolbar.vue';

const { t } = useI18n();
const { setContent: setBreadcrumbSlot } = useBreadcrumbSlot();

const fetchTasks: FetchFn = async ({ page, limit, sort, filters }) => {
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

function taskNameCell(row: Record<string, unknown>) {
  const v = row.title;
  return typeof v === 'string' && v.trim() ? v : '—';
}

function ruleTextCell(row: Record<string, unknown>) {
  const rule = row.rule as Record<string, unknown> | undefined;
  return rule && typeof rule.rule === 'string' ? rule.rule : '—';
}

function taskTypeCell(row: Record<string, unknown>) {
  const warranty = row.warranty as Record<string, unknown> | undefined;
  if (!warranty) return '—';
  return warranty && typeof warranty.title === 'string' ? warranty.title : (typeof warranty.type === 'string' ? warranty.type : '—');
}

function ruleSubjectCell(row: Record<string, unknown>) {
  const section = row.section as Record<string, unknown> | undefined;
  if (!section) return '—';
  const children = section.children as Record<string, unknown> | undefined;
  if (children && typeof children.title === 'string') {
    return `${section.title} / ${children.title}`;
  }
  return typeof section.title === 'string' ? section.title : '—';
}

function mandatoryUnitCell(row: Record<string, unknown>) {
  const units = row.mandatory_unit as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(units) || units.length === 0) return '—';
  return units.map((u) => u.title ?? '').filter(Boolean).join('، ');
}

function clauseCell(row: Record<string, unknown>) {
  return row.has_clause === 1 ? t('task.clause-yes') : t('task.clause-no');
}

const table = useDataTable({
  fetchFn: fetchTasks,
  columns: [
    createColumn({
      key: 'code',
      label: t('task.code'),
      sortable: false,
      bodyCell: (row) => row.code ?? '—',
    }),
    createColumn({
      key: 'title',
      label: t('task.name'),
      sortable: false,
      bodyCell: taskNameCell,
    }),
    createColumn({
      key: 'warrenty',
      label: t('task.task-type'),
      sortable: false,
      bodyCell: taskTypeCell,
    }),
    createColumn({
      key: 'rule_subject',
      label: t('task.subject'),
      sortable: false,
      bodyCell: ruleSubjectCell,
    }),
    createColumn({
      key: 'rule_text',
      label: t('task.law'),
      sortable: false,
      bodyCell: ruleTextCell,
    }),
    createColumn({
      key: 'mandatory_unit',
      label: t('task.mandatory-unit'),
      sortable: false,
      bodyCell: mandatoryUnitCell,
    }),
    createColumn({
      key: 'has_clause',
      label: t('task.clause-column'),
      sortable: false,
      bodyCell: clauseCell,
    }),
  ],
  selectable: false,
  exportEnabled: true,
  pageSize: 10,
  cacheKey: 'tasks-list',
  listCacheStaleTime: 0,
});

onMounted(() => {
  table.fetch();
  setBreadcrumbSlot(TasksBreadcrumbToolbar, {
    onExport: onExportTasks,
    onTrash: onTrashTasks,
    onAdd: onAddTask,
  });
});

function onAttachmentTask(row: Record<string, unknown>) {
  console.log('Attachment task', row);
}

function onEditTask(row: Record<string, unknown>) {
  console.log('Edit task', row);
}

function onDeleteTask(row: Record<string, unknown>) {
  console.log('Delete task', row);
}

function onAddTask() {
  console.log('Add task');
}

function onExportTasks() {
  table.exportCSV();
}

function onTrashTasks() {
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
          :actions-header="t('task.settings')"
          :show-search="false"
      >
        <template #cell-has_clause="{ row }">
          <span
              :class="[
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
              row.has_clause === 1
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
            ]"
          >
            {{ row.has_clause === 1 ? t('task.clause-yes') : t('task.clause-no') }}
          </span>
        </template>
        <template #actions="{ row }">
          <div class="flex items-center justify-center gap-1">
            <button
                type="button"
                class="rounded p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-primary dark:text-slate-400 dark:hover:bg-darkmode-600 dark:hover:text-primary"
                :aria-label="t('task.attachment')"
                :title="t('task.attachment')"
                @click.stop="onAttachmentTask(row)"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            <button
                type="button"
                class="rounded p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-primary dark:text-slate-400 dark:hover:bg-darkmode-600 dark:hover:text-primary"
                :aria-label="t('title.update')"
                :title="t('title.update')"
                @click.stop="onEditTask(row)"
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
                @click.stop="onDeleteTask(row)"
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
