<script setup lang="ts">
import { watch } from 'vue';
import { useForm } from 'vee-validate';

const props = defineProps<{
  validDomainValues: string[];
}>();

const { values, setFieldValue } = useForm();

watch(
  () => props.validDomainValues,
  (valid) => {
    const current = values.domainSlug as string[] | undefined;
    if (!current?.length) return;
    const validSet = new Set(valid);
    const cleaned = current.filter((d: string) => validSet.has(d));
    if (cleaned.length !== current.length) {
      setFieldValue('domainSlug', cleaned);
    }
  },
  { deep: true }
);
</script>

<template>
  <span class="sr-only" aria-hidden="true" />
</template>
