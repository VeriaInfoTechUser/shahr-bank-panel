<script setup lang="ts">
import type { Ref } from 'vue';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import BaseSelect from '@/core/ui/base/BaseSelect.vue';
import Button from '@/base-components/Button';
import { useRiskCategories } from './useRiskCategories';

const props = defineProps<{
  table: {
    replaceFilters: (f: Record<string, unknown>) => void;
    clearFilters: () => void;
    filters: Ref<Record<string, unknown>> | Record<string, unknown>;
  };
  toolbarClearTick: number;
}>();

const { t } = useI18n();
const { categoryOptions, subCategoryOptions, fetchTree } = useRiskCategories();

const search = ref('');
const categorySlug = ref('');
const subCategorySlug = ref('');
const riskType = ref('');
const riskLevel = ref('');
const status = ref('');

const riskTypeOptions = computed(() => [
  { value: '', label: t('risk.filter-all') },
  { value: 'threat', label: t('risk.type-threat') },
  { value: 'opportunity', label: t('risk.type-opportunity') },
]);

const riskLevelOptions = computed(() => [
  { value: '', label: t('risk.filter-all') },
  { value: 'low', label: t('risk.level-low') },
  { value: 'medium', label: t('risk.level-medium') },
  { value: 'high', label: t('risk.level-high') },
  { value: 'critical', label: t('risk.level-critical') },
]);

const statusOptions = computed(() => [
  { value: '', label: t('risk.status-all') },
  { value: 'draft', label: t('risk.status-draft') },
  { value: 'registered', label: t('risk.status-registered') },
  { value: 'analysis', label: t('risk.status-analysis') },
  { value: 'response', label: t('risk.status-response') },
  { value: 'monitoring', label: t('risk.status-monitoring') },
  { value: 'closed', label: t('risk.status-closed') },
  { value: 'archived', label: t('risk.status-archived') },
]);

const subCatOptions = computed(() =>
  categorySlug.value ? subCategoryOptions(categorySlug.value) : []
);

watch(categorySlug, () => {
  subCategorySlug.value = '';
});

watch(
  () => props.toolbarClearTick,
  () => {
    search.value = '';
    categorySlug.value = '';
    subCategorySlug.value = '';
    riskType.value = '';
    riskLevel.value = '';
    status.value = '';
  }
);

fetchTree();

function applyFilters() {
  const filters: Record<string, unknown> = {};
  if (search.value.trim()) filters.search = search.value.trim();
  if (categorySlug.value) filters.categoryId = categorySlug.value;
  if (subCategorySlug.value) filters.subCategoryId = subCategorySlug.value;
  if (riskType.value) filters.type = riskType.value;
  if (riskLevel.value) filters.level = riskLevel.value;
  if (status.value) filters.status = status.value;
  props.table.replaceFilters(filters);
}

function clearFilters() {
  search.value = '';
  categorySlug.value = '';
  subCategorySlug.value = '';
  riskType.value = '';
  riskLevel.value = '';
  status.value = '';
  props.table.clearFilters();
}
</script>

<template>
  <div class="space-y-3">
    <h3 class="text-sm font-medium text-slate-700 dark:text-slate-200">
      {{ t('risk.filter-panel-title') }}
    </h3>
    <div class="space-y-3">
      <div class="form-control w-full">
        <label class="label min-h-0 py-1">
          <span class="label-text text-[0.6125rem] font-normal leading-snug">{{ t('risk.filter-search') }}</span>
        </label>
        <input
          v-model="search"
          type="text"
          class="input input-bordered w-full !h-8 !min-h-0 py-1.5 px-2.5 text-xs font-light leading-snug placeholder:text-slate-400"
          :placeholder="t('risk.filter-search-placeholder')"
        />
      </div>
      <BaseSelect
        name="filterCategory"
        :label="t('risk.field-category')"
        :options="[{ value: '', label: t('risk.filter-all') }, ...categoryOptions]"
        :compact-label="true"
        :filter="true"
        @change="categorySlug = String($event ?? '')"
      />
      <BaseSelect
        v-if="categorySlug"
        name="filterSubCategory"
        :label="t('risk.field-sub-category')"
        :options="[{ value: '', label: t('risk.filter-all') }, ...subCatOptions]"
        :compact-label="true"
        :filter="true"
        @change="subCategorySlug = String($event ?? '')"
      />
      <BaseSelect
        name="filterRiskType"
        :label="t('risk.field-risk-type')"
        :options="riskTypeOptions"
        :compact-label="true"
        @change="riskType = String($event ?? '')"
      />
      <BaseSelect
        name="filterRiskLevel"
        :label="t('risk.field-risk-level')"
        :options="riskLevelOptions"
        :compact-label="true"
        @change="riskLevel = String($event ?? '')"
      />
      <BaseSelect
        name="filterStatus"
        :label="t('risk.field-status')"
        :options="statusOptions"
        :compact-label="true"
        @change="status = String($event ?? '')"
      />
    </div>
    <div class="flex justify-end gap-2 pt-2">
      <Button type="button" variant="outline-secondary" size="sm" @click="clearFilters">
        {{ t('risk.filter-clear') }}
      </Button>
      <Button type="button" variant="primary" size="sm" @click="applyFilters">
        {{ t('risk.filter-apply') }}
      </Button>
    </div>
  </div>
</template>
