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
  () => String(values.value.title ?? ''),
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
    rule_ids: values.value.rule_ids,
    warranty_ids: values.value.warranty_ids,
    section_ids: values.value.section_ids,
    mandatory_unit_ids: values.value.mandatory_unit_ids,
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
