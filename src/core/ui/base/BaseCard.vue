<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
  }>(),
  {}
);
</script>

<template>
  <div
    class="rounded-xl border border-slate-200/80 dark:border-darkmode-700/80 bg-white dark:bg-darkmode-800 shadow-sm overflow-hidden"
  >
    <div
      v-if="title || $slots.header"
      class="px-5 py-3 border-b border-slate-200/70 dark:border-darkmode-700/70"
    >
      <h2 v-if="title" class="text-sm font-semibold text-slate-900 dark:text-slate-100">
        {{ title }}
      </h2>
      <slot name="header" />
    </div>
    <div class="px-5 py-4 text-sm">
      <slot />
    </div>
    <div
      v-if="$slots.footer"
      class="px-5 py-3 border-t border-slate-200/70 dark:border-darkmode-700/70 bg-slate-50/60 dark:bg-darkmode-700/40 text-sm"
    >
      <slot name="footer" />
    </div>
  </div>
</template>
