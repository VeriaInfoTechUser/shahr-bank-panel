<script setup lang="ts">
import { computed } from 'vue';
import { useField } from 'vee-validate';
import { useI18n } from 'vue-i18n';
import Slider from 'primevue/slider';

const R_MIN = 1;
const R_MAX = 25;

const { t } = useI18n();

const { value: minRef, setValue: setMin } = useField<number>('min_risk');
const { value: maxRef, setValue: setMax } = useField<number>('max_risk');

function clampInt(n: number): number {
  if (!Number.isFinite(n)) return R_MIN;
  return Math.min(R_MAX, Math.max(R_MIN, Math.trunc(n)));
}

const sliderModel = computed<[number, number]>({
  get() {
    const a = clampInt(Number(minRef.value ?? R_MIN));
    const b = clampInt(Number(maxRef.value ?? R_MAX));
    return [Math.min(a, b), Math.max(a, b)];
  },
  set(next) {
    if (Array.isArray(next) && next.length >= 2) {
      const lo = clampInt(Number(next[0]));
      const hi = clampInt(Number(next[1]));
      setMin(Math.min(lo, hi));
      setMax(Math.max(lo, hi));
    }
  },
});

/** موقعیت افقی هر دسته روی مسیر (۰…۱۰۰٪) برای تراز با Prime Slider */
function valueToLeftPercent(v: number): number {
  const c = clampInt(v);
  if (R_MAX === R_MIN) return 0;
  return ((c - R_MIN) / (R_MAX - R_MIN)) * 100;
}

const lo = computed(() => sliderModel.value[0]);
const hi = computed(() => sliderModel.value[1]);

const leftHandleLeftPct = computed(() => valueToLeftPercent(lo.value));
const rightHandleLeftPct = computed(() => valueToLeftPercent(hi.value));
</script>

<template>
  <div class="w-full pt-0.5">
    <label
      class="mb-1 block text-[13px] font-medium text-slate-700 dark:text-slate-200"
      for="risk-intensity-range"
    >
      {{ t('risk-operations.filter-risk-intensity-range') }}
    </label>

    <div class="mt-3 px-0.5 pb-1" dir="ltr">
      <div class="relative isolate w-full">
        <Slider
          id="risk-intensity-range"
          v-model="sliderModel"
          class="relative z-0 w-full"
          :min="R_MIN"
          :max="R_MAX"
          :step="1"
          range
          :aria-label="t('risk-operations.filter-risk-intensity-range')"
        />
        <!-- مرکز عمودی = محور پوینتر؛ کادر روی دسته (pointer-events-none برای درگ) -->
        <template v-if="lo === hi">
          <span
            class="pointer-events-none absolute top-1/2 z-20 flex h-6 w-6 shrink-0 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-[11px] font-bold tabular-nums leading-none text-slate-900 shadow-md ring-1 ring-black/5 dark:border-darkmode-500 dark:bg-darkmode-700 dark:text-slate-50 dark:ring-white/10"
            :style="{ left: `${leftHandleLeftPct}%` }"
          >
            {{ lo }}
          </span>
        </template>
        <template v-else>
          <span
            class="pointer-events-none absolute top-1/2 z-20 flex h-6 w-6 shrink-0 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-[11px] font-bold tabular-nums leading-none text-slate-900 shadow-md ring-1 ring-black/5 dark:border-darkmode-500 dark:bg-darkmode-700 dark:text-slate-50 dark:ring-white/10"
            :style="{ left: `${leftHandleLeftPct}%` }"
          >
            {{ lo }}
          </span>
          <span
            class="pointer-events-none absolute top-1/2 z-30 flex h-6 w-6 shrink-0 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-[11px] font-bold tabular-nums leading-none text-slate-900 shadow-md ring-1 ring-black/5 dark:border-darkmode-500 dark:bg-darkmode-700 dark:text-slate-50 dark:ring-white/10"
            :style="{ left: `${rightHandleLeftPct}%` }"
          >
            {{ hi }}
          </span>
        </template>
      </div>
      <div
        class="mt-1.5 flex w-full justify-between text-[11px] font-medium tabular-nums text-slate-500 dark:text-slate-400"
      >
        <span>{{ R_MIN }}</span>
        <span>{{ R_MAX }}</span>
      </div>
    </div>
  </div>
</template>
