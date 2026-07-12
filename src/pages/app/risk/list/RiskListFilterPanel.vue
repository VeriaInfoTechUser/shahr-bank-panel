<script setup lang="ts">
import type { Ref } from 'vue';
import { computed, nextTick, onMounted, ref, toValue, watch } from 'vue';
import { Form, useFormValues } from 'vee-validate';
import { watchDebounced } from '@vueuse/core';
import { useI18n } from 'vue-i18n';
import Slider from 'primevue/slider';
import BaseInput from '@/core/ui/base/BaseInput.vue';
import BaseMultiSelect from '@/core/ui/base/BaseMultiSelect.vue';
import { useRiskCategories } from './useRiskCategories';

const SCORE_MIN = 0;
const SCORE_MAX = 25;

const props = defineProps<{
  table: {
    replaceFilters: (f: Record<string, unknown>) => void;
    clearFilters: () => void;
    filters: Ref<Record<string, unknown>> | Record<string, unknown>;
  };
  toolbarClearTick: number;
  hideStateFilter?: boolean;
  showOnlyFilters?: string[];
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

const impactOptions = computed(() => [
  { value: 1, label: `1 - ${t('risk.impact-1')}` },
  { value: 2, label: `2 - ${t('risk.impact-2')}` },
  { value: 3, label: `3 - ${t('risk.impact-3')}` },
  { value: 4, label: `4 - ${t('risk.impact-4')}` },
  { value: 5, label: `5 - ${t('risk.impact-5')}` },
]);

const likelihoodOptions = computed(() => [
  { value: 1, label: `1 - ${t('risk.likelihood-1')}` },
  { value: 2, label: `2 - ${t('risk.likelihood-2')}` },
  { value: 3, label: `3 - ${t('risk.likelihood-3')}` },
  { value: 4, label: `4 - ${t('risk.likelihood-4')}` },
  { value: 5, label: `5 - ${t('risk.likelihood-5')}` },
]);

const statusOptions = computed(() => [
  { value: 'registered', label: t('risk.status-registered') },
  { value: 'analysis', label: t('risk.status-analysis') },
  { value: 'response', label: t('risk.status-response') },
  { value: 'monitoring', label: t('risk.status-monitoring') },
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
    impact: Array.isArray(x.impact) ? (x.impact as unknown[]).map(Number) : [],
    likelihood: Array.isArray(x.likelihood) ? (x.likelihood as unknown[]).map(Number) : [],
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
  const impact = values.impact as number[] | undefined;
  if (impact?.length) o.impact = impact;
  const likelihood = values.likelihood as number[] | undefined;
  if (likelihood?.length) o.likelihood = likelihood;
  const [sMin, sMax] = scoreSliderModel.value;
  if (sMin !== SCORE_MIN || sMax !== SCORE_MAX) {
    o.minScore = sMin;
    o.maxScore = sMax;
  }
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
        impact: Array.isArray(values.value?.impact) ? [...(values.value.impact as number[])] : [],
        likelihood: Array.isArray(values.value?.likelihood) ? [...(values.value.likelihood as number[])] : [],
        state: Array.isArray(values.value?.state) ? [...(values.value.state as string[])] : [],
      }),
      () => emitPayload(),
      { deep: true }
    );

    // Watch score slider changes (debounced to avoid rapid requests while dragging)
    watchDebounced(scoreSliderModel, () => emitPayload(), { debounce: 400, deep: true });

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
    scoreSliderModel.value = [SCORE_MIN, SCORE_MAX];
  }
);

fetchTree();

// --- Score range slider ---
function clampScore(n: number): number {
  if (!Number.isFinite(n)) return SCORE_MIN;
  return Math.min(SCORE_MAX, Math.max(SCORE_MIN, Math.trunc(n)));
}

const scoreSliderModel = ref<[number, number]>([SCORE_MIN, SCORE_MAX]);

function onScoreSliderChange(value: [number, number]) {
  const lo = clampScore(value[0]);
  const hi = clampScore(value[1]);
  scoreSliderModel.value = [Math.min(lo, hi), Math.max(lo, hi)];
}

function scoreToPercent(v: number): number {
  const c = clampScore(v);
  if (SCORE_MAX === SCORE_MIN) return 0;
  return ((c - SCORE_MIN) / (SCORE_MAX - SCORE_MIN)) * 100;
}

const scoreLo = computed(() => scoreSliderModel.value[0]);
const scoreHi = computed(() => scoreSliderModel.value[1]);
const scoreLoPct = computed(() => scoreToPercent(scoreLo.value));
const scoreHiPct = computed(() => scoreToPercent(scoreHi.value));

