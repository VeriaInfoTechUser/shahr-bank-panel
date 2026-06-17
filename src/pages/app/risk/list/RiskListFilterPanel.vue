<script setup lang="ts">
import type { Ref } from 'vue';
import { computed, nextTick, onMounted, ref, toValue, watch } from 'vue';
import { Form, useFormValues } from 'vee-validate';
import { watchDebounced } from '@vueuse/core';
import { useI18n } from 'vue-i18n';
import BaseInput from '@/core/ui/base/BaseInput.vue';
import BaseMultiSelect from '@/core/ui/base/BaseMultiSelect.vue';
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

const formKey = ref(0);
const formId = 'risk-filter-form';
const selectedCategorySlugs = ref<string[]>([]);

const riskTypeOptions = computed(() => [
  { value: 'threat', label: t('risk.type-threat') },
  { value: 'opportunity', label: t('risk.type-opportunity') },
]);

const riskLevelOptions = computed(() => [
  { value: 'low', label: t('risk.level-low') },
  { value: 'medium', label: t('risk.level-medium') },
  { value: 'high', label: t('risk.level-high') },
  { value: 'critical', label: t('risk.level-critical') },
]);

const statusOptions = computed(() => [
  { value: 'draft', label: t('risk.status-draft') },
  { value: 'registered', label: t('risk.status-registered') },
  { value: 'analysis', label: t('risk.status-analysis') },
  { value: 'response', label: t('risk.status-response') },
  { value: 'monitoring', label: t('risk.status-monitoring') },
  { value: 'closed', label: t('risk.status-closed') },
  { value: 'archived', label: t('risk.status-archived') },
]);

const filteredSubCategoryOptions = computed(() => {
  const slugs = selectedCategorySlugs.value;
  if (slugs.length === 0) return [];
  const all: { value: string; label: string }[] = [];
  for (const slug of slugs) {
    all.push(...subCategoryOptions(slug));
  }
  return all;
});

function apiFiltersToFormValues(f: Record<string, unknown> | undefined | null) {
  const x = f ?? {};
  return {
    search: String(x.search ?? ''),
    categoryId: Array.isArray(x.categoryId) ? (x.categoryId as unknown[]).map(String) : [],
    subCategoryId: Array.isArray(x.subCategoryId) ? (x.subCategoryId as unknown[]).map(String) : [],
    type: Array.isArray(x.type) ? (x.type as unknown[]).map(String) : [],
    level: Array.isArray(x.level) ? (x.level as unknown[]).map(String) : [],
    status: Array.isArray(x.status) ? (x.status as unknown[]).map(String) : [],
  };
}

const formInitialValues = computed(() =>
  apiFiltersToFormValues(toValue(props.table.filters) ?? {})
);

function buildPayload(values: Record<string, unknown>): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  const search = String(values.search ?? '').trim();
  if (search) o.search = search;
  const categoryId = values.categoryId as string[] | undefined;
  if (categoryId?.length) o.categoryId = categoryId;
  const subCategoryId = values.subCategoryId as string[] | undefined;
  if (subCategoryId?.length) o.subCategoryId = subCategoryId;
  const type = values.type as string[] | undefined;
  if (type?.length) o.type = type;
  const level = values.level as string[] | undefined;
  if (level?.length) o.level = level;
  const status = values.status as string[] | undefined;
  if (status?.length) o.status = status;
  return o;
}

// --- Auto-apply logic ---
const AutoApply = {
  setup() {
    const values = useFormValues();
    const ready = ref(false);

    onMounted(() => {
      void nextTick(() => { ready.value = true; });
    });

    function emitPayload() {
      if (!ready.value) return;
      const payload = buildPayload(values.value as Record<string, unknown>);
      props.table.replaceFilters(payload);
    }

    // Debounced for text input
    watchDebounced(
      () => String(values.value?.search ?? ''),
      () => emitPayload(),
      { debounce: 450 }
    );

    // Immediate for selects
    watch(
      () => ({
        categoryId: Array.isArray(values.value?.categoryId) ? [...(values.value.categoryId as string[])] : [],
        subCategoryId: Array.isArray(values.value?.subCategoryId) ? [...(values.value.subCategoryId as string[])] : [],
        type: Array.isArray(values.value?.type) ? [...(values.value.type as string[])] : [],
        level: Array.isArray(values.value?.level) ? [...(values.value.level as string[])] : [],
        status: Array.isArray(values.value?.status) ? [...(values.value.status as string[])] : [],
      }),
      () => emitPayload(),
      { deep: true }
    );

    return () => null;
  },
};

function onCategoryFilterChange(value: unknown) {
  const newSlugs = Array.isArray(value) ? (value as string[]) : [];
  selectedCategorySlugs.value = newSlugs;
}

watch(
  () => props.toolbarClearTick,
  (_v, prev) => {
    if (prev === undefined) return;
    formKey.value += 1;
    selectedCategorySlugs.value = [];
  }
);

fetchTree();
</script>

<template>
  <div>
    <h3 class="mb-3 text-sm font-medium text-slate-700 dark:text-slate-200">
      {{ t('risk.filter-panel-title') }}
    </h3>
    <Form
      :id="formId"
      :key="formKey"
      class="space-y-3"
      :initial-values="formInitialValues"
      as="div"
    >
      <AutoApply />
      <BaseInput
        name="search"
        compact-label
        :label="t('risk.filter-search')"
        :placeholder="t('risk.filter-search-placeholder')"
      />
      <BaseMultiSelect
        name="categoryId"
        compact-label
        :label="t('risk.field-category')"
        :options="categoryOptions"
        placeholder=""
        @change="onCategoryFilterChange"
      />
      <BaseMultiSelect
        v-if="selectedCategorySlugs.length > 0"
        name="subCategoryId"
        compact-label
        :label="t('risk.field-sub-category')"
        :options="filteredSubCategoryOptions"
        placeholder=""
      />
      <BaseMultiSelect
        name="type"
        compact-label
        :label="t('risk.field-risk-type')"
        :options="riskTypeOptions"
        placeholder=""
      />
      <BaseMultiSelect
        name="level"
        compact-label
        :label="t('risk.field-risk-level')"
        :options="riskLevelOptions"
        placeholder=""
      />
      <BaseMultiSelect
        name="status"
        compact-label
        :label="t('risk.field-status')"
        :options="statusOptions"
        placeholder=""
      />
    </Form>
  </div>
</template>
