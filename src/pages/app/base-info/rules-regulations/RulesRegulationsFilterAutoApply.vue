<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';
import { useFormValues } from 'vee-validate';
import { watchDebounced } from '@vueuse/core';

const props = defineProps<{
  buildPayload: (v: Record<string, unknown>) => Record<string, unknown>;
}>();

const emit = defineEmits<{
  (e: 'apply', payload: Record<string, unknown>): void;
}>();

/** useFormValues() یک ComputedRef است؛ در اسکریپت حتماً .value */
const values = useFormValues();
const ready = ref(false);

onMounted(() => {
  void nextTick(() => {
    ready.value = true;
  });
});

function emitIfReady() {
  if (!ready.value) return;
  const payload = props.buildPayload(values.value as Record<string, unknown>);
  emit('apply', payload);
}

watchDebounced(
  () => String(values.value.rule ?? ''),
  () => emitIfReady(),
  { debounce: 450 }
);
watchDebounced(
  () => String(values.value.code ?? ''),
  () => emitIfReady(),
  { debounce: 450 }
);

watch(
  () => ({
    author: values.value.author,
    category: values.value.category,
    type: values.value.type,
    requirement_select: values.value.requirement_select,
    validity_select: values.value.validity_select,
    approval_at_from: values.value.approval_at_from,
    approval_at_to: values.value.approval_at_to,
    promulgation_at_from: values.value.promulgation_at_from,
    promulgation_at_to: values.value.promulgation_at_to,
    cancellation_at_from: values.value.cancellation_at_from,
    cancellation_at_to: values.value.cancellation_at_to,
    data_from: values.value.data_from,
    data_to: values.value.data_to,
  }),
  () => emitIfReady(),
  { deep: true }
);
</script>

<template>
  <span class="sr-only" aria-hidden="true" />
</template>