function shouldShowFilter(key: string): boolean {
  if (props.showOnlyFilters) return props.showOnlyFilters.includes(key);
  return true;
}
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
        v-if="shouldShowFilter('title')"
        name="title"
        compact-label
        :label="t('risk.filter-search')"
        :placeholder="t('risk.filter-search-placeholder')"
      />
      <BaseMultiSelect
        v-if="shouldShowFilter('categorySlug')"
        name="categorySlug"
        compact-label
        :label="t('risk.field-category')"
        :options="categoryOptions"
        placeholder=""
        @change="onCategoryFilterChange"
      />
      <BaseMultiSelect
        v-if="shouldShowFilter('subCategorySlug') && selectedCategorySlugs.length > 0"
        name="subCategorySlug"
        compact-label
        :label="t('risk.field-sub-category')"
        :options="filteredSubCategoryOptions"
        placeholder=""
      />
      <BaseMultiSelect
        v-if="shouldShowFilter('riskType')"
        name="riskType"
        compact-label
        :label="t('risk.field-risk-type')"
        :options="riskTypeOptions"
        placeholder=""
      />
      <BaseMultiSelect
        v-if="shouldShowFilter('riskLevel')"
        name="riskLevel"
        compact-label
        :label="t('risk.field-risk-level')"
        :options="riskLevelOptions"
        placeholder=""
      />
      <BaseMultiSelect
        v-if="shouldShowFilter('impact')"
        name="impact"
        compact-label
        :label="t('risk.col-impact')"
        :options="impactOptions"
        placeholder=""
      />
      <BaseMultiSelect
        v-if="shouldShowFilter('likelihood')"
        name="likelihood"
        compact-label
        :label="t('risk.col-likelihood')"
        :options="likelihoodOptions"
        placeholder=""
      />
      <div v-if="shouldShowFilter('minScore')" class="w-full pt-0.5">
        <label class="mb-1 block text-[13px] font-medium text-slate-700 dark:text-slate-200">
          {{ t('risk.col-inherent-score') }}
        </label>
        <div class="mt-3 px-0.5 pb-1" dir="ltr">
          <div class="relative isolate w-full">
            <Slider
              v-model="scoreSliderModel"
              class="relative z-0 w-full"
              :min="SCORE_MIN"
              :max="SCORE_MAX"
              :step="1"
              range
              :aria-label="t('risk.col-inherent-score')"
            />
            <template v-if="scoreLo === scoreHi">
              <span
                class="pointer-events-none absolute top-1/2 z-20 flex h-6 w-6 shrink-0 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-[11px] font-bold tabular-nums leading-none text-slate-900 shadow-md ring-1 ring-black/5 dark:border-darkmode-500 dark:bg-darkmode-700 dark:text-slate-50 dark:ring-white/10"
                :style="{ left: `${scoreLoPct}%` }"
              >
                {{ scoreLo }}
              </span>
            </template>
            <template v-else>
              <span
                class="pointer-events-none absolute top-1/2 z-20 flex h-6 w-6 shrink-0 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-[11px] font-bold tabular-nums leading-none text-slate-900 shadow-md ring-1 ring-black/5 dark:border-darkmode-500 dark:bg-darkmode-700 dark:text-slate-50 dark:ring-white/10"
                :style="{ left: `${scoreLoPct}%` }"
              >
                {{ scoreLo }}
              </span>
              <span
                class="pointer-events-none absolute top-1/2 z-30 flex h-6 w-6 shrink-0 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-[11px] font-bold tabular-nums leading-none text-slate-900 shadow-md ring-1 ring-black/5 dark:border-darkmode-500 dark:bg-darkmode-700 dark:text-slate-50 dark:ring-white/10"
                :style="{ left: `${scoreHiPct}%` }"
              >
                {{ scoreHi }}
              </span>
            </template>
          </div>
          <div class="mt-1.5 flex w-full justify-between text-[11px] font-medium tabular-nums text-slate-500 dark:text-slate-400">
            <span>{{ SCORE_MIN }}</span>
            <span>{{ SCORE_MAX }}</span>
          </div>
        </div>
      </div>
      <BaseMultiSelect
        v-if="shouldShowFilter('state') && !hideStateFilter"
        name="state"
        compact-label
        :label="t('risk.field-status')"
        :options="statusOptions"
        placeholder=""
      />
    </Form>
  </div>
</template>
