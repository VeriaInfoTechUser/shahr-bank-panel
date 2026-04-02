<script setup lang="ts">
import { onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useDataTable, createColumn, type FetchFn } from '@core';
import BaseTable from '@core/ui/base/BaseTable.vue';
import { ermRepo } from '@/core/repositories/ermRepo';
import { useBreadcrumbSlot } from '@/composables/useBreadcrumb';
import SettingsExportToolbar from '@/pages/app/settings/SettingsExportToolbar.vue';
import { complianceOperationsStatusBadgeClass } from '@/composables/complianceOperationsStatusBadge';
import {
  clauseFilteredTasksRoute,
  resolveOperationsTaskRowId,
} from '@/composables/taskClauseNavigation';

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
  return pickStr(row, 'code');
}

/** تعهد — `title` on compliance row (see API sample) */
function commitmentCell(row: Record<string, unknown>) {
  const task = row.task as Record<string, unknown> | undefined;
  if (task && typeof task.title === 'string' && task.title.trim()) {
    return task.title;
  }
  return pickStr(row, 'title', 'name', 'commitment', 'task_title', 'label');
}

function getProgress(row: Record<string, unknown>): Record<string, unknown> | null {
  const p = row.progress;
  if (p == null || typeof p !== 'object' || Array.isArray(p)) return null;
  if (Object.keys(p).length === 0) return null;
  return p as Record<string, unknown>;
}

/** فقط تاریخ، بدون ساعت (رشتهٔ API مثل «۱۴۰۴/۰۹/۳۰ ۰۰:۰۰:۰۰» یا ISO) */
function deadlineWithoutTime(view: string | undefined, ts: number | undefined): string {
  if (typeof view === 'string' && view.trim()) {
    const s = view.trim();
    const sp = s.indexOf(' ');
    if (sp !== -1) return s.slice(0, sp).trim();
    const tIdx = s.indexOf('T');
    if (tIdx !== -1) return s.slice(0, tIdx);
    return s;
  }
  if (typeof ts === 'number' && ts > 0) {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(ts * 1000));
  }
  return '—';
}

/** مهلت پاسخگویی — از `progress.time_deadline_view` / `time_deadline` (بدون نمایش زمان) */
function deadlineCell(row: Record<string, unknown>) {
  const p = getProgress(row);
  if (!p) return '—';
  const view = p.time_deadline_view;
  const ts = p.time_deadline;
  return deadlineWithoutTime(
    typeof view === 'string' ? view : undefined,
    typeof ts === 'number' ? ts : undefined,
  );
}

const COMPLIANCE_STATUS_I18N: Record<string, string> = {
  todo: 'compliance-page.status-todo',
  doing: 'compliance-page.status-doing',
  done: 'compliance-page.status-done',
  approve: 'compliance-page.status-approve',
  reject: 'compliance-page.status-reject',
};

/** ردیف دارای تبصره (`has_clause` از API) */
function rowHasClause(row: Record<string, unknown>): boolean {
  const h = row.has_clause;
  if (h === 1 || h === true) return true;
  const c = row.clause;
  if (Array.isArray(c) && c.length > 0) return true;
  return false;
}

/** مقدار مرجع وضعیت: اول `progress.level`، در نبودش `progress.status` */
function progressStateKey(p: Record<string, unknown>): string {
  const level = p.level;
  const status = p.status;
  const raw =
    typeof level === 'string' && level.trim()
      ? level
      : typeof status === 'string'
        ? status
        : '';
  return raw.trim().toLowerCase();
}

/** وضعیت از `progress.level` (پشتیبان: `progress.status`)؛ تبصره؛ یا `progress` خالی → در انتظار ارجاع */
function complianceStatusLabel(row: Record<string, unknown>): string {
  if (rowHasClause(row)) {
    return t('compliance-page.status-clauses');
  }
  const p = getProgress(row);
  if (!p) {
    return t('compliance-page.status-pending-assignment');
  }
  const key = progressStateKey(p);
  if (key && COMPLIANCE_STATUS_I18N[key]) {
    return t(COMPLIANCE_STATUS_I18N[key]);
  }
  const fallback = p.level ?? p.status;
  if (typeof fallback === 'string' && fallback.trim()) return fallback;
  return '—';
}

function complianceStatusKey(row: Record<string, unknown>): string {
  if (rowHasClause(row)) return 'clauses';
  const p = getProgress(row);
  if (!p) return 'pending-assignment';
  const key = progressStateKey(p);
  if (key && COMPLIANCE_STATUS_I18N[key]) return key;
  return 'unknown';
}

function statusBadgeClass(row: Record<string, unknown>): string {
  return complianceOperationsStatusBadgeClass(complianceStatusKey(row));
}

function onComplianceStatusClick(_row: Record<string, unknown>) {
  /* آینده: مودال جریان وضعیت */
}

const fetchComplianceList: FetchFn = async ({ page, limit, sort, filters }) => {
  const res = await ermRepo.complianceList({
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
  fetchFn: fetchComplianceList,
  columns: [
    createColumn({
      key: 'code',
      label: t('compliance-page.col-code'),
      sortable: false,
      bodyCell: codeCell,
    }),
    createColumn({
      key: 'commitment',
      label: t('compliance-page.col-commitment'),
      sortable: false,
      bodyCell: commitmentCell,
    }),
    createColumn({
      key: 'deadline',
      label: t('compliance-page.col-deadline'),
      sortable: false,
      bodyCell: deadlineCell,
    }),
    createColumn({
      key: 'status',
      label: t('compliance-page.col-status'),
      sortable: false,
      bodyCell: complianceStatusLabel,
    }),
  ],
  selectable: true,
  exportEnabled: true,
  pageSize: 10,
  cacheKey: 'compliance-operations-list',
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
        :selectable="true"
        :export-enabled="table.exportEnabled"
        :empty-message="t('general.no-data')"
        :actions="false"
        :show-search="false"
      >
        <template #cell-status="{ row }">
          <RouterLink
            v-if="rowHasClause(row) && resolveOperationsTaskRowId(row) != null"
            :to="clauseFilteredTasksRoute(row)"
            :class="[statusBadgeClass(row), '!cursor-pointer']"
            @click.stop
          >
            {{ complianceStatusLabel(row) }}
          </RouterLink>
          <span
            v-else-if="rowHasClause(row)"
            :class="statusBadgeClass(row)"
          >
            {{ complianceStatusLabel(row) }}
          </span>
          <button
            v-else
            type="button"
            :class="statusBadgeClass(row)"
            @click.stop="onComplianceStatusClick(row)"
          >
            {{ complianceStatusLabel(row) }}
          </button>
        </template>
      </BaseTable>
    </div>
  </div>
</template>
