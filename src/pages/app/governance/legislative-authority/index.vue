<script setup lang="ts">
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import { useDataTable, createColumn, type FetchFn } from '@core';
import BaseTable from '@core/ui/base/BaseTable.vue';
import BaseConfirmModal from '@core/ui/base/BaseConfirmModal.vue';
import { grcRepo } from '@/core/repositories/grcRepo';
import { invalidateRuleAuthorOptionsCache } from '@/core/erm/ruleAuthorTypeOptionsCache';
import { useBreadcrumbSlot } from '@/composables/useBreadcrumb';
import { useGlobalModal } from '@/composables/useGlobalModal';
import Button from '@/base-components/Button';
import Lucide from '@/base-components/Lucide';
import GovernanceExportToolbar from '../GovernanceExportToolbar.vue';
import LegislativeAuthorityFormModal from './LegislativeAuthorityFormModal.vue';

const { t } = useI18n();
const { setContent: setBreadcrumbSlot } = useBreadcrumbSlot();
const { openModal } = useGlobalModal();

function pickStr(row: Record<string, unknown>, ...keys: string[]) {
  for (const k of keys) {
    const v = row[k];
    if (v == null) continue;
    if (typeof v === 'string' && v.trim()) return v;
    if (typeof v === 'number' && !Number.isNaN(v)) return String(v);
  }
  return '—';
}

function nameCell(row: Record<string, unknown>) {
  return pickStr(row, 'title', 'name', 'label');
}

function descriptionCell(row: Record<string, unknown>) {
  return pickStr(row, 'description', 'summary');
}

const fetchLegislators: FetchFn = async ({ page, limit, filters }) => {
  const res = await grcRepo.legislatorList({
    page,
    limit,
    ...filters,
  });
  const list = res?.data?.list ?? [];
  const count = res?.data?.paginator?.count ?? 0;
  return { list: Array.isArray(list) ? list : [], count };
};

const table = useDataTable({
  fetchFn: fetchLegislators,
  columns: [
    createColumn({
      key: 'title',
      label: t('settings-page.legislative-authority-col-name'),
      sortable: false,
      bodyCell: nameCell,
    }),
    createColumn({
      key: 'description',
      label: t('settings-page.legislative-authority-col-description'),
      sortable: false,
      bodyCell: descriptionCell,
    }),
  ],
  selectable: false,
  exportEnabled: true,

  cacheKey: 'settings-rule-author-list',
  listCacheStaleTime: 0,
});

function onAddAuthor() {
  openModal({
    component: LegislativeAuthorityFormModal,
    props: {},
    onSuccess: () => {
      invalidateRuleAuthorOptionsCache();
      table.invalidateListCache();
      void table.fetch();
    },
  });
}

onMounted(() => {
  table.fetch();
  setBreadcrumbSlot(GovernanceExportToolbar, {
    onExport: () => table.exportCSV(),
    onAdd: onAddAuthor,
    addLabelKey: 'settings-page.add-legislative-authority',
  });
});

function onEditAuthor(row: Record<string, unknown>) {
  openModal({
    component: LegislativeAuthorityFormModal,
    props: { record: row },
    onSuccess: () => {
      invalidateRuleAuthorOptionsCache();
      table.invalidateListCache();
      void table.fetch();
    },
  });
}

function onDeleteAuthor(row: Record<string, unknown>) {
  openModal({
    component: BaseConfirmModal,
    props: {
      titleKey: 'settings-page.legislative-authority-delete-title',
      messageKey: 'settings-page.legislative-authority-delete-message',
      confirmVariant: 'danger' as const,
      onConfirmAction: async () => {
        const slug = String(row.slug ?? '');
        if (!slug) {
          const msg = t('settings-page.legislative-authority-delete-error');
          toast(msg, { type: 'error' });
          throw new Error(msg);
        }
        const res = await grcRepo.legislatorDelete(slug);
        if (!res?.result) {
          const msg = String(
            res?.error ?? t('settings-page.legislative-authority-delete-error')
          );
          toast(msg, { type: 'error' });
          throw new Error(msg);
        }
      },
    },
    onSuccess: () => {
      invalidateRuleAuthorOptionsCache();
      table.invalidateListCache();
      void table.fetch();
    },
  });
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
              @click.stop="onEditAuthor(row)"
            >
              <Lucide icon="Pencil" class="!h-3.5 !w-3.5" />
            </Button>
            <Button
              type="button"
              variant="outline-danger"
              size="sm"
              class="!h-7 !w-7 !px-0 !py-0"
              :aria-label="t('general.delete')"
              :title="t('general.delete')"
              @click.stop="onDeleteAuthor(row)"
            >
              <Lucide icon="Trash2" class="!h-3.5 !w-3.5" />
            </Button>
          </div>
        </template>
      </BaseTable>
    </div>
  </div>
</template>
