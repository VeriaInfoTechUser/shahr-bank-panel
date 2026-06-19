<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import { useDataTable, createColumn, type FetchFn } from '@core';
import BaseTable from '@core/ui/base/BaseTable.vue';
import { grcRepo } from '@/core/repositories/grcRepo';
import { ermRepo } from '@/core/repositories/ermRepo';
import { useBreadcrumbSlot } from '@/composables/useBreadcrumb';
import { complianceOperationsStatusBadgeClass } from '@/composables/complianceOperationsStatusBadge';
import ComplianceTaskAnswerModal from './ComplianceTaskAnswerModal.vue';
import Button from '@/base-components/Button';
import Lucide from '@/base-components/Lucide';
import ComplianceTaskBreadcrumbToolbar from './ComplianceTaskBreadcrumbToolbar.vue';

interface UserOption {
  value: string;
  label: string;
}

const { t } = useI18n();
const route = useRoute();
const { setContent: setBreadcrumbSlot } = useBreadcrumbSlot();

const userOptions = ref<UserOption[]>([]);
const usersLoading = ref(true);
const showAnswerModal = ref(false);
const selectedTask = ref<Record<string, unknown> | null>(null);

const STATE_I18N: Record<string, string> = {
  todo: 'compliance-task.state-todo',
  in_progress: 'compliance-task.state-in_progress',
  done: 'compliance-task.state-done',
  approved: 'compliance-task.state-approved',
  rejected: 'compliance-task.state-rejected',
};

const STATE_BADGE_KEY: Record<string, string> = {
  todo: 'todo',
  in_progress: 'doing',
  done: 'done',
  approved: 'approve',
  rejected: 'reject',
};

const ANSWER_I18N: Record<string, string> = {
  not_started: 'compliance-task.answer-not-started',
  compliant: 'compliance-task.answer-compliant',
  partially_compliant: 'compliance-task.answer-partially-compliant',
  non_compliant: 'compliance-task.answer-non-compliant',
};

const ANSWER_BADGE_KEY: Record<string, string> = {
  not_started: 'todo',
  compliant: 'approve',
  partially_compliant: 'doing',
  non_compliant: 'reject',
};

function mapUsers(list: Record<string, unknown>[]): UserOption[] {
  return list
    .map((m) => {
      const id = m.id ?? m.user_id;
      if (id == null) return null;
      const label =
        [m.name, m.full_name, m.email, m.mobile]
          .find((x) => typeof x === 'string' && String(x).trim()) ?? String(id);
      return { value: String(id), label: String(label).trim() };
    })
    .filter((x): x is UserOption => x != null);
}

function getUserLabel(id: unknown): string {
  if (id == null) return '—';
  const key = String(id);
  return userOptions.value.find((u) => u.value === key)?.label ?? key;
}

function answerLabel(row: Record<string, unknown>): string {
  const raw = String(row.answer ?? '').trim().toLowerCase();
  if (!raw) return '—';
  return t(ANSWER_I18N[raw] ?? 'compliance-task.status-unknown');
}

function answerBadgeClass(row: Record<string, unknown>): string {
  const raw = String(row.answer ?? '').trim().toLowerCase();
  const badgeKey = ANSWER_BADGE_KEY[raw] ?? 'unknown';
  return complianceOperationsStatusBadgeClass(badgeKey);
}

function stateLabel(row: Record<string, unknown>): string {
  const raw = String(row.state ?? '').trim().toLowerCase();
  if (!raw) return '—';
  return t(STATE_I18N[raw] ?? 'compliance-task.status-unknown');
}

function stateBadgeClass(row: Record<string, unknown>): string {
  const raw = String(row.state ?? '').trim().toLowerCase();
  const badgeKey = STATE_BADGE_KEY[raw] ?? 'unknown';
  return complianceOperationsStatusBadgeClass(badgeKey);
}

function assignedUserCell(row: Record<string, unknown>): string {
  return getUserLabel(row.assigneeId ?? row.assignee_id);
}

function ownerUserCell(row: Record<string, unknown>): string {
  return getUserLabel(row.ownerId ?? row.owner_id ?? row.createdBy);
}

