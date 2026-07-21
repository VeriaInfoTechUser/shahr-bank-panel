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

watch(
  () => ({
    capitalSlug: Array.isArray(values.value.capitalSlug) ? [...values.value.capitalSlug] : values.value.capitalSlug,
    domainSlug: Array.isArray(values.value.domainSlug) ? [...values.value.domainSlug] : values.value.domainSlug,
    componentSlug: Array.isArray(values.value.componentSlug) ? [...values.value.componentSlug] : values.value.componentSlug,
    capabilitySlug: Array.isArray(values.value.capabilitySlug) ? [...values.value.capabilitySlug] : values.value.capabilitySlug,
    claimSlug: Array.isArray(values.value.claimSlug) ? [...values.value.claimSlug] : values.value.claimSlug,
    indicatorSlug: Array.isArray(values.value.indicatorSlug) ? [...values.value.indicatorSlug] : values.value.indicatorSlug,
  }),
  () => emitIfReady(),
  { deep: true }
);
</script>

<template>
  <span class="sr-only" aria-hidden="true" />
</template>
