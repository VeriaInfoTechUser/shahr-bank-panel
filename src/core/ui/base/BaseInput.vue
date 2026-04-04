<script setup lang="ts">
import { computed } from 'vue';
import { useField } from 'vee-validate';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';

const props = withDefaults(
  defineProps<{
    name: string;
    label?: string;
    type?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    rows?: number;
    autofocus?: boolean;
    min?: number | string;
    max?: number | string;
  }>(),
  { type: 'text', required: false, disabled: false, rows: 3, autofocus: false }
);

const { value, errorMessage, handleBlur, handleChange } = useField(props.name);

const textareaMinHeightClass = computed(() =>
  props.rows <= 2 ? 'min-h-[2.75rem]' : 'min-h-[4.5rem]'
);
</script>

<template>
  <div
    class="form-control w-full"
    :data-autofocus-modal="autofocus ? '' : undefined"
  >
    <label v-if="label" class="label min-h-0 py-1">
      <span class="label-text text-sm font-normal leading-snug">{{ label }} <span v-if="required" class="text-error">*</span></span>
    </label>
    <InputText
      v-if="type !== 'textarea'"
      v-model="value"
      :type="type"
      :min="min"
      :max="max"
      :placeholder="placeholder"
      :disabled="disabled"
      class="input input-bordered w-full !h-8 !min-h-0 py-1.5 px-2.5 text-xs font-light leading-snug placeholder:font-light placeholder:text-slate-400 dark:placeholder:text-slate-500"
      :class="{ 'input-error': errorMessage }"
      :pt="autofocus ? { root: { autofocus: true } } : undefined"
      @blur="handleBlur"
      @input="handleChange"
    />
    <Textarea
      v-else
      v-model="value"
      :placeholder="placeholder"
      :disabled="disabled"
      :rows="rows"
      class="textarea textarea-bordered w-full !min-h-0 py-1.5 px-2.5 text-xs font-light leading-snug placeholder:font-light placeholder:text-slate-400 dark:placeholder:text-slate-500"
      :class="[textareaMinHeightClass, { 'textarea-error': errorMessage }]"
      :pt="autofocus ? { root: { autofocus: true } } : undefined"
      @blur="handleBlur"
      @input="handleChange"
    />
    <label v-if="errorMessage" class="label min-h-0 py-0 pt-0.5">
      <span class="label-text-alt text-error text-xs">{{ errorMessage }}</span>
    </label>
  </div>
</template>
