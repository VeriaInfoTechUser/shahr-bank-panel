import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import { useDataTable, createColumn, type FetchFn } from '@core';
import BaseConfirmModal from '@core/ui/base/BaseConfirmModal.vue';
import { grcRepo } from '@/core/repositories/grcRepo';
import { useBreadcrumbSlot } from '@/composables/useBreadcrumb';
import { useGlobalModal } from '@/composables/useGlobalModal';
import GovernanceExportToolbar from '@/pages/app/governance/GovernanceExportToolbar.vue';
import GovernanceFormModal from '@/pages/app/governance/GovernanceFormModal.vue';

function pickStr(row: Record<string, unknown>, ...keys: string[]) {
  for (const k of keys) {
    const v = row[k];
    if (v == null) continue;
    if (typeof v === 'string' && v.trim()) return v;
    if (typeof v === 'number' && !Number.isNaN(v)) return String(v);
  }
  return '—';
}

export function useGovernancePage(entityName: string, type: string) {
  const { t } = useI18n();
  const { setContent: setBreadcrumbSlot } = useBreadcrumbSlot();
  const { openModal } = useGlobalModal();

  const fetchItems: FetchFn = async ({ page, limit, filters }) => {
    const res = await grcRepo.governanceList(type, { page, limit, ...filters });
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
        key: 'description',
        label: t('governance-page.col-description'),
        sortable: false,
        bodyCell: (row) => pickStr(row, 'description', 'summary'),
      }),
    ],
    selectable: false,
    exportEnabled: true,
    cacheKey: `governance-${type}-list`,
    listCacheStaleTime: 0,
  });

  function onAdd() {
    openModal({
      component: GovernanceFormModal,
      props: { type, entityName },
      onSuccess: () => {
        table.invalidateListCache();
        void table.fetch();
      },
    });
  }

  function onEdit(row: Record<string, unknown>) {
    openModal({
      component: GovernanceFormModal,
      props: { record: row, type, entityName },
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
        title: t('governance-page.delete-title', { entity: t(`menu.governance-${entityName}`) }),
        message: t('governance-page.delete-message', { entity: t(`menu.governance-${entityName}`) }),
        confirmVariant: 'danger' as const,
        onConfirmAction: async () => {
          const slug = String(row.slug ?? '');
          if (!slug) {
            const msg = t('governance-page.delete-error', { entity: t(`menu.governance-${entityName}`) });
            toast(msg, { type: 'error' });
            throw new Error(msg);
          }
          const res = await grcRepo.governanceDelete(slug);
          if (!res?.result) {
            const msg = String(
              res?.error ?? t('governance-page.delete-error', { entity: t(`menu.governance-${entityName}`) })
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
      addLabelParams: { entity: t(`menu.governance-${entityName}`) },
    });
  });

  return { table, onAdd, onEdit, onDelete };
}
