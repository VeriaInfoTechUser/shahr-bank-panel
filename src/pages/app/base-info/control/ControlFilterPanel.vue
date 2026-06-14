<script setup lang="ts">
import type { Ref } from 'vue';
import { computed, ref, onMounted, toValue, watch } from 'vue';
import { Form } from 'vee-validate';
import { useI18n } from 'vue-i18n';
import BaseInput from '@/core/ui/base/BaseInput.vue';
import BaseSelect from '@/core/ui/base/BaseSelect.vue';
import { grcRepo, type GrcEntity } from '@/core/repositories/grcRepo';
import ControlFilterAutoApply from './ControlFilterAutoApply.vue';

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
const formId = 'control-filter-form';
const frameworkOptions = ref<{ value: string; label: string }[]>([]);
const domainOptions = ref<{ value: string; label: string }[]>([]);
const allDomains = ref<GrcEntity[]>([]);
const selectedFrameworkSlug = ref('');

function apiFiltersToFormValues(f: Record<string, unknown> | undefined | null) {
  const x = f ?? {};
  return {
    title: String(x.title ?? ''),
    frameworkSlug: String(x.frameworkSlug ?? ''),
    domainSlug: String(x.domainSlug ?? ''),
  };
}

const formInitialValues = computed(() =>
  apiFiltersToFormValues(toValue(props.table?.filters) ?? {})
);

const filteredDomainOptions = computed(() => {
  const fwSlug = selectedFrameworkSlug.value;
  const filtered = fwSlug
    ? allDomains.value.filter((d) => d.frameworkSlug === fwSlug)
    : allDomains.value;
  return filtered.map((d) => ({
    value: d.slug,
    label: d.title ?? d.slug,
  }));
});

async function loadOptions() {
  try {
    const [fwRes, domRes] = await Promise.all([
      grcRepo.frameworkList({ limit: 100 }),
      grcRepo.domainList({ limit: 100 }),
    ]);
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
    selectedFrameworkSlug.value = '';
  }
);

function buildPayload(values: Record<string, unknown>): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  const title = String(values.title ?? '').trim();
  if (title) o.title = title;
  const frameworkSlug = String(values.frameworkSlug ?? '').trim();
  if (frameworkSlug) o.frameworkSlug = frameworkSlug;
  const domainSlug = String(values.domainSlug ?? '').trim();
  if (domainSlug) o.domainSlug = domainSlug;
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
  selectedFrameworkSlug.value = String(value ?? '');
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
      <ControlFilterAutoApply
        :build-payload="buildPayload"
        @apply="onAutoApply"
      />
      <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
        <BaseInput
          name="title"
          compact-label
          :label="t('control.filter-field-title')"
        />
        <BaseSelect
          name="frameworkSlug"
          compact-label
          :label="t('control.filter-field-framework')"
          :options="frameworkOptions"
          placeholder=""
          :filter="true"
          @change="onFrameworkFilterChange"
        />
        <BaseSelect
          name="domainSlug"
          compact-label
          :label="t('control.filter-field-domain')"
          :options="filteredDomainOptions"
          placeholder=""
          :filter="true"
        />
      </div>
    </Form>
  </div>
</template>
