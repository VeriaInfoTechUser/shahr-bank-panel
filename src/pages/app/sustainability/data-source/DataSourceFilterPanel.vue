<script setup lang="ts">
import type { Ref } from 'vue';
import { computed, ref, toValue, watch } from 'vue';
import { Form } from 'vee-validate';
import { useI18n } from 'vue-i18n';
import BaseInput from '@/core/ui/base/BaseInput.vue';
import BasePaginatedMultiSelect from '@/core/ui/base/BasePaginatedMultiSelect.vue';
import { useSustainabilityCascadeFilters } from '@/composables/useSustainabilityCascadeFilters';
import DataSourceFilterAutoApply from './DataSourceFilterAutoApply.vue';
import DataSourceFilterCascadeSync, { type DataSourceFilterParents } from './DataSourceFilterCascadeSync.vue';

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
const formId = 'data-source-filter-form';

// ── Cascading levels (capital → domain → component → capability → claim → indicator) ──
const { parents, onParentsSync, fetchCapitals, fetchDomains, fetchComponents, fetchCapabilities, fetchClaims, fetchIndicators } =
  useSustainabilityCascadeFilters();

function apiFiltersToFormValues(f: Record<string, unknown> | undefined | null) {
  const x = f ?? {};
  return {
    title: String(x.title ?? ''),
    capitalSlug: Array.isArray(x.capitalSlug) ? x.capitalSlug.map(String) : x.capitalSlug ? [String(x.capitalSlug)] : [],
    domainSlug: Array.isArray(x.domainSlug) ? x.domainSlug.map(String) : x.domainSlug ? [String(x.domainSlug)] : [],
    componentSlug: Array.isArray(x.componentSlug) ? x.componentSlug.map(String) : x.componentSlug ? [String(x.componentSlug)] : [],
    capabilitySlug: Array.isArray(x.capabilitySlug) ? x.capabilitySlug.map(String) : x.capabilitySlug ? [String(x.capabilitySlug)] : [],
    claimSlug: Array.isArray(x.claimSlug) ? x.claimSlug.map(String) : x.claimSlug ? [String(x.claimSlug)] : [],
    indicatorSlug: Array.isArray(x.indicatorSlug) ? x.indicatorSlug.map(String) : x.indicatorSlug ? [String(x.indicatorSlug)] : [],
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
  const capitalSlug = values.capitalSlug as string[] | undefined;
  if (capitalSlug?.length) o.capitalSlug = capitalSlug.length === 1 ? capitalSlug[0] : capitalSlug;
  const domainSlug = values.domainSlug as string[] | undefined;
  if (domainSlug?.length) o.domainSlug = domainSlug.length === 1 ? domainSlug[0] : domainSlug;
  const componentSlug = values.componentSlug as string[] | undefined;
  if (componentSlug?.length) o.componentSlug = componentSlug.length === 1 ? componentSlug[0] : componentSlug;
  const capabilitySlug = values.capabilitySlug as string[] | undefined;
  if (capabilitySlug?.length) o.capabilitySlug = capabilitySlug.length === 1 ? capabilitySlug[0] : capabilitySlug;
  const claimSlug = values.claimSlug as string[] | undefined;
  if (claimSlug?.length) o.claimSlug = claimSlug.length === 1 ? claimSlug[0] : claimSlug;
  const indicatorSlug = values.indicatorSlug as string[] | undefined;
  if (indicatorSlug?.length) o.indicatorSlug = indicatorSlug.length === 1 ? indicatorSlug[0] : indicatorSlug;
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
      <DataSourceFilterCascadeSync @parents="onParentsSync" />
      <DataSourceFilterAutoApply
        :build-payload="buildPayload"
        @apply="onAutoApply"
      />
      <div class="grid grid-cols-1 gap-3">
        <BaseInput
          name="title"
          compact-label
          :label="t('sustainability-data-source-page.filter-field-title')"
        />
        <BasePaginatedMultiSelect
          name="capitalSlug"
          compact-label
          :label="t('sustainability-data-source-page.col-capital')"
          :fetch-fn="fetchCapitals"
          :limit="25"
          :search="true"
          placeholder=""
        />
        <BasePaginatedMultiSelect
          name="domainSlug"
          compact-label
          :label="t('sustainability-data-source-page.col-domain')"
          :fetch-fn="fetchDomains"
          :limit="25"
          :search="true"
          placeholder=""
        />
        <BasePaginatedMultiSelect
          name="componentSlug"
          compact-label
          :label="t('sustainability-data-source-page.col-component')"
          :fetch-fn="fetchComponents"
          :limit="25"
          :search="true"
          placeholder=""
        />
        <BasePaginatedMultiSelect
          name="capabilitySlug"
          compact-label
          :label="t('sustainability-data-source-page.col-capability')"
          :fetch-fn="fetchCapabilities"
          :limit="25"
          :search="true"
          placeholder=""
        />
        <BasePaginatedMultiSelect
          name="claimSlug"
          compact-label
          :label="t('sustainability-data-source-page.col-claim')"
          :fetch-fn="fetchClaims"
          :limit="25"
          :search="true"
          placeholder=""
        />
        <BasePaginatedMultiSelect
          name="indicatorSlug"
          compact-label
          :label="t('sustainability-data-source-page.col-indicator')"
          :fetch-fn="fetchIndicators"
          :limit="25"
          :search="true"
          placeholder=""
        />
      </div>
    </Form>
  </div>
</template>
