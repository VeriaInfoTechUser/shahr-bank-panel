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

function onChange(event: { value: unknown }) {
  handleChange(event.value);
}
</script>

<template>
  <div class="form-control w-full">
    <label v-if="label" class="label min-h-0 py-1">
      <span class="label-text text-sm font-normal leading-snug">{{ label }} <span v-if="required" class="text-error">*</span></span>
    </label>
    <Select
      v-model="value"
      :options="options"
      optionLabel="label"
      optionValue="value"
      :placeholder="placeholder"
      :disabled="disabled"
      class="select select-bordered w-full !h-8 !min-h-0 pl-0.5 ps-0 text-xs font-light leading-snug [&_.p-select-label]:flex [&_.p-select-label]:items-center [&_.p-select-label]:pl-0 [&_.p-select-label]:text-xs [&_.p-select-label]:font-light [&_.p-select-label.p-placeholder]:text-slate-400 dark:[&_.p-select-label.p-placeholder]:text-slate-500"
      :class="{ 'select-error': errorMessage }"
      @blur="handleBlur"
      @change="onChange"
    />
    <label v-if="errorMessage" class="label min-h-0 py-0 pt-0.5">
      <span class="label-text-alt text-error text-xs">{{ errorMessage }}</span>
    </label>
  </div>
</template>
