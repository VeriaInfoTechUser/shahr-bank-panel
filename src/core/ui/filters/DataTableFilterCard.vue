<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Lucide from '@/base-components/Lucide';

const props = withDefaults(
  defineProps<{
    /** کلید i18n عنوان هدر */
    titleKey?: string;
    /** شروع بسته */
    defaultCollapsed?: boolean;
  }>(),
  {
    titleKey: 'rule.filter-panel-title',
    defaultCollapsed: false,
  }
);

const { t } = useI18n();
const open = ref(!props.defaultCollapsed);

watch(
  () => props.defaultCollapsed,
  (v) => {
    open.value = !v;
  }
);
</script>

<template>
  <div
    class="rounded-xl border border-slate-200/80 bg-white shadow-sm dark:border-darkmode-700 dark:bg-darkmode-800"
  >
    <button
      type="button"
      class="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-start text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50/80 dark:text-slate-200 dark:hover:bg-darkmode-700/50"
      :aria-expanded="open"
      @click="open = !open"
    >
      <span>{{ t(titleKey) }}</span>
      <Lucide :icon="open ? 'ChevronUp' : 'ChevronDown'" class="h-4 w-4 shrink-0 opacity-70" />
    </button>
    <div
      v-show="open"
      class="border-t border-slate-200/80 px-3 pb-3 pt-2 dark:border-darkmode-700"
    >
      <slot />
    </div>
  </div>
</template>
