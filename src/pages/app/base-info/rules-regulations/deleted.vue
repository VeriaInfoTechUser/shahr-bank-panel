<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useDataTable, createColumn, type FetchFn } from '@core';
import BaseTable from '@core/ui/base/BaseTable.vue';
import { ermRepo } from '@/core/repositories/ermRepo';
import { useBreadcrumbSlot } from '@/composables/useBreadcrumb';
import DeletedRulesExportToolbar from './DeletedRulesExportToolbar.vue';

const { t } = useI18n();
const router = useRouter();
const { setContent: setBreadcrumbSlot } = useBreadcrumbSlot();

const fetchRules: FetchFn = async ({ page, limit, sort, filters }) => {
  const res = await ermRepo.list({
    page,
    limit,
    status: 0,
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
      key: 'code',
      label: t('rule.section-letter-number'),
      sortable: false,
      bodyCell: (row) => row.code ?? '—',
    }),
    createColumn({
      key: 'rule',
      label: t('rule.law'),
      sortable: false,
      bodyCell: (row) => row.rule ?? '—',
    }),
    createColumn({
      key: 'author_information',
      label: t('rule.author'),
      bodyCell: authorCell,
    }),
    createColumn({
      key: 'type_information',
      label: t('title.type'),
      bodyCell: typeCell,
    }),
    createColumn({
      key: 'category_information',
      label: t('title.category'),
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
      bodyCell: requirementCell,
    }),
    createColumn({
      key: 'validity',
      label: t('rule.validity'),
      bodyCell: validityCell,
    }),
  ],
  selectable: false,
  exportEnabled: true,

  cacheKey: 'rules-regulations-deleted-list',
  listCacheStaleTime: 0,
});

function onExportRules() {
  table.exportCSV();
}

function goBackToRules() {
  router.push({ name: 'app-base-info-rules-regulations' });
}

onMounted(() => {
  table.fetch();
  setBreadcrumbSlot(DeletedRulesExportToolbar, {
    onBack: goBackToRules,
    onExport: onExportRules,
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
        :actions="false"
        :show-search="false"
      >
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
      </BaseTable>
    </div>
  </div>
</template>
