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
    title: String(x.title ?? ''),
    categorySlug: Array.isArray(x.categorySlug) ? (x.categorySlug as unknown[]).map(String) : [],
    subCategorySlug: Array.isArray(x.subCategorySlug) ? (x.subCategorySlug as unknown[]).map(String) : [],
    riskType: Array.isArray(x.riskType) ? (x.riskType as unknown[]).map(String) : [],
    riskLevel: Array.isArray(x.riskLevel) ? (x.riskLevel as unknown[]).map(String) : [],
    state: Array.isArray(x.state) ? (x.state as unknown[]).map(String) : [],
  };
}

const formInitialValues = computed(() =>
  apiFiltersToFormValues(toValue(props.table.filters) ?? {})
);

function buildPayload(values: Record<string, unknown>): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  const title = String(values.title ?? '').trim();
  if (title) o.title = title;
  const categorySlug = values.categorySlug as string[] | undefined;
  if (categorySlug?.length) o.categorySlug = categorySlug;
  const subCategorySlug = values.subCategorySlug as string[] | undefined;
  if (subCategorySlug?.length) o.subCategorySlug = subCategorySlug;
  const riskType = values.riskType as string[] | undefined;
  if (riskType?.length) o.riskType = riskType;
  const riskLevel = values.riskLevel as string[] | undefined;
  if (riskLevel?.length) o.riskLevel = riskLevel;
  const state = values.state as string[] | undefined;
  if (state?.length) o.state = state;
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
      () => String(values.value?.title ?? ''),
      () => emitPayload(),
      { debounce: 450 }
    );

    // Immediate for selects
    watch(
      () => ({
        categorySlug: Array.isArray(values.value?.categorySlug) ? [...(values.value.categorySlug as string[])] : [],
        subCategorySlug: Array.isArray(values.value?.subCategorySlug) ? [...(values.value.subCategorySlug as string[])] : [],
        riskType: Array.isArray(values.value?.riskType) ? [...(values.value.riskType as string[])] : [],
        riskLevel: Array.isArray(values.value?.riskLevel) ? [...(values.value.riskLevel as string[])] : [],
        state: Array.isArray(values.value?.state) ? [...(values.value.state as string[])] : [],
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
        name="title"
        compact-label
        :label="t('risk.filter-search')"
        :placeholder="t('risk.filter-search-placeholder')"
      />
      <BaseMultiSelect
        name="categorySlug"
        compact-label
        :label="t('risk.field-category')"
        :options="categoryOptions"
        placeholder=""
        @change="onCategoryFilterChange"
      />
      <BaseMultiSelect
        v-if="selectedCategorySlugs.length > 0"
        name="subCategorySlug"
        compact-label
        :label="t('risk.field-sub-category')"
        :options="filteredSubCategoryOptions"
        placeholder=""
      />
      <BaseMultiSelect
        name="riskType"
        compact-label
        :label="t('risk.field-risk-type')"
        :options="riskTypeOptions"
        placeholder=""
      />
      <BaseMultiSelect
        name="riskLevel"
        compact-label
        :label="t('risk.field-risk-level')"
        :options="riskLevelOptions"
        placeholder=""
      />
      <BaseMultiSelect
        name="state"
        compact-label
        :label="t('risk.field-status')"
        :options="statusOptions"
        placeholder=""
      />
    </Form>
  </div>
</template>
