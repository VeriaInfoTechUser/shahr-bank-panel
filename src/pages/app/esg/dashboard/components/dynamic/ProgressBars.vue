<script setup lang="ts">
import { computed } from 'vue';
import type { DashboardSection, ProgressItem } from '../../types';
import { formatValueWithUnit, normalizePercent, resolveText, statusClasses, statusFromValue } from '../../dashboardUtils';

const props = defineProps<{
  section: DashboardSection;
  translate?: (key: string) => string;
}>();

const items = computed(() => (props.section.items ?? []) as ProgressItem[]);
</script>

<template>
  <section class="rounded-lg border border-slate-200/80 bg-white p-5 shadow-sm dark:border-darkmode-600 dark:bg-darkmode-800">
    <h2 class="text-base font-semibold text-slate-900 dark:text-slate-50">
      {{ resolveText(section.title, translate) }}
    </h2>

    <div class="mt-5 space-y-4">
      <article
        v-for="item in items"
        :key="item.label || item.title"
        class="rounded-lg border border-slate-200/80 p-4 dark:border-darkmode-600"
      >
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div class="min-w-0">
            <h3 class="text-sm font-semibold leading-6 text-slate-900 dark:text-slate-50">
              {{ resolveText(item.label || item.title, translate) }}
            </h3>
            <p v-if="item.secondaryValue !== undefined" class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              تکمیل داده: {{ formatValueWithUnit(item.secondaryValue, item.unit) }}
            </p>
          </div>

          <span
            class="w-fit rounded-full border px-2.5 py-1 text-xs font-semibold"
            :class="statusClasses(statusFromValue(item.value, item.status))"
          >
            {{ formatValueWithUnit(item.value, item.unit) }}
          </span>
        </div>

        <div class="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-darkmode-700">
          <div
            class="h-full rounded-full bg-emerald-500"
            :style="{ width: `${normalizePercent(item.value)}%` }"
          />
        </div>

        <div v-if="item.keyMetrics?.length" class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div
            v-for="metric in item.keyMetrics"
            :key="metric.title"
            class="rounded-lg bg-slate-50 px-3 py-2 dark:bg-darkmode-700/50"
          >
            <p class="line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
              {{ resolveText(metric.title, translate) }}
            </p>
            <strong class="mt-1 block text-sm font-semibold text-slate-900 dark:text-slate-50">
              {{ formatValueWithUnit(metric.value, metric.unit, metric.type) }}
            </strong>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>
