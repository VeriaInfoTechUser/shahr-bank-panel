<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { onMounted, ref } from 'vue';
import { useDataTable, createColumn, type FetchFn } from '@core';
import BaseTable from '@core/ui/base/BaseTable.vue';
import { grcRepo } from '@/core/repositories/grcRepo';
import { useBreadcrumbSlot } from '@/composables/useBreadcrumb';
import Button from '@/base-components/Button';
import Lucide from '@/base-components/Lucide';
import RiskListBreadcrumbToolbar from './RiskListBreadcrumbToolbar.vue';
import CreateRiskModal from './CreateRiskModal.vue';
import RiskDetailModal from './RiskDetailModal.vue';

const { t } = useI18n();
const { setContent: setBreadcrumbSlot } = useBreadcrumbSlot();

const showCreateModal = ref(false);
const showDetailModal = ref(false);
const selectedRiskId = ref<string | null>(null);

const fetchRisks: FetchFn = async ({ page, limit, filters }) => {
  const params: Record<string, unknown> = { page, limit };
  if (filters) {
    if (filters.search) params.search = filters.search;
    if (filters.status) params.state = filters.status;
    if (filters.type) params.type = filters.type;
    if (filters.level) params.level = filters.level;
    if (filters.categoryId) params.categoryId = filters.categoryId;
    if (filters.subCategoryId) params.subCategoryId = filters.subCategoryId;
  }
  const res = await grcRepo.riskList(params);
  const list = res?.data?.list ?? [];
  const count = res?.data?.paginator?.count ?? 0;
  return { list: Array.isArray(list) ? list : [], count };
};

function riskLevelBadgeClass(level: string | null): string {
  const base = 'inline-flex items-center justify-center rounded-md px-2 py-0.5 text-[9px] font-semibold leading-snug shadow-sm';
  switch (level) {
    case 'low': return `${base} bg-green-100 text-green-800 border border-green-200`;
    case 'medium': return `${base} bg-amber-100 text-amber-800 border border-amber-200`;
    case 'high': return `${base} bg-orange-100 text-orange-800 border border-orange-200`;
    case 'critical': return `${base} bg-red-100 text-red-800 border border-red-200`;
    default: return `${base} bg-slate-100 text-slate-600 border border-slate-200`;
  }
}

function statusBadgeClass(state: string): string {
  const base = 'inline-flex items-center justify-center rounded-md px-2 py-0.5 text-[9px] font-semibold leading-snug shadow-sm';
  switch (state) {
    case 'draft': return `${base} bg-slate-100 text-slate-700 border border-slate-200`;
    case 'registered': return `${base} bg-blue-100 text-blue-800 border border-blue-200`;
    case 'analysis': return `${base} bg-violet-100 text-violet-800 border border-violet-200`;
    case 'response': return `${base} bg-orange-100 text-orange-800 border border-orange-200`;
    case 'monitoring': return `${base} bg-sky-100 text-sky-800 border border-sky-200`;
    case 'closed': return `${base} bg-emerald-100 text-emerald-800 border border-emerald-200`;
    case 'archived': return `${base} bg-stone-100 text-stone-700 border border-stone-200`;
    default: return `${base} bg-slate-100 text-slate-600 border border-slate-200`;
  }
}

function riskTypeBadgeClass(type: string): string {
  const base = 'inline-flex items-center justify-center rounded-md px-2 py-0.5 text-[9px] font-semibold leading-snug shadow-sm';
  if (type === 'threat') return `${base} bg-red-50 text-red-700 border border-red-200`;
  if (type === 'opportunity') return `${base} bg-green-50 text-green-700 border border-green-200`;
  return `${base} bg-slate-100 text-slate-600 border border-slate-200`;
}

