<script setup lang="ts">
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDataTable, createColumn, type FetchFn } from '@core';
import BaseTable from '@core/ui/base/BaseTable.vue';
import { grcRepo } from '@/core/repositories/grcRepo';
import { useBreadcrumbSlot } from '@/composables/useBreadcrumb';
import Button from '@/base-components/Button';
import Lucide from '@/base-components/Lucide';
import CapitalMetricsBreadcrumbToolbar from './CapitalMetricsBreadcrumbToolbar.vue';
import { useRouter } from 'vue-router';

const { t } = useI18n();
const router = useRouter();
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

const fetchMetrics: FetchFn = async ({ page, limit, filters }) => {
  const res = await grcRepo.metricsList({ page, limit, ...filters });
  const list = res?.data?.list ?? [];
  const count = res?.data?.paginator?.count ?? 0;
  return { list: Array.isArray(list) ? list : [], count };
};

const table = useDataTable({
  fetchFn: fetchMetrics,
  columns: [
    createColumn({
      key: 'number',
      label: t('sustainability-metrics-page.col-number'),
      sortable: false,
      bodyCell: (row) => pickStr(row, 'number'),
    }),
    createColumn({
      key: 'title',
      label: t('governance-page.col-title'),
      sortable: false,
      bodyCell: (row) => pickStr(row, 'title'),
    }),
    createColumn({
      key: 'categoryTitle',
      label: t('sustainability-metrics-page.col-category'),
      sortable: false,
      bodyCell: (row) => pickStr(row, 'categoryTitle'),
    }),
    createColumn({
      key: 'categorySubTitle',
      label: t('sustainability-metrics-page.col-subcategory'),
      sortable: false,
      bodyCell: (row) => pickStr(row, 'categorySubTitle'),
    }),
    createColumn({
      key: 'industries',
      label: t('sustainability-metrics-page.col-industries'),
      sortable: false,
    }),
    createColumn({
      key: 'metricRole',
      label: t('sustainability-metrics-page.col-metric-role'),
      sortable: false,
    }),
    createColumn({
      key: 'calculationType',
      label: t('sustainability-metrics-page.col-calculation-type'),
      sortable: false,
      bodyCell: (row) => {
        const v = row.calculationType;
        if (typeof v === 'string' && v.trim()) return t(`metrics.${v.trim()}`);
        return '—';
      },
    }),
    createColumn({
      key: 'hasSubAssets',
      label: t('sustainability-metrics-page.has-sub-assets'),
      sortable: false,
    }),
    createColumn({
      key: 'sourceAssetType',
      label: t('sustainability-metrics-page.col-source-asset'),
      sortable: false,
      bodyCell: (row) => {
        const v = row.sourceAssetType;
        if (typeof v === 'string' && v.trim()) return t(`metrics.${v.trim()}`);
        return '—';
      },
    }),
  ],
  selectable: false,
  exportEnabled: true,
  cacheKey: 'sustainability-metrics-list',
  listCacheStaleTime: 0,
});

const metricRoleColors: Record<string, string> = {
  kpi: 'bg-warning/15 text-warning',
  pi: 'bg-info/15 text-info',
  control: 'bg-success/15 text-success',
};

function metricRoleClass(role: unknown): string {
  const key = String(role ?? '').trim().toLowerCase();
  return metricRoleColors[key] ?? 'bg-slate-100 text-slate-600 dark:bg-darkmode-700 dark:text-slate-300';
}

function goToDetail(row: Record<string, unknown>) {
  const slug = String(row.slug ?? '');
  if (slug) {
    router.push({ name: 'app-sustainability-metrics-detail', params: { slug } });
  }
}

onMounted(() => {
  table.fetch();
  setBreadcrumbSlot(CapitalMetricsBreadcrumbToolbar, {
    onExport: () => table.exportCSV(),
    table,
  });
});
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
        :show-search="false"
      >
        <template #cell-industries="{ row }">
          <div class="flex flex-wrap gap-1">
            <span
              v-for="ind in (Array.isArray(row.industries) ? row.industries : [])"
              :key="ind"
              class="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
            >
              {{ ind }}
            </span>
            <span v-if="!Array.isArray(row.industries) || !row.industries.length">—</span>
          </div>
        </template>
        <template #cell-metricRole="{ row }">
          <span
            class="inline-block w-20 rounded px-2 py-0.5 text-center text-xs font-semibold"
            :class="metricRoleClass(row.metricRole)"
          >
            {{ pickStr(row, 'metricRole') }}
          </span>
        </template>
        <template #cell-hasSubAssets="{ row }">
          <span
            class="rounded px-2 py-0.5 text-xs font-medium"
            :class="row.hasSubAssets ? 'bg-success/10 text-success' : 'bg-slate-100 text-slate-500 dark:bg-darkmode-700 dark:text-slate-400'"
          >
            {{ row.hasSubAssets ? t('general.yes') : t('general.no') }}
          </span>
        </template>
        <template #actions="{ row }">
          <div class="flex items-center justify-center gap-3">
            <Button
              type="button"
              variant="outline-secondary"
              size="sm"
              class="!h-7 !w-7 !px-0 !py-0"
              :aria-label="t('sustainability-metrics-page.view-detail')"
              :title="t('sustainability-metrics-page.view-detail')"
              @click.stop="goToDetail(row)"
            >
              <Lucide icon="Eye" class="!h-3.5 !w-3.5" />
            </Button>
          </div>
        </template>
      </BaseTable>
    </div>
  </div>
</template>
