<script setup lang="ts">
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import { useDataTable, createColumn, type FetchFn } from '@core';
import BaseTable from '@core/ui/base/BaseTable.vue';
import BaseConfirmModal from '@core/ui/base/BaseConfirmModal.vue';
import { ermRepo } from '@/core/repositories/ermRepo';
import { invalidateRuleTypeOptionsCache } from '@/core/erm/ruleAuthorTypeOptionsCache';
import { useBreadcrumbSlot } from '@/composables/useBreadcrumb';
import { useGlobalModal } from '@/composables/useGlobalModal';
import Button from '@/base-components/Button';
import Lucide from '@/base-components/Lucide';
import SettingsExportToolbar from '../SettingsExportToolbar.vue';
import LawTypeFormModal from './LawTypeFormModal.vue';

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

function titleCell(row: Record<string, unknown>) {
  return pickStr(row, 'title', 'name', 'label');
}

const fetchRuleTypes: FetchFn = async ({ page, limit, sort, filters }) => {
  const res = await ermRepo.ruleTypeList({
    page,
    limit,
    ...(sort && { sort }),
    ...filters,
    api_version: 8,
  });
  const list = res?.data?.list ?? [];
  const count = res?.data?.paginator?.count ?? 0;
  return { list: Array.isArray(list) ? list : [], count };
};

const table = useDataTable({
  fetchFn: fetchRuleTypes,
  columns: [
    createColumn({
      key: 'title',
      label: t('settings-page.law-type-col-name'),
      sortable: false,
      bodyCell: titleCell,
    }),
  ],
  selectable: false,
  exportEnabled: true,
  pageSize: 10,
  cacheKey: 'settings-rule-type-list',
  listCacheStaleTime: 0,
});

function onAddLawType() {
  openModal({
    component: LawTypeFormModal,
    props: {},
    onSuccess: () => {
      invalidateRuleTypeOptionsCache();
      table.invalidateListCache();
      void table.fetch();
    },
  });
}

onMounted(() => {
  table.fetch();
  setBreadcrumbSlot(SettingsExportToolbar, {
    onExport: () => table.exportCSV(),
    onAdd: onAddLawType,
    addLabelKey: 'settings-page.add-law-type',
  });
});

function onEditLawType(row: Record<string, unknown>) {
  openModal({
    component: LawTypeFormModal,
    props: { record: row },
    onSuccess: () => {
      invalidateRuleTypeOptionsCache();
      table.invalidateListCache();
      void table.fetch();
    },
  });
}

function onDeleteLawType(row: Record<string, unknown>) {
  openModal({
    component: BaseConfirmModal,
    props: {
      titleKey: 'settings-page.law-type-delete-title',
      messageKey: 'settings-page.law-type-delete-message',
      confirmVariant: 'danger' as const,
      onConfirmAction: async () => {
        const res = await ermRepo.ruleTypeDelete({ id: row.id });
        if (!res?.result) {
          const msg = String(
            res?.error?.message ?? t('settings-page.law-type-delete-error')
          );
          toast(msg, { type: 'error' });
          throw new Error(msg);
        }
      },
    },
    onSuccess: () => {
      invalidateRuleTypeOptionsCache();
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
              class="!h-7 !w-7 shrink-0 !px-0 !py-0"
              :aria-label="t('title.update')"
              :title="t('title.update')"
              @click.stop="onEditLawType(row)"
            >
              <Lucide icon="Pencil" class="!h-3.5 !w-3.5" />
            </Button>
            <Button
              type="button"
              variant="outline-danger"
              size="sm"
              class="!h-7 !w-7 shrink-0 !px-0 !py-0"
              :aria-label="t('general.delete')"
              :title="t('general.delete')"
              @click.stop="onDeleteLawType(row)"
            >
              <Lucide icon="Trash2" class="!h-3.5 !w-3.5" />
            </Button>
          </div>
        </template>
      </BaseTable>
    </div>
  </div>
</template>
