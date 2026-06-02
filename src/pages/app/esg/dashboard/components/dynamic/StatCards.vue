<script setup lang="ts">
import { computed } from 'vue';
import type { DashboardSection, StatItem } from '../../types';
import { formatValueWithUnit, resolveText, statusClasses, statusFromValue } from '../../dashboardUtils';

const props = defineProps<{
  section: DashboardSection;
  translate?: (key: string) => string;
}>();

const items = computed(() => (props.section.items ?? []) as StatItem[]);
</script>

<template>
  <section class="rounded-lg border border-slate-200/80 bg-white p-5 shadow-sm dark:border-darkmode-600 dark:bg-darkmode-800">
    <h2 class="text-base font-semibold text-slate-900 dark:text-slate-50">
      {{ resolveText(section.title, translate) }}
    </h2>

    <div class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <article
        v-for="item in items"
        :key="item.title"
        class="rounded-lg border p-4"
        :class="statusClasses(statusFromValue(item.value, item.status))"
      >
        <p class="text-sm font-medium opacity-80">
          {{ item.title}}
        </p>
        <strong class="mt-3 block text-2xl font-semibold">
          {{ formatValueWithUnit(item.value, item.unit) }}
        </strong>
        <p v-if="item.description" class="mt-2 text-xs opacity-75">
          {{ item.description}}
        </p>
      </article>
    </div>
  </section>
</template>
