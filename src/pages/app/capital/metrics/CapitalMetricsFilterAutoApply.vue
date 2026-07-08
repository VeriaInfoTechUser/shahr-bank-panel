<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';
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
</script>

<template>
  <span class="sr-only" aria-hidden="true" />
</template>
