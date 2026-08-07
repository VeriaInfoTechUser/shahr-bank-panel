<script setup lang="ts">
import { computed } from 'vue';
import { useField } from 'vee-validate';
import MultiSelect from 'primevue/multiselect';

const props = withDefaults(
  defineProps<{
    name: string;
    label?: string;
    options?: { value: unknown; label: string }[];
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    /** لیبل کوچک‌تر (~۳۰٪ از text-sm)؛ مثلاً داخل کارت فیلتر */
    compactLabel?: boolean;
  }>(),
  { options: () => [], required: false, disabled: false, compactLabel: false }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: unknown): void;
  (e: 'change', value: unknown): void;
}>();

const { value, errorMessage, handleBlur, handleChange } = useField<string[]>(() => props.name);

const multiPanelStyle = {
  maxWidth: 'min(calc(100vw - 2rem), 42rem)',
  boxSizing: 'border-box' as const,
};

function onUpdate(v: unknown) {
  const next = Array.isArray(v) ? v : [];
  handleChange(next);
  emit('update:modelValue', next);
  emit('change', next);
}

const labelTextClass = computed(() =>
  props.compactLabel ? 'text-[0.6125rem]' : 'text-sm'
);
</script>

<template>
  <div class="form-control w-full base-multiselect-wrap">
    <label v-if="label" class="label min-h-0 py-1">
      <span :class="['label-text', labelTextClass, 'font-normal leading-snug']">{{ label }} <span v-if="required" class="text-error">*</span></span>
    </label>
    <MultiSelect
      :model-value="value ?? []"
      :options="options"
      option-label="label"
      option-value="value"
      display="chip"
      :placeholder="placeholder"
      :disabled="disabled"
      append-to="body"
      panel-class="base-multiselect-overlay-panel"
      :panel-style="multiPanelStyle"
      class="base-multiselect-trigger select select-bordered w-full !h-8 !min-h-0 !max-h-8 py-0 pl-0.5 ps-0 text-xs font-light leading-snug [&_.p-multiselect-label]:text-xs [&_.p-multiselect-label]:font-light [&_.p-multiselect-label]:items-center [&_.p-placeholder]:text-text-muted dark:[&_.p-placeholder]:text-text-secondary"
      :class="{ 'select-error': errorMessage }"
      :filter="options.length > 6"
      @blur="handleBlur"
      @update:model-value="onUpdate"
    />
    <label v-if="errorMessage" class="label min-h-0 py-0 pt-0.5">
      <span class="label-text-alt text-error text-xs">{{ errorMessage }}</span>
    </label>
  </div>
</template>

<style scoped>
.base-multiselect-wrap {
  position: relative;
  min-width: 0;
}

.base-multiselect-trigger {
  position: relative;
  width: 100%;
  max-width: 100%;
  min-height: 2rem !important;
  height: 2rem !important;
  max-height: 2rem !important;
  align-items: center;
}

.base-multiselect-trigger :deep(.p-multiselect-label) {
  min-height: 0;
  max-height: 2rem;
  overflow: hidden;
  flex-wrap: nowrap;
  gap: 0.125rem;
}

.base-multiselect-trigger :deep(.p-multiselect-label-container) {
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
}

.base-multiselect-trigger :deep(.p-multiselect-dropdown) {
  flex-shrink: 0;
}

.base-multiselect-trigger :deep(.p-chip) {
  max-height: 1.5rem;
  padding-block: 0;
  padding-inline: 0.35rem;
  font-size: 0.75rem;
  line-height: 1.25;
}

.base-multiselect-trigger :deep(.p-chip-label) {
  max-width: 6rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

</style>

<style>
.base-multiselect-overlay-panel.p-multiselect-overlay {
  box-sizing: border-box;
  z-index: 1200 !important;
}

.base-multiselect-overlay-panel .p-multiselect-option {
  white-space: normal;
  word-break: break-word;
  overflow-wrap: anywhere;
  align-items: flex-start;
  min-height: auto;
}

.base-multiselect-overlay-panel .p-multiselect-header .p-iconfield {
  min-height: 0;
  align-items: center;
}

.base-multiselect-overlay-panel .p-multiselect-filter,
.base-multiselect-overlay-panel .p-multiselect-header .p-inputtext,
.base-multiselect-overlay-panel .p-multiselect-header input {
  min-height: 0 !important;
  height: 2rem !important;
  padding-block: 0.375rem !important;
  padding-inline: 0.625rem !important;
  font-size: 0.75rem !important;
  line-height: 1.375 !important;
  font-weight: 300 !important;
}
</style>
