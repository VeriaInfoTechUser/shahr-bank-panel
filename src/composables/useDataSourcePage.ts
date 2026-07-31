import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import { useDataTable, createColumn, type FetchFn } from '@core';
import { grcRepo } from '@/core/repositories/grcRepo';
import { useBreadcrumbSlot } from '@/composables/useBreadcrumb';
import { useGlobalModal } from '@/composables/useGlobalModal';
import DataSourceBreadcrumbToolbar from '@/pages/app/sustainability/data-source/DataSourceBreadcrumbToolbar.vue';

function pickStr(row: Record<string, unknown>, ...keys: string[]) {
  for (const k of keys) {
    const v = row[k];
    if (v == null) continue;
    if (typeof v === 'string' && v.trim()) return v;
    if (typeof v === 'number' && !Number.isNaN(v)) return String(v);
  }
  return '—';
}

export function useDataSourcePage() {
  const { t } = useI18n();
  const { setContent: setBreadcrumbSlot } = useBreadcrumbSlot();
  const { openModal } = useGlobalModal();

  const fetchItems: FetchFn = async ({ page, limit, filters }) => {
    const res = await grcRepo.dataSourcesList({ page, limit, ...filters });
    const list = res?.data?.list ?? [];
    const count = res?.data?.paginator?.count ?? 0;
    return { list: Array.isArray(list) ? list : [], count };
  };

  const table = useDataTable({
    fetchFn: fetchItems,
    columns: [
      createColumn({
        key: 'title',
        label: t('sustainability-data-source-page.col-title'),
        sortable: false,
        bodyCell: (row) => pickStr(row, 'title'),
      }),
      createColumn({
        key: 'description',
        label: t('sustainability-data-source-page.col-description'),
        sortable: false,
        bodyCell: (row) => pickStr(row, 'description'),
      }),
      createColumn({
        key: 'capital',
        label: t('sustainability-data-source-page.col-capital'),
        sortable: false,
        bodyCell: (row) => pickStr(row, 'capitalTitle'),
      }),
      createColumn({
        key: 'domain',
        label: t('sustainability-data-source-page.col-domain'),
        sortable: false,
        bodyCell: (row) => pickStr(row, 'domainTitle'),
      }),
      createColumn({
        key: 'component',
        label: t('sustainability-data-source-page.col-component'),
        sortable: false,
        bodyCell: (row) => pickStr(row, 'componentTitle'),
      }),
      createColumn({
        key: 'capability',
        label: t('sustainability-data-source-page.col-capability'),
        sortable: false,
        bodyCell: (row) => pickStr(row, 'capabilityTitle'),
      }),
      createColumn({
        key: 'claim',
        label: t('sustainability-data-source-page.col-claim'),
        sortable: false,
        bodyCell: (row) => pickStr(row, 'claimTitle'),
      }),
      createColumn({
        key: 'indicator',
        label: t('sustainability-data-source-page.col-indicator'),
        sortable: false,
        bodyCell: (row) => pickStr(row, 'indicatorTitle'),
      }),
      createColumn({
        key: 'dataSourceType',
        label: t('sustainability-data-source-page.col-data-source-type'),
        sortable: false,
        bodyCell: (row) => pickStr(row, 'dataSourceType'),
      }),
      createColumn({
        key: 'status',
        label: t('sustainability-data-source-page.col-status'),
        sortable: false,
        bodyCell: (row) => {
          const v = row['status'];
          if (v === 1) return t('sustainability-data-source-page.status-active');
          if (v === 0) return t('sustainability-data-source-page.status-inactive');
          return pickStr(row, 'status');
        },
      }),
    ],
    selectable: false,
    exportEnabled: true,
    cacheKey: 'sustainability-data-sources-list',
    listCacheStaleTime: 0,
  });

  function onExport() {
    table.exportCSV();
  }

  onMounted(() => {
    table.invalidateListCache();
    table.fetch();
    setBreadcrumbSlot(DataSourceBreadcrumbToolbar, {
      onExport,
      table,
    });
  });

  return { table, onExport };
}
