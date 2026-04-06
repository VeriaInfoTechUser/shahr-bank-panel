<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { toast } from 'vue3-toastify';
import { useDataTable, createColumn, type FetchFn } from '@core';
import BaseTable from '@core/ui/base/BaseTable.vue';
import BaseConfirmModal from '@core/ui/base/BaseConfirmModal.vue';
import { ermRepo } from '@/core/repositories/ermRepo';
import { invalidateRuleLightListCache } from '@/core/erm/ruleAuthorTypeOptionsCache';
import { useBreadcrumbSlot } from '@/composables/useBreadcrumb';
import { useGlobalModal } from '@/composables/useGlobalModal';
import Button from '@/base-components/Button';
import Lucide from '@/base-components/Lucide';
import RulesRegulationsToolbar from './RulesRegulationsToolbar.vue';
import AddRuleModal from './AddRuleModal.vue';

const { t } = useI18n();
const router = useRouter();
const { setContent: setBreadcrumbSlot } = useBreadcrumbSlot();
const { openModal } = useGlobalModal();

const fetchRules: FetchFn = async ({ page, limit, sort, filters }) => {
  const res = await ermRepo.list({
    page,
    limit,
    ...(sort && { sort }),
    ...filters,
  });
  const list = res?.data?.list ?? [];
  const count = res?.data?.paginator?.count ?? 0;
  return { list: Array.isArray(list) ? list : [], count };
};

function authorCell(row: Record<string, unknown>) {
  const info = row.author_information as Record<string, unknown> | undefined;
  return info && typeof info.title === 'string' ? info.title : '—';
}

function typeCell(row: Record<string, unknown>) {
  const info = row.type_information as Record<string, unknown> | undefined;
  return info && typeof info.title === 'string' ? info.title : '—';
}

function categoryCell(row: Record<string, unknown>) {
  const info = row.category_information as Record<string, unknown> | undefined;
  return info && typeof info.title === 'string' ? info.title : '—';
}

function requirementCell(row: Record<string, unknown>) {
  const v = row.requirement;
  const hasRequirement = v === 1 || v === true;
  return hasRequirement ? t('rule.requirement-yes') : t('rule.requirement-no');
}

function validityCell(row: Record<string, unknown>) {
  const v = row.validity;
  const hasValidity = v === 1 || v === true;
  return hasValidity ? t('rule.validity-active') : t('rule.validity-inactive');
}

const table = useDataTable({
  fetchFn: fetchRules,
  columns: [
    createColumn({
      key: 'rule',
      label: t('rule.law'),
      sortable: false,
      bodyCell: (row) => row.rule ?? '—',
    }),
    createColumn({
      key: 'code',
      label: t('rule.section-letter-number'),
      sortable: false,
      bodyCell: (row) => row.code ?? '—',
    }),
    createColumn({
      key: 'author_information',
      label: t('rule.author'),
      sortable: false,
      bodyCell: authorCell,
    }),
    createColumn({
      key: 'type_information',
      label: t('title.type'),
      sortable: false,
      bodyCell: typeCell,
    }),
    createColumn({
      key: 'category_information',
      label: t('title.category'),
      sortable: false,
      bodyCell: categoryCell,
    }),
    createColumn({
      key: 'approval_at_view',
      label: t('rule.approval-at'),
      sortable: true,
      bodyCell: (row) => row.approval_at_view ?? '—',
    }),
    createColumn({
      key: 'promulgation_at_view',
      label: t('rule.promulgation-at'),
      sortable: true,
      bodyCell: (row) => row.promulgation_at_view ?? '—',
    }),
    createColumn({
      key: 'cancellation_at_view',
      label: t('rule.cancellation-at'),
      sortable: true,
      bodyCell: (row) => row.cancellation_at_view ?? '—',
    }),
    createColumn({
      key: 'requirement',
      label: t('rule.requirement'),
      sortable: false,
      bodyCell: requirementCell,
    }),
    createColumn({
      key: 'validity',
      label: t('rule.validity'),
      sortable: false,
      bodyCell: validityCell,
    }),
    createColumn({
      key: 'settings',
      label: t('rule.settings'),
      sortable: false,
      bodyCell: () => '',
    }),
  ],
  selectable: false,
  exportEnabled: true,
  pageSize: 10,
  cacheKey: 'rules-regulations-list',
  listCacheStaleTime: 0,
});

