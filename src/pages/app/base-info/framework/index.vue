<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { onMounted } from 'vue';
import { useDataTable, createColumn } from '@core';
import BaseTable from '@core/ui/base/BaseTable.vue';
import { useBreadcrumbSlot } from '@/composables/useBreadcrumb';
import Button from '@/base-components/Button';
import Lucide from '@/base-components/Lucide';

const { t } = useI18n();
const { setContent: setBreadcrumbSlot } = useBreadcrumbSlot();

const table = useDataTable({
  fetchFn: async () => {
    return { list: [], count: 0 };
  },
  columns: [
    createColumn({
      key: 'id',
      label: t('title.id'),
      sortable: false,
      bodyCell: (row) => row.id ?? '—',
    }),
    createColumn({
      key: 'title',
      label: t('title.title'),
      sortable: false,
      bodyCell: (row) => row.title ?? '—',
    }),
    createColumn({
      key: 'description',
      label: t('title.description'),
      sortable: false,
      bodyCell: (row) => row.description ?? '—',
    }),
  ],
  selectable: false,
  exportEnabled: true,
  pageSize: 10,
  cacheKey: 'framework-list',
  listCacheStaleTime: 0,
});

onMounted(() => {
  table.invalidateListCache();
  table.fetch();
  setBreadcrumbSlot(null);
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
      />
    </div>
  </div>
</template>
