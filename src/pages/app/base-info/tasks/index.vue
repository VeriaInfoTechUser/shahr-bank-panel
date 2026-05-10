<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import { computed, onMounted, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { useDataTable, createColumn, type FetchFn } from '@core';
import BaseTable from '@core/ui/base/BaseTable.vue';
import BaseConfirmModal from '@core/ui/base/BaseConfirmModal.vue';
import { ermRepo } from '@/core/repositories/ermRepo';
import { useBreadcrumbSlot } from '@/composables/useBreadcrumb';
import { useGlobalModal } from '@/composables/useGlobalModal';
import Button from '@/base-components/Button';
import Lucide from '@/base-components/Lucide';
import AddTaskModal from './AddTaskModal.vue';
import TasksBreadcrumbToolbar from './TasksBreadcrumbToolbar.vue';
import TaskAttachmentsModal from './TaskAttachmentsModal.vue';
import {
  clauseFilteredTasksRoute,
  resolveOperationsTaskRowId,
} from '@/composables/taskClauseNavigation';

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

/** عنوان تعهد والد از query (هنگام کلیک «مشاهده» ست می‌شود) */
const referenceParentTitle = computed(() => {
  const raw = route.query.ref_title;
  if (typeof raw !== 'string' || !raw.trim()) return '';
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
});

const referenceBannerLabel = computed(() => {
  const title = referenceParentTitle.value.trim();
  if (title) return title;
  const id = currentReferenceId.value;
  return id != null ? `#${id}` : '';
});

/** بدنهٔ لیست تسک‌ها؛ `reference_id` فقط وقتی در query هست (همان صفحه، فیلتر زیرمجموعهٔ تبصرهٔ آن تسک). */
const fetchTasks: FetchFn = async ({ page, limit, sort, filters }) => {
  const refFromRoute = parseReferenceIdFromQuery(route.query.reference_id);
  const payload: Record<string, unknown> = {
    page,
    limit,
    ...(sort && { sort }),
    ...(filters ?? {}),
  };
  if (refFromRoute != null) {
    payload.reference_id = refFromRoute;
  } else {
    delete payload.reference_id;
  }
  const res = await ermRepo.taskList(payload);
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

/** در لیست تعهدات زیرمجموعهٔ تبصره، ستون «تبصره» مخفی می‌شود */
watch(
  currentReferenceId,
  (refId) => {
    const keys = table.visibleColumns.value;
    const hasClauseKey = keys.includes('has_clause');
    if (refId != null) {
      if (hasClauseKey) {
        table.visibleColumns.value = keys.filter((k) => k !== 'has_clause');
      }
    } else if (!hasClauseKey) {
      table.visibleColumns.value = [...keys, 'has_clause'];
    }
  },
  { immediate: true }
);

onMounted(() => {
  syncReferenceFilterFromRoute();
  table.invalidateListCache();
  table.fetch();
  setBreadcrumbSlot(TasksBreadcrumbToolbar, {
    table,
    onImport: onImportTasks,
    onExport: onExportTasks,
    onAdd: onAddTask,
  });
});

function onBackToAllTasks() {
  router.push({ path: '/app/base-info/tasks' });
}

function onAttachmentTask(row: Record<string, unknown>) {
  const id = row.id;
  if (id == null) {
    toast(t('general.error'), { type: 'error' });
    return;
  }

  openModal({
    component: TaskAttachmentsModal,
    props: {
      relationModule: 'erm',
      relationSection: 'compliance-task',
      relationItem: id,
      ruleId: row.rule_id,
    },
  });
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
  openModal({
    component: BaseConfirmModal,
    props: {
      titleKey: 'task.delete-confirm-title',
      messageKey: 'task.delete-confirm-message',
      confirmVariant: 'danger' as const,
      onConfirmAction: async () => {
        const id = row.id;
        if (id == null) {
          toast(t('task.delete-error'), { type: 'error' });
          throw new Error('missing id');
        }
        const res = await ermRepo.taskDelete({ id });
        if (!res?.result) {
          const msg = String(res?.error?.message ?? t('task.delete-error'));
          toast(msg, { type: 'error' });
          throw new Error(msg);
        }
      },
    },
    onSuccess: () => {
      table.invalidateListCache();
      void table.fetch();
    },
  });
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

function onImportTasks() {
  // TODO: دیالوگ ایمپورت / انتخاب فایل
  console.log('Import tasks');
}

function onExportTasks() {
  table.exportCSV();
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
          <span
            class="font-medium text-slate-800 dark:text-slate-100"
            :title="referenceBannerLabel"
          >
            ({{ referenceBannerLabel }})
          </span>
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
          :selectable="false"
          :export-enabled="table.exportEnabled"
          :empty-message="t('general.no-data')"
          :actions="true"
          :actions-header="t('task.settings')"
          :show-search="false"
      >
        <template #cell-has_clause="{ row }">
          <RouterLink
            v-if="row.has_clause === 1 && resolveOperationsTaskRowId(row) != null"
            class="inline-flex max-w-full cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-left text-[10px] font-medium text-primary underline decoration-primary/70 underline-offset-[3px] transition hover:text-primary/85 hover:decoration-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-1 rounded-sm dark:text-primary dark:decoration-primary/60"
            :to="clauseFilteredTasksRoute(row)"
            :title="t('task.view-clause')"
            @click.stop
          >
            {{ t('task.view-clause') }}
            <Lucide icon="ExternalLink" class="h-3 w-3 shrink-0 opacity-70" aria-hidden="true" />
          </RouterLink>
          <span
            v-else-if="row.has_clause === 1"
            class="text-[10px] text-slate-400 dark:text-slate-500"
            :title="t('task.view-clause')"
          >
            —
          </span>
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