onMounted(() => {
  table.fetch();
  setBreadcrumbSlot(RulesRegulationsToolbar, {
    table,
    onImport: onImportRules,
    onExport: onExportRules,
    onTrash: onTrashRules,
    onAdd: onAddRule,
  });
});

function onAddRule() {
  openModal({
    component: AddRuleModal,
    onSuccess: () => {
      invalidateRuleLightListCache();
      table.invalidateListCache();
      table.setPage(1);
    },
  });
}

function onImportRules() {
  // TODO: open import dialog / file picker
  console.log('Import rules');
}

function onExportRules() {
  table.exportCSV();
}

function onTrashRules() {
  router.push({ name: 'app-base-info-rules-regulations-deleted' });
}

function onAttachmentClick(row: Record<string, unknown>) {
  console.log('Attachment clicked', row);
}

function onEditClick(row: Record<string, unknown>) {
  openModal({
    component: AddRuleModal,
    props: {
      mode: 'edit',
      rule: row,
    },
    onSuccess: () => {
      invalidateRuleLightListCache();
      table.invalidateListCache();
      table.setPage(1);
    },
  });
}

function onDeleteClick(row: Record<string, unknown>) {
  openModal({
    component: BaseConfirmModal,
    props: {
      titleKey: 'rule.delete-confirm-title',
      messageKey: 'rule.delete-confirm-message',
      confirmVariant: 'danger' as const,
      onConfirmAction: async () => {
        const id = row.id;
        if (id == null) {
          toast(t('rule.delete-error'), { type: 'error' });
          throw new Error('missing id');
        }
        const res = await ermRepo.deleteRule({ id });
        if (!res?.result) {
          const msg = String(res?.error?.message ?? t('rule.delete-error'));
          toast(msg, { type: 'error' });
          throw new Error(msg);
        }
      },
    },
    onSuccess: () => {
      invalidateRuleLightListCache();
      table.invalidateListCache();
      void table.fetch();
    },
  });
}
</script>

<template>
  <div class="grid grid-cols-12 gap-2 p-2">
    <div class="col-span-12 space-y-3">
      <BaseTable
          :table="table"
          :selectable="false"
          :export-enabled="table.exportEnabled"
          :empty-message="t('general.no-data')"
          :actions="false"
          :show-search="false"
        >
          <!-- Per-column slots by column key (e.g. cell-requirement, cell-validity) -->
          <template #cell-requirement="{ row }">
            <span
              :class="[
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                (row.requirement === 1 || row.requirement === true)
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
              ]"
            >
              {{ (row.requirement === 1 || row.requirement === true) ? t('rule.requirement-yes') : t('rule.requirement-no') }}
            </span>
          </template>
          <template #cell-validity="{ row }">
            <span
              :class="[
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                (row.validity === 1 || row.validity === true)
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
              ]"
            >
              {{ (row.validity === 1 || row.validity === true) ? t('rule.validity-active') : t('rule.validity-inactive') }}
            </span>
          </template>
          <template #cell-settings="{ row }">
            <div class="flex items-center justify-center gap-3">
              <Button
                type="button"
                variant="outline-secondary"
                size="sm"
                class="!h-7 !w-7 !px-0 !py-0"
                @click="onAttachmentClick(row)"
              >
                <Lucide icon="Paperclip" class="!h-3.5 !w-3.5" />
              </Button>
              <Button
                type="button"
                variant="outline-secondary"
                size="sm"
                class="!h-7 !w-7 !px-0 !py-0"
                @click="onEditClick(row)"
              >
                <Lucide icon="Pencil" class="!h-3.5 !w-3.5" />
              </Button>
              <Button
                type="button"
                variant="outline-danger"
                size="sm"
                class="!h-7 !w-7 !px-0 !py-0"
                @click="onDeleteClick(row)"
              >
                <Lucide icon="Trash2" class="!h-3.5 !w-3.5" />
              </Button>
            </div>
          </template>
        </BaseTable>
    </div>
  </div>
</template>
