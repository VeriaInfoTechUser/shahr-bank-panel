<script setup lang="ts">
import { onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useDataTable, createColumn, type FetchFn } from '@core';
import BaseTable from '@core/ui/base/BaseTable.vue';
import { ermRepo } from '@/core/repositories/ermRepo';
import { useBreadcrumbSlot } from '@/composables/useBreadcrumb';
import SettingsExportToolbar from '@/pages/app/settings/SettingsExportToolbar.vue';
import { riskOperationsStatusBadgeClass } from '@/composables/riskOperationsStatusBadge';
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

function commitmentCell(row: Record<string, unknown>) {
  const task = row.task as Record<string, unknown> | undefined;
  if (task && typeof task.title === 'string' && task.title.trim()) {
    return task.title;
  }
  return pickStr(row, 'title', 'name', 'commitment', 'task_title', 'label');
}

/** وضعیت/مهلت از آبجکت `risk` (نه `progress`) */
function getRisk(row: Record<string, unknown>): Record<string, unknown> | null {
  const r = row.risk;
  if (r == null || typeof r !== 'object' || Array.isArray(r)) return null;
  if (Object.keys(r).length === 0) return null;
  return r as Record<string, unknown>;
}

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

function deadlineCell(row: Record<string, unknown>) {
  const r = getRisk(row);
  if (!r) return '—';
  const view = r.time_deadline_view;
  const ts = r.time_deadline;
  return deadlineWithoutTime(
    typeof view === 'string' ? view : undefined,
    typeof ts === 'number' ? ts : undefined,
  );
}

const RISK_STATUS_I18N: Record<string, string> = {
  todo: 'compliance-page.status-todo',
  doing: 'compliance-page.status-doing',
  done: 'compliance-page.status-done',
  approve: 'compliance-page.status-approve',
  reject: 'compliance-page.status-reject',
};

function rowHasClause(row: Record<string, unknown>): boolean {
  const h = row.has_clause;
  if (h === 1 || h === true) return true;
  const c = row.clause;
  if (Array.isArray(c) && c.length > 0) return true;
  return false;
}

/** وضعیت ریسک: `risk.level` سپس `risk.status` */
function riskStateKey(r: Record<string, unknown>): string {
  const level = r.level;
  const status = r.status;
  const raw =
    typeof level === 'string' && level.trim()
      ? level
      : typeof status === 'string'
        ? status
        : '';
  return raw.trim().toLowerCase();
}

function riskStatusLabel(row: Record<string, unknown>): string {
  if (rowHasClause(row)) {
    return t('compliance-page.status-clauses');
  }
  const r = getRisk(row);
  if (!r) {
    return t('compliance-page.status-pending-assignment');
  }
  const key = riskStateKey(r);
  if (key && RISK_STATUS_I18N[key]) {
    return t(RISK_STATUS_I18N[key]);
  }
  const fallback = r.level ?? r.status;
  if (typeof fallback === 'string' && fallback.trim()) return fallback;
  return '—';
}

function riskStatusKey(row: Record<string, unknown>): string {
  if (rowHasClause(row)) return 'clauses';
  const r = getRisk(row);
  if (!r) return 'pending-assignment';
  const key = riskStateKey(r);
  if (key && RISK_STATUS_I18N[key]) return key;
  return 'unknown';
}

function statusBadgeClass(row: Record<string, unknown>): string {
  return riskOperationsStatusBadgeClass(riskStatusKey(row));
}

function onRiskStatusClick(_row: Record<string, unknown>) {
  /* آینده: مودال جریان وضعیت */
}

const fetchRiskList: FetchFn = async ({ page, limit, sort, filters }) => {
  const res = await ermRepo.riskList({
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
  fetchFn: fetchRiskList,
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
      bodyCell: riskStatusLabel,
    }),
  ],
  selectable: true,
  exportEnabled: true,
  pageSize: 10,
  cacheKey: 'risk-operations-list',
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
            {{ riskStatusLabel(row) }}
          </RouterLink>
          <span
            v-else-if="rowHasClause(row)"
            :class="statusBadgeClass(row)"
          >
            {{ riskStatusLabel(row) }}
          </span>
          <button
            v-else
            type="button"
            :class="statusBadgeClass(row)"
            @click.stop="onRiskStatusClick(row)"
          >
            {{ riskStatusLabel(row) }}
          </button>
        </template>
      </BaseTable>
    </div>
  </div>
</template>
