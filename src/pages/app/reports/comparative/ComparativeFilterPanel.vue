<script setup lang="ts">
import type { Ref } from 'vue';
import { computed, onMounted, ref, toValue, watch } from 'vue';
import { Form } from 'vee-validate';
import { useI18n } from 'vue-i18n';
import BaseInput from '@/core/ui/base/BaseInput.vue';
import BaseMultiSelect from '@/core/ui/base/BaseMultiSelect.vue';
import ComparativeFilterAutoApply from './ComparativeFilterAutoApply.vue';
import { grcRepo, type GrcEntity } from '@/core/repositories/grcRepo';

const props = withDefaults(
  defineProps<{
    table?: {
      replaceFilters: (f: Record<string, unknown>) => void;
      clearFilters: () => void;
      filters?: Ref<Record<string, unknown>> | Record<string, unknown>;
    } | null;
    toolbarClearTick?: number;
  }>(),
  {
    table: null,
    toolbarClearTick: 0,
  }
);

const emit = defineEmits<{
  (e: 'apply', payload: Record<string, unknown>): void;
}>();

const { t } = useI18n();
const formKey = ref(0);
const formId = 'comparative-filter-form';

const frameworkOptions = ref<{ value: string; label: string }[]>([]);

onMounted(async () => {
  try {
    const res = await grcRepo.frameworkList({ limit: 100 });
    frameworkOptions.value = (res?.data?.list ?? []).map((fw: GrcEntity) => ({
      value: fw.slug,
      label: fw.title ?? fw.slug,
    }));
  } catch {
    frameworkOptions.value = [];
  }
});

const periodTypeOptions = computed(() => [
  { value: 'YEARLY', label: t('reports.period-type.yearly') },
  { value: 'QUARTERLY', label: t('reports.period-type.quarterly') },
  { value: 'MONTHLY', label: t('reports.period-type.monthly') },
]);

const dateTypeOptions = computed(() => [
  { value: 'jalali', label: t('reports.date-type.jalali') },
  { value: 'gregorian', label: t('reports.date-type.gregorian') },
]);

function apiFiltersToFormValues(f: Record<string, unknown> | undefined | null) {
  const x = f ?? {};
  return {
    title: String(x.title ?? ''),
    frameworkSlug: Array.isArray(x.frameworkSlug) ? (x.frameworkSlug as unknown[]).map(String) : [],
    dateType: Array.isArray(x.dateType) ? (x.dateType as unknown[]).map(String) : [],
    periodType: Array.isArray(x.periodType) ? (x.periodType as unknown[]).map(String) : [],
  };
}

const formInitialValues = computed(() =>
  apiFiltersToFormValues(toValue(props.table?.filters) ?? {})
);

watch(
  () => props.toolbarClearTick,
  (_v, prev) => {
    if (prev === undefined) return;
    formKey.value += 1;
  }
);

function buildPayload(values: Record<string, unknown>): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  const title = String(values.title ?? '').trim();
  if (title) o.title = title;
  const frameworkSlug = values.frameworkSlug as string[] | undefined;
  if (frameworkSlug?.length) o.frameworkSlug = frameworkSlug;
  const dateType = values.dateType as string[] | undefined;
  if (dateType?.length) o.dateType = dateType;
  const periodType = values.periodType as string[] | undefined;
  if (periodType?.length) o.periodType = periodType;
  return o;
}

function onAutoApply(payload: Record<string, unknown>) {
  if (props.table) {
    props.table.replaceFilters(payload);
  } else {
    emit('apply', payload);
  }
}
</script>

<template>
  <div>
    <Form
      :id="formId"
      :key="formKey"
      class="space-y-3"
      :initial-values="formInitialValues"
      as="div"
    >
      <ComparativeFilterAutoApply
        :build-payload="buildPayload"
        @apply="onAutoApply"
      />
      <div class="grid grid-cols-1 gap-3 md:grid-cols-1">
        <BaseInput
          name="title"
          compact-label
          :label="t('reports.col-title')"
        />
        <BaseMultiSelect
          name="frameworkSlug"
          compact-label
          :label="t('reports.col-framework')"
          :options="frameworkOptions"
          placeholder=""
        />
        <BaseMultiSelect
          name="dateType"
          compact-label
          :label="t('reports.col-date-type')"
          :options="dateTypeOptions"
          placeholder=""
        />
        <BaseMultiSelect
          name="periodType"
          compact-label
          :label="t('reports.col-period')"
          :options="periodTypeOptions"
          placeholder=""
        />
      </div>
    </Form>
  </div>
</template>
