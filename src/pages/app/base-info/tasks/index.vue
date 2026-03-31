<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDataTable, createColumn, type FetchFn } from '@core';
import BaseTable from '@core/ui/base/BaseTable.vue';
import { ermRepo } from '@/core/repositories/ermRepo';
import { useBreadcrumbSlot } from '@/composables/useBreadcrumb';
import { useGlobalModal } from '@/composables/useGlobalModal';
import Button from '@/base-components/Button';
import Lucide from '@/base-components/Lucide';
import AddTaskModal from './AddTaskModal.vue';
import TasksBreadcrumbToolbar from './TasksBreadcrumbToolbar.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { setContent: setBreadcrumbSlot } = useBreadcrumbSlot();
const { openModal } = useGlobalModal();

function parseReferenceIdFromQuery(q: unknown): number | null {
  if (q == null || q === '') return null;
  const n = Number(q);
  return Number.isFinite(n) && n > 0 ? n : null;
}

const currentReferenceId = computed(() => parseReferenceIdFromQuery(route.query.reference_id));

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
      bodyCell: (row) =>
        row.has_clause === 1 ? t('task.clause-yes') : t('task.clause-no'),
    }),
  ],
  selectable: false,
  exportEnabled: true,
  pageSize: 10,
  cacheKey: 'tasks-list',
  listCacheStaleTime: 0,
});

function syncReferenceFilterFromRoute() {
  const refId = parseReferenceIdFromQuery(route.query.reference_id);
  const next = { ...table.filters.value };
  if (refId != null) {
    next.reference_id = refId;
  } else {
    delete next.reference_id;
  }
  table.filters.value = next;
}

watch(
  () => route.query.reference_id,
  () => {
    table.invalidateListCache();
    syncReferenceFilterFromRoute();
    table.setPage(1);
  }
);

onMounted(() => {
  syncReferenceFilterFromRoute();
  table.invalidateListCache();
  table.fetch();
  setBreadcrumbSlot(TasksBreadcrumbToolbar, {
    onExport: onExportTasks,
    onTrash: onTrashTasks,
    onAdd: onAddTask,
  });
});

function onNavigateClauseRelated(row: Record<string, unknown>) {
  const id = row.id;
  if (id == null) return;
  router.push({
    name: 'app-base-info-tasks',
    query: { reference_id: String(id) },
  });
}

function onBackToAllTasks() {
  router.push({ name: 'app-base-info-tasks' });
}

function onAttachmentTask(row: Record<string, unknown>) {
  console.log('Attachment task', row);
}

function onEditTask(row: Record<string, unknown>) {
  openModal({
    component: AddTaskModal,
    props: {
      mode: 'edit',
      task: row,
    },
    onSuccess: () => {
      table.invalidateListCache();
      table.setPage(1);
    },
  });
}

function onDeleteTask(row: Record<string, unknown>) {
  console.log('Delete task', row);
}

function onAddTask() {
  const refId = currentReferenceId.value;
  openModal({
    component: AddTaskModal,
    props: refId != null ? { referenceId: refId } : {},
    onSuccess: () => {
      table.invalidateListCache();
      table.setPage(1);
    },
  });
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
    <div v-if="currentReferenceId != null" class="col-span-12">
      <div
        class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-darkmode-600 dark:bg-darkmode-800"
      >
        <span class="text-slate-600 dark:text-slate-300">
          {{ t('task.viewing-related-tasks') }}
          <span class="font-medium text-slate-800 dark:text-slate-100"
            >#{{ currentReferenceId }}</span
          >
        </span>
        <button
          type="button"
          class="text-primary hover:underline"
          @click="onBackToAllTasks"
        >
          {{ t('task.back-to-all-tasks') }}
        </button>
      </div>
    </div>
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
          <Button
            v-if="row.has_clause === 1"
            type="button"
            variant="outline-primary"
            size="sm"
            class="!h-7 px-2.5 text-xs font-normal"
            @click.stop="onNavigateClauseRelated(row)"
          >
            {{ t('task.view-clause') }}
          </Button>
          <span
            v-else
            :class="[
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
              'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
            ]"
          >
            {{ t('task.clause-no') }}
          </span>
        </template>
        <template #actions="{ row }">
          <div class="flex items-center justify-center gap-3">
            <Button
              type="button"
              variant="outline-secondary"
              size="sm"
              class="!h-7 !w-7 !px-0 !py-0"
              :aria-label="t('task.attachment')"
              :title="t('task.attachment')"
              @click.stop="onAttachmentTask(row)"
            >
              <Lucide icon="Paperclip" class="!h-3.5 !w-3.5" />
            </Button>
            <Button
              type="button"
              variant="outline-secondary"
              size="sm"
              class="!h-7 !w-7 !px-0 !py-0"
              :aria-label="t('title.update')"
              :title="t('title.update')"
              @click.stop="onEditTask(row)"
            >
              <Lucide icon="Pencil" class="!h-3.5 !w-3.5" />
            </Button>
            <Button
              type="button"
              variant="outline-danger"
              size="sm"
              class="!h-7 !w-7 !px-0 !py-0"
              :aria-label="t('task.delete')"
              :title="t('task.delete')"
              @click.stop="onDeleteTask(row)"
            >
              <Lucide icon="Trash2" class="!h-3.5 !w-3.5" />
            </Button>
          </div>
        </template>
      </BaseTable>
    </div>
  </div>
</template>
