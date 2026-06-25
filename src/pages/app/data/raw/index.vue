<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import BaseTable from '@core/ui/base/BaseTable.vue';
import Button from '@/base-components/Button';
import Lucide from '@/base-components/Lucide';
import { useGovernancePage } from '@/composables/useGovernancePage';

const { t } = useI18n();
const { table, onEdit, onDelete } = useGovernancePage('data-raw', 'data-raw', {
  entityLabelKey: 'menu.data-raw',
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
              @click.stop="onEdit(row)"
            >
              <Lucide icon="Pencil" class="!h-3.5 !w-3.5" />
            </Button>
            <Button
              type="button"
              variant="outline-danger"
              size="sm"
              class="!h-7 !w-7 !px-0 !py-0"
              :aria-label="t('general.delete')"
              :title="t('general.delete')"
              @click.stop="onDelete(row)"
            >
              <Lucide icon="Trash2" class="!h-3.5 !w-3.5" />
            </Button>
          </div>
        </template>
      </BaseTable>
    </div>
  </div>
</template>
