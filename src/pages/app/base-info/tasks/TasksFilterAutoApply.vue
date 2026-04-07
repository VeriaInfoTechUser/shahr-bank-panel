<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useFormValues } from 'vee-validate';
import { watchDebounced } from '@vueuse/core';

const props = withDefaults(
  defineProps<{
    buildPayload: (v: Record<string, unknown>) => Record<string, unknown>;
    includeMandatoryUnit?: boolean;
  }>(),
  { includeMandatoryUnit: true }
);

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

const nonTextFilterSlice = computed(() => ({
  enforcer_ids: values.value.enforcer_ids,
  level: values.value.level,
  rule_ids: values.value.rule_ids,
  warranty_ids: values.value.warranty_ids,
  section_ids: values.value.section_ids,
  ...(props.includeMandatoryUnit ? { mandatory_unit_ids: values.value.mandatory_unit_ids } : {}),
  data_from: values.value.data_from,
  data_to: values.value.data_to,
}));

watch(
  nonTextFilterSlice,
  () => emitIfReady(),
  { deep: true }
);
</script>

<template>
  <span class="sr-only" aria-hidden="true" />
</template>
