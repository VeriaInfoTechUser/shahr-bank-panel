<script setup lang="ts">
import type { Ref } from 'vue';
import { computed, ref, toValue, watch } from 'vue';
import { Form } from 'vee-validate';
import { useI18n } from 'vue-i18n';
import BaseInput from '@/core/ui/base/BaseInput.vue';
import BaseMultiSelect from '@/core/ui/base/BaseMultiSelect.vue';
import CapitalMetricsFilterAutoApply from './CapitalMetricsFilterAutoApply.vue';

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
const formId = 'capital-metrics-filter-form';

const industryOptions = computed(() => [
  { value: 'نفت و گاز', label: 'نفت و گاز' },
  { value: 'خودرو', label: 'خودرو' },
  { value: 'فولاد و معدن', label: 'فولاد و معدن' },
  { value: 'بانک', label: 'بانک' },
  { value: 'بیمه', label: 'بیمه' },
]);

const metricRoleOptions = computed(() => [
  { value: 'CONTROL', label: 'CONTROL' },
  { value: 'PI', label: 'PI' },
  { value: 'KPI', label: 'KPI' },
  { value: 'KRI', label: 'KRI' },
]);

function apiFiltersToFormValues(f: Record<string, unknown> | undefined | null) {
  const x = f ?? {};
  return {
    title: String(x.title ?? ''),
    industries: Array.isArray(x.industries) ? (x.industries as unknown[]).map(String) : [],
    metricRole: Array.isArray(x.metricRole) ? (x.metricRole as unknown[]).map(String) : [],
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
  const industries = values.industries as string[] | undefined;
  if (industries?.length) o.industries = industries;
  const metricRole = values.metricRole as string[] | undefined;
  if (metricRole?.length) o.metricRole = metricRole;
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
      <CapitalMetricsFilterAutoApply
        :build-payload="buildPayload"
        @apply="onAutoApply"
      />
      <div class="grid grid-cols-1 gap-3 md:grid-cols-1">
        <BaseInput
          name="title"
          compact-label
          :label="t('capital-metrics-page.filter-field-title')"
        />
        <BaseMultiSelect
          name="industries"
          compact-label
          :label="t('capital-metrics-page.col-industries')"
          :options="industryOptions"
          placeholder=""
        />
        <BaseMultiSelect
          name="metricRole"
          compact-label
          :label="t('capital-metrics-page.col-metric-role')"
          :options="metricRoleOptions"
          placeholder=""
        />
      </div>
    </Form>
  </div>
</template>
