<script setup lang="ts">
import { computed } from 'vue';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-vue-next';
import type { MetricItem, ScoreCard } from '../../types';
import {
  formatNumber,
  formatValueWithUnit,
  normalizePercent,
  resolveText,
  statusClasses,
  statusFromValue,
} from '../../dashboardUtils';

const props = withDefaults(defineProps<{
  item: MetricItem | ScoreCard;
  translate?: (key: string) => string;
  compact?: boolean;
}>(), {
  compact: false,
});

const title = computed(() => resolveText(props.item.title, props.translate));
const value = computed(() => Number(props.item.value ?? 0));
const unit = computed(() => props.item.unit || ('answerUnit' in props.item ? props.item.answerUnit : ''));
const answerType = computed(() => ('answerType' in props.item ? props.item.answerType : undefined));
const isPercent = computed(() => (
  unit.value === '%'
  || unit.value === 'percent'
  || unit.value === 'percentage'
  || answerType.value === 'percentage'
  || ('chartType' in props.item && props.item.chartType === 'gauge')
));
const percent = computed(() => normalizePercent(value.value));
const status = computed(() => statusFromValue(props.item.value, 'status' in props.item ? props.item.status : undefined));
const change = computed(() => props.item.change);
const isPositiveChange = computed(() => String(change.value ?? '').trim().startsWith('+'));
const isNegativeChange = computed(() => String(change.value ?? '').trim().startsWith('-'));
const displayValue = computed(() => (
  isPercent.value
    ? formatValueWithUnit(props.item.value, unit.value, answerType.value)
    : formatValueWithUnit(props.item.value, unit.value, answerType.value)
));
const progressStyle = computed(() => ({
  background: `conic-gradient(#10b981 ${percent.value * 3.6}deg, rgba(148, 163, 184, 0.18) 0deg)`,
}));
</script>

<template>
  <article
    class="min-h-[132px] rounded-lg border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-darkmode-600 dark:bg-darkmode-800"
  >
    <div class="flex h-full items-start justify-between gap-4">
      <div class="min-w-0 flex-1">
        <p class="line-clamp-2 text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
          {{ title }}
        </p>

        <div class="mt-3 flex flex-wrap items-end gap-x-2 gap-y-1">
          <strong class="text-2xl font-semibold leading-none text-slate-900 dark:text-slate-50">
            {{ displayValue }}
          </strong>
          <span
            v-if="change"
            class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold"
            :class="isPositiveChange
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
              : isNegativeChange
                ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300'
                : 'border-slate-200 bg-slate-50 text-slate-500 dark:border-darkmode-600 dark:bg-darkmode-700 dark:text-slate-300'"
          >
            <ArrowUpRight v-if="isPositiveChange" class="h-3.5 w-3.5" />
            <ArrowDownRight v-else-if="isNegativeChange" class="h-3.5 w-3.5" />
            <Minus v-else class="h-3.5 w-3.5" />
            {{ change }}
          </span>
        </div>

        <span
          v-if="'status' in item && item.status"
          class="mt-3 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold"
          :class="statusClasses(status)"
        >
          {{ item.status }}
        </span>
      </div>

      <div
        v-if="isPercent"
        class="grid h-16 w-16 shrink-0 place-items-center rounded-full p-1"
        :style="progressStyle"
        aria-hidden="true"
      >
        <div class="grid h-full w-full place-items-center rounded-full bg-white text-xs font-semibold text-slate-700 dark:bg-darkmode-800 dark:text-slate-200">
          {{ formatNumber(percent, 'fa-IR', 0) }}%
        </div>
      </div>
    </div>
  </article>
</template>
