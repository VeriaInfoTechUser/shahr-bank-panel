<script setup lang="ts">
import { computed } from 'vue';
import { CheckCircle2, CircleDot, Clock3 } from 'lucide-vue-next';
import type { ActivityItem, DashboardSection } from '../../types';
import { resolveText, statusClasses, statusFromValue } from '../../dashboardUtils';

const props = defineProps<{
  section: DashboardSection;
  translate?: (key: string) => string;
}>();

const items = computed(() => (props.section.items ?? []) as ActivityItem[]);

function iconFor(item: ActivityItem) {
  if (item.status === 'good' || item.status === 'done' || item.status === 'completed') return CheckCircle2;
  if (item.status === 'warning' || item.status === 'pending') return Clock3;
  return CircleDot;
}
</script>

<template>
  <section class="rounded-lg border border-slate-200/80 bg-white p-5 shadow-sm dark:border-darkmode-600 dark:bg-darkmode-800">
    <h2 class="text-base font-semibold text-slate-900 dark:text-slate-50">
      {{ resolveText(section.title, translate) }}
    </h2>

    <div class="mt-5 space-y-4">
      <article
        v-for="(item, index) in items"
        :key="`${item.title || item.description || index}`"
        class="grid grid-cols-[auto_minmax(0,1fr)] gap-3"
      >
        <div
          class="grid h-9 w-9 place-items-center rounded-full border"
          :class="statusClasses(statusFromValue(null, item.status))"
        >
          <component :is="iconFor(item)" class="h-4 w-4" />
        </div>

        <div class="min-w-0 rounded-lg bg-slate-50 px-4 py-3 dark:bg-darkmode-700/50">
          <div class="flex flex-col gap-1 md:flex-row md:items-start md:justify-between">
            <h3 class="text-sm font-semibold leading-6 text-slate-900 dark:text-slate-50">
              {{ item.title }}
            </h3>
            <span v-if="item.date || item.time" class="shrink-0 text-xs text-slate-400 dark:text-slate-500">
              {{ item.date || item.time }}
            </span>
          </div>
          <p v-if="item.description && item.title" class="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {{item.description }}
          </p>
          <p v-if="item.user || item.actor" class="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            {{ item.user || item.actor }}
          </p>
        </div>
      </article>

      <p v-if="!items.length" class="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
        فعالیتی برای نمایش وجود ندارد.
      </p>
    </div>
  </section>
</template>
