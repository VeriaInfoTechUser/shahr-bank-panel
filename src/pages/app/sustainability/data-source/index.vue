<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import BaseTable from '@core/ui/base/BaseTable.vue';
import { useDataSourcePage } from '@/composables/useDataSourcePage';

const { t } = useI18n();
const { table } = useDataSourcePage();
</script>

<template>
  <div class="grid grid-cols-12 gap-2 p-2">
    <div class="col-span-12">
      <BaseTable
        :table="table"
        :selectable="false"
        :export-enabled="table.exportEnabled"
        :empty-message="t('general.no-data')"
        :show-search="false"
      />
    </div>
  </div>
</template>
