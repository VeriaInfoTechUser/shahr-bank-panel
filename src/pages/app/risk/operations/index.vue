<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useDataTable, createColumn, type FetchFn } from '@core';
import BaseTable from '@core/ui/base/BaseTable.vue';
import { ermRepo } from '@/core/repositories/ermRepo';
import { useBreadcrumbSlot } from '@/composables/useBreadcrumb';
import RiskOperationsBreadcrumbToolbar from './RiskOperationsBreadcrumbToolbar.vue';
import { riskOperationsStatusBadgeClass } from '@/composables/riskOperationsStatusBadge';
import {
  clauseFilteredRiskOperationsRoute,
  resolveOperationsTaskRowId,
} from '@/composables/taskClauseNavigation';
import { rowHasClause } from '@/pages/app/compliance/operations/complianceStatusHelpers';
import {
  getRisk,
  getRiskStateKeyForLabel,
  getRiskStatusKey,
} from './riskStatusHelpers';
import RiskOperationsStatusModal from './RiskOperationsStatusModal.vue';
import { useGlobalModal } from '@/composables/useGlobalModal';

const { t } = useI18n();
const { openModal } = useGlobalModal();
const route = useRoute();
const router = useRouter();
const { setContent: setBreadcrumbSlot } = useBreadcrumbSlot();

function parseReferenceIdFromQuery(q: unknown): number | null {
  if (q == null || q === '') return null;
  const n = Number(q);
  return Number.isFinite(n) && n > 0 ? n : null;
}

const currentReferenceId = computed(() => parseReferenceIdFromQuery(route.query.reference_id));

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

function pickStr(row: Record<string, unknown>, ...keys: string[]) {
  for (const k of keys) {
    const v = row[k];
    if (v == null) continue;
    if (typeof v === 'string' && v.trim()) return v;
    if (typeof v === 'number' && !Number.isNaN(v)) return String(v);
  }
  return '—';
}

function commitmentCell(row: Record<string, unknown>) {
  const task = row.task as Record<string, unknown> | undefined;
  if (task && typeof task.title === 'string' && task.title.trim()) {
    return task.title;
  }
  return pickStr(row, 'title', 'name', 'commitment', 'task_title', 'label');
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

function riskStatusLabel(row: Record<string, unknown>): string {
  if (rowHasClause(row)) {
    return t('compliance-page.status-clauses');
  }
  const r = getRisk(row);
  if (!r) {
    return t('compliance-page.status-pending-assignment');
  }
  const key = getRiskStateKeyForLabel(r);
  if (key && RISK_STATUS_I18N[key]) {
    return t(RISK_STATUS_I18N[key]);
  }
  const fallback = r.level ?? r.status;
  if (typeof fallback === 'string' && fallback.trim()) return fallback;
  return '—';
}

function statusBadgeClass(row: Record<string, unknown>): string {
  return riskOperationsStatusBadgeClass(getRiskStatusKey(row));
}

const fetchRiskList: FetchFn = async ({ page, limit, sort, filters }) => {
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
  const res = await ermRepo.riskList(payload);
  const list = res?.data?.list ?? [];
  const count = res?.data?.paginator?.count ?? 0;
  return { list: Array.isArray(list) ? list : [], count };
};

const table = useDataTable({
  fetchFn: fetchRiskList,
  columns: [
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
  selectable: false,
  exportEnabled: true,

  cacheKey: 'risk-operations-list',
  listCacheStaleTime: 0,
});

function openRiskStatusModal(row: Record<string, unknown>) {
  openModal({
    component: RiskOperationsStatusModal,
    props: { row },
    onSuccess: () => {
      table.invalidateListCache();
      table.fetch();
    },
  });
}

function onRiskStatusClick(row: Record<string, unknown>) {
  if (rowHasClause(row)) return;
  openRiskStatusModal(row);
}

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

function onBackToAllRiskOperations() {
  router.push({ name: 'app-risk-operations' });
}

onMounted(() => {
  syncReferenceFilterFromRoute();
  table.invalidateListCache();
  table.fetch();
  setBreadcrumbSlot(RiskOperationsBreadcrumbToolbar, {
    table,
    onExport: () => table.exportCSV(),
  });
});
</script>

<template>
  <div class="grid grid-cols-12 gap-2 p-2">
    <div v-if="currentReferenceId != null" class="col-span-12">
      <div
        class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-darkmode-600 dark:bg-darkmode-800"
      >
        <span class="text-slate-600 dark:text-slate-300">
          {{ t('risk-operations.operations-clause-filter-hint') }}
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
          @click="onBackToAllRiskOperations"
        >
          {{ t('risk-operations.operations-filter-back') }}
        </button>
      </div>
    </div>
    <div class="col-span-12">
      <BaseTable
        :table="table"
        :selectable="false"
        :export-enabled="table.exportEnabled"
        :empty-message="t('general.no-data')"
        :actions="false"
        :show-search="false"
      >
        <template #cell-status="{ row }">
          <RouterLink
            v-if="rowHasClause(row) && resolveOperationsTaskRowId(row) != null"
            :to="clauseFilteredRiskOperationsRoute(row)"
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
            :class="[statusBadgeClass(row), '!cursor-pointer']"
            @click.stop="onRiskStatusClick(row)"
          >
            {{ riskStatusLabel(row) }}
          </button>
        </template>
      </BaseTable>
    </div>
  </div>
</template>
