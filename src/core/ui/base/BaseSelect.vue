<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useField } from 'vee-validate';
import Select from 'primevue/select';

const props = withDefaults(
  defineProps<{
    name: string;
    label?: string;
    options?: { value: unknown; label: string; subtitle?: string }[];
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    /** فیلتر متنی روی گزینه‌های همین لیست (لوکال، بدون درخواست سرور) */
    filter?: boolean;
    /** اگر ندهید، از متن عمومی `general.select-filter-placeholder` استفاده می‌شود */
    filterPlaceholder?: string;
    /** پیش‌فرض PrimeVue: `contains` */
    filterMatchMode?: string;
    /** با بستن پنل، متن جستجو پاک شود */
    resetFilterOnHide?: boolean;
    /** لیبل کوچک‌تر (~۳۰٪ از text-sm)؛ مثلاً داخل کارت فیلتر */
    compactLabel?: boolean;
  }>(),
  {
    options: () => [],
    required: false,
    disabled: false,
    filter: false,
    filterMatchMode: 'contains',
    resetFilterOnHide: true,
    compactLabel: false,
  }
);

const { t } = useI18n();

const resolvedFilterPlaceholder = computed(() =>
  props.filterPlaceholder ?? t('general.select-filter-placeholder')
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: unknown): void;
  (e: 'change', value: unknown): void;
}>();

const { value, errorMessage, handleBlur, handleChange } = useField(props.name);

/** پنل با appendTo=body به document می‌رود؛ عرض و شکستن خط با کلاس panel اعمال می‌شود */
const selectPanelStyle = {
  maxWidth: 'min(calc(100vw - 2rem), 42rem)',
  boxSizing: 'border-box' as const,
};

function onChange(event: { value: unknown }) {
  handleChange(event.value);
  emit('update:modelValue', event.value);
  emit('change', event.value);
}

const labelTextClass = computed(() =>
  props.compactLabel ? 'text-[0.6125rem]' : 'text-sm'
);
</script>

<template>
  <div class="form-control w-full">
    <label v-if="label" class="label min-h-0 py-1">
      <span :class="['label-text', labelTextClass, 'font-normal leading-snug']">{{ label }} <span v-if="required" class="text-error">*</span></span>
    </label>
    <Select
      v-model="value"
      :options="options"
      optionLabel="label"
      optionValue="value"
      :placeholder="placeholder"
      :disabled="disabled"
      :filter="filter"
      :filter-placeholder="filter ? resolvedFilterPlaceholder : undefined"
      :filter-match-mode="filterMatchMode"
      :reset-filter-on-hide="resetFilterOnHide"
      :auto-filter-focus="filter"
      append-to="body"
      scroll-height="16rem"
      panel-class="base-select-overlay-panel"
      :panel-style="selectPanelStyle"
      class="base-select-trigger select select-bordered w-full !h-8 !min-h-0 pl-0.5 ps-0 text-xs font-light leading-snug [&_.p-select-label]:flex [&_.p-select-label]:items-center [&_.p-select-label]:pl-0 [&_.p-select-label]:text-xs [&_.p-select-label]:font-light [&_.p-select-label.p-placeholder]:text-text-muted dark:[&_.p-select-label.p-placeholder]:text-text-secondary"
      :class="{ 'select-error': errorMessage }"
      @blur="handleBlur"
      @change="onChange"
    >
      <template #option="{ option }">
        <div class="flex flex-col">
          <span>{{ option.label }}</span>
          <span v-if="option.subtitle" class="text-[10px] font-light text-text-muted dark:text-text-muted">{{ option.subtitle }}</span>
        </div>
      </template>
    </Select>
    <label v-if="errorMessage" class="label min-h-0 py-0 pt-0.5">
      <span class="label-text-alt text-error text-xs">{{ errorMessage }}</span>
    </label>
  </div>
</template>

<style scoped>
.base-select-trigger {
  position: relative;
  width: 100%;
  max-width: 100%;
}
</style>

<!-- پنل به body پورت می‌شود؛ سلکتور scoped به آن نمی‌رسد -->
<style>
/* بالای دیالوگ/کارت فیلتر (مثلاً z≈1100) تا آیتم‌ها دیده شوند */
.base-select-overlay-panel.p-select-overlay {
  box-sizing: border-box;
  z-index: 1200 !important;
}

.base-select-overlay-panel .p-select-option {
  white-space: normal;
  word-break: break-word;
  overflow-wrap: anywhere;
  align-items: flex-start;
  min-height: auto;
}

.base-select-overlay-panel .p-select-option-label {
  white-space: normal;
  word-break: break-word;
  line-height: 1.35;
}

.base-select-overlay-panel .p-select-header {
  padding: 0.35rem 0.5rem;
  min-height: 0;
}

.base-select-overlay-panel .p-select-header .p-iconfield {
  min-height: 0;
  align-items: center;
}

.base-select-overlay-panel .p-select-header .p-select-filter,
.base-select-overlay-panel .p-select-header .p-inputtext,
.base-select-overlay-panel .p-select-header input {
  min-height: 0 !important;
  height: 2rem !important;
  padding-block: 0.375rem !important;
  padding-inline: 0.625rem !important;
  font-size: 0.75rem !important;
  line-height: 1.375 !important;
  font-weight: 300 !important;
}

.base-select-overlay-panel .p-select-header .p-inputicon {
  width: 1.75rem;
}

.base-select-overlay-panel .p-select-header .p-inputicon .p-icon {
  width: 0.875rem;
  height: 0.875rem;
}
</style>
