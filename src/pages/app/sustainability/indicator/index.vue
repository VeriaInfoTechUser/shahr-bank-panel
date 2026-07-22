<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useDataTable, createColumn, type FetchFn } from '@core';
import BaseTable from '@core/ui/base/BaseTable.vue';
import { grcRepo } from '@/core/repositories/grcRepo';
import { useBreadcrumbSlot } from '@/composables/useBreadcrumb';
import Button from '@/base-components/Button';
import Lucide from '@/base-components/Lucide';
import IndicatorBreadcrumbToolbar from './IndicatorBreadcrumbToolbar.vue';

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

const fetchIndicators: FetchFn = async ({ page, limit, filters }) => {
  const res = await grcRepo.indicatorList({ page, limit, ...(filters ?? {}) });
  const list = res?.data?.list ?? [];
  const count = res?.data?.paginator?.count ?? 0;
  return { list: Array.isArray(list) ? list : [], count };
};

const table = useDataTable({
  fetchFn: fetchIndicators,
  columns: [
    createColumn({
      key: 'title',
      label: t('sustainability-indicator-page.col-title'),
      sortable: false,
      bodyCell: (row) => pickStr(row, 'title'),
    }),
    createColumn({
      key: 'capital',
      label: t('sustainability-indicator-page.col-capital'),
      sortable: false,
      bodyCell: (row) => pickStr(row, 'capitalTitle'),
    }),
    createColumn({
      key: 'domain',
      label: t('sustainability-indicator-page.col-domain'),
      sortable: false,
      bodyCell: (row) => pickStr(row, 'domainTitle'),
    }),
    createColumn({
      key: 'component',
      label: t('sustainability-indicator-page.col-component'),
      sortable: false,
      bodyCell: (row) => pickStr(row, 'componentTitle'),
    }),
    createColumn({
      key: 'capability',
      label: t('sustainability-indicator-page.col-capability'),
      sortable: false,
      bodyCell: (row) => pickStr(row, 'capabilityTitle'),
    }),
    createColumn({
      key: 'claim',
      label: t('sustainability-indicator-page.col-claim'),
      sortable: false,
      bodyCell: (row) => pickStr(row, 'claimTitle'),
    }),
    createColumn({
      key: 'indicatorType',
      label: t('sustainability-indicator-page.col-indicator-type'),
      sortable: false,
      bodyCell: (row) => pickStr(row, 'indicatorType'),
    }),
    createColumn({
      key: 'unit',
      label: t('sustainability-indicator-page.col-unit'),
      sortable: false,
      bodyCell: (row) => pickStr(row, 'unit'),
    }),
    createColumn({
      key: 'direction',
      label: t('sustainability-indicator-page.col-direction'),
      sortable: false,
      bodyCell: (row) => pickStr(row, 'direction'),
    }),
  ],
  selectable: false,
  exportEnabled: true,
  cacheKey: 'sustainability-indicators-list',
  listCacheStaleTime: 0,
});

function onExportIndicators() {
  table.exportCSV();
}

function onAddIndicator() {
  router.push({ name: 'app-sustainability-indicator-create' });
}

function onEditIndicator(row: Record<string, unknown>) {
  router.push({ name: 'app-sustainability-indicator-edit', params: { slug: row.slug } });
}

import { onMounted } from 'vue';

onMounted(() => {
  table.invalidateListCache();
  table.fetch();
  setBreadcrumbSlot(IndicatorBreadcrumbToolbar, {
    onAdd: onAddIndicator,
    onExport: onExportIndicators,
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
        <template #actions="{ row }">
          <div class="flex items-center justify-center gap-3">
            <Button
              type="button"
              variant="outline-secondary"
              size="sm"
              class="!h-7 !w-7 !px-0 !py-0"
              :aria-label="t('title.update')"
              :title="t('title.update')"
              @click.stop="onEditIndicator(row)"
            >
              <Lucide icon="Pencil" class="!h-3.5 !w-3.5" />
            </Button>
          </div>
        </template>
      </BaseTable>
    </div>
  </div>
</template>
