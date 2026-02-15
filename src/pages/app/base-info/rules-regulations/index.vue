<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { computed, onMounted } from 'vue';
import { useDataTable, createColumn, type FetchFn } from '@core';
import BaseTable from '@core/ui/base/BaseTable.vue';
import BaseCard from '@core/ui/base/BaseCard.vue';
import { ermRepo } from '@/core/repositories/ermRepo';

const { t } = useI18n();

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
      key: 'code',
      label: t('rule.section-letter-number'),
      sortable: true,
      bodyCell: (row) => row.code ?? '—',
    }),
    createColumn({
      key: 'rule',
      label: t('rule.law'),
      sortable: true,
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
      sortable: false,
      bodyCell: (row) => row.approval_at_view ?? '—',
    }),
    createColumn({
      key: 'promulgation_at_view',
      label: t('rule.promulgation-at'),
      sortable: false,
      bodyCell: (row) => row.promulgation_at_view ?? '—',
    }),
    createColumn({
      key: 'cancellation_at_view',
      label: t('rule.cancellation-at'),
      sortable: false,
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
  pageSize: 10,
  cacheKey: 'rules-regulations-list',
  listCacheStaleTime: 0,
});

onMounted(() => {
  table.fetch();
});

/** Debug: selected rows for <pre> display */
const selectedForDebug = computed(() =>
  JSON.stringify(table.selectedRows.value ?? [], null, 2)
);

function onEditRule(row: Record<string, unknown>) {
  // TODO: open edit modal / navigate to edit page
  console.log('Edit rule', row);
}

function onDeleteRule(row: Record<string, unknown>) {
  // TODO: confirm and call delete API
  console.log('Delete rule', row);
}
</script>

<template>
  <div class="grid grid-cols-12 gap-2 p-2">

    <div class="col-span-12">
        <BaseTable
          :table="table"
          :selectable="true"
          :export-enabled="table.exportEnabled"
          :empty-message="t('general.no-data')"
          :actions="true"
          :actions-header="t('rule.settings')"
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
          <!-- Custom actions cell: use #actions with row prop -->
          <template #actions="{ row }">
            <div class="flex items-center justify-center gap-1">
              <button
                type="button"
                class="rounded p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-primary dark:text-slate-400 dark:hover:bg-darkmode-600 dark:hover:text-primary"
                :aria-label="t('title.update')"
                @click.stop="onEditRule(row)"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                type="button"
                class="rounded p-1.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-darkmode-600 dark:hover:text-red-400"
                :aria-label="'Delete'"
                @click.stop="onDeleteRule(row)"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </template>
        </BaseTable>
    </div>
  </div>
</template>
