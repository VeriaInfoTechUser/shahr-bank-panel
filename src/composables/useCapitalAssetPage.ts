import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import { useDataTable, createColumn, type FetchFn } from '@core';
import { grcRepo } from '@/core/repositories/grcRepo';
import { useBreadcrumbSlot } from '@/composables/useBreadcrumb';
import { useGlobalModal } from '@/composables/useGlobalModal';
import AssetBreadcrumbToolbar from '@/pages/app/sustainability/asset/AssetBreadcrumbToolbar.vue';

function pickStr(row: Record<string, unknown>, ...keys: string[]) {
  for (const k of keys) {
    const v = row[k];
    if (v == null) continue;
    if (typeof v === 'string' && v.trim()) return v;
    if (typeof v === 'number' && !Number.isNaN(v)) return String(v);
  }
  return '—';
}

export function useCapitalAssetPage() {
  const { t } = useI18n();
  const { setContent: setBreadcrumbSlot } = useBreadcrumbSlot();
  const { openModal } = useGlobalModal();

  const fetchItems: FetchFn = async ({ page, limit, filters }) => {
    const res = await grcRepo.governanceList('assets', { page, limit, ...filters });
    const list = res?.data?.list ?? [];
    const count = res?.data?.paginator?.count ?? 0;
    return { list: Array.isArray(list) ? list : [], count };
  };

  const table = useDataTable({
    fetchFn: fetchItems,
    columns: [
      createColumn({
        key: 'title',
        label: t('sustainability-asset-page.col-title'),
        sortable: false,
        bodyCell: (row) => pickStr(row, 'title'),
      }),
      createColumn({
        key: 'capital',
        label: t('sustainability-asset-page.col-capital'),
        sortable: false,
        bodyCell: (row) => pickStr(row, 'capitalTitle'),
      }),
      createColumn({
        key: 'domain',
        label: t('sustainability-asset-page.col-domain'),
        sortable: false,
        bodyCell: (row) => pickStr(row, 'domainTitle'),
      }),
      createColumn({
        key: 'component',
        label: t('sustainability-asset-page.col-component'),
        sortable: false,
        bodyCell: (row) => pickStr(row, 'componentTitle'),
      }),
      createColumn({
        key: 'capability',
        label: t('sustainability-asset-page.col-capability'),
        sortable: false,
        bodyCell: (row) => pickStr(row, 'capabilityTitle'),
      }),
      createColumn({
        key: 'claim',
        label: t('sustainability-asset-page.col-claim'),
        sortable: false,
        bodyCell: (row) => pickStr(row, 'claimTitle'),
      }),
      createColumn({
        key: 'indicator',
        label: t('sustainability-asset-page.col-indicator'),
        sortable: false,
        bodyCell: (row) => pickStr(row, 'indicatorTitle'),
      }),
      createColumn({
        key: 'assetType',
        label: t('sustainability-asset-page.col-asset-type'),
        sortable: false,
        bodyCell: (row) => pickStr(row, 'assetType'),
      }),
    ],
    selectable: false,
    exportEnabled: true,
    cacheKey: 'sustainability-assets-list',
    listCacheStaleTime: 0,
  });

  function onExport() {
    table.exportCSV();
  }

  onMounted(() => {
    table.invalidateListCache();
    table.fetch();
    setBreadcrumbSlot(AssetBreadcrumbToolbar, {
      onExport,
      table,
    });
  });

  return { table, onExport };
}
