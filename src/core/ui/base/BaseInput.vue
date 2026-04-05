<script setup lang="ts">
import { computed } from 'vue';
import { useField } from 'vee-validate';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_INDIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

/** ارقام فارسی/عربی را به لاتین؛ بقیهٔ نویسه‌ها دست‌نخورده (مثلاً + و فاصله). */
function normalizeDigitsToLatin(raw: string): string {
  let out = '';
  for (const ch of raw) {
    const pi = PERSIAN_DIGITS.indexOf(ch);
    if (pi >= 0) {
      out += String(pi);
      continue;
    }
    const ai = ARABIC_INDIC_DIGITS.indexOf(ch);
    if (ai >= 0) {
      out += String(ai);
      continue;
    }
    out += ch;
  }
  return out;
}

function latinDigitsToPersianDisplay(raw: string): string {
  if (!raw) return '';
  return raw.replace(/[0-9]/g, (d) => PERSIAN_DIGITS[Number(d)]);
}

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
    /**
     * در blur، فاصلهٔ ابتدا و انتهای مقدار حذف می‌شود تا فقط فاصلهٔ میانی حفظ شود.
     * برای `number` / `range` اعمال نمی‌شود.
     */
    trimOnBlur?: boolean;
    /** فقط روی فیلد ورودی؛ برای موبایل/ایمیل در UI راست‌به‌چپ بدون برهم‌زدن لیبل */
    inputDir?: 'ltr' | 'rtl' | 'auto';
    /**
     * `persian`: مقدار فرم و اعتبارسنجی همیشه لاتین؛ نمایش ورودی با ارقام فارسی.
     * برای شماره موبایل با کیبورد فارسی/انگلیسی.
     */
    digitDisplay?: 'none' | 'persian';
    /** لیبل کوچک‌تر (~۳۰٪ از text-sm)؛ مثلاً داخل کارت فیلتر */
    compactLabel?: boolean;
  }>(),
  {
    type: 'text',
    required: false,
    disabled: false,
    rows: 3,
    autofocus: false,
    trimOnBlur: true,
    inputDir: undefined,
    digitDisplay: 'none',
    compactLabel: false,
  }
);

const { value, errorMessage, handleBlur, setValue } = useField(props.name);

/** برای `digitDisplay="persian"`: نمایش فارسی، ذخیرهٔ لاتین در vee-validate */
const textFieldModel = computed({
  get() {
    const v = value.value;
    if (props.digitDisplay !== 'persian') {
      return v == null ? '' : String(v);
    }
    return typeof v === 'string' ? latinDigitsToPersianDisplay(v) : '';
  },
  set(next: string) {
    if (props.digitDisplay !== 'persian') {
      setValue(next, true);
      return;
    }
    setValue(normalizeDigitsToLatin(String(next ?? '')), true);
  },
});

const shouldTrimOnBlur = computed(() => {
  if (!props.trimOnBlur) return false;
  const t = props.type ?? 'text';
  if (t === 'number' || t === 'range') return false;
  return true;
});

function onBlurTrim(e: Event) {
  handleBlur(e);
  if (!shouldTrimOnBlur.value) return;
  const raw = value.value;
  if (typeof raw !== 'string') return;
  const next = raw.trim();
  if (next !== raw) {
    setValue(next, true);
  }
}

const textareaMinHeightClass = computed(() =>
  props.rows <= 2 ? 'min-h-[2.75rem]' : 'min-h-[4.5rem]'
);

const labelTextClass = computed(() =>
  props.compactLabel ? 'text-[0.6125rem]' : 'text-sm'
);
</script>

<template>
  <div
    class="form-control w-full"
    :data-autofocus-modal="autofocus ? '' : undefined"
  >
    <label v-if="label" class="label min-h-0 py-1">
      <span :class="['label-text', labelTextClass, 'font-normal leading-snug']">{{ label }} <span v-if="required" class="text-error">*</span></span>
    </label>
    <InputText
      v-if="type !== 'textarea'"
      v-model="textFieldModel"
      :type="type"
      :min="min"
      :max="max"
      :placeholder="placeholder"
      :disabled="disabled"
      :dir="inputDir"
      class="input input-bordered w-full !h-8 !min-h-0 py-1.5 px-2.5 text-xs font-light leading-snug placeholder:text-[0.65em] placeholder:font-light placeholder:text-slate-400 dark:placeholder:text-slate-500"
      :class="{ 'input-error': errorMessage }"
      :pt="autofocus ? { root: { autofocus: true } } : undefined"
      @blur="onBlurTrim"
    />
    <Textarea
      v-else
      v-model="textFieldModel"
      :placeholder="placeholder"
      :disabled="disabled"
      :rows="rows"
      :dir="inputDir"
      class="textarea textarea-bordered w-full !min-h-0 py-1.5 px-2.5 text-xs font-light leading-snug placeholder:text-[0.65em] placeholder:font-light placeholder:text-slate-400 dark:placeholder:text-slate-500"
      :class="[textareaMinHeightClass, { 'textarea-error': errorMessage }]"
      :pt="autofocus ? { root: { autofocus: true } } : undefined"
      @blur="onBlurTrim"
    />
    <label v-if="errorMessage" class="label min-h-0 py-0 pt-0.5">
      <span class="label-text-alt text-error text-xs">{{ errorMessage }}</span>
    </label>
  </div>
</template>