function openAnswerModal(row: Record<string, unknown>) {
  selectedTask.value = row;
  showAnswerModal.value = true;
}

const fetchTasks: FetchFn = async ({ page, limit, filters }) => {
  const res = await grcRepo.complianceTaskList({ page, limit, ...(filters ?? {}) });
  const list = res?.data?.list ?? [];
  const count = res?.data?.paginator?.count ?? 0;
  return { list: Array.isArray(list) ? list : [], count };
};

const initialPlanFilter = (() => {
  const planSlug = route.query.planSlug;
  if (planSlug && typeof planSlug === 'string') {
    return { planSlug: [planSlug] };
  }
  return {};
})();

const table = useDataTable({
  fetchFn: fetchTasks,
  columns: [
    createColumn({
      key: 'title',
      label: t('compliance-task.col-title'),
      sortable: false,
      bodyCell: (row) => row.title ?? '—',
    }),
    createColumn({
      key: 'assignedUser',
      label: t('compliance-task.col-assigned'),
      sortable: false,
      bodyCell: assignedUserCell,
    }),
    createColumn({
      key: 'answer',
      label: t('compliance-task.col-answer'),
      sortable: false,
      slot: true,
    }),
    createColumn({
      key: 'state',
      label: t('compliance-task.col-state'),
      sortable: false,
      slot: true,
    }),

  ],
  selectable: false,
  exportEnabled: true,
  pageSize: 10,
  cacheKey: 'compliance-task-list',
  listCacheStaleTime: 0,
});

function onExportTasks() {
  table.exportCSV();
}

function onAnswerSuccess() {
  table.invalidateListCache();
  void table.fetch();
}

onMounted(async () => {
  try {
    const res = await ermRepo.memberList({ page: 1, limit: 500 });
    const list = (res?.data?.list ?? []) as Record<string, unknown>[];
    userOptions.value = mapUsers(Array.isArray(list) ? list : []);
  } catch {
    toast(t('compliance-task.users-load-error'), { type: 'error' });
  } finally {
    usersLoading.value = false;
  }

  table.invalidateListCache();
  if (Object.keys(initialPlanFilter).length > 0) {
    table.replaceFilters(initialPlanFilter);
  } else {
    table.fetch();
  }
  setBreadcrumbSlot(ComplianceTaskBreadcrumbToolbar, {
    onExport: onExportTasks,
    table,
  });
});
</script>

<template>
  <div class="grid grid-cols-12 gap-2 p-2">
    <div class="col-span-12">
      <div
        v-if="usersLoading"
        class="flex items-center justify-center py-8 text-xs text-slate-500"
      >
        <Lucide icon="Loader2" class="mr-2 h-4 w-4 animate-spin" />
        {{ t('general.loading') }}
      </div>
      <BaseTable
        v-else
        :table="table"
        :selectable="false"
        :export-enabled="table.exportEnabled"
        :empty-message="t('general.no-data')"
        :actions="true"
        :show-search="false"
      >
        <template #cell-answer="{ row }">
          <span :class="answerBadgeClass(row)">
            {{ answerLabel(row) }}
          </span>
        </template>
        <template #cell-state="{ row }">
          <span :class="stateBadgeClass(row)">
            {{ stateLabel(row) }}
          </span>
        </template>
        <template #actions="{ row }">
          <div class="flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="outline-primary"
              size="sm"
              class="!h-7 !px-2 !py-0 text-[11px] w-24"
              :aria-label="t('compliance-task.action-set-answer')"
              :title="t('compliance-task.action-set-answer')"
              @click.stop="openAnswerModal(row)"
            >
              <Lucide icon="ClipboardCheck" class="mr-1 !h-3 !w-3" />
              {{ t('compliance-task.action-set-answer') }}
            </Button>
          </div>
        </template>
      </BaseTable>
    </div>

    <ComplianceTaskAnswerModal
      v-if="selectedTask"
      :show="showAnswerModal"
      :task="selectedTask"
      @update:show="showAnswerModal = $event"
      @success="onAnswerSuccess"
    />
  </div>
</template>
