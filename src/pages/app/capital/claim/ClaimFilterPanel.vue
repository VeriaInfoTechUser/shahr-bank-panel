<script setup lang="ts">
import type { Ref } from 'vue';
import { computed, ref, toValue, watch } from 'vue';
import { Form } from 'vee-validate';
import { useI18n } from 'vue-i18n';
import BaseInput from '@/core/ui/base/BaseInput.vue';
import BaseMultiSelect from '@/core/ui/base/BaseMultiSelect.vue';
import ClaimFilterAutoApply from './ClaimFilterAutoApply.vue';

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
const formId = 'claim-filter-form';

const statusOptions = computed(() => [
  { value: '1', label: t('capital-claim-page.status-active') },
  { value: '0', label: t('capital-claim-page.status-inactive') },
]);

function apiFiltersToFormValues(f: Record<string, unknown> | undefined | null) {
  const x = f ?? {};
  return {
    title: String(x.title ?? ''),
    status: Array.isArray(x.status)
      ? (x.status as unknown[]).map(String)
      : x.status != null
        ? [String(x.status)]
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
  const status = values.status as string[] | undefined;
  if (status?.length) {
    o.status = status.length === 1 ? Number(status[0]) : status;
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
      <ClaimFilterAutoApply
        :build-payload="buildPayload"
        @apply="onAutoApply"
      />
      <div class="grid grid-cols-1 gap-3">
        <BaseInput
          name="title"
          compact-label
          :label="t('capital-claim-page.filter-field-title')"
        />
        <BaseMultiSelect
          name="status"
          compact-label
          :label="t('capital-claim-page.filter-field-status')"
          :options="statusOptions"
          placeholder=""
        />
      </div>
    </Form>
  </div>
</template>
