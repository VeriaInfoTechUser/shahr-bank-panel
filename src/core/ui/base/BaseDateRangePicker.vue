<script setup lang="ts">
import { computed, toRef } from 'vue';
import { useField } from 'vee-validate';
import { useI18n } from 'vue-i18n';
import Vue3PersianDatetimePicker from 'vue3-persian-datetime-picker';

/** خروجی پیکر در حالت range: آرایهٔ رشتهٔ YYYY-MM-DD (میلادی برای API) */
type PickerModel = string[];

const props = withDefaults(
  defineProps<{
    nameFrom: string;
    nameTo: string;
    label?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    compactLabel?: boolean;
  }>(),
  {
    required: false,
    disabled: false,
    compactLabel: false,
  }
);

const { value: fromVal, errorMessage: errFrom, handleBlur: blurFrom, setValue: setFrom } =
  useField<string>(toRef(props, 'nameFrom'));
const { value: toVal, errorMessage: errTo, handleBlur: blurTo, setValue: setTo } =
  useField<string>(toRef(props, 'nameTo'));

const { locale } = useI18n();

const DATE_PICKER_ACCENT = 'rgb(var(--color-primary) / 1)';

const isFa = computed(() => String(locale.value).startsWith('fa'));

const resolvedPlaceholder = computed(() => {
  if (props.placeholder !== undefined) {
    return props.placeholder;
  }
  return isFa.value ? 'مثلاً ۱۴۰۳/۰۱/۰۱ تا ۱۴۰۳/۰۱/۳۱' : 'YYYY-MM-DD — YYYY-MM-DD';
});

const pickerValue = computed<PickerModel>({
  get() {
    const a = String(fromVal.value ?? '').trim();
    const b = String(toVal.value ?? '').trim();
    if (!a && !b) return [];
    if (a && b) return [a, b];
    if (a) return [a];
    return [b];
  },
  set(v) {
    if (!Array.isArray(v)) {
      setFrom('');
      setTo('');
      return;
    }
    const toStr = (x: unknown) => {
      if (x == null || x === '') return '';
      if (x instanceof Date) {
        const y = x.getFullYear();
        const m = String(x.getMonth() + 1).padStart(2, '0');
        const d = String(x.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
      return String(x).trim();
    };
    setFrom(toStr(v[0]));
    setTo(toStr(v[1]));
  },
});

const errorMessage = computed(() => errFrom.value || errTo.value);

const labelTextClass = computed(() =>
  props.compactLabel ? 'text-[0.6125rem]' : 'text-sm'
);

function onBlur() {
  void blurFrom();
  void blurTo();
}
</script>

<template>
  <div class="form-control w-full">
    <label v-if="label" class="label min-h-0 py-1">
      <span :class="['label-text', labelTextClass, 'font-normal leading-snug']">
        {{ label }}
        <span v-if="required" class="text-error">*</span>
      </span>
    </label>
    <Vue3PersianDatetimePicker
      v-model="pickerValue"
      type="date"
      range
      :color="DATE_PICKER_ACCENT"
      :format="'YYYY-MM-DD'"
      :display-format="isFa ? 'jYYYY/jMM/jDD' : 'YYYY-MM-DD'"
      :locale="isFa ? 'fa' : 'en'"
      :auto-submit="true"
      :input-class="`input input-bordered w-full !h-8 !min-h-0 py-1.5 px-2.5 text-xs font-light leading-snug${
        errorMessage ? ' input-error' : ''
      }`"
      :placeholder="resolvedPlaceholder"
      :disabled="disabled"
      @blur="onBlur"
    />
    <label v-if="errorMessage" class="label min-h-0 py-0 pt-0.5">
      <span class="label-text-alt text-error text-xs">{{ errorMessage }}</span>
    </label>
  </div>
</template>
