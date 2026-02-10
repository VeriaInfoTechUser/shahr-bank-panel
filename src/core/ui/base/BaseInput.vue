<script setup lang="ts">
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
  }>(),
  { type: 'text', required: false, disabled: false, rows: 3 }
);

const { value, errorMessage, handleBlur, handleChange } = useField(props.name);
</script>

<template>
  <div class="form-control w-full">
    <label v-if="label" class="label">
      <span class="label-text">{{ label }} <span v-if="required" class="text-error">*</span></span>
    </label>
    <InputText
      v-if="type !== 'textarea'"
      v-model="value"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      class="input input-bordered w-full"
      :class="{ 'input-error': errorMessage }"
      @blur="handleBlur"
      @input="handleChange"
    />
    <Textarea
      v-else
      v-model="value"
      :placeholder="placeholder"
      :disabled="disabled"
      :rows="rows"
      class="textarea textarea-bordered w-full"
      :class="{ 'textarea-error': errorMessage }"
      @blur="handleBlur"
      @input="handleChange"
    />
    <label v-if="errorMessage" class="label">
      <span class="label-text-alt text-error">{{ errorMessage }}</span>
    </label>
  </div>
</template>
