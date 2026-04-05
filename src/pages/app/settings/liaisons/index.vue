<script setup lang="ts">
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import { useDataTable, createColumn, type FetchFn } from '@core';
import BaseTable from '@/core/ui/base/BaseTable.vue';
import BaseConfirmModal from '@core/ui/base/BaseConfirmModal.vue';
import { ermRepo } from '@/core/repositories/ermRepo';
import { useBreadcrumbSlot } from '@/composables/useBreadcrumb';
import { useGlobalModal } from '@/composables/useGlobalModal';
import Button from '@/base-components/Button';
import Lucide from '@/base-components/Lucide';
import SettingsExportToolbar from '../SettingsExportToolbar.vue';
import MemberAddModal from './MemberAddModal.vue';
import MemberLogsModal from './MemberLogsModal.vue';
import MemberChangePasswordModal from './MemberChangePasswordModal.vue';

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
      if (
        item &&
        typeof item === 'object' &&
        typeof (item as Record<string, unknown>).title === 'string'
      ) {
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
    const tt = (direct as Record<string, unknown>).title;
    if (typeof tt === 'string' && tt.trim()) return tt;
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
      key: 'time_created_view',
      label: t('settings-page.liaisons-col-registered-at'),
      sortable: false,
      bodyCell: (row) => pickStr(row, 'time_created_view'),
    }),
    createColumn({
      key: 'mandatory_unit',
      label: t('settings-page.liaisons-col-mandatory-unit'),
      sortable: false,
      bodyCell: mandatoryUnitCell,
    }),
    createColumn({
      key: 'status',
      label: t('settings-page.liaisons-col-status'),
      sortable: false,
      align: 'center',
      bodyCell: (row) => statusExportCell(row),
    }),
  ],
  selectable: false,
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
    addLabelKey: 'settings-page.add-member',
  });
});

function onAddMember() {
  openModal({
    component: MemberAddModal,
    props: {},
    onSuccess: () => {
      table.invalidateListCache();
      void table.fetch();
    },
  });
}

function onEditMember(row: Record<string, unknown>) {
  const uid = Number(row.id);
  if (!Number.isFinite(uid) || uid <= 0) return;
  openModal({
    component: MemberAddModal,
    props: { mode: 'edit' as const, member: row },
    onSuccess: () => {
      table.invalidateListCache();
      void table.fetch();
    },
  });
}

function onChangePasswordMember(row: Record<string, unknown>) {
  const uid = Number(row.id);
  if (!Number.isFinite(uid) || uid <= 0) return;
  openModal({
    component: MemberChangePasswordModal,
    props: { userId: uid },
  });
}

function onLogsMember(row: Record<string, unknown>) {
  const uid = Number(row.id);
  if (!Number.isFinite(uid) || uid <= 0) return;
  openModal({
    component: MemberLogsModal,
    props: { userId: uid },
  });
}

function onToggleMemberStatus(row: Record<string, unknown>, nextActive: boolean) {
  const userId = String(row.id ?? '');
  if (!userId || userId === 'undefined') {
    toast(t('settings-page.liaisons-status-error'), { type: 'error' });
    return;
  }
  const displayName = pickStr(row, 'name', 'full_name');
  openModal({
    component: BaseConfirmModal,
    props: {
      titleKey: 'settings-page.liaisons-status-confirm-title',
      message: `${t('settings-page.liaisons-status-confirm')} «${displayName}»`,
      confirmVariant: 'primary' as const,
      onConfirmAction: async () => {
        const res = await ermRepo.memberStatus({
          user_id: userId,
          status: nextActive ? '1' : '0',
        });
        if (!res?.result) {
          const msg = String(
            res?.error?.message ?? t('settings-page.liaisons-status-error')
          );
          toast(msg, { type: 'error' });
          throw new Error(msg);
        }
      },
    },
    onSuccess: () => {
      toast(t('settings-page.liaisons-status-success'), { type: 'success' });
      table.invalidateListCache();
      void table.fetch();
    },
  });
}

function onDeleteMember(row: Record<string, unknown>) {
  const userId = String(row.id ?? '');
  if (!userId || userId === 'undefined') {
    toast(t('settings-page.liaisons-delete-error'), { type: 'error' });
    return;
  }
  const displayName = pickStr(row, 'name', 'full_name');
  openModal({
    component: BaseConfirmModal,
    props: {
      titleKey: 'settings-page.liaisons-delete-title',
      message: `${t('settings-page.liaisons-delete-confirm')} «${displayName}»`,
      confirmVariant: 'danger' as const,
      onConfirmAction: async () => {
        const res = await ermRepo.memberDelete({ user_id: userId });
        if (!res?.result) {
          const msg = String(
            res?.error?.message ?? t('settings-page.liaisons-delete-error')
          );
          toast(msg, { type: 'error' });
          throw new Error(msg);
        }
      },
    },
    onSuccess: () => {
      toast(t('settings-page.liaisons-delete-success'), { type: 'success' });
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
        :export-enabled="table.exportEnabled"
        :empty-message="t('general.no-data')"
        :actions="true"
        :actions-header="t('task.settings')"
        actions-column-min-width="11rem"
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
              @click.prevent="onToggleMemberStatus(row, !isStatusActive(row))"
            />
          </div>
        </template>
        <template #actions="{ row }">
          <div class="flex flex-nowrap items-center justify-center gap-3">
            <Button
              type="button"
              variant="outline-secondary"
              size="sm"
              class="!h-7 !w-7 shrink-0 !px-0 !py-0"
              :aria-label="t('settings-page.liaisons-action-edit')"
              :title="t('settings-page.liaisons-action-edit')"
              @click.stop="onEditMember(row)"
            >
              <Lucide icon="Pencil" class="!h-3.5 !w-3.5" />
            </Button>
            <Button
              type="button"
              variant="outline-secondary"
              size="sm"
              class="!h-7 !w-7 shrink-0 !px-0 !py-0"
              :aria-label="t('settings-page.liaisons-action-logs')"
              :title="t('settings-page.liaisons-action-logs')"
              @click.stop="onLogsMember(row)"
            >
              <Lucide icon="FileText" class="!h-3.5 !w-3.5" />
            </Button>
            <Button
              type="button"
              variant="outline-warning"
              size="sm"
              class="!h-7 !w-7 shrink-0 !px-0 !py-0"
              :aria-label="t('settings-page.liaisons-action-change-password')"
              :title="t('settings-page.liaisons-action-change-password')"
              @click.stop="onChangePasswordMember(row)"
            >
              <Lucide icon="Lock" class="!h-3.5 !w-3.5" />
            </Button>
            <Button
              type="button"
              variant="outline-danger"
              size="sm"
              class="!h-7 !w-7 shrink-0 !px-0 !py-0"
              :aria-label="t('settings-page.liaisons-action-delete')"
              :title="t('settings-page.liaisons-action-delete')"
              @click.stop="onDeleteMember(row)"
            >
              <Lucide icon="Trash2" class="!h-3.5 !w-3.5" />
            </Button>
          </div>
        </template>
      </BaseTable>
    </div>
  </div>
</template>
