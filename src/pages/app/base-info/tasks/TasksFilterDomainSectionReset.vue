<script setup lang="ts">
import { watch } from 'vue';
import { useFormContext, useFormValues } from 'vee-validate';

/** وقتی حوزه (`standard_id`) عوض می‌شود، موضوع‌های انتخاب‌شده (`section_ids`) خالی می‌شود */
const values = useFormValues();
const { setFieldValue } = useFormContext();

let prevDomain = '';

watch(
  () => String(values.value.standard_id ?? ''),
  (next) => {
    if (prevDomain !== '' && prevDomain !== next) {
      setFieldValue('section_ids', [], false);
    }
    prevDomain = next;
  },
  { flush: 'post' }
);
</script>

<template>
  <span class="sr-only" aria-hidden="true" />
</template>
