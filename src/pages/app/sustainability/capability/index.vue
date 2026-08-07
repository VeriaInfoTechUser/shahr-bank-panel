<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDataTable, createColumn, type FetchFn } from '@core';
import BaseTable from '@core/ui/base/BaseTable.vue';
import Button from '@/base-components/Button';
import Lucide from '@/base-components/Lucide';
import { grcRepo } from '@/core/repositories/grcRepo';
import { useBreadcrumbSlot } from '@/composables/useBreadcrumb';
import CapabilityFormModal from '../fundamental-capitals/CapabilityFormModal.vue';
import CapabilityBreadcrumbToolbar from './CapabilityBreadcrumbToolbar.vue';

const { t } = useI18n();
const { setContent: setBreadcrumbSlot } = useBreadcrumbSlot();

const showAddModal = ref(false);
const showEditModal = ref(false);
const selectedCapability = ref<Record<string, unknown> | null>(null);

function pickStr(row: Record<string, unknown>, ...keys: string[]) {
  for (const k of keys) {
    const v = row[k];
    if (v == null) continue;
    if (typeof v === 'string' && v.trim()) return v;
    if (typeof v === 'number' && !Number.isNaN(v)) return String(v);
  }
  return '—';
}

const fetchCapabilities: FetchFn = async ({ page, limit, filters }) => {
  const res = await grcRepo.capabilityList({ page, limit, ...(filters ?? {}) });
  const list = res?.data?.list ?? [];
  const count = res?.data?.paginator?.count ?? 0;
  return { list: Array.isArray(list) ? list : [], count };
};

const table = useDataTable({
  fetchFn: fetchCapabilities,
  columns: [
    createColumn({
      key: 'title',
      label: t('sustainability-capability-page.col-title'),
      sortable: false,
      bodyCell: (row) => pickStr(row, 'title', 'name'),
    }),
    createColumn({
      key: 'capital',
      label: t('sustainability-capability-page.col-capital'),
      sortable: false,
      bodyCell: (row) => pickStr(row, 'capitalTitle'),
    }),
    createColumn({
      key: 'domain',
      label: t('sustainability-capability-page.col-domain'),
      sortable: false,
      bodyCell: (row) => pickStr(row, 'domainTitle'),
    }),
    createColumn({
      key: 'component',
      label: t('sustainability-capability-page.col-component'),
      sortable: false,
      bodyCell: (row) => pickStr(row, 'componentTitle'),
    }),
    createColumn({
      key: 'template',
      label: t('sustainability-capability-page.col-template'),
      sortable: false,
      bodyCell: (row) => pickStr(row, 'template'),
    }),
    createColumn({
      key: 'importance',
      label: t('sustainability-capability-page.col-importance'),
      sortable: false,
      bodyCell: (row) => pickStr(row, 'importance'),
    }),
    createColumn({
      key: 'requiredMaturity',
      label: t('sustainability-capability-page.col-required-maturity'),
      sortable: false,
      bodyCell: (row) => pickStr(row, 'requiredMaturity'),
    }),
    createColumn({
      key: 'version',
      label: t('sustainability-capability-page.col-version'),
      sortable: false,
      bodyCell: (row) => pickStr(row, 'version'),
    }),
    createColumn({
      key: 'description',
      label: t('sustainability-capability-page.col-description'),
      sortable: false,
      bodyCell: (row) => pickStr(row, 'description', 'definition'),
    }),
  ],
  selectable: false,
  exportEnabled: true,
  cacheKey: 'sustainability-capabilities-list',
  listCacheStaleTime: 0,
});

function onExport() {
  table.exportCSV();
}

function onAddCapability() {
  showAddModal.value = true;
}

function onEditCapability(row: Record<string, unknown>) {
  selectedCapability.value = row;
  showEditModal.value = true;
}

function onModalSuccess() {
  table.invalidateListCache();
  table.setPage(1);
}

onMounted(() => {
  table.invalidateListCache();
  table.fetch();
  setBreadcrumbSlot(CapabilityBreadcrumbToolbar, {
    onAdd: onAddCapability,
    onExport,
    table,
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
              @click.stop="onEditCapability(row)"
            >
              <Lucide icon="Pencil" class="!h-3.5 !w-3.5" />
            </Button>
          </div>
        </template>
      </BaseTable>
    </div>

    <CapabilityFormModal
      :show="showAddModal"
      @update:show="showAddModal = $event"
      @success="onModalSuccess"
    />

    <CapabilityFormModal
      v-if="selectedCapability"
      :show="showEditModal"
      :record="selectedCapability"
      @update:show="
        (v) => {
          showEditModal = v;
          if (!v) selectedCapability = null;
        }
      "
      @success="onModalSuccess"
    />
  </div>
</template>
