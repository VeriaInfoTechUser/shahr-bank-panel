<script setup lang="ts">
import { useField } from 'vee-validate';
import Select from 'primevue/select';

const props = withDefaults(
  defineProps<{
    name: string;
    label?: string;
    options?: { value: unknown; label: string }[];
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
  }>(),
  { options: () => [], required: false, disabled: false }
);

const { value, errorMessage, handleBlur, handleChange } = useField(props.name);
</script>

<template>
  <div class="form-control w-full">
    <label v-if="label" class="label">
      <span class="label-text">{{ label }} <span v-if="required" class="text-error">*</span></span>
    </label>
    <Select
      v-model="value"
      :options="options"
      optionLabel="label"
      optionValue="value"
      :placeholder="placeholder"
      :disabled="disabled"
      class="select select-bordered w-full"
      :class="{ 'select-error': errorMessage }"
      @blur="handleBlur"
      @change="handleChange"
    />
    <label v-if="errorMessage" class="label">
      <span class="label-text-alt text-error">{{ errorMessage }}</span>
    </label>
  </div>
</template>
