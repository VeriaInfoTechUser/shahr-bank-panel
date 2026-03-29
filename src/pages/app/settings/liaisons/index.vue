<script setup lang="ts">
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDataTable, createColumn, type FetchFn } from '@core';
import BaseTable from '@core/ui/base/BaseTable.vue';
import { ermRepo } from '@/core/repositories/ermRepo';
import { useBreadcrumbSlot } from '@/composables/useBreadcrumb';
import SettingsExportToolbar from '../SettingsExportToolbar.vue';

const { t } = useI18n();
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

function nameCell(row: Record<string, unknown>) {
  return pickStr(row, 'name', 'full_name');
}

function roleCell(row: Record<string, unknown>) {
  const roles = row.roles as Record<string, unknown> | undefined;
  if (!roles || typeof roles !== 'object') return '—';
  const titles: string[] = [];
  for (const key of Object.keys(roles)) {
    const arr = roles[key];
    if (!Array.isArray(arr)) continue;
    for (const item of arr) {
      if (item && typeof item === 'object' && typeof (item as Record<string, unknown>).title === 'string') {
        titles.push((item as Record<string, unknown>).title as string);
      }
    }
  }
  return titles.length ? titles.join('، ') : '—';
}

function orgUnitCell(row: Record<string, unknown>) {
  const direct = row.organizational_unit ?? row.organization_unit ?? row.department;
  if (typeof direct === 'string' && direct.trim()) return direct;
  if (direct && typeof direct === 'object' && 'title' in direct) {
    const t = (direct as Record<string, unknown>).title;
    if (typeof t === 'string' && t.trim()) return t;
  }
  return '—';
}

function orgPostCell(row: Record<string, unknown>) {
  return pickStr(row, 'organizational_post', 'job_title', 'position', 'post_title');
}

function mandatoryUnitCell(row: Record<string, unknown>) {
  const units = row.mandatory_unit as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(units) || units.length === 0) return '—';
  return units.map((u) => u.title ?? '').filter(Boolean).join('، ');
}

function isStatusActive(row: Record<string, unknown>) {
  const s = row.status;
  return s === 1 || s === true;
}

function statusExportCell(row: Record<string, unknown>) {
  return isStatusActive(row) ? '1' : '0';
}

const fetchMembers: FetchFn = async ({ page, limit, sort, filters }) => {
  const res = await ermRepo.memberList({
    page,
    limit,
    ...(sort && { sort }),
    ...filters,
  });
  const list = res?.data?.list ?? [];
  const count = res?.data?.paginator?.count ?? 0;
  return { list: Array.isArray(list) ? list : [], count };
};

const table = useDataTable({
  fetchFn: fetchMembers,
  columns: [
    createColumn({
      key: 'name',
      label: t('settings-page.liaisons-col-name'),
      sortable: false,
      bodyCell: nameCell,
    }),
    createColumn({
      key: 'role',
      label: t('settings-page.liaisons-col-role'),
      sortable: false,
      bodyCell: roleCell,
    }),
    createColumn({
      key: 'organizational_unit',
      label: t('settings-page.liaisons-col-org-unit'),
      sortable: false,
      bodyCell: orgUnitCell,
    }),
    createColumn({
      key: 'organizational_post',
      label: t('settings-page.liaisons-col-org-post'),
      sortable: false,
      bodyCell: orgPostCell,
    }),
    createColumn({
      key: 'email',
      label: t('settings-page.liaisons-col-email'),
      sortable: false,
      bodyCell: (row) => pickStr(row, 'email'),
    }),
    createColumn({
      key: 'mobile',
      label: t('settings-page.liaisons-col-mobile'),
      sortable: false,
      bodyCell: (row) => pickStr(row, 'mobile'),
    }),
    createColumn({
      key: 'time_created_view',
      label: t('settings-page.liaisons-col-registered-at'),
      sortable: false,
      bodyCell: (row) => pickStr(row, 'time_created_view'),
    }),
    createColumn({
      key: 'status',
      label: t('settings-page.liaisons-col-status'),
      sortable: false,
      align: 'center',
      bodyCell: (row) => statusExportCell(row),
    }),
    createColumn({
      key: 'mandatory_unit',
      label: t('settings-page.liaisons-col-mandatory-unit'),
      sortable: false,
      bodyCell: mandatoryUnitCell,
    }),
  ],
  selectable: true,
  exportEnabled: true,
  pageSize: 10,
  cacheKey: 'settings-members-list',
  listCacheStaleTime: 0,
});

onMounted(() => {
  table.fetch();
  setBreadcrumbSlot(SettingsExportToolbar, {
    onExport: () => table.exportCSV(),
    onAdd: onAddMember,
  });
});

function onAddMember() {
  console.log('Add member');
}

function onEditMember(row: Record<string, unknown>) {
  console.log('Edit member', row);
}

function onChangePasswordMember(row: Record<string, unknown>) {
  console.log('Change password', row);
}

function onLogsMember(row: Record<string, unknown>) {
  console.log('Logs', row);
}

function onToggleMemberStatus(row: Record<string, unknown>, nextActive: boolean) {
  row.status = nextActive ? 1 : 0;
  console.log('Toggle status', row.id, row.status);
}

function onDeleteMember(row: Record<string, unknown>) {
  console.log('Delete member', row);
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
        :actions-header="t('task.settings')"
        :actions-column-min-width="'180px'"
        :show-search="false"
      >
        <template #cell-status="{ row }">
          <div class="flex items-center justify-center">
            <input
              type="checkbox"
              role="switch"
              class="toggle toggle-primary toggle-sm"
              :checked="isStatusActive(row)"
              :aria-label="t('settings-page.liaisons-col-status')"
              @change.stop="
                onToggleMemberStatus(row, ($event.target as HTMLInputElement).checked)
              "
            />
          </div>
        </template>
        <template #actions="{ row }">
          <div class="flex flex-wrap items-center justify-center gap-0.5">
            <button
              type="button"
              class="rounded p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-primary dark:text-slate-400 dark:hover:bg-darkmode-600 dark:hover:text-primary"
              :aria-label="t('settings-page.liaisons-action-edit')"
              :title="t('settings-page.liaisons-action-edit')"
              @click.stop="onEditMember(row)"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              type="button"
              class="rounded p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-amber-600 dark:text-slate-400 dark:hover:bg-darkmode-600 dark:hover:text-amber-400"
              :aria-label="t('settings-page.liaisons-action-change-password')"
              :title="t('settings-page.liaisons-action-change-password')"
              @click.stop="onChangePasswordMember(row)"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </button>
            <button
              type="button"
              class="rounded p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-primary dark:text-slate-400 dark:hover:bg-darkmode-600 dark:hover:text-primary"
              :aria-label="t('settings-page.liaisons-action-logs')"
              :title="t('settings-page.liaisons-action-logs')"
              @click.stop="onLogsMember(row)"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
            <button
              type="button"
              class="rounded p-1.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-darkmode-600 dark:hover:text-red-400"
              :aria-label="t('settings-page.liaisons-action-delete')"
              :title="t('settings-page.liaisons-action-delete')"
              @click.stop="onDeleteMember(row)"
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
