<script setup lang="ts">
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDataTable, createColumn, type FetchFn } from '@core';
import BaseTable from '@core/ui/base/BaseTable.vue';
import { grcRepo } from '@/core/repositories/grcRepo';
import { useBreadcrumbSlot } from '@/composables/useBreadcrumb';
import { useGlobalModal } from '@/composables/useGlobalModal';
import Button from '@/base-components/Button';
import Lucide from '@/base-components/Lucide';
import GovernanceExportToolbar from '@/pages/app/governance/GovernanceExportToolbar.vue';
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
      label: t('capital-metrics-page.col-number'),
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
      key: 'unit',
      label: t('capital-metrics-page.col-unit'),
      sortable: false,
      bodyCell: (row) => pickStr(row, 'unit'),
    }),
    createColumn({
      key: 'categoryTitle',
      label: t('capital-metrics-page.col-category'),
      sortable: false,
      bodyCell: (row) => pickStr(row, 'categoryTitle'),
    }),
    createColumn({
      key: 'categorySubTitle',
      label: t('capital-metrics-page.col-subcategory'),
      sortable: false,
      bodyCell: (row) => pickStr(row, 'categorySubTitle'),
    }),
    createColumn({
      key: 'direction',
      label: t('capital-metrics-page.col-direction'),
      sortable: false,
      bodyCell: (row) => pickStr(row, 'direction'),
    }),
  ],
  selectable: false,
  exportEnabled: true,
  cacheKey: 'capital-metrics-list',
  listCacheStaleTime: 0,
});

function goToDetail(row: Record<string, unknown>) {
  const slug = String(row.slug ?? '');
  if (slug) {
    router.push({ name: 'app-capital-metrics-detail', params: { slug } });
  }
}

onMounted(() => {
  table.fetch();
  setBreadcrumbSlot(GovernanceExportToolbar, {
    onExport: () => table.exportCSV(),
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
        <template #actions="{ row }">
          <div class="flex items-center justify-center gap-3">
            <Button
              type="button"
              variant="outline-secondary"
              size="sm"
              class="!h-7 !w-7 !px-0 !py-0"
              :aria-label="t('capital-metrics-page.view-detail')"
              :title="t('capital-metrics-page.view-detail')"
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
