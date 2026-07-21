import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import { useDataTable, createColumn, type FetchFn } from '@core';
import BaseConfirmModal from '@core/ui/base/BaseConfirmModal.vue';
import { grcRepo } from '@/core/repositories/grcRepo';
import { useBreadcrumbSlot } from '@/composables/useBreadcrumb';
import { useGlobalModal } from '@/composables/useGlobalModal';
import GovernanceExportToolbar from '@/pages/app/governance/GovernanceExportToolbar.vue';
import AssetFormModal from '@/pages/app/sustainability/asset/AssetFormModal.vue';
import { sourceAssetTypes } from '@/pages/app/sustainability/source-asset-types';

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

  const assetTypeMap = new Map(sourceAssetTypes.map((item) => [item.slug, t(item.title)]));

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
        label: t('governance-page.col-title'),
        sortable: false,
        bodyCell: (row) => pickStr(row, 'title', 'name', 'label'),
      }),
      createColumn({
        key: 'assetType',
        label: t('asset-page.col-asset-type'),
        sortable: false,
        bodyCell: (row) => {
          const val = pickStr(row, 'assetType');
          return assetTypeMap.get(val) ?? val;
        },
      }),
      createColumn({
        key: 'status',
        label: t('asset-page.col-status'),
        sortable: false,
        bodyCell: (row) => {
          const val = row.status;
          return val === 1 || val === '1'
            ? t('asset-page.status-active')
            : t('asset-page.status-inactive');
        },
      }),
      createColumn({
        key: 'metricSlug',
        label: t('asset-page.col-metric'),
        sortable: false,
        bodyCell: (row) => pickStr(row, 'metricSlug'),
      }),
      createColumn({
        key: 'description',
        label: t('governance-page.col-description'),
        sortable: false,
        bodyCell: (row) => pickStr(row, 'description', 'summary'),
      }),
    ],
    selectable: false,
    exportEnabled: true,
    cacheKey: 'governance-assets-list',
    listCacheStaleTime: 0,
  });

  function onAdd() {
    openModal({
      component: AssetFormModal,
      onSuccess: () => {
        table.invalidateListCache();
        void table.fetch();
      },
    });
  }

  function onEdit(row: Record<string, unknown>) {
    openModal({
      component: AssetFormModal,
      props: { record: row },
      onSuccess: () => {
        table.invalidateListCache();
        void table.fetch();
      },
    });
  }

  function onDelete(row: Record<string, unknown>) {
    openModal({
      component: BaseConfirmModal,
      props: {
        title: t('governance-page.delete-title', { entity: t('menu.sustainability-asset') }),
        message: t('governance-page.delete-message', { entity: t('menu.sustainability-asset') }),
        confirmVariant: 'danger' as const,
        onConfirmAction: async () => {
          const slug = String(row.slug ?? '');
          if (!slug) {
            const msg = t('governance-page.delete-error', { entity: t('menu.sustainability-asset') });
            toast(msg, { type: 'error' });
            throw new Error(msg);
          }
          const res = await grcRepo.governanceDelete(slug);
          if (!res?.result) {
            const msg = String(
              res?.error ?? t('governance-page.delete-error', { entity: t('menu.sustainability-asset') })
            );
            toast(msg, { type: 'error' });
            throw new Error(msg);
          }
        },
      },
      onSuccess: () => {
        table.invalidateListCache();
        void table.fetch();
      },
    });
  }

  onMounted(() => {
    table.fetch();
    setBreadcrumbSlot(GovernanceExportToolbar, {
      onExport: () => table.exportCSV(),
      onAdd,
      addLabelKey: 'governance-page.add-entity',
      addLabelParams: { entity: t('menu.sustainability-asset') },
    });
  });

  return { table, onAdd, onEdit, onDelete };
}
