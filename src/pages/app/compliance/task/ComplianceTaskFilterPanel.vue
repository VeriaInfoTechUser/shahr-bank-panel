<script setup lang="ts">
import type { Ref } from 'vue';
import { computed, ref, onMounted, toValue, watch } from 'vue';
import { Form } from 'vee-validate';
import { useI18n } from 'vue-i18n';
import BaseInput from '@/core/ui/base/BaseInput.vue';
import BaseMultiSelect from '@/core/ui/base/BaseMultiSelect.vue';
import { grcRepo, type GrcEntity } from '@/core/repositories/grcRepo';
import ComplianceTaskFilterAutoApply from './ComplianceTaskFilterAutoApply.vue';
import ComplianceTaskDomainCleanup from './ComplianceTaskDomainCleanup.vue';

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
const formId = 'compliance-task-filter-form';
const planOptions = ref<{ value: string; label: string }[]>([]);
const frameworkOptions = ref<{ value: string; label: string }[]>([]);
const allDomains = ref<GrcEntity[]>([]);
const selectedFrameworkSlugs = ref<string[]>([]);

function apiFiltersToFormValues(f: Record<string, unknown> | undefined | null) {
  const x = f ?? {};
  return {
    title: String(x.title ?? ''),
    planSlug: Array.isArray(x.planSlug) ? (x.planSlug as unknown[]).map(String) : [],
    frameworkSlug: Array.isArray(x.frameworkSlug) ? (x.frameworkSlug as unknown[]).map(String) : [],
    domainSlug: Array.isArray(x.domainSlug) ? (x.domainSlug as unknown[]).map(String) : [],
  };
}

const formInitialValues = computed(() =>
  apiFiltersToFormValues(toValue(props.table?.filters) ?? {})
);

const filteredDomainOptions = computed(() => {
  const fwSlugs = selectedFrameworkSlugs.value;
  const filtered = fwSlugs.length > 0
    ? allDomains.value.filter((d) => fwSlugs.includes(d.frameworkSlug))
    : allDomains.value;
  return filtered.map((d) => ({
    value: d.slug,
    label: d.title ?? d.slug,
  }));
});

async function loadOptions() {
  try {
    const [planRes, fwRes, domRes] = await Promise.all([
      grcRepo.planList({ limit: 100 }),
      grcRepo.frameworkList({ limit: 100 }),
      grcRepo.domainList({ limit: 100 }),
    ]);
    if (planRes?.data?.list) {
      planOptions.value = (Array.isArray(planRes.data.list) ? planRes.data.list : []).map((p: GrcEntity) => ({
        value: p.slug,
        label: p.title ?? p.slug,
      }));
    }
    if (fwRes?.result && fwRes.data?.list) {
      frameworkOptions.value = fwRes.data.list.map((fw: GrcEntity) => ({
        value: fw.slug,
        label: fw.title ?? fw.slug,
      }));
    }
    if (domRes?.result && domRes.data?.list) {
      allDomains.value = domRes.data.list;
    }
  } catch {
    planOptions.value = [];
    frameworkOptions.value = [];
    allDomains.value = [];
  }
}

onMounted(() => {
  void loadOptions();
});

watch(
  () => props.toolbarClearTick,
  (_v, prev) => {
    if (prev === undefined) return;
    formKey.value += 1;
    selectedFrameworkSlugs.value = [];
  }
);

function buildPayload(values: Record<string, unknown>): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  const title = String(values.title ?? '').trim();
  if (title) o.title = title;
  const planSlug = values.planSlug as string[] | undefined;
  if (planSlug?.length) o.planSlug = planSlug;
  const frameworkSlug = values.frameworkSlug as string[] | undefined;
  if (frameworkSlug?.length) o.frameworkSlug = frameworkSlug;
  const domainSlug = values.domainSlug as string[] | undefined;
  if (domainSlug?.length) o.domainSlug = domainSlug;
  return o;
}

function onAutoApply(payload: Record<string, unknown>) {
  if (props.table) {
    props.table.replaceFilters(payload);
  } else {
    emit('apply', payload);
  }
}

function onFrameworkFilterChange(value: unknown) {
  const newSlugs = Array.isArray(value) ? (value as string[]) : [];
  selectedFrameworkSlugs.value = newSlugs;
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
      <ComplianceTaskFilterAutoApply
        :build-payload="buildPayload"
        @apply="onAutoApply"
      />
      <ComplianceTaskDomainCleanup
        :valid-domain-values="filteredDomainOptions.map((d) => d.value)"
      />
      <div class="grid grid-cols-1 gap-3">
        <BaseInput
          name="title"
          compact-label
          :label="t('compliance-task.filter-field-title')"
        />
        <BaseMultiSelect
          name="planSlug"
          compact-label
          :label="t('compliance-task.filter-field-plan')"
          :options="planOptions"
          placeholder=""
        />
        <BaseMultiSelect
          name="frameworkSlug"
          compact-label
          :label="t('compliance-task.filter-field-framework')"
          :options="frameworkOptions"
          placeholder=""
          @change="onFrameworkFilterChange"
        />
        <BaseMultiSelect
          name="domainSlug"
          compact-label
          :label="t('compliance-task.filter-field-domain')"
          :options="filteredDomainOptions"
          placeholder=""
        />
      </div>
    </Form>
  </div>
</template>
