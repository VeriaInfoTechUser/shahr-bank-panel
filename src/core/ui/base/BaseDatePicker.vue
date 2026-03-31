<script setup lang="ts">
import { computed } from 'vue';
import { useField } from 'vee-validate';
import { useI18n } from 'vue-i18n';
import Vue3PersianDatetimePicker from 'vue3-persian-datetime-picker';

type ModelValue = string | null | undefined;

const props = withDefaults(
  defineProps<{
    name: string;
    label?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
  }>(),
  {
    required: false,
    disabled: false,
  }
);

const { value: fieldValue, errorMessage, handleBlur, setValue } = useField<ModelValue>(props.name);
const { locale } = useI18n();

const isFa = computed(() => String(locale.value).startsWith('fa'));

// مقدار داخلی پیکر، همیشه میلادی YYYY-MM-DD (برای سازگاری با API)
const pickerValue = computed({
  get: () => (fieldValue.value as string | null) ?? '',
  set: (v: string | null | undefined) => {
    setValue((v ?? '') as ModelValue);
  },
});
</script>

<template>
  <div class="form-control w-full">
    <label v-if="label" class="label min-h-0 py-1">
      <span class="label-text text-sm font-normal leading-snug">
        {{ label }}
        <span v-if="required" class="text-error">*</span>
      </span>
    </label>
    <Vue3PersianDatetimePicker
      v-model="pickerValue"
      type="date"
      :format="'YYYY-MM-DD'"
      :display-format="isFa ? 'jYYYY/jMM/jDD' : 'YYYY-MM-DD'"
      :locale="isFa ? 'fa' : 'en'"
      :auto-submit="true"
      :input-class="`input input-bordered w-full !h-8 !min-h-0 py-1.5 px-2.5 text-xs font-light leading-snug${
        errorMessage ? ' input-error' : ''
      }`"
      :placeholder="
        placeholder ||
        (isFa ? 'مثلاً ۱۴۰۳/۰۱/۱۵' : 'YYYY-MM-DD')
      "
      :disabled="disabled"
      @blur="handleBlur"
    />
    <label v-if="errorMessage" class="label min-h-0 py-0 pt-0.5">
      <span class="label-text-alt text-error text-xs">{{ errorMessage }}</span>
    </label>
  </div>
</template>


