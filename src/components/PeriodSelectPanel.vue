<template>
  <div ref="rootRef" class="relative w-full">
    <!-- trigger -->
    <button
        type="button"
        class="inline-flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-darkmode-600 dark:bg-darkmode-800 dark:text-slate-200 dark:hover:bg-darkmode-700"
        @click="open = !open"
    >
      <span class="flex min-w-0 items-center gap-2">
        <Lucide icon="CalendarRange" class="h-4 w-4 flex-none text-slate-400" />
        <span class="truncate">{{ modelValue ? label : placeholder }}</span>
      </span>
      <Lucide
          icon="ChevronDown"
          class="h-4 w-4 flex-none text-slate-400 transition-transform"
          :class="{ 'rotate-180': open }"
      />
    </button>

    <!-- wizard panel -->
    <div
        v-if="open"
        class="absolute left-0 right-0 z-30 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-darkmode-600 dark:bg-darkmode-800"
    >
      <!-- step 1: period type -->
      <div class="flex gap-1 border-b border-slate-100 p-2 dark:border-darkmode-700">
        <button
            v-for="opt in typeOptions"
            :key="opt.type"
            type="button"
            class="flex-1 rounded-md px-2 py-1.5 text-[11px] font-semibold transition"
            :class="effectiveType === opt.type
              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'
              : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-darkmode-700'"
            @click="selectType(opt.type)"
        >{{ opt.label }}</button>
      </div>

      <!-- step 2: year -->
      <div class="flex flex-wrap gap-1 p-2">
        <button
            v-for="y in years"
            :key="y"
            type="button"
            class="rounded-full border px-2.5 py-1 text-[11px] font-medium transition"
            :class="year === y
              ? 'border-indigo-300 bg-indigo-50 text-indigo-600 dark:border-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400'
              : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-darkmode-600 dark:bg-darkmode-800 dark:text-slate-400 dark:hover:bg-darkmode-700'"
            @click="selectYear(y)"
        >{{ faYear(y) }}</button>
      </div>

      <!-- step 3a: quarter -->
      <div v-if="effectiveType === 'QUARTERLY'" class="grid grid-cols-4 gap-1 p-2 pt-0">
        <button
            v-for="q in 4"
            :key="q"
            type="button"
            class="rounded-lg border px-1 py-2 text-[11px] font-medium transition"
            :class="sub === q
              ? 'border-indigo-300 bg-indigo-50 text-indigo-600 dark:border-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400'
              : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-darkmode-600 dark:bg-darkmode-800 dark:text-slate-400 dark:hover:bg-darkmode-700'"
            @click="selectSub('QUARTERLY', q)"
        >{{ quarterLabel(q) }}</button>
      </div>

      <!-- step 3b: month -->
      <div v-else-if="effectiveType === 'MONTHLY'" class="grid grid-cols-4 gap-1 p-2 pt-0">
        <button
            v-for="m in 12"
            :key="m"
            type="button"
            class="rounded-lg border px-1 py-1.5 text-[11px] font-medium transition"
            :class="sub === m
              ? 'border-indigo-300 bg-indigo-50 text-indigo-600 dark:border-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400'
              : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-darkmode-600 dark:bg-darkmode-800 dark:text-slate-400 dark:hover:bg-darkmode-700'"
            @click="selectSub('MONTHLY', m)"
        >{{ pad2(m) }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import Lucide from '@/base-components/Lucide';
import { isPersianDigitLocale, toPersianDigits } from '@/utils/persianDigits';

/**
 * Compact period selector with a wizard-style dropdown panel.
 * No calendar — pick granularity → year → (quarter / month).
 *
 * Props:
 *   modelValue  — { type, startDate, endDate } | null (Gregorian ISO dates)
 *   label       — formatted text shown on the trigger button
 *   placeholder — shown when modelValue is null
 *   types       — allowed granularities (default ['YEARLY','QUARTERLY','MONTHLY'])
 *
 * Emits:
 *   update:modelValue — on every concrete selection
 */
const props = defineProps({
  modelValue: { type: Object, default: null },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  types: { type: Array as () => string[], default: () => ['YEARLY', 'QUARTERLY', 'MONTHLY'] },
});
const emit = defineEmits(['update:modelValue']);

const { t, locale } = useI18n();
const rootRef = ref<HTMLElement | null>(null);
const open = ref(false);

const type = ref('YEARLY');
const year = ref(new Date().getFullYear());
const sub = ref(1);

const typeOptions = computed(() =>
    props.types.map((tp) => ({
      type: tp,
      label:
          tp === 'YEARLY'
              ? t('reports.period-type.yearly')
              : tp === 'QUARTERLY'
                ? t('reports.period-type.quarterly')
                : t('reports.period-type.monthly'),
    })),
);

/** The granularity actually usable: falls back to the first allowed type (e.g. when types is locked). */
const effectiveType = computed(() => {
  if (props.types.length && !props.types.includes(type.value)) return props.types[0];
  return type.value;
});

/** بازه پیش‌فرض سال‌ها: ۱۲ سال قبل تا ۱ سال بعد (داده‌های قدیمی هم قابل انتخاب باشند). */
const years = computed<number[]>(() => {
  const cy = new Date().getFullYear();
  return Array.from({ length: 14 }, (_, i) => cy - 12 + i);
});

/** نمایش سال با ارقام فارسی در لوکال fa و لاتین در بقیه (بدون جداکننده هزارگان). */
function faYear(y: number): string {
  return isPersianDigitLocale(locale.value) ? toPersianDigits(y) : String(y);
}

function syncFromModel() {
  const v = props.modelValue as { type?: string; startDate?: string } | null;
  if (!v || !v.type) return;
  // Respect a locked `types` list: fall back to the first allowed granularity.
  type.value = props.types.length && !props.types.includes(v.type) ? props.types[0] : v.type;
  const m = /^(\d{4})-(\d{2})/.exec(String(v.startDate || ''));
  if (m) {
    year.value = Number(m[1]);
    const mm = Number(m[2]);
    sub.value = v.type === 'QUARTERLY' ? Math.floor((mm - 1) / 3) + 1 : mm;
  }
}
watch(() => props.modelValue, syncFromModel, { immediate: true });

const pad2 = (n: number) => String(n).padStart(2, '0');
const lastDayOfMonth = (y: number, m: number) => new Date(y, m, 0).getDate();

function buildPeriod(periodType: string, y: number, s: number) {
  if (periodType === 'YEARLY') return { type: 'YEARLY', startDate: `${y}-01-01`, endDate: `${y}-12-31` };
  if (periodType === 'QUARTERLY') {
    const fm = (s - 1) * 3 + 1;
    const lm = s * 3;
    return { type: 'QUARTERLY', startDate: `${y}-${pad2(fm)}-01`, endDate: `${y}-${pad2(lm)}-${pad2(lastDayOfMonth(y, lm))}` };
  }
  const m = Math.min(s, 12);
  return { type: 'MONTHLY', startDate: `${y}-${pad2(m)}-01`, endDate: `${y}-${pad2(m)}-${pad2(lastDayOfMonth(y, m))}` };
}

function emitPeriod(p: { type: string; startDate: string; endDate: string }) {
  emit('update:modelValue', p);
}

function selectType(tp: string) {
  if (!props.types.includes(tp)) return;
  type.value = tp;
  sub.value = 1;
  emitPeriod(buildPeriod(tp, year.value, 1));
}

function selectYear(y: number) {
  year.value = y;
  const tp = effectiveType.value;
  if (tp === 'YEARLY') {
    emitPeriod(buildPeriod('YEARLY', y, 1));
    open.value = false;
  } else {
    emitPeriod(buildPeriod(tp, y, sub.value));
  }
}

function selectSub(tp: string, s: number) {
  sub.value = s;
  emitPeriod(buildPeriod(tp, year.value, s));
  open.value = false;
}

const quarterLabel = (q: number) => `${t('reports.quarter')} ${q}`;

function onDocMouseDown(e: MouseEvent) {
  if (rootRef.value && !rootRef.value.contains(e.target as Node)) open.value = false;
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false;
}
onMounted(() => {
  document.addEventListener('mousedown', onDocMouseDown);
  document.addEventListener('keydown', onKey);
});
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocMouseDown);
  document.removeEventListener('keydown', onKey);
});
</script>
