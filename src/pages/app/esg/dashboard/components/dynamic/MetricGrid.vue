<script setup lang="ts">
import KpiCard from './KpiCard.vue';
import type { DashboardSection, MetricItem } from '../../types';
import { resolveText } from '../../dashboardUtils';

defineProps<{
  section: DashboardSection;
  translate?: (key: string) => string;
}>();
</script>

<template>
  <section class="rounded-lg border border-slate-200/80 bg-slate-50/70 p-4 dark:border-darkmode-600 dark:bg-darkmode-900/20">
    <div class="mb-4 flex items-center justify-between gap-3">
      <h2 class="text-base font-semibold text-slate-900 dark:text-slate-50">
        {{ resolveText(section.title, translate) }}
      </h2>
    </div>

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        v-for="item in (section.items as MetricItem[])"
        :key="item.metricCode || item.title"
        :item="item"
        :translate="translate"
      />
    </div>
  </section>
</template>
