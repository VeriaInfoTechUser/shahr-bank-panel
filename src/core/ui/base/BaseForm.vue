<script setup lang="ts">
import { Form, Field } from 'vee-validate';
import type { FieldSchema } from '../../form/validationBuilder';
import { buildValidationSchema } from '../../form/validationBuilder';

const props = withDefaults(
  defineProps<{
    schema: FieldSchema[];
    initialValues?: Record<string, unknown>;
    mode?: 'create' | 'edit';
    loading?: boolean;
  }>(),
  { initialValues: () => ({}), mode: 'create', loading: false }
);

const emit = defineEmits<{
  (e: 'submit', values: Record<string, unknown>): void;
  (e: 'reset'): void;
}>();

const validationSchema = buildValidationSchema(props.schema);

function onSubmit(values: Record<string, unknown>) {
  emit('submit', values);
}

function onReset() {
  emit('reset');
}
</script>

<template>
  <Form
    :validation-schema="validationSchema"
    :initial-values="initialValues"
    @submit="onSubmit"
    class="space-y-4"
  >
    <div v-for="field in schema" :key="field.name" class="form-control w-full">
      <Field :name="field.name" v-slot="{ field: fieldBag, errorMessage }">
        <label v-if="field.label" class="label">
          <span class="label-text">{{ field.label }} <span v-if="field.required" class="text-error">*</span></span>
        </label>
        <input
          v-if="field.type !== 'select'"
          v-bind="fieldBag"
          :type="field.type === 'textarea' ? 'text' : field.type || 'text'"
          class="input input-bordered w-full"
          :class="{ 'input-error': errorMessage }"
        />
        <select
          v-else
          v-bind="fieldBag"
          class="select select-bordered w-full"
          :class="{ 'select-error': errorMessage }"
        >
          <option value="">Select...</option>
          <option v-for="opt in field.options" :key="String(opt.value)" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <label v-if="errorMessage" class="label">
          <span class="label-text-alt text-error">{{ errorMessage }}</span>
        </label>
      </Field>
    </div>
    <slot name="custom-fields" />
    <div class="flex gap-2 mt-6">
      <slot name="actions">
        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ mode === 'create' ? 'Create' : 'Update' }}
        </button>
        <button type="button" class="btn btn-ghost" @click="onReset">Reset</button>
      </slot>
    </div>
  </Form>
</template>
