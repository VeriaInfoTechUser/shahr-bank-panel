<script setup lang="ts">
import type { Ref } from 'vue';
import { computed, ref, onMounted, toValue, watch } from 'vue';
import { Form } from 'vee-validate';
import { useI18n } from 'vue-i18n';
import BaseInput from '@/core/ui/base/BaseInput.vue';
import BaseMultiSelect from '@/core/ui/base/BaseMultiSelect.vue';
import { grcRepo, type GrcEntity } from '@/core/repositories/grcRepo';
import DomainFilterAutoApply from './DomainFilterAutoApply.vue';

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
const formId = 'domain-filter-form';
const frameworkOptions = ref<{ value: string; label: string }[]>([]);

function apiFiltersToFormValues(f: Record<string, unknown> | undefined | null) {
  const x = f ?? {};
  return {
    title: String(x.title ?? ''),
    frameworkSlug: Array.isArray(x.frameworkSlug) ? (x.frameworkSlug as unknown[]).map(String) : [],
  };
}

const formInitialValues = computed(() =>
  apiFiltersToFormValues(toValue(props.table?.filters) ?? {})
);

async function loadFrameworkOptions() {
  try {
    const res = await grcRepo.frameworkList({ limit: 100 });
    if (res?.result && res.data?.list) {
      frameworkOptions.value = res.data.list.map((fw: GrcEntity) => ({
        value: fw.slug,
        label: fw.title ?? fw.slug,
      }));
    }
  } catch {
    frameworkOptions.value = [];
  }
}

onMounted(() => {
  void loadFrameworkOptions();
});

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
      <DomainFilterAutoApply
        :build-payload="buildPayload"
        @apply="onAutoApply"
      />
      <div class="grid grid-cols-1 gap-3">
        <BaseInput
          name="title"
          compact-label
          :label="t('domain.filter-field-title')"
        />
        <BaseMultiSelect
          name="frameworkSlug"
          compact-label
          :label="t('domain.filter-field-framework')"
          :options="frameworkOptions"
          placeholder=""
        />
      </div>
    </Form>
  </div>
</template>
