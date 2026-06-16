<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useDataTable, createColumn, type FetchFn } from '@core';
import BaseTable from '@core/ui/base/BaseTable.vue';
import { grcRepo } from '@/core/repositories/grcRepo';
import { ermRepo } from '@/core/repositories/ermRepo';
import { useBreadcrumbSlot } from '@/composables/useBreadcrumb';
import Button from '@/base-components/Button';
import Lucide from '@/base-components/Lucide';
import AddPlanModal from './AddPlanModal.vue';
import PlanBreadcrumbToolbar from './PlanBreadcrumbToolbar.vue';

const { t } = useI18n();
const router = useRouter();
const { setContent: setBreadcrumbSlot } = useBreadcrumbSlot();

const showAddModal = ref(false);

const memberMap = ref<Record<string, string>>({});

async function loadMembers() {
  try {
    const res = await ermRepo.memberList({ page: 1, limit: 500 });
    const list = (res?.data?.list ?? []) as Record<string, unknown>[];
    const map: Record<string, string> = {};
    for (const m of list) {
      const id = m.id ?? m.user_id;
      if (id == null) continue;
      const label =
        [m.name, m.full_name, m.email, m.mobile]
          .find((x) => typeof x === 'string' && String(x).trim()) ?? String(id);
      map[String(id)] = String(label).trim();
    }
    memberMap.value = map;
  } catch {
    // silent
  }
}

const fetchPlans: FetchFn = async ({ page, limit, filters }) => {
  const res = await grcRepo.planList({ page, limit, ...(filters ?? {}) });
  const list = res?.data?.list ?? [];
  const count = res?.data?.paginator?.count ?? 0;
  return { list: Array.isArray(list) ? list : [], count };
};

const table = useDataTable({
  fetchFn: fetchPlans,
  columns: [
    createColumn({
      key: 'title',
      label: t('plan.col-title'),
      sortable: false,
      bodyCell: (row) => row.title ?? '—',
    }),
    createColumn({
      key: 'deadline',
      label: t('plan.col-deadline'),
      sortable: false,
      bodyCell: (row) => row.deadline ?? '—',
    }),
    createColumn({
      key: 'frameworkTitle',
      label: t('plan.col-framework'),
      sortable: false,
      bodyCell: (row) => {
        const val = row.frameworkTitle;
        return Array.isArray(val) ? val.join(', ') : (val ?? '—');
      },
    }),
    createColumn({
      key: 'domainTitle',
      label: t('plan.col-domain'),
      sortable: false,
      bodyCell: (row) => {
        const val = row.domainTitle;
        return Array.isArray(val) ? val.join(', ') : (val ?? '—');
      },
    }),
    createColumn({
      key: 'ownerId',
      label: t('plan.col-owner'),
      sortable: false,
      bodyCell: (row) => memberMap.value[String(row.ownerId)] ?? row.ownerId ?? '—',
    }),
  ],
  selectable: false,
  exportEnabled: true,
  pageSize: 10,
  cacheKey: 'plan-list',
  listCacheStaleTime: 0,
});

function onExportPlans() {
  table.exportCSV();
}

function goToTasks(planSlug: string) {
  router.push({ name: 'app-compliance-task', query: { planSlug } });
}

onMounted(() => {
  loadMembers();
  table.invalidateListCache();
  table.fetch();
  setBreadcrumbSlot(PlanBreadcrumbToolbar, {
    onAdd: onAddPlan,
    onExport: onExportPlans,
    table,
  });
});

function onAddPlan() {
  showAddModal.value = true;
}

function onModalSuccess() {
  table.invalidateListCache();
  table.setPage(1);
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
        :actions-header="t('plan.col-actions')"
        :show-search="false"
      >
        <template #actions="{ row }">
          <div class="flex items-center justify-center">
            <Button
              type="button"
              variant="outline-primary"
              size="sm"
              class="!h-7 !px-2 !py-0 text-[11px]"
              :aria-label="t('plan.action-show-tasks')"
              :title="t('plan.action-show-tasks')"
              @click.stop="goToTasks(row.slug)"
            >
              <Lucide icon="ListChecks" class="mr-1 !h-3 !w-3" />
              {{ t('plan.action-show-tasks') }}
            </Button>
          </div>
        </template>
      </BaseTable>
    </div>

    <AddPlanModal
      :show="showAddModal"
      @update:show="showAddModal = $event"
      @success="onModalSuccess"
    />
  </div>
</template>
