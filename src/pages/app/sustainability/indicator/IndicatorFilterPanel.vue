<script setup lang="ts">
import type { Ref } from 'vue';
import { computed, ref, toValue, watch } from 'vue';
import { Form } from 'vee-validate';
import { useI18n } from 'vue-i18n';
import BaseInput from '@/core/ui/base/BaseInput.vue';
import BaseMultiSelect from '@/core/ui/base/BaseMultiSelect.vue';
import BasePaginatedSelect from '@/core/ui/base/BasePaginatedSelect.vue';
import { grcRepo } from '@/core/repositories/grcRepo';
import IndicatorFilterAutoApply from './IndicatorFilterAutoApply.vue';

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
const formId = 'indicator-filter-form';

const indicatorTypeOptions = computed(() => [
  { value: 'KPI', label: 'KPI' },
  { value: 'KRI', label: 'KRI' },
  { value: 'KCI', label: 'KCI' },
  { value: 'RES', label: 'RES' },
]);

async function fetchCapitals(params: { page: number; limit: number; search?: string }) {
  const res = await grcRepo.capitalTree({ ...params, level: 1 });
  const list = Array.isArray(res?.data) ? res.data : [];
  return {
    list: list.map((item: Record<string, unknown>) => ({
      value: String(item.slug ?? ''),
      label: String(item.title ?? item.name ?? ''),
    })),
    count: list.length,
  };
}

async function fetchDomains(params: { page: number; limit: number; search?: string }) {
  const res = await grcRepo.domainList(params);
  const list = res?.data?.list ?? [];
  return {
    list: (Array.isArray(list) ? list : []).map((item: Record<string, unknown>) => ({
      value: String(item.slug ?? ''),
      label: String(item.title ?? item.name ?? ''),
    })),
    count: res?.data?.paginator?.count ?? 0,
  };
}

async function fetchComponents(params: { page: number; limit: number; search?: string }) {
  const res = await grcRepo.indicatorList({ ...params, limit: 100 });
  const list = res?.data?.list ?? [];
  const unique = new Map<string, string>();
  (Array.isArray(list) ? list : []).forEach((item: Record<string, unknown>) => {
    const info = item.information as Record<string, unknown> | undefined;
    const slug = String(info?.componentSlug ?? '');
    const title = String(info?.componentTitle ?? '');
    if (slug && title && !unique.has(slug)) {
      unique.set(slug, title);
    }
  });
  return {
    list: Array.from(unique.entries()).map(([value, label]) => ({ value, label })),
    count: unique.size,
  };
}

async function fetchCapabilities(params: { page: number; limit: number; search?: string }) {
  const res = await grcRepo.indicatorList({ ...params, limit: 100 });
  const list = res?.data?.list ?? [];
  const unique = new Map<string, string>();
  (Array.isArray(list) ? list : []).forEach((item: Record<string, unknown>) => {
    const info = item.information as Record<string, unknown> | undefined;
    const slug = String(info?.capabilitySlug ?? '');
    const title = String(info?.capabilityTitle ?? '');
    if (slug && title && !unique.has(slug)) {
      unique.set(slug, title);
    }
  });
  return {
    list: Array.from(unique.entries()).map(([value, label]) => ({ value, label })),
    count: unique.size,
  };
}

function apiFiltersToFormValues(f: Record<string, unknown> | undefined | null) {
  const x = f ?? {};
  return {
    title: String(x.title ?? ''),
    capitalSlug: String(x.capitalSlug ?? ''),
    domainSlug: String(x.domainSlug ?? ''),
    componentSlug: String(x.componentSlug ?? ''),
    capabilitySlug: String(x.capabilitySlug ?? ''),
    indicatorType: Array.isArray(x.indicatorType)
      ? (x.indicatorType as unknown[]).map(String)
      : x.indicatorType != null
        ? [String(x.indicatorType)]
        : [],
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
  const capitalSlug = String(values.capitalSlug ?? '').trim();
  if (capitalSlug) o.capitalSlug = capitalSlug;
  const domainSlug = String(values.domainSlug ?? '').trim();
  if (domainSlug) o.domainSlug = domainSlug;
  const componentSlug = String(values.componentSlug ?? '').trim();
  if (componentSlug) o.componentSlug = componentSlug;
  const capabilitySlug = String(values.capabilitySlug ?? '').trim();
  if (capabilitySlug) o.capabilitySlug = capabilitySlug;
  const indicatorType = values.indicatorType as string[] | undefined;
  if (indicatorType?.length) {
    o.indicatorType = indicatorType.length === 1 ? indicatorType[0] : indicatorType;
  }
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
      <IndicatorFilterAutoApply
        :build-payload="buildPayload"
        @apply="onAutoApply"
      />
      <div class="grid grid-cols-1 gap-3">
        <BaseInput
          name="title"
          compact-label
          :label="t('sustainability-indicator-page.filter-field-title')"
        />
        <BasePaginatedSelect
          name="capitalSlug"
          compact-label
          :label="t('sustainability-indicator-page.col-capital')"
          :fetch-fn="fetchCapitals"
          :limit="10"
          :search="true"
          placeholder=""
        />
        <BasePaginatedSelect
          name="domainSlug"
          compact-label
          :label="t('sustainability-indicator-page.col-domain')"
          :fetch-fn="fetchDomains"
          :limit="10"
          :search="true"
          placeholder=""
        />
        <BasePaginatedSelect
          name="componentSlug"
          compact-label
          :label="t('sustainability-indicator-page.col-component')"
          :fetch-fn="fetchComponents"
          :limit="10"
          :search="true"
          placeholder=""
        />
        <BasePaginatedSelect
          name="capabilitySlug"
          compact-label
          :label="t('sustainability-indicator-page.col-capability')"
          :fetch-fn="fetchCapabilities"
          :limit="10"
          :search="true"
          placeholder=""
        />
        <BaseMultiSelect
          name="indicatorType"
          compact-label
          :label="t('sustainability-indicator-page.col-indicator-type')"
          :options="indicatorTypeOptions"
          placeholder=""
        />
      </div>
    </Form>
  </div>
</template>