const table = useDataTable({
  fetchFn: fetchRisks,
  columns: [
    createColumn({
      key: 'title',
      label: t('risk.col-title'),
      sortable: false,
      bodyCell: (row) => (row.title as string) ?? '—',
    }),
    createColumn({
      key: 'category',
      label: t('risk.col-category'),
      sortable: false,
      bodyCell: (row) => {
        const cat = (row.categoryTitle as string) ?? '—';
        const sub = (row.subCategoryTitle as string) ?? '';
        return sub ? `${cat} / ${sub}` : cat;
      },
    }),
    createColumn({
      key: 'riskType',
      label: t('risk.col-type'),
      sortable: false,
      slot: true,
      bodyCell: (row) => (row.riskType as string) ?? '—',
    }),
    createColumn({
      key: 'riskLevel',
      label: t('risk.col-level'),
      sortable: false,
      slot: true,
      bodyCell: (row) => (row.riskLevel as string) ?? '—',
    }),
    createColumn({
      key: 'inherentScore',
      label: t('risk.col-inherent-score'),
      sortable: false,
      bodyCell: (row) => {
        const s = row.inherentScore;
        return s != null ? String(s) : '—';
      },
    }),
    createColumn({
      key: 'state',
      label: t('risk.col-status'),
      sortable: false,
      slot: true,
      bodyCell: (row) => (row.state as string) ?? '—',
    }),
    createColumn({
      key: 'createdAt',
      label: t('risk.col-created-at'),
      sortable: false,
      bodyCell: (row) => (row.createdAt as string) ?? '—',
    }),
  ],
  selectable: false,
  exportEnabled: true,
  pageSize: 10,
  cacheKey: 'risk-list',
  listCacheStaleTime: 0,
});

onMounted(() => {
  table.invalidateListCache();
  table.fetch();
  setBreadcrumbSlot(RiskListBreadcrumbToolbar, {
    onAdd: onCreateRisk,
    onExport: onExportRisks,
    table,
  });
});

function onCreateRisk() {
  showCreateModal.value = true;
}

function onExportRisks() {
  table.exportCSV();
}

function onRowClick(row: Record<string, unknown>) {
  const id = row.slug  
  if (id) {
    selectedRiskId.value = String(id);
    showDetailModal.value = true;
  }
}

function onEditRisk(row: Record<string, unknown>) {
  const id = row.slug;
  if (id) {
    selectedRiskId.value = String(id);
    showDetailModal.value = true;
  }
}

function onTransitionRisk(row: Record<string, unknown>) {
  const id = row.slug;
  if (id) {
    selectedRiskId.value = String(id);
    showDetailModal.value = true;
  }
}

function onModalSuccess() {
  table.invalidateListCache();
  void table.fetch();
}
</script>

<template>
  <div class="grid grid-cols-12 gap-2 p-2">
    <div class="col-span-12">
      <BaseTable
        :table="table"
        :selectable="false"
        :export-enabled="table.exportEnabled"
        :empty-message="t('general.no-data')"
        :actions="true"
        :actions-header="t('general.actions')"
        :show-search="false"
        @row-click="onRowClick"
      >
        <template #cell-riskType="{ row }">
          <span :class="riskTypeBadgeClass(row.riskType)">
            {{ t(`risk.type-${row.riskType}`) }}
          </span>
        </template>

        <template #cell-riskLevel="{ row }">
          <span :class="riskLevelBadgeClass(row.riskLevel)">
            {{ row.riskLevel ? t(`risk.level-${row.riskLevel}`) : '—' }}
          </span>
        </template>

        <template #cell-state="{ row }">
          <span :class="statusBadgeClass(row.state)">
            {{ t(`risk.status-${row.state}`) }}
          </span>
        </template>

        <template #actions="{ row }">
          <div class="flex items-center justify-center gap-3">
            <Button
              type="button"
              variant="outline-secondary"
              size="sm"
              class="!h-7 !w-7 !px-0 !py-0"
              :aria-label="t('title.update')"
              :title="t('title.update')"
              @click.stop="onEditRisk(row)"
            >
              <Lucide icon="Pencil" class="!h-3.5 !w-3.5" />
            </Button>
            <Button
              type="button"
              variant="outline-primary"
              size="sm"
              class="!h-7 !w-7 !px-0 !py-0"
              :aria-label="t('risk.action-transition')"
              :title="t('risk.action-transition')"
              @click.stop="onTransitionRisk(row)"
            >
              <Lucide icon="ArrowRight" class="!h-3.5 !w-3.5" />
            </Button>
          </div>
        </template>
      </BaseTable>
    </div>

    <CreateRiskModal
      :show="showCreateModal"
      @update:show="showCreateModal = $event"
      @success="onModalSuccess"
    />

    <RiskDetailModal
      v-if="selectedRiskId"
      :show="showDetailModal"
      :risk-id="selectedRiskId"
      @update:show="showDetailModal = $event"
      @success="onModalSuccess"
    />
  </div>
</template>
