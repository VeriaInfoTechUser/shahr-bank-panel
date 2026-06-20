<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useDataTable, createColumn, type FetchFn } from '@core';
import BaseTable from '@core/ui/base/BaseTable.vue';
import { grcRepo } from '@/core/repositories/grcRepo';
import { ermRepo } from '@/core/repositories/ermRepo';
import { useBreadcrumbSlot } from '@/composables/useBreadcrumb';
import Button from '@/base-components/Button';
import Lucide from '@/base-components/Lucide';
import RiskArchiveBreadcrumbToolbar from './RiskArchiveBreadcrumbToolbar.vue';

const { t } = useI18n();
const router = useRouter();
const { setContent: setBreadcrumbSlot } = useBreadcrumbSlot();

const memberOptions = ref<{ value: string; label: string }[]>([]);

function mapMembers(list: Record<string, unknown>[]) {
  return list
    .map((m) => {
      const id = m.id ?? m.user_id;
      if (id == null) return null;
      const label =
        [m.name, m.full_name, m.email, m.mobile]
          .find((x) => typeof x === 'string' && String(x).trim()) ?? String(id);
      return { value: String(id), label: String(label).trim() };
    })
    .filter((x): x is { value: string; label: string } => x != null);
}

function getOwnerName(ownerId: unknown): string {
  if (!ownerId) return '—';
  const member = memberOptions.value.find((m) => m.value === String(ownerId));
  return member?.label ?? String(ownerId);
}

async function loadMembers() {
  try {
    const res = await ermRepo.memberList({ page: 1, limit: 500 });
    const list = res?.data?.list ?? [];
    memberOptions.value = mapMembers(Array.isArray(list) ? list : []);
  } catch {
    memberOptions.value = [];
  }
}

const fetchRisks: FetchFn = async ({ page, limit, filters }) => {
  const res = await grcRepo.riskList({ page, limit, state: ['archived'], ...(filters ?? {}) });
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
  const base = 'inline-flex items-center justify-center rounded-md px-2 py-0.5 text-[9px] font-semibold leading-snug shadow-sm w-16';
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
      key: 'state',
      label: t('risk.col-status'),
      sortable: false,
      slot: true,
      bodyCell: (row) => (row.state as string) ?? '—',
    }),
    createColumn({
      key: 'riskLevel',
      label: t('risk.col-level'),
      sortable: false,
      slot: true,
      bodyCell: (row) => (row.riskLevel as string) ?? '—',
    }),
    createColumn({
      key: 'inherentImpact',
      label: t('risk.col-impact'),
      sortable: false,
      bodyCell: (row) => {
        const v = row.inherentImpact;
        return v != null ? String(v) : '—';
      },
    }),
    createColumn({
      key: 'likelihood',
      label: t('risk.col-likelihood'),
      sortable: false,
      bodyCell: (row) => {
        const v = row.likelihood;
        return v != null ? String(v) : '—';
      },
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
      key: 'ownerId',
      label: t('risk.col-owner'),
      sortable: false,
      bodyCell: (row) => getOwnerName(row.ownerId),
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
  cacheKey: 'risk-archive-list',
  listCacheStaleTime: 0,
});

onMounted(() => {
  loadMembers();
  table.invalidateListCache();
  table.fetch();
  setBreadcrumbSlot(RiskArchiveBreadcrumbToolbar, {
    onExport: onExportRisks,
    table,
  });
});

function onExportRisks() {
  table.exportCSV();
}

function onViewDetail(row: Record<string, unknown>) {
  const slug = row.slug as string;
  if (slug) {
    router.push({ name: 'app-risk-detail', params: { slug } });
  }
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
        :actions-header="''"
        :show-search="false"
      >
        <template #cell-state="{ row }">
          <span :class="statusBadgeClass(row.state)">
            {{ t(`risk.status-${row.state}`) }}
          </span>
        </template>

        <template #cell-riskLevel="{ row }">
          <span :class="riskLevelBadgeClass(row.riskLevel)">
            {{ row.riskLevel ? t(`risk.level-${row.riskLevel}`) : '—' }}
          </span>
        </template>

        <template #cell-riskType="{ row }">
          <span :class="riskTypeBadgeClass(row.riskType)">
            {{ t(`risk.type-${row.riskType}`) }}
          </span>
        </template>

        <template #actions="{ row }">
          <div class="flex items-center justify-center gap-1.5">
            <Button
              type="button"
              variant="outline-primary"
              size="sm"
              class="!h-7 !w-7 !px-0 !py-0"
              :aria-label="t('risk.action-view-detail')"
              :title="t('risk.action-view-detail')"
              @click.stop="onViewDetail(row)"
            >
              <Lucide icon="Eye" class="!h-3.5 !w-3.5" />
            </Button>
          </div>
        </template>
      </BaseTable>
    </div>
  </div>
</template>
